'use client'

import { useState, useTransition } from 'react'
import type { HistoriqueEntry } from '@/app/actions/historique'
import { loadMoreHistorique } from '@/app/actions/historique'

const ALIMENTATION_LABEL: Record<string, string> = {
  super_healthy: 'Super Healthy',
  ca_va: 'En vrai ça va',
  faute: "J'ai fauté",
}

function formatDateFr(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function HistoriqueCard({ entry }: { entry: HistoriqueEntry }) {
  const sportsStr =
    entry.activities.length > 0
      ? entry.activities.map((a) => `${a.sport} (${a.duree_minutes} min)`).join(', ')
      : null

  return (
    <article className="rounded-xl border border-black/10 overflow-hidden">
      {entry.photo_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={entry.photo_url}
          alt={`Check-in du ${entry.date}`}
          className="w-full max-h-64 object-cover"
        />
      )}
      <div className="p-4 flex flex-col gap-2">
        {/* Date + late indicator */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm capitalize">{formatDateFr(entry.date)}</span>
          {entry.is_late && (
            <span className="text-xs text-zinc-400 border border-black/10 rounded-full px-2 py-0.5">
              rattrapé en retard
            </span>
          )}
        </div>

        {/* Details row */}
        <div className="flex flex-wrap gap-2 text-sm text-zinc-600">
          <span className="rounded-full border border-black/10 px-2.5 py-0.5">
            {ALIMENTATION_LABEL[entry.alimentation] ?? entry.alimentation}
          </span>
          <span className="rounded-full border border-black/10 px-2.5 py-0.5">
            {entry.nb_verres_alcool === 0
              ? '0 verre'
              : `${entry.nb_verres_alcool} verre${entry.nb_verres_alcool > 1 ? 's' : ''}`}
          </span>
          {sportsStr && (
            <span className="rounded-full border border-black/10 px-2.5 py-0.5">{sportsStr}</span>
          )}
        </div>

        {/* Score */}
        <p className="text-xs text-zinc-400">{entry.score} pt{entry.score > 1 ? 's' : ''} ce jour</p>
      </div>
    </article>
  )
}

export function HistoriqueList({
  initialEntries,
  total,
}: {
  initialEntries: HistoriqueEntry[]
  total: number
}) {
  const [entries, setEntries] = useState<HistoriqueEntry[]>(initialEntries)
  const [isPending, startTransition] = useTransition()

  const hasMore = entries.length < total

  function handleLoadMore() {
    startTransition(async () => {
      const next = await loadMoreHistorique(entries.length)
      setEntries((prev) => [...prev, ...next])
    })
  }

  if (entries.length === 0) {
    return (
      <p className="text-center text-zinc-500 text-sm py-12">
        Aucun check-in pour le moment.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {entries.map((entry) => (
        <HistoriqueCard key={entry.id} entry={entry} />
      ))}

      {hasMore && (
        <button
          onClick={handleLoadMore}
          disabled={isPending}
          className="rounded-full border border-black/20 py-2.5 text-sm text-zinc-600 hover:bg-zinc-50 disabled:opacity-40"
        >
          {isPending ? 'Chargement…' : `Charger plus (${total - entries.length} restants)`}
        </button>
      )}
    </div>
  )
}
