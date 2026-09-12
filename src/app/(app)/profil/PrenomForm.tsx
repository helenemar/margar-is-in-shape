'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updatePrenom } from '@/app/actions/profil'

export function PrenomForm({ currentPrenom }: { currentPrenom: string }) {
  const router = useRouter()
  const [prenom, setPrenom] = useState(currentPrenom)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      const result = await updatePrenom(prenom)
      if (result.error) {
        setError(result.error)
      } else {
        router.refresh()
      }
    })
  }

  const unchanged = prenom.trim() === currentPrenom

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label htmlFor="prenom" className="font-medium">
        Prénom
      </label>
      <div className="flex gap-2">
        <input
          id="prenom"
          type="text"
          value={prenom}
          onChange={(e) => setPrenom(e.target.value)}
          maxLength={50}
          required
          className="flex-1 rounded-lg border border-black/20 px-3 py-2 text-sm outline-none focus:border-black"
        />
        <button
          type="submit"
          disabled={isPending || unchanged}
          className="rounded-full bg-black px-5 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          {isPending ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  )
}
