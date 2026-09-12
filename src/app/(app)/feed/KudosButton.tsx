'use client'

import { useState, useTransition } from 'react'
import { Flame } from 'lucide-react'
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
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all active:scale-95 disabled:opacity-60 ${
        kudosed
          ? 'bg-accent text-white shadow-[0_4px_12px_rgba(255,107,74,0.35)]'
          : 'bg-zinc-100 text-ink hover:bg-zinc-200'
      }`}
    >
      <Flame size={15} strokeWidth={kudosed ? 2.5 : 2} />
      <span>{count}</span>
    </button>
  )
}
