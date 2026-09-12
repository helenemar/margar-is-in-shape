import { getProfile, createAdminClient } from '@/lib/supabase/server'

/** Async Server Component — shows a count bubble if there is new activity since last feed view. */
export async function FeedBadge() {
  const profile = await getProfile()
  if (!profile) return null

  const supabase = createAdminClient()
  const since = profile.last_feed_view_at ?? profile.created_at

  // Fetch group members (excluding self) and my checkin IDs in parallel
  const [{ data: membersRaw }, { data: myCheckinsRaw }] = await Promise.all([
    supabase.from('profiles').select('id').eq('group_id', profile.group_id).neq('id', profile.id),
    supabase.from('checkins').select('id').eq('user_id', profile.id),
  ])

  const otherIds = (membersRaw ?? []).map((m) => m.id)
  const myCheckinIds = (myCheckinsRaw ?? []).map((c) => c.id)

  // Count new activity in parallel
  const [newCheckinsResult, newKudosResult, newCommentsResult] = await Promise.all([
    otherIds.length > 0
      ? supabase
          .from('checkins')
          .select('id', { count: 'exact', head: true })
          .in('user_id', otherIds)
          .gt('created_at', since)
      : Promise.resolve({ count: 0 as number | null }),
    myCheckinIds.length > 0
      ? supabase
          .from('kudos')
          .select('id', { count: 'exact', head: true })
          .neq('user_id', profile.id)
          .in('checkin_id', myCheckinIds)
          .gt('created_at', since)
      : Promise.resolve({ count: 0 as number | null }),
    myCheckinIds.length > 0
      ? supabase
          .from('comments')
          .select('id', { count: 'exact', head: true })
          .neq('user_id', profile.id)
          .in('checkin_id', myCheckinIds)
          .gt('created_at', since)
      : Promise.resolve({ count: 0 as number | null }),
  ])

  const total =
    (newCheckinsResult.count ?? 0) +
    (newKudosResult.count ?? 0) +
    (newCommentsResult.count ?? 0)

  if (total === 0) return null

  return (
    <span className="inline-flex items-center justify-center rounded-full bg-accent text-white text-[10px] font-bold min-w-[16px] h-[16px] px-1">
      {total > 99 ? '99+' : total}
    </span>
  )
}
