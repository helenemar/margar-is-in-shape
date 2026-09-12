'use client'

import type { FeedCheckin } from './types'
import { KudosButton } from './KudosButton'
import { CommentsSection, ALIMENTATION_LABEL } from './CommentsSection'

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const label = new Date(y, m - 1, d).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

// Badge colour varies by alimentation level
const ALIM_BADGE: Record<string, string> = {
  super_healthy: 'bg-emerald-100 text-emerald-800',
  ca_va:         'bg-zinc-100 text-ink',
  faute:         'bg-red-100 text-red-800',
}

export function FeedCard({ checkin }: { checkin: FeedCheckin }) {
  const activities = checkin.activities
  const alimentationLabel = ALIMENTATION_LABEL[checkin.alimentation] ?? checkin.alimentation
  const alimBadge = ALIM_BADGE[checkin.alimentation] ?? 'bg-zinc-100 text-ink'

  return (
    <article className="rounded-3xl overflow-hidden bg-white shadow-[0_2px_12px_rgba(0,0,0,0.07)]">
      {/* Hero photo — full-width, top corners clipped by parent rounded-3xl */}
      {checkin.photo_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={checkin.photo_url}
          alt={`Check-in de ${checkin.prenom}`}
          className="w-full max-h-72 object-cover"
        />
      )}

      <div className="p-5 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <span className="font-bold text-[15px] truncate">{checkin.prenom}</span>
          <span className="text-xs text-muted shrink-0">{formatDate(checkin.date)}</span>
        </div>

        {/* Info badges */}
        <div className="flex flex-wrap gap-1.5">
          <span className={`rounded-full px-3 py-1 text-sm font-medium ${alimBadge}`}>
            {alimentationLabel}
          </span>

          <span className="rounded-full bg-zinc-100 px-3 py-1 text-sm font-medium text-ink">
            {checkin.nb_verres_alcool === 0
              ? '0 verre'
              : `${checkin.nb_verres_alcool} verre${checkin.nb_verres_alcool > 1 ? 's' : ''}`}
          </span>

          {activities.map((a) => (
            <span
              key={a.id}
              className="rounded-full bg-zinc-100 px-3 py-1 text-sm font-medium text-ink"
            >
              {a.sport} · {a.duree_minutes} min
            </span>
          ))}
        </div>

        {/* Kudos */}
        <div className="flex">
          <KudosButton
            checkinId={checkin.id}
            initialCount={checkin.kudos_count}
            initialKudosed={checkin.i_kudosed}
          />
        </div>

        {/* Comments */}
        <CommentsSection checkinId={checkin.id} initialComments={checkin.comments} />
      </div>
    </article>
  )
}
