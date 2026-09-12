import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getProfile, createAdminClient } from '@/lib/supabase/server'
import { computeMonthlyScore, rankMembers, type MemberScore } from '@/lib/scoring'

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Current date in YYYY-MM-DD (UTC — consistent with Supabase date columns). */
function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

/** First and last day of the current UTC calendar month. */
function currentMonthBounds(): { start: string; end: string; label: string } {
  const now = new Date()
  const y = now.getUTCFullYear()
  const m = now.getUTCMonth() // 0-based
  const pad = (n: number) => String(n).padStart(2, '0')
  const start = `${y}-${pad(m + 1)}-01`
  const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate()
  const end = `${y}-${pad(m + 1)}-${pad(lastDay)}`
  const label = now.toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
  return { start, end, label }
}

function ordinalFr(n: number): string {
  return n === 1 ? '1er' : `${n}e`
}

const ALIMENTATION_LABEL: Record<string, string> = {
  super_healthy: 'Super Healthy',
  ca_va: 'En vrai ça va',
  faute: "J'ai fauté",
}

// ── Types ─────────────────────────────────────────────────────────────────────

type Activity = { id: string; sport: string; duree_minutes: number }

type TodayCheckin = {
  id: string
  alimentation: string
  nb_verres_alcool: number
  activities: Activity[]
}

type MonthCheckin = {
  user_id: string
  alimentation: string
  nb_verres_alcool: number
  activities: { id: string }[]
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>
}) {
  const { success } = await searchParams
  const profile = await getProfile()
  if (!profile) redirect('/join')

  const supabase = createAdminClient()
  const today = todayISO()
  const { start: monthStart, end: monthEnd, label: monthLabel } = currentMonthBounds()

  // Fetch today's check-in + group members in parallel
  const [{ data: todayRaw }, { data: membersRaw }] = await Promise.all([
    supabase
      .from('checkins')
      .select('id, alimentation, nb_verres_alcool, activities(id, sport, duree_minutes)')
      .eq('user_id', profile.id)
      .eq('date', today)
      .maybeSingle(),
    supabase
      .from('profiles')
      .select('id, prenom')
      .eq('group_id', profile.group_id)
      .order('prenom'),
  ])

  const todayCheckin = todayRaw as TodayCheckin | null
  const members = (membersRaw ?? []) as { id: string; prenom: string }[]
  const memberIds = members.map((m) => m.id)

  // Fetch all check-ins for the month (requires member IDs from previous query)
  const { data: monthRaw } = await supabase
    .from('checkins')
    .select('user_id, alimentation, nb_verres_alcool, activities(id)')
    .in('user_id', memberIds)
    .gte('date', monthStart)
    .lte('date', monthEnd)

  const monthCheckins = (monthRaw ?? []) as MonthCheckin[]

  // Group checkins by member, then compute scores
  const byUser = new Map<string, MonthCheckin[]>()
  for (const c of monthCheckins) {
    byUser.set(c.user_id, [...(byUser.get(c.user_id) ?? []), c])
  }

  const memberScores: MemberScore[] = members.map((m) => ({
    profileId: m.id,
    prenom: m.prenom,
    score: computeMonthlyScore(
      (byUser.get(m.id) ?? []).map((c) => ({
        alimentation: c.alimentation,
        nb_verres_alcool: c.nb_verres_alcool,
        has_activity: Array.isArray(c.activities) && c.activities.length > 0,
      }))
    ),
  }))

  const ranked = rankMembers(memberScores)
  const myRankIdx = ranked.findIndex((m) => m.profileId === profile.id)
  const myRank = myRankIdx + 1
  const myScore = ranked[myRankIdx]?.score ?? 0
  const top3 = ranked.slice(0, 3)

  // Sports summary string for today
  const sportsStr =
    todayCheckin && todayCheckin.activities.length > 0
      ? todayCheckin.activities
          .map((a) => `${a.sport} (${a.duree_minutes} min)`)
          .join(', ')
      : null

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-xl px-4 py-8 flex flex-col gap-6">
      {/* Redirect success banner from /checkin */}
      {success === '1' && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Check-in enregistré !
        </div>
      )}

      {/* ── 1. Check-in du jour ── */}
      {todayCheckin ? (
        <section className="rounded-xl border border-green-200 bg-green-50 p-5 flex flex-col gap-2">
          <p className="font-semibold text-green-800">✅ Check-in fait aujourd&apos;hui</p>
          <p className="text-sm text-green-700">
            {ALIMENTATION_LABEL[todayCheckin.alimentation] ?? todayCheckin.alimentation}
            {todayCheckin.nb_verres_alcool === 0 ? ' · 0 verre' : ` · ${todayCheckin.nb_verres_alcool} verre${todayCheckin.nb_verres_alcool > 1 ? 's' : ''}`}
          </p>
          {sportsStr && <p className="text-sm text-green-700">{sportsStr}</p>}
          <Link
            href="/checkin"
            className="mt-1 self-start text-xs text-green-600 underline underline-offset-2"
          >
            Modifier
          </Link>
        </section>
      ) : (
        <section className="rounded-xl bg-black p-5 flex flex-col gap-3">
          <p className="font-semibold text-white text-lg">
            Pas encore de check-in aujourd&apos;hui
          </p>
          <p className="text-sm text-zinc-400">Valide ta journée pour gagner tes points !</p>
          <Link
            href="/checkin"
            className="mt-1 self-start rounded-full bg-white px-5 py-2 text-sm font-semibold text-black"
          >
            Faire mon check-in
          </Link>
        </section>
      )}

      {/* ── 2. Mon score du mois ── */}
      <section className="rounded-xl border border-black/10 p-5 flex flex-col gap-1">
        <p className="text-xs uppercase tracking-wide text-zinc-500">{monthLabel}</p>
        <p className="text-4xl font-bold mt-1">{myScore} pts</p>
        <p className="text-sm text-zinc-500 mt-0.5">
          {ordinalFr(myRank)} sur {members.length}{' '}
          {members.length > 1 ? 'membres' : 'membre'}
        </p>
      </section>

      {/* ── 3. Mini classement ── */}
      <section className="rounded-xl border border-black/10 p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Top du mois</p>
          <Link
            href="/classement"
            className="text-xs underline underline-offset-2 text-zinc-600"
          >
            Classement complet →
          </Link>
        </div>
        <ol className="flex flex-col gap-2">
          {top3.map((m, i) => {
            const isMe = m.profileId === profile.id
            return (
              <li
                key={m.profileId}
                className={`flex items-center justify-between rounded-lg px-4 py-2.5 text-sm ${
                  isMe
                    ? 'bg-black text-white font-semibold'
                    : 'bg-zinc-50 text-zinc-800'
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className={isMe ? 'text-zinc-400' : 'text-zinc-400 tabular-nums'}>
                    {i + 1}.
                  </span>
                  {m.prenom}
                </span>
                <span className={isMe ? 'text-zinc-300' : 'text-zinc-500'}>
                  {m.score} pts
                </span>
              </li>
            )
          })}
        </ol>
      </section>
    </div>
  )
}
