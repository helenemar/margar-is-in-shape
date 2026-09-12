'use server'

import { redirect } from 'next/navigation'
import { getProfile, createAdminClient } from '@/lib/supabase/server'

/** Must match immutable_unaccent(lower(prenom)) in the DB generated column. */
function normalizePrenom(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

// ── updatePrenom ─────────────────────────────────────────────────────────────

export async function updatePrenom(prenom: string): Promise<{ error?: string }> {
  const profile = await getProfile()
  if (!profile) redirect('/join')

  const trimmed = prenom.trim()
  if (!trimmed) return { error: 'Le prénom ne peut pas être vide.' }
  if (trimmed.length > 50) return { error: 'Le prénom est trop long (max 50 caractères).' }

  const normalized = normalizePrenom(trimmed)

  const supabase = createAdminClient()

  // Check uniqueness within the group (excluding self)
  const { data: conflict } = await supabase
    .from('profiles')
    .select('id')
    .eq('group_id', profile.group_id)
    .eq('prenom_normalized', normalized)
    .neq('id', profile.id)
    .maybeSingle()

  if (conflict) {
    return { error: 'Ce prénom est déjà utilisé dans ton groupe.' }
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ prenom: trimmed })
    .eq('id', profile.id)

  if (updateError) return { error: updateError.message }

  return {}
}

// ── uploadAvatar ─────────────────────────────────────────────────────────────

export async function uploadAvatar(formData: FormData): Promise<{ error?: string }> {
  const profile = await getProfile()
  if (!profile) redirect('/join')

  const file = formData.get('avatar') as File | null
  if (!file || file.size === 0) return { error: 'Aucun fichier sélectionné.' }
  if (file.size > 5 * 1024 * 1024) return { error: 'La photo ne doit pas dépasser 5 Mo.' }

  const supabase = createAdminClient()

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${profile.id}.${ext}`
  const bytes = await file.arrayBuffer()

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, bytes, { contentType: file.type, upsert: true })

  if (uploadError) return { error: `Échec de l'upload : ${uploadError.message}` }

  const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(uploadData.path)

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: urlData.publicUrl })
    .eq('id', profile.id)

  if (updateError) return { error: updateError.message }

  return {}
}
