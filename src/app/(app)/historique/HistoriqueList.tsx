'use client'

import { useState, useTransition } from 'react'
import type { HistoriqueEntry } from '@/app/actions/historique'
import { loadMoreHistorique } from '@/app/actions/historique'
import {
  Salad, Utensils, Pizza,
  GlassWater, Wine,
  Footprints, Dumbbell, Waves, Bike, Mountain, PersonStanding, Activity,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const ALIMENTATION_LABEL: Record<string, string> = {
  super_healthy: 'Super Healthy',
  ca_va: 'En vrai ça va',
  faute: "J'ai fauté",
}

const ALIM_ICON: Record<string, LucideIcon> = {
  super_healthy: Salad,
  ca_va:         Utensils,
  faute:         Pizza,
}

function sportIcon(sport: string): LucideIcon {
  const s = sport.toLowerCase()
  if (s.includes('muscu') || s.includes('gym'))                              return Dumbbell
  if (s.includes('natation') || s.includes('nage') || s.includes('piscine')) return Waves
  if (s.includes('vélo') || s.includes('velo') || s.includes('cyclisme'))   return Bike
  if (s.includes('escalade') || s.includes('grimpe'))                        return Mountain
  if (s.includes('yoga') || s.includes('pilates'))                           return PersonStanding
  if (s.includes('course') || s.includes('run') || s.includes('marche'))    return Footprints
  return Activity
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
  const AlimIcon = ALIM_ICON[entry.alimentation] ?? Utensils
  const AlcoolIcon = entry.nb_verres_alcool === 0 ? GlassWater : Wine
  const alcoolLabel = entry.nb_verres_alcool === 0
    ? '0 verre'
    : `${entry.nb_verres_alcool} verre${entry.nb_verres_alcool > 1 ? 's' : ''}`

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
            <span className="text-xs text-zinc-400 border border-black/10 rounded-xl px-2 py-0.5">
              rattrapé en retard
            </span>
          )}
        </div>

        {/* Sport badges — primary info */}
        {entry.activities.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {entry.activities.map((a) => {
              const SportIcon = sportIcon(a.sport)
              return (
                <span key={a.id} className="rounded-xl bg-zinc-100 px-2.5 py-0.5 text-sm font-medium text-ink flex items-center gap-1.5">
                  <SportIcon size={13} className="shrink-0" />
                  {a.sport} · {a.duree_minutes} min
                </span>
              )
            })}
          </div>
        )}

        {/* Alimentation + alcool — secondary text line */}
        <div className="flex items-center gap-1.5 text-sm text-muted flex-wrap">
          <AlimIcon size={15} className="shrink-0" />
          <span>{ALIMENTATION_LABEL[entry.alimentation] ?? entry.alimentation}</span>
          <span className="opacity-40">·</span>
          <AlcoolIcon size={15} className="shrink-0" />
          <span>{alcoolLabel}</span>
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
