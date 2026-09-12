'use client'

import { useState, useTransition, useRef } from 'react'
import type { FeedComment } from './types'
import { addComment } from '@/app/actions/feed'

export const ALIMENTATION_LABEL: Record<string, string> = {
  super_healthy: 'Super Healthy',
  ca_va: 'En vrai ça va',
  faute: "J'ai fauté",
}

// Deterministic pastel colour per first letter of prenom
const AVATAR_PALETTES = [
  'bg-orange-100 text-orange-700',
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-purple-100 text-purple-700',
  'bg-pink-100 text-pink-700',
  'bg-amber-100 text-amber-700',
]

function avatarClass(prenom: string): string {
  return AVATAR_PALETTES[prenom.charCodeAt(0) % AVATAR_PALETTES.length]
}

export function CommentsSection({
  checkinId,
  initialComments,
}: {
  checkinId: string
  initialComments: FeedComment[]
}) {
  const [comments, setComments] = useState<FeedComment[]>(initialComments)
  const [expanded, setExpanded] = useState(false)
  const [texte, setTexte] = useState('')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  const visible = expanded ? comments : comments.slice(-2)
  const hiddenCount = comments.length - 2

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!texte.trim()) return
    setError('')

    startTransition(async () => {
      try {
        const newComment = await addComment(checkinId, texte)
        setComments((prev) => [...prev, newComment])
        setTexte('')
        setExpanded(true)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur.')
      }
    })
  }

  return (
    <div className="flex flex-col gap-3">
      {!expanded && hiddenCount > 0 && (
        <button
          onClick={() => setExpanded(true)}
          className="self-start text-xs font-medium text-muted hover:text-ink transition-colors"
        >
          Voir {hiddenCount} commentaire{hiddenCount > 1 ? 's' : ''} de plus
        </button>
      )}

      {visible.length > 0 && (
        <div className="flex flex-col gap-2.5">
          {visible.map((c) => (
            <div key={c.id} className="flex items-start gap-2.5">
              {/* Avatar initiale */}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5 ${avatarClass(c.prenom)}`}
              >
                {c.prenom.charAt(0).toUpperCase()}
              </div>
              <p className="text-sm leading-snug flex-1 min-w-0">
                <span className="font-semibold">{c.prenom}</span>{' '}
                <span className="text-zinc-600">{c.texte}</span>
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2 items-center">
        <input
          ref={inputRef}
          type="text"
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          placeholder="Ajouter un commentaire…"
          maxLength={500}
          className="flex-1 min-w-0 rounded-2xl bg-zinc-100 px-4 py-2 text-sm outline-none placeholder:text-muted focus:bg-zinc-200 transition-colors"
        />
        <button
          type="submit"
          disabled={isPending || !texte.trim()}
          className="shrink-0 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-40 active:scale-95 transition-all"
        >
          Envoyer
        </button>
      </form>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
