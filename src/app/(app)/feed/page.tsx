import { redirect } from 'next/navigation'
import { getProfile, createAdminClient } from '@/lib/supabase/server'
import { fetchFeedPage, FEED_PAGE_SIZE } from '@/lib/feed'
import { FeedList } from './FeedList'

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>
}) {
  const { success } = await searchParams
  const profile = await getProfile()
  if (!profile) redirect('/join')

  const supabase = createAdminClient()

  // Update last_feed_view_at so the badge resets on next load
  await supabase
    .from('profiles')
    .update({ last_feed_view_at: new Date().toISOString() })
    .eq('id', profile.id)

  const checkins = await fetchFeedPage(profile.group_id, profile.id, 0)
  const hasMore = checkins.length === FEED_PAGE_SIZE

  return (
    <div className="mx-auto max-w-xl px-4 py-6 w-full flex flex-col gap-4">
      {success === '1' && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm font-medium text-emerald-800">
          ✓ Check-in enregistré !
        </div>
      )}

      <h1 className="font-bold text-xl">Fil d&apos;activité</h1>

      <FeedList initialCheckins={checkins} initialHasMore={hasMore} />
    </div>
  )
}
