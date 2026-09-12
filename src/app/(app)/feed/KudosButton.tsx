'use client'

import { useState, useTransition } from 'react'
import { toggleKudos } from '@/app/actions/feed'

export function KudosButton({
  checkinId,
  initialCount,
  initialKudosed,
}: {
  checkinId: string
  initialCount: number
  initialKudosed: boolean
}) {
  const [kudosed, setKudosed] = useState(initialKudosed)
  const [count, setCount] = useState(initialCount)
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    // Optimistic update
    setKudosed((k) => !k)
    setCount((c) => (kudosed ? c - 1 : c + 1))

    startTransition(async () => {
      try {
        const result = await toggleKudos(checkinId)
        setKudosed(result.i_kudosed)
        setCount(result.kudos_count)
      } catch {
        // Revert on error
        setKudosed((k) => !k)
        setCount((c) => (kudosed ? c + 1 : c - 1))
      }
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm transition-colors ${
        kudosed
          ? 'bg-black text-white'
          : 'border border-black/20 text-zinc-600 hover:bg-zinc-50'
      }`}
    >
      <span>{kudosed ? '★' : '☆'}</span>
      <span>{count}</span>
    </button>
  )
}
