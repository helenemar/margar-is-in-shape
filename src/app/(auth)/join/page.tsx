'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Mode = 'choice' | 'create' | 'join' | 'created'

export default function JoinPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('choice')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [createdPin, setCreatedPin] = useState('')

  // create state
  const [groupNom, setGroupNom] = useState('')
  const [createPrenom, setCreatePrenom] = useState('')

  // join state
  const [pin, setPin] = useState('')
  const [prenom, setPrenom] = useState('')

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', nom: groupNom, prenom: createPrenom }),
    })
    const data: { ok?: boolean; pin?: string; error?: string } = await res.json()
    setLoading(false)

    if (!res.ok || !data.ok) {
      setError(data.error ?? 'Une erreur est survenue.')
      return
    }

    setCreatedPin(data.pin ?? '')
    setMode('created')
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'join', pin, prenom }),
    })
    const data: { ok?: boolean; error?: string } = await res.json()
    setLoading(false)

    if (!res.ok || !data.ok) {
      setError(data.error ?? 'Une erreur est survenue.')
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  // ── CHOICE ──────────────────────────────────────────────────────────
  if (mode === 'choice') {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-8 px-4 py-16">
        <h1 className="text-3xl font-semibold">Margar is in Shape</h1>
        <p className="text-zinc-500">Défi fitness familial</p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={() => setMode('create')}
            className="rounded-full bg-black py-3 text-sm font-medium text-white"
          >
            Créer un groupe famille
          </button>
          <button
            onClick={() => setMode('join')}
            className="rounded-full border border-black/20 py-3 text-sm font-medium"
          >
            Rejoindre un groupe existant
          </button>
        </div>
      </div>
    )
  }

  // ── CREATED (show PIN to share) ──────────────────────────────────────
  if (mode === 'created') {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-6 px-4 py-16">
        <h1 className="text-2xl font-semibold">Groupe créé !</h1>
        <p className="text-zinc-600 text-center max-w-xs">
          Partagez ce PIN avec votre famille pour qu&apos;ils puissent rejoindre :
        </p>
        <div className="rounded-2xl bg-black px-10 py-6 text-center">
          <p className="text-xs text-zinc-400 mb-1 tracking-widest uppercase">PIN</p>
          <p className="text-5xl font-bold tracking-[0.2em] text-white">{createdPin}</p>
        </div>
        <button
          onClick={() => { router.push('/dashboard'); router.refresh() }}
          className="rounded-full bg-black px-8 py-3 text-sm font-medium text-white"
        >
          Commencer le défi
        </button>
      </div>
    )
  }

  // ── CREATE FORM ──────────────────────────────────────────────────────
  if (mode === 'create') {
    return (
      <div className="flex min-h-full flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm">
          <button
            onClick={() => { setMode('choice'); setError('') }}
            className="mb-6 text-sm text-zinc-500"
          >
            ← Retour
          </button>
          <h1 className="mb-6 text-2xl font-semibold">Créer un groupe famille</h1>
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="groupNom" className="text-sm font-medium">
                Nom du groupe
              </label>
              <input
                id="groupNom"
                value={groupNom}
                onChange={(e) => setGroupNom(e.target.value)}
                required
                placeholder="ex. Les Dupont"
                className="rounded-lg border border-black/20 px-3 py-2 text-sm outline-none focus:border-black"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="createPrenom" className="text-sm font-medium">
                Votre prénom
              </label>
              <input
                id="createPrenom"
                value={createPrenom}
                onChange={(e) => setCreatePrenom(e.target.value)}
                required
                placeholder="ex. Sophie"
                className="rounded-lg border border-black/20 px-3 py-2 text-sm outline-none focus:border-black"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 rounded-full bg-black py-2.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {loading ? 'Création…' : 'Créer le groupe'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  // ── JOIN FORM ────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <button
          onClick={() => { setMode('choice'); setError('') }}
          className="mb-6 text-sm text-zinc-500"
        >
          ← Retour
        </button>
        <h1 className="mb-6 text-2xl font-semibold">Rejoindre un groupe</h1>
        <form onSubmit={handleJoin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="pin" className="text-sm font-medium">
              PIN du groupe (6 chiffres)
            </label>
            <input
              id="pin"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              required
              inputMode="numeric"
              pattern="\d{6}"
              placeholder="123456"
              className="rounded-lg border border-black/20 px-3 py-2 text-sm tracking-widest outline-none focus:border-black"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="prenom" className="text-sm font-medium">
              Votre prénom
            </label>
            <input
              id="prenom"
              value={prenom}
              onChange={(e) => setPrenom(e.target.value)}
              required
              placeholder="ex. Thomas"
              className="rounded-lg border border-black/20 px-3 py-2 text-sm outline-none focus:border-black"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-full bg-black py-2.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {loading ? 'Connexion…' : 'Rejoindre'}
          </button>
        </form>
      </div>
    </div>
  )
}
