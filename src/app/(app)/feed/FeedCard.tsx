'use client'

import { useRef } from 'react'
import type { FeedCheckin } from './types'
import { KudosButton } from './KudosButton'
import { CommentsSection, ALIMENTATION_LABEL } from './CommentsSection'
import type { CommentsSectionHandle } from './CommentsSection'
import {
  Salad, Utensils, Pizza,
  GlassWater, Wine,
  Footprints, Dumbbell, Waves, Bike, Mountain, PersonStanding, Activity,
  MessageCircle,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const label = new Date(y, m - 1, d).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
  return label.charAt(0).toUpperCase() + label.slice(1)
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

export function FeedCard({ checkin }: { checkin: FeedCheckin }) {
  const commentsRef = useRef<CommentsSectionHandle>(null)
  const activities = checkin.activities
  const alimentationLabel = ALIMENTATION_LABEL[checkin.alimentation] ?? checkin.alimentation
  const AlimIcon = ALIM_ICON[checkin.alimentation] ?? Utensils
  const AlcoolIcon = checkin.nb_verres_alcool === 0 ? GlassWater : Wine
  const alcoolLabel = checkin.nb_verres_alcool === 0
    ? '0 verre'
    : `${checkin.nb_verres_alcool} verre${checkin.nb_verres_alcool > 1 ? 's' : ''}`

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

      <div className="px-5 pt-5 pb-6 flex flex-col">
        {/* ── Bloc activité ── */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <span className="font-bold text-[15px] truncate">{checkin.prenom}</span>
            <span className="text-xs text-muted shrink-0">{formatDate(checkin.date)}</span>
          </div>

          {activities.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {activities.map((a) => {
                const SportIcon = sportIcon(a.sport)
                return (
                  <span
                    key={a.id}
                    className="rounded-xl bg-zinc-100 px-3 py-1.5 text-sm font-medium text-ink flex items-center gap-1.5"
                  >
                    <SportIcon size={13} className="shrink-0" />
                    {a.sport} · {a.duree_minutes} min
                  </span>
                )
              })}
            </div>
          )}

          <div className="flex items-center gap-1.5 text-sm text-muted flex-wrap">
            <AlimIcon size={15} className="shrink-0" />
            <span>{alimentationLabel}</span>
            <span className="opacity-40">·</span>
            <AlcoolIcon size={15} className="shrink-0" />
            <span>{alcoolLabel}</span>
          </div>
        </div>

        {/* ── Séparateur ── */}
        <div className="border-t border-zinc-100 my-5" />

        {/* ── Bloc social : barre d'action + commentaires ── */}
        <div className="flex flex-col gap-4">
          {/* Action bar */}
          <div className="flex items-center gap-4">
            <KudosButton
              checkinId={checkin.id}
              initialCount={checkin.kudos_count}
              initialKudosed={checkin.i_kudosed}
            />
            <button
              onClick={() => commentsRef.current?.expand()}
              className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink transition-colors"
            >
              <MessageCircle size={16} strokeWidth={1.75} />
              <span>{checkin.comments.length}</span>
            </button>
          </div>
          <CommentsSection ref={commentsRef} checkinId={checkin.id} initialComments={checkin.comments} />
        </div>
      </div>
    </article>
  )
}
