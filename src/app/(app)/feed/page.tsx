import { redirect } from 'next/navigation'
import { getProfile, createAdminClient } from '@/lib/supabase/server'
import { fetchFeedPage, FEED_PAGE_SIZE } from '@/lib/feed'
import { FeedList } from './FeedList'

export default async function FeedPage() {
  const profile = await getProfile()
  if (!profile) redirect('/join')

  // Update last_feed_view_at (fire-and-forget is fine here)
  const supabase = createAdminClient()
  await supabase
    .from('profiles')
    .update({ last_feed_view_at: new Date().toISOString() })
    .eq('id', profile.id)

  const checkins = await fetchFeedPage(profile.group_id, profile.id, 0)
  const hasMore = checkins.length === FEED_PAGE_SIZE

  return (
    <div className="mx-auto max-w-xl px-4 py-8 w-full">
      <h1 className="text-2xl font-semibold mb-6">Fil d&apos;activité</h1>
      <FeedList initialCheckins={checkins} initialHasMore={hasMore} />
    </div>
  )
}
