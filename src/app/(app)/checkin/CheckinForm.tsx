'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

export type Member = { id: string; prenom: string }

type SportDetails = {
  duree: string
  withOthers: boolean
  participants: string[]
}

type Alimentation = 'super_healthy' | 'ca_va' | 'faute'

const PRESET_SPORTS = [
  'Course',
  'Muscu',
  'Yoga',
  'Vélo',
  'Natation',
  'Marche',
  'Escalade',
  'Padel',
]

const ALIMENTATION_OPTIONS: { value: Alimentation; label: string }[] = [
  { value: 'super_healthy', label: 'Super Healthy' },
  { value: 'ca_va', label: 'En vrai ça va' },
  { value: 'faute', label: "J'ai fauté" },
]

function localDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// ── ParticipantPicker — defined at module level to avoid "created during render" ──

function ParticipantPicker({
  members,
  details,
  onToggleWithOthers,
  onToggleMember,
}: {
  members: Member[]
  details: SportDetails
  onToggleWithOthers: () => void
  onToggleMember: (id: string) => void
}) {
  if (members.length === 0) return null
  return (
    <div className="mt-2">
      <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
        <input
          type="checkbox"
          checked={details.withOthers}
          onChange={onToggleWithOthers}
        />
        Fait avec quelqu&apos;un d&apos;autre du groupe
      </label>
      {details.withOthers && (
        <div className="mt-2 ml-5 flex flex-wrap gap-2">
          {members.map((m) => (
            <label
              key={m.id}
              className="flex items-center gap-1 text-sm cursor-pointer select-none rounded-full border px-3 py-1"
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={details.participants.includes(m.id)}
                onChange={() => onToggleMember(m.id)}
              />
              <span
                className={
                  details.participants.includes(m.id) ? 'font-medium' : 'text-zinc-500'
                }
              >
                {m.prenom}
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main form component ──────────────────────────────────────────────────────

export function CheckinForm({ members }: { members: Member[] }) {
  const router = useRouter()

  // Lazy initialisers — computed once on first client render, no useEffect needed
  const [today] = useState<string>(() => localDateStr(new Date()))
  const [minDate] = useState<string>(() => {
    const d = new Date()
    d.setDate(d.getDate() - 7)
    return localDateStr(d)
  })
  const [date, setDate] = useState<string>(() => localDateStr(new Date()))

  const [alimentation, setAlimentation] = useState<Alimentation>('ca_va')
  const [nbVerres, setNbVerres] = useState(0)

  // Photo
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sports — preset
  const [activeSports, setActiveSports] = useState<Record<string, SportDetails>>({})

  // Sports — custom "Autre"
  const [customChecked, setCustomChecked] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customDetails, setCustomDetails] = useState<SportDetails>({
    duree: '',
    withOthers: false,
    participants: [],
  })

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // ── Handlers ──────────────────────────────────────────────────────

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (photoPreview) URL.revokeObjectURL(photoPreview)
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  function toggleSport(sport: string) {
    setActiveSports((prev) => {
      if (prev[sport]) {
        const next = { ...prev }
        delete next[sport]
        return next
      }
      return { ...prev, [sport]: { duree: '', withOthers: false, participants: [] } }
    })
  }

  function updateSport(sport: string, patch: Partial<SportDetails>) {
    setActiveSports((prev) => ({ ...prev, [sport]: { ...prev[sport], ...patch } }))
  }

  function toggleParticipantIn(
    memberId: string,
    current: string[],
    setter: (ids: string[]) => void
  ) {
    setter(
      current.includes(memberId)
        ? current.filter((id) => id !== memberId)
        : [...current, memberId]
    )
  }

  // ── Submit ────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')

    if (!photoFile) {
      setError('La photo est obligatoire.')
      return
    }

    type SportPayload = { sport: string; duree: number; participants: string[] }
    const sports: SportPayload[] = []

    for (const [sport, details] of Object.entries(activeSports)) {
      const duree = parseInt(details.duree, 10)
      if (!duree || duree <= 0) {
        setError(`Durée invalide pour « ${sport} ».`)
        return
      }
      sports.push({
        sport,
        duree,
        participants: details.withOthers ? details.participants : [],
      })
    }

    if (customChecked) {
      if (!customName.trim()) {
        setError('Indiquez le nom du sport personnalisé.')
        return
      }
      const duree = parseInt(customDetails.duree, 10)
      if (!duree || duree <= 0) {
        setError(`Durée invalide pour « ${customName} ».`)
        return
      }
      sports.push({
        sport: customName.trim(),
        duree,
        participants: customDetails.withOthers ? customDetails.participants : [],
      })
    }

    setSubmitting(true)

    const fd = new FormData()
    fd.set('date', date)
    fd.set('alimentation', alimentation)
    fd.set('nb_verres_alcool', String(nbVerres))
    fd.set('photo', photoFile)
    fd.set('sports', JSON.stringify(sports))

    try {
      const res = await fetch('/api/checkin/submit', { method: 'POST', body: fd })
      const data: { ok?: boolean; error?: string } = await res.json()

      if (!res.ok || !data.ok) {
        setError(data.error ?? 'Une erreur est survenue.')
        setSubmitting(false)
        return
      }

      router.push('/dashboard?success=1')
      router.refresh()
    } catch {
      setError('Erreur réseau, réessayez.')
      setSubmitting(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-xl px-4 py-8 flex flex-col gap-8"
    >
      <h1 className="text-2xl font-semibold">Check-in</h1>

      {/* ── Date ── */}
      <section className="flex flex-col gap-2">
        <label htmlFor="date" className="font-medium">
          Date
        </label>
        <input
          id="date"
          type="date"
          value={date}
          min={minDate}
          max={today}
          onChange={(e) => setDate(e.target.value)}
          required
          className="w-fit rounded-lg border border-black/20 px-3 py-2 text-sm"
        />
      </section>

      {/* ── Sports ── */}
      <section className="flex flex-col gap-3">
        <p className="font-medium">Sports pratiqués</p>

        {PRESET_SPORTS.map((sport) => {
          const active = !!activeSports[sport]
          const details = activeSports[sport]
          return (
            <div key={sport} className="rounded-lg border border-black/10 p-3">
              <label className="flex items-center gap-2 cursor-pointer select-none font-medium">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={() => toggleSport(sport)}
                />
                {sport}
              </label>

              {active && (
                <div className="mt-3 ml-5 flex flex-col gap-2">
                  <label className="flex items-center gap-2 text-sm">
                    <span className="shrink-0">Durée (min)</span>
                    <input
                      type="number"
                      min={1}
                      max={600}
                      value={details.duree}
                      onChange={(e) => updateSport(sport, { duree: e.target.value })}
                      required
                      className="w-20 rounded border border-black/20 px-2 py-1 text-sm"
                    />
                  </label>

                  <ParticipantPicker
                    members={members}
                    details={details}
                    onToggleWithOthers={() =>
                      updateSport(sport, { withOthers: !details.withOthers })
                    }
                    onToggleMember={(id) =>
                      toggleParticipantIn(id, details.participants, (ids) =>
                        updateSport(sport, { participants: ids })
                      )
                    }
                  />
                </div>
              )}
            </div>
          )
        })}

        {/* Custom sport */}
        <div className="rounded-lg border border-black/10 p-3">
          <label className="flex items-center gap-2 cursor-pointer select-none font-medium">
            <input
              type="checkbox"
              checked={customChecked}
              onChange={() => setCustomChecked((v) => !v)}
            />
            Autre
          </label>

          {customChecked && (
            <div className="mt-3 ml-5 flex flex-col gap-2">
              <input
                type="text"
                placeholder="Nom du sport"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-48 rounded border border-black/20 px-2 py-1 text-sm"
              />
              <label className="flex items-center gap-2 text-sm">
                <span className="shrink-0">Durée (min)</span>
                <input
                  type="number"
                  min={1}
                  max={600}
                  value={customDetails.duree}
                  onChange={(e) =>
                    setCustomDetails((prev) => ({ ...prev, duree: e.target.value }))
                  }
                  className="w-20 rounded border border-black/20 px-2 py-1 text-sm"
                />
              </label>

              <ParticipantPicker
                members={members}
                details={customDetails}
                onToggleWithOthers={() =>
                  setCustomDetails((prev) => ({ ...prev, withOthers: !prev.withOthers }))
                }
                onToggleMember={(id) =>
                  toggleParticipantIn(id, customDetails.participants, (ids) =>
                    setCustomDetails((prev) => ({ ...prev, participants: ids }))
                  )
                }
              />
            </div>
          )}
        </div>
      </section>

      {/* ── Alimentation ── */}
      <section className="flex flex-col gap-3">
        <p className="font-medium">Alimentation</p>
        <div className="flex flex-col gap-2">
          {ALIMENTATION_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-2 cursor-pointer select-none"
            >
              <input
                type="radio"
                name="alimentation"
                value={opt.value}
                checked={alimentation === opt.value}
                onChange={() => setAlimentation(opt.value)}
              />
              {opt.label}
            </label>
          ))}
        </div>
      </section>

      {/* ── Alcool ── */}
      <section className="flex items-center gap-3">
        <label htmlFor="alcool" className="font-medium shrink-0">
          Verres d&apos;alcool
        </label>
        <input
          id="alcool"
          type="number"
          min={0}
          max={99}
          value={nbVerres}
          onChange={(e) => setNbVerres(Math.max(0, Number(e.target.value)))}
          className="w-20 rounded-lg border border-black/20 px-3 py-2 text-sm"
        />
      </section>

      {/* ── Photo ── */}
      <section className="flex flex-col gap-3">
        <p className="font-medium">
          Photo <span className="text-red-500">*</span>
        </p>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-fit rounded-full border border-black/20 px-4 py-2 text-sm"
        >
          {photoFile ? 'Changer la photo' : 'Choisir une photo'}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handlePhotoChange}
          className="sr-only"
        />

        {photoPreview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoPreview}
            alt="Aperçu de la photo"
            className="max-h-64 w-full max-w-xs rounded-lg object-cover"
          />
        )}

        {!photoFile && (
          <p className="text-xs text-zinc-500">
            Une photo est requise pour valider le check-in.
          </p>
        )}
      </section>

      {/* ── Error ── */}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* ── Submit ── */}
      <button
        type="submit"
        disabled={submitting || !photoFile || !date}
        className="rounded-full bg-black py-3 text-sm font-medium text-white disabled:opacity-40"
      >
        {submitting ? 'Envoi en cours…' : 'Valider mon check-in'}
      </button>
    </form>
  )
}
