import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/supabase/server'
import { BottomNav } from '@/components/BottomNav'
import { FeedBadge } from './FeedBadge'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await getProfile()
  if (!profile) redirect('/join')

  return (
    <div className="flex min-h-full flex-col">
      <main className="flex flex-1 flex-col pb-28">{children}</main>
      <BottomNav
        feedBadge={
          <Suspense fallback={null}>
            <FeedBadge />
          </Suspense>
        }
      />
    </div>
  )
}
