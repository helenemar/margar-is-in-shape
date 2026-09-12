'use server'

import { redirect } from 'next/navigation'
import { getProfile, createAdminClient } from '@/lib/supabase/server'
import { scoreDayCheckin } from '@/lib/scoring'

export type HistoriqueEntry = {
  id: string
  date: string
  alimentation: string
  nb_verres_alcool: number
  photo_url: string | null
  created_at: string
  activities: { id: string; sport: string; duree_minutes: number }[]
  score: number
  is_late: boolean
}

function isLate(date: string, createdAt: string): boolean {
  const checkinDate = new Date(date + 'T00:00:00Z')
  const diffDays =
    (new Date(createdAt).getTime() - checkinDate.getTime()) / (1000 * 60 * 60 * 24)
  return diffDays > 1
}

type RawEntry = {
  id: string
  date: string
  alimentation: string
  nb_verres_alcool: number
  photo_url: string | null
  created_at: string
  activities: { id: string; sport: string; duree_minutes: number }[]
}

export async function loadMoreHistorique(offset: number): Promise<HistoriqueEntry[]> {
  const profile = await getProfile()
  if (!profile) redirect('/join')

  const supabase = createAdminClient()
  const { data } = await supabase
    .from('checkins')
    .select('id, date, alimentation, nb_verres_alcool, photo_url, created_at, activities(id, sport, duree_minutes)')
    .eq('user_id', profile.id)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + 19)

  return ((data ?? []) as unknown as RawEntry[]).map((c) => ({
    ...c,
    score: scoreDayCheckin({
      alimentation: c.alimentation,
      nb_verres_alcool: c.nb_verres_alcool,
      has_activity: c.activities.length > 0,
    }),
    is_late: isLate(c.date, c.created_at),
  }))
}
