import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { signToken, generateSessionToken, SESSION_COOKIE, COOKIE_OPTIONS } from '@/lib/session'

function generatePin(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

/** Must match the DB generated column: lower(unaccent(prenom)). */
function normalizePrenom(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export async function POST(request: NextRequest) {
  const body: Record<string, string> = await request.json()
  const supabase = createAdminClient()

  // ── CREATE a new family group ──────────────────────────────────────
  if (body.action === 'create') {
    const nom = body.nom?.trim()
    const prenom = body.prenom?.trim()

    if (!nom || !prenom) {
      return NextResponse.json(
        { error: 'Nom du groupe et prénom requis.' },
        { status: 400 }
      )
    }

    // Retry on the unlikely event of a PIN collision
    let group: { id: string; nom: string; pin: string } | null = null
    for (let attempt = 0; attempt < 5; attempt++) {
      const pin = generatePin()
      const { data, error } = await supabase
        .from('family_groups')
        .insert({ nom, pin })
        .select('id, nom, pin')
        .single()

      if (!error) {
        group = data
        break
      }
      if (error.code !== '23505') {
        // Not a unique violation — something else went wrong
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    if (!group) {
      return NextResponse.json(
        { error: 'Impossible de générer un PIN unique, réessayez.' },
        { status: 500 }
      )
    }

    const sessionToken = generateSessionToken()
    const { error: profileError } = await supabase.from('profiles').insert({
      group_id: group.id,
      prenom,
      session_token: sessionToken,
    })

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    const response = NextResponse.json({ ok: true, pin: group.pin })
    response.cookies.set(SESSION_COOKIE, signToken(sessionToken), COOKIE_OPTIONS)
    return response
  }

  // ── JOIN an existing group via PIN ────────────────────────────────
  if (body.action === 'join') {
    const pin = body.pin?.trim()
    const prenom = body.prenom?.trim()

    if (!pin || !prenom) {
      return NextResponse.json(
        { error: 'PIN et prénom requis.' },
        { status: 400 }
      )
    }

    const { data: group } = await supabase
      .from('family_groups')
      .select('id')
      .eq('pin', pin)
      .maybeSingle()

    if (!group) {
      return NextResponse.json({ error: 'PIN invalide.' }, { status: 400 })
    }

    // Find existing profile by normalized prenom (accent- and case-insensitive)
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('group_id', group.id)
      .eq('prenom_normalized', normalizePrenom(prenom))
      .maybeSingle()

    const sessionToken = generateSessionToken()

    if (existing) {
      await supabase
        .from('profiles')
        .update({ session_token: sessionToken })
        .eq('id', existing.id)
    } else {
      const { error: profileError } = await supabase.from('profiles').insert({
        group_id: group.id,
        prenom,
        session_token: sessionToken,
      })
      if (profileError) {
        if (profileError.code === '23505') {
          return NextResponse.json(
            { error: 'Ce prénom est déjà utilisé dans ce groupe (vérifiez la casse et les accents).' },
            { status: 409 }
          )
        }
        return NextResponse.json({ error: profileError.message }, { status: 500 })
      }
    }

    const response = NextResponse.json({ ok: true })
    response.cookies.set(SESSION_COOKIE, signToken(sessionToken), COOKIE_OPTIONS)
    return response
  }

  return NextResponse.json({ error: 'Action invalide.' }, { status: 400 })
}
