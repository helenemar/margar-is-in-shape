import { NextRequest, NextResponse } from 'next/server'
import { getProfile, createAdminClient } from '@/lib/supabase/server'

type SportPayload = {
  sport: string
  duree: number
  participants: string[]
}

const VALID_ALIMENTATION = ['super_healthy', 'ca_va', 'faute'] as const

/** Returns YYYY-MM-DD for a Date in local wall-clock time. */
function localDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export async function POST(request: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────
  const profile = await getProfile()
  if (!profile) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  }

  // ── Parse multipart form ──────────────────────────────────────────
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide.' }, { status: 400 })
  }

  const date = (formData.get('date') as string | null)?.trim() ?? ''
  const alimentation = (formData.get('alimentation') as string | null)?.trim() ?? ''
  const nbVerresRaw = formData.get('nb_verres_alcool') as string | null
  const photo = formData.get('photo') as File | null
  const sportsRaw = formData.get('sports') as string | null

  // ── Validate date (today or up to 7 days ago) ────────────────────
  const today = new Date()
  const todayStr = localDateStr(today)
  const minDate = new Date(today)
  minDate.setDate(today.getDate() - 7)
  const minDateStr = localDateStr(minDate)

  if (!date || date < minDateStr || date > todayStr) {
    return NextResponse.json(
      { error: "Date invalide. Vous pouvez valider jusqu'à 7 jours en arrière." },
      { status: 400 }
    )
  }

  // ── Validate alimentation ─────────────────────────────────────────
  if (!VALID_ALIMENTATION.includes(alimentation as (typeof VALID_ALIMENTATION)[number])) {
    return NextResponse.json({ error: 'Alimentation invalide.' }, { status: 400 })
  }

  const nbVerres = Math.max(0, parseInt(nbVerresRaw ?? '0', 10) || 0)

  // ── Validate photo ────────────────────────────────────────────────
  if (!photo || photo.size === 0) {
    return NextResponse.json({ error: 'La photo est obligatoire.' }, { status: 400 })
  }

  // ── Parse sports ──────────────────────────────────────────────────
  let sports: SportPayload[] = []
  try {
    sports = JSON.parse(sportsRaw ?? '[]')
    if (!Array.isArray(sports)) throw new Error()
  } catch {
    return NextResponse.json({ error: 'Format sports invalide.' }, { status: 400 })
  }

  for (const s of sports) {
    if (!s.sport?.trim()) {
      return NextResponse.json({ error: 'Nom de sport manquant.' }, { status: 400 })
    }
    if (!Number.isInteger(s.duree) || s.duree <= 0) {
      return NextResponse.json(
        { error: `Durée invalide pour « ${s.sport} ».` },
        { status: 400 }
      )
    }
  }

  const supabase = createAdminClient()

  // ── Validate participant IDs belong to the same group ─────────────
  const participantIds = sports.flatMap((s) => s.participants)
  if (participantIds.length > 0) {
    const { data: groupMembers } = await supabase
      .from('profiles')
      .select('id')
      .eq('group_id', profile.group_id)

    const validIds = new Set((groupMembers ?? []).map((m) => m.id))
    const invalid = participantIds.find((id) => !validIds.has(id))
    if (invalid) {
      return NextResponse.json({ error: 'Participant invalide.' }, { status: 400 })
    }
  }

  // ── Upload photo ──────────────────────────────────────────────────
  const ext = photo.name.split('.').pop()?.toLowerCase() || 'jpg'
  const photoPath = `${profile.id}/${date}.${ext}`
  const bytes = await photo.arrayBuffer()

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('checkin-photos')
    .upload(photoPath, bytes, { contentType: photo.type, upsert: true })

  if (uploadError) {
    return NextResponse.json(
      { error: `Échec upload photo : ${uploadError.message}` },
      { status: 500 }
    )
  }

  const { data: urlData } = supabase.storage
    .from('checkin-photos')
    .getPublicUrl(uploadData.path)

  const photoUrl = urlData.publicUrl

  // ── Upsert check-in ───────────────────────────────────────────────
  const { data: checkin, error: checkinError } = await supabase
    .from('checkins')
    .upsert(
      {
        user_id: profile.id,
        date,
        alimentation,
        nb_verres_alcool: nbVerres,
        photo_url: photoUrl,
      },
      { onConflict: 'user_id,date' }
    )
    .select('id')
    .single()

  if (checkinError || !checkin) {
    return NextResponse.json(
      { error: checkinError?.message ?? 'Erreur lors du check-in.' },
      { status: 500 }
    )
  }

  // ── Delete previous activities (handles edit case) ────────────────
  await supabase.from('activities').delete().eq('checkin_id', checkin.id)

  // ── Insert activities + participants ──────────────────────────────
  for (const s of sports) {
    const { data: activity, error: actErr } = await supabase
      .from('activities')
      .insert({
        checkin_id: checkin.id,
        sport: s.sport.trim(),
        duree_minutes: s.duree,
      })
      .select('id')
      .single()

    if (actErr || !activity) continue

    const others = s.participants.filter((id) => id !== profile.id)
    if (others.length > 0) {
      await supabase.from('activity_participants').insert(
        others.map((userId) => ({ activity_id: activity.id, user_id: userId }))
      )
    }
  }

  return NextResponse.json({ ok: true })
}
