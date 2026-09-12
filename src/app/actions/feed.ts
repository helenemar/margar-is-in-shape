'use server'

import { redirect } from 'next/navigation'
import { getProfile, createAdminClient } from '@/lib/supabase/server'
import { fetchFeedPage } from '@/lib/feed'
import type { FeedCheckin } from '@/app/(app)/feed/types'

// ── loadMoreCheckins ────────────────────────────────────────────────────────

export async function loadMoreCheckins(offset: number): Promise<FeedCheckin[]> {
  const profile = await getProfile()
  if (!profile) redirect('/join')
  return fetchFeedPage(profile.group_id, profile.id, offset)
}

// ── toggleKudos ─────────────────────────────────────────────────────────────

export async function toggleKudos(
  checkinId: string
): Promise<{ kudos_count: number; i_kudosed: boolean }> {
  const profile = await getProfile()
  if (!profile) redirect('/join')

  const supabase = createAdminClient()

  // Check if kudos already exists
  const { data: existing } = await supabase
    .from('kudos')
    .select('id')
    .eq('checkin_id', checkinId)
    .eq('user_id', profile.id)
    .maybeSingle()

  if (existing) {
    await supabase.from('kudos').delete().eq('checkin_id', checkinId).eq('user_id', profile.id)
  } else {
    await supabase.from('kudos').insert({ checkin_id: checkinId, user_id: profile.id })
  }

  const { count } = await supabase
    .from('kudos')
    .select('id', { count: 'exact', head: true })
    .eq('checkin_id', checkinId)

  return {
    kudos_count: count ?? 0,
    i_kudosed: !existing,
  }
}

// ── addComment ───────────────────────────────────────────────────────────────

export async function addComment(
  checkinId: string,
  texte: string
): Promise<{ id: string; user_id: string; prenom: string; texte: string; created_at: string }> {
  const profile = await getProfile()
  if (!profile) redirect('/join')

  const trimmed = texte.trim()
  if (!trimmed) throw new Error('Commentaire vide.')
  if (trimmed.length > 500) throw new Error('Commentaire trop long (max 500 caractères).')

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('comments')
    .insert({ checkin_id: checkinId, user_id: profile.id, texte: trimmed })
    .select('id, user_id, texte, created_at')
    .single()

  if (error || !data) throw new Error(error?.message ?? 'Erreur lors de l\'ajout du commentaire.')

  return {
    id: data.id,
    user_id: data.user_id,
    prenom: profile.prenom,
    texte: data.texte,
    created_at: data.created_at,
  }
}

