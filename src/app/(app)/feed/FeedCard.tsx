'use client'

import type { FeedCheckin } from './types'
import { KudosButton } from './KudosButton'
import { CommentsSection, ALIMENTATION_LABEL } from './CommentsSection'

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}

export function FeedCard({ checkin }: { checkin: FeedCheckin }) {
  const sportsStr =
    checkin.activities.length > 0
      ? checkin.activities.map((a) => `${a.sport} (${a.duree_minutes} min)`).join(', ')
      : null

  const alimentationLabel = ALIMENTATION_LABEL[checkin.alimentation] ?? checkin.alimentation

  return (
    <article className="rounded-xl border border-black/10 overflow-hidden">
      {/* Photo */}
      {checkin.photo_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={checkin.photo_url}
          alt={`Check-in de ${checkin.prenom}`}
          className="w-full max-h-80 object-cover"
        />
      )}

      <div className="p-4 flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-semibold">{checkin.prenom}</span>
          <span className="text-xs text-zinc-400 shrink-0">{formatDate(checkin.date)}</span>
        </div>

        {/* Details */}
        <div className="flex flex-wrap gap-2 text-sm text-zinc-600">
          <span className="rounded-full border border-black/10 px-2.5 py-0.5">
            {alimentationLabel}
          </span>
          {checkin.nb_verres_alcool === 0 ? (
            <span className="rounded-full border border-black/10 px-2.5 py-0.5">0 verre</span>
          ) : (
            <span className="rounded-full border border-black/10 px-2.5 py-0.5">
              {checkin.nb_verres_alcool} verre{checkin.nb_verres_alcool > 1 ? 's' : ''}
            </span>
          )}
          {sportsStr && (
            <span className="rounded-full border border-black/10 px-2.5 py-0.5">{sportsStr}</span>
          )}
        </div>

        {/* Kudos */}
        <div>
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
