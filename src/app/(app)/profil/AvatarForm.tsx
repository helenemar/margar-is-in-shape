'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { uploadAvatar } from '@/app/actions/profil'

export function AvatarForm({
  currentAvatarUrl,
  prenom,
}: {
  currentAvatarUrl: string | null
  prenom: string
}) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(currentAvatarUrl)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    if (preview && preview !== currentAvatarUrl) URL.revokeObjectURL(preview)
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    setError('')
    startTransition(async () => {
      const fd = new FormData()
      fd.set('avatar', file)
      const result = await uploadAvatar(fd)
      if (result.error) {
        setError(result.error)
      } else {
        setFile(null)
        router.refresh()
      }
    })
  }

  const initial = prenom.charAt(0).toUpperCase()

  return (
    <div className="flex flex-col gap-3">
      <p className="font-medium">Photo de profil</p>

      {/* Avatar preview / placeholder */}
      <div className="flex items-center gap-4">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="Avatar"
            className="w-20 h-20 rounded-full object-cover border border-black/10"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-zinc-100 border border-black/10 flex items-center justify-center text-2xl font-semibold text-zinc-500">
            {initial}
          </div>
        )}

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="rounded-full border border-black/20 px-4 py-2 text-sm hover:bg-zinc-50"
        >
          {currentAvatarUrl ? 'Changer la photo' : 'Choisir une photo'}
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="sr-only"
      />

      {file && (
        <form onSubmit={handleSubmit}>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-full bg-black px-5 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            {isPending ? 'Envoi en cours…' : 'Enregistrer la photo'}
          </button>
        </form>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
