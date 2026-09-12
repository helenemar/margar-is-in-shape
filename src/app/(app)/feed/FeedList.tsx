'use client'

import { useState, useTransition } from 'react'
import type { FeedCheckin } from './types'
import { FeedCard } from './FeedCard'
import { loadMoreCheckins } from '@/app/actions/feed'
import { FEED_PAGE_SIZE } from '@/lib/feed-constants'

export function FeedList({
  initialCheckins,
  initialHasMore,
}: {
  initialCheckins: FeedCheckin[]
  initialHasMore: boolean
}) {
  const [checkins, setCheckins] = useState<FeedCheckin[]>(initialCheckins)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [isPending, startTransition] = useTransition()

  function handleLoadMore() {
    startTransition(async () => {
      const next = await loadMoreCheckins(checkins.length)
      setCheckins((prev) => [...prev, ...next])
      setHasMore(next.length === FEED_PAGE_SIZE)
    })
  }

  if (checkins.length === 0) {
    return (
      <p className="text-center text-zinc-500 text-sm py-12">
        Aucun check-in pour le moment. Soyez le premier !
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {checkins.map((c) => (
        <FeedCard key={c.id} checkin={c} />
      ))}

      {hasMore && (
        <button
          onClick={handleLoadMore}
          disabled={isPending}
          className="rounded-full bg-zinc-100 py-3 text-sm font-semibold text-ink hover:bg-zinc-200 disabled:opacity-40 transition-colors"
        >
          {isPending ? 'Chargement…' : 'Charger plus'}
        </button>
      )}
    </div>
  )
}
