import { createAdminClient } from '@/lib/supabase/server'
import type { FeedCheckin, FeedActivity, FeedComment } from '@/app/(app)/feed/types'

export { FEED_PAGE_SIZE } from './feed-constants'
import { FEED_PAGE_SIZE } from './feed-constants'

type RawCheckin = {
  id: string
  user_id: string
  date: string
  alimentation: string
  nb_verres_alcool: number
  photo_url: string | null
  created_at: string
  profiles: { prenom: string } | null
  activities: { id: string; sport: string; duree_minutes: number }[]
}

type RawComment = {
  id: string
  checkin_id: string
  user_id: string
  texte: string
  created_at: string
  profiles: { prenom: string } | null
}

type RawKudos = {
  checkin_id: string
  user_id: string
}

export async function fetchFeedPage(
  groupId: string,
  currentProfileId: string,
  offset: number
): Promise<FeedCheckin[]> {
  const supabase = createAdminClient()

  // 1. Fetch members of the group
  const { data: membersRaw } = await supabase
    .from('profiles')
    .select('id')
    .eq('group_id', groupId)

  const memberIds = (membersRaw ?? []).map((m) => m.id)
  if (memberIds.length === 0) return []

  // 2. Fetch paginated checkins with nested data
  const { data: checkinsRaw } = await supabase
    .from('checkins')
    .select(
      'id, user_id, date, alimentation, nb_verres_alcool, photo_url, created_at, profiles(prenom), activities(id, sport, duree_minutes)'
    )
    .in('user_id', memberIds)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + FEED_PAGE_SIZE - 1)

  const checkins = (checkinsRaw ?? []) as unknown as RawCheckin[]
  if (checkins.length === 0) return []

  const checkinIds = checkins.map((c) => c.id)

  // 3. Fetch kudos and comments in parallel
  const [{ data: kudosRaw }, { data: commentsRaw }] = await Promise.all([
    supabase.from('kudos').select('checkin_id, user_id').in('checkin_id', checkinIds),
    supabase
      .from('comments')
      .select('id, checkin_id, user_id, texte, created_at, profiles(prenom)')
      .in('checkin_id', checkinIds)
      .order('created_at', { ascending: true }),
  ])

  const kudos = (kudosRaw ?? []) as RawKudos[]
  const comments = (commentsRaw ?? []) as unknown as RawComment[]

  // 4. Index kudos and comments by checkin_id
  const kudosByCheckin = new Map<string, Set<string>>()
  for (const k of kudos) {
    if (!kudosByCheckin.has(k.checkin_id)) kudosByCheckin.set(k.checkin_id, new Set())
    kudosByCheckin.get(k.checkin_id)!.add(k.user_id)
  }

  const commentsByCheckin = new Map<string, RawComment[]>()
  for (const c of comments) {
    if (!commentsByCheckin.has(c.checkin_id)) commentsByCheckin.set(c.checkin_id, [])
    commentsByCheckin.get(c.checkin_id)!.push(c)
  }

  // 5. Assemble
  return checkins.map((c): FeedCheckin => {
    const checkinKudos = kudosByCheckin.get(c.id) ?? new Set()
    const checkinComments = commentsByCheckin.get(c.id) ?? []

    const mappedComments: FeedComment[] = checkinComments.map((cm) => ({
      id: cm.id,
      user_id: cm.user_id,
      prenom: cm.profiles?.prenom ?? '?',
      texte: cm.texte,
      created_at: cm.created_at,
    }))

    const mappedActivities: FeedActivity[] = c.activities.map((a) => ({
      id: a.id,
      sport: a.sport,
      duree_minutes: a.duree_minutes,
    }))

    return {
      id: c.id,
      user_id: c.user_id,
      prenom: c.profiles?.prenom ?? '?',
      date: c.date,
      alimentation: c.alimentation,
      nb_verres_alcool: c.nb_verres_alcool,
      photo_url: c.photo_url,
      activities: mappedActivities,
      comments: mappedComments,
      kudos_count: checkinKudos.size,
      i_kudosed: checkinKudos.has(currentProfileId),
      created_at: c.created_at,
    }
  })
}
