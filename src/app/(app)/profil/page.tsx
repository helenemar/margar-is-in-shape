import { redirect } from 'next/navigation'
import { getProfile, createAdminClient } from '@/lib/supabase/server'
import { PrenomForm } from './PrenomForm'
import { AvatarForm } from './AvatarForm'
import { PinCard } from './PinCard'
import { LogoutButton } from '@/components/LogoutButton'

export default async function ProfilPage() {
  const profile = await getProfile()
  if (!profile) redirect('/join')

  const supabase = createAdminClient()
  const { data: group } = await supabase
    .from('family_groups')
    .select('pin')
    .eq('id', profile.group_id)
    .single()

  const pin = group?.pin ?? '—'

  return (
    <div className="mx-auto max-w-xl px-4 py-8 flex flex-col gap-8">
      <h1 className="text-2xl font-semibold">Mon profil</h1>

      {/* ── Avatar ── */}
      <section className="rounded-xl border border-black/10 p-5">
        <AvatarForm currentAvatarUrl={profile.avatar_url} prenom={profile.prenom} />
      </section>

      {/* ── Prénom ── */}
      <section className="rounded-xl border border-black/10 p-5">
        <PrenomForm currentPrenom={profile.prenom} />
      </section>

      {/* ── PIN ── */}
      <section className="rounded-xl border border-black/10 p-5">
        <PinCard pin={pin} />
      </section>

      {/* ── Déconnexion ── */}
      <section className="flex flex-col gap-2">
        <p className="text-xs text-muted">Connecté en tant que {profile.prenom}</p>
        <LogoutButton />
      </section>
    </div>
  )
}
