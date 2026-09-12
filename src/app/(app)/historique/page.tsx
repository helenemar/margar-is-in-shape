import { redirect } from 'next/navigation'
import { getProfile, createAdminClient } from '@/lib/supabase/server'
import { scoreDayCheckin } from '@/lib/scoring'
import type { HistoriqueEntry } from '@/app/actions/historique'
import { HistoriqueList } from './HistoriqueList'

type RawEntry = {
  id: string
  date: string
  alimentation: string
  nb_verres_alcool: number
  photo_url: string | null
  created_at: string
  activities: { id: string; sport: string; duree_minutes: number }[]
}

function isLate(date: string, createdAt: string): boolean {
  const checkinDate = new Date(date + 'T00:00:00Z')
  const diffDays =
    (new Date(createdAt).getTime() - checkinDate.getTime()) / (1000 * 60 * 60 * 24)
  return diffDays > 1
}

export default async function HistoriquePage() {
  const profile = await getProfile()
  if (!profile) redirect('/join')

  const supabase = createAdminClient()

  // Fetch ALL check-ins for stats + first page for display
  const { data: allRaw } = await supabase
    .from('checkins')
    .select('id, date, alimentation, nb_verres_alcool, photo_url, created_at, activities(id, sport, duree_minutes)')
    .eq('user_id', profile.id)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })

  const all = ((allRaw ?? []) as unknown as RawEntry[]).map((c): HistoriqueEntry => ({
    ...c,
    score: scoreDayCheckin({
      alimentation: c.alimentation,
      nb_verres_alcool: c.nb_verres_alcool,
      has_activity: c.activities.length > 0,
    }),
    is_late: isLate(c.date, c.created_at),
  }))

  // ── Global stats ────────────────────────────────────────────────────────────

  const totalDays = all.length
  const totalDaysSport = all.filter((c) => c.activities.length > 0).length
  const totalScore = all.reduce((sum, c) => sum + c.score, 0)

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-xl px-4 py-8 flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Mon historique</h1>

      {/* ── Stats summary ── */}
      <section className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-black/10 p-4 flex flex-col gap-0.5">
          <p className="text-2xl font-bold">{totalDays}</p>
          <p className="text-xs text-zinc-500">jours checkés</p>
        </div>
        <div className="rounded-xl border border-black/10 p-4 flex flex-col gap-0.5">
          <p className="text-2xl font-bold">{totalDaysSport}</p>
          <p className="text-xs text-zinc-500">jours sport</p>
        </div>
        <div className="rounded-xl border border-black/10 p-4 flex flex-col gap-0.5">
          <p className="text-2xl font-bold">{totalScore}</p>
          <p className="text-xs text-zinc-500">pts au total</p>
        </div>
      </section>

      {/* ── Paginated list ── */}
      <HistoriqueList initialEntries={all.slice(0, 20)} total={all.length} />
    </div>
  )
}
