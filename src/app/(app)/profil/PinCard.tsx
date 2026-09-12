'use client'

import { useState } from 'react'

export function PinCard({ pin }: { pin: string }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(pin).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="font-medium">PIN du groupe</p>
      <div className="flex items-center gap-3">
        <span className="text-3xl font-bold tracking-widest">{pin}</span>
        <button
          onClick={handleCopy}
          className="rounded-full border border-black/20 px-4 py-1.5 text-sm hover:bg-zinc-50 transition-colors"
        >
          {copied ? 'Copié !' : 'Copier'}
        </button>
      </div>
      <p className="text-xs text-zinc-500">
        Partage ce PIN avec ta famille pour qu&apos;ils rejoignent le groupe.
      </p>
    </div>
  )
}
