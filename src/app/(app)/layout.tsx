import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/supabase/server'
import { LogoutButton } from '@/components/LogoutButton'
import { FeedBadge } from './FeedBadge'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await getProfile()
  if (!profile) redirect('/join')

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-black/10 px-4 py-3 flex items-center justify-between gap-4">
        <span className="font-semibold text-sm shrink-0">Margar is in Shape</span>
        <nav className="flex gap-4 text-sm flex-wrap">
          <a href="/dashboard" className="hover:underline">Accueil</a>
          <a href="/feed" className="hover:underline inline-flex items-center">
            Fil
            <Suspense fallback={null}>
              <FeedBadge />
            </Suspense>
          </a>
          <a href="/checkin" className="hover:underline">Check-in</a>
          <a href="/classement" className="hover:underline">Classement</a>
          <a href="/historique" className="hover:underline">Historique</a>
          <a href="/profil" className="hover:underline">Profil</a>
        </nav>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-sm text-zinc-500">{profile.prenom}</span>
          <LogoutButton />
        </div>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  )
}
