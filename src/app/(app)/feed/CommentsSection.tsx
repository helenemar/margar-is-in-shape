'use client'

import { useState, useTransition, useRef } from 'react'
import type { FeedComment } from './types'
import { addComment } from '@/app/actions/feed'

const ALIMENTATION_LABEL: Record<string, string> = {
  super_healthy: 'Super Healthy',
  ca_va: 'En vrai ça va',
  faute: "J'ai fauté",
}

function formatDateFr(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export { ALIMENTATION_LABEL, formatDateFr }

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
    <div className="flex flex-col gap-2">
      {!expanded && hiddenCount > 0 && (
        <button
          onClick={() => setExpanded(true)}
          className="text-xs text-zinc-400 hover:text-zinc-600 self-start"
        >
          Voir {hiddenCount} commentaire{hiddenCount > 1 ? 's' : ''} de plus
        </button>
      )}

      {visible.length > 0 && (
        <div className="flex flex-col gap-1">
          {visible.map((c) => (
            <p key={c.id} className="text-sm">
              <span className="font-medium">{c.prenom}</span>{' '}
              <span className="text-zinc-700">{c.texte}</span>
            </p>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2 mt-1">
        <input
          ref={inputRef}
          type="text"
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          placeholder="Ajouter un commentaire…"
          maxLength={500}
          className="flex-1 rounded-full border border-black/20 px-3 py-1.5 text-sm outline-none focus:border-black"
        />
        <button
          type="submit"
          disabled={isPending || !texte.trim()}
          className="rounded-full bg-black px-4 py-1.5 text-sm text-white disabled:opacity-40"
        >
          Envoyer
        </button>
      </form>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
