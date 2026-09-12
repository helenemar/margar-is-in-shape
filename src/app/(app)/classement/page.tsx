import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getProfile, createAdminClient } from '@/lib/supabase/server'
import { computeMonthlyScore, type MemberScore } from '@/lib/scoring'

// ── Helpers ───────────────────────────────────────────────────────────────────

const pad = (n: number) => String(n).padStart(2, '0')

/** Current month as YYYY-MM (UTC). */
function currentYM(): string {
  const now = new Date()
  return `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}`
}

/** First and last day of a YYYY-MM month. */
function monthBounds(ym: string): { start: string; end: string } {
  const [y, m] = ym.split('-').map(Number)
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate()
  return {
    start: `${y}-${pad(m)}-01`,
    end: `${y}-${pad(m)}-${pad(lastDay)}`,
  }
}

/** "Septembre 2026" */
function monthLabel(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  const label = new Date(y, m - 1, 1).toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

/** "Sept." — short name for nav arrows */
function shortMonthLabel(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  const label = new Date(y, m - 1, 1).toLocaleDateString('fr-FR', { month: 'short' })
  return label.charAt(0).toUpperCase() + label.slice(1).replace('.', '')
}

function ordinalFr(n: number): string {
  return n === 1 ? '1er' : `${n}e`
}

// ── Types ─────────────────────────────────────────────────────────────────────

type MonthCheckin = {
  user_id: string
  alimentation: string
  nb_verres_alcool: number
  activities: { id: string }[]
}

type RankedMember = MemberScore & {
  days_sport: number
  days_super_healthy: number
  days_no_alcohol: number
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ClassementPage({
  searchParams,
}: {
  searchParams: Promise<{ mois?: string }>
}) {
  const { mois: moisParam } = await searchParams
  const profile = await getProfile()
  if (!profile) redirect('/join')

  const supabase = createAdminClient()

  // 1. Fetch group members
  const { data: membersRaw } = await supabase
    .from('profiles')
    .select('id, prenom')
    .eq('group_id', profile.group_id)
    .order('prenom')

  const members = (membersRaw ?? []) as { id: string; prenom: string }[]
  const memberIds = members.map((m) => m.id)

  // 2. Build list of available months (months with at least one check-in in the group)
  const allMonths: string[] = [currentYM()] // always include current month

  if (memberIds.length > 0) {
    const { data: datesRaw } = await supabase
      .from('checkins')
      .select('date')
      .in('user_id', memberIds)

    for (const row of datesRaw ?? []) {
      const ym = (row as { date: string }).date.slice(0, 7)
      if (!allMonths.includes(ym)) allMonths.push(ym)
    }
  }

  // Sort descending (most recent first)
  allMonths.sort((a, b) => b.localeCompare(a))

  // 3. Resolve selected month
  const selectedMois =
    moisParam && allMonths.includes(moisParam) ? moisParam : currentYM()

  const currentIdx = allMonths.indexOf(selectedMois)
  const prevMois = currentIdx < allMonths.length - 1 ? allMonths[currentIdx + 1] : null
  const nextMois = currentIdx > 0 ? allMonths[currentIdx - 1] : null
  const isCurrentMonth = selectedMois === currentYM()

  // 4. Fetch check-ins for the selected month
  const { start, end } = monthBounds(selectedMois)

  const { data: monthRaw } =
    memberIds.length > 0
      ? await supabase
          .from('checkins')
          .select('user_id, alimentation, nb_verres_alcool, activities(id)')
          .in('user_id', memberIds)
          .gte('date', start)
          .lte('date', end)
      : { data: [] }

  const monthCheckins = (monthRaw ?? []) as MonthCheckin[]

  // 5. Group by member
  const byUser = new Map<string, MonthCheckin[]>()
  for (const c of monthCheckins) {
    byUser.set(c.user_id, [...(byUser.get(c.user_id) ?? []), c])
  }

  // 6. Compute scores + breakdown, then sort descending
  const ranked: RankedMember[] = members
    .map((m) => {
      const checkins = byUser.get(m.id) ?? []
      const forScoring = checkins.map((c) => ({
        alimentation: c.alimentation,
        nb_verres_alcool: c.nb_verres_alcool,
        has_activity: Array.isArray(c.activities) && c.activities.length > 0,
      }))
      return {
        profileId: m.id,
        prenom: m.prenom,
        score: computeMonthlyScore(forScoring),
        days_sport: forScoring.filter((c) => c.has_activity).length,
        days_super_healthy: forScoring.filter((c) => c.alimentation === 'super_healthy').length,
        days_no_alcohol: forScoring.filter((c) => c.nb_verres_alcool === 0).length,
      }
    })
    .sort((a, b) => b.score - a.score)

  const winner = ranked[0]

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-xl px-4 py-8 flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Classement</h1>

      {/* ── Month navigation ── */}
      <div className="flex items-center justify-between">
        {prevMois ? (
          <Link
            href={`/classement?mois=${prevMois}`}
            className="text-sm text-zinc-500 hover:text-black"
          >
            ← {shortMonthLabel(prevMois)}
          </Link>
        ) : (
          <span />
        )}
        <span className="text-sm font-medium">{monthLabel(selectedMois)}</span>
        {nextMois ? (
          <Link
            href={`/classement?mois=${nextMois}`}
            className="text-sm text-zinc-500 hover:text-black"
          >
            {shortMonthLabel(nextMois)} →
          </Link>
        ) : (
          <span />
        )}
      </div>

      {/* ── Winner banner ── */}
      {winner && winner.score > 0 && (
        <section className="rounded-xl bg-black text-white p-5 flex flex-col gap-1">
          <p className="text-xs uppercase tracking-wide text-zinc-400">
            {isCurrentMonth ? 'En tête ce mois-ci' : 'Gagnant du mois'}
          </p>
          <p className="text-3xl font-bold mt-1">{winner.prenom}</p>
          <p className="text-sm text-zinc-400 mt-0.5">{winner.score} pts</p>
        </section>
      )}

      {/* ── Full ranking ── */}
      <section className="flex flex-col gap-2">
        {ranked.map((m, i) => {
          const isMe = m.profileId === profile.id
          return (
            <div
              key={m.profileId}
              className={`rounded-xl px-4 py-3 flex flex-col gap-1.5 ${
                isMe ? 'bg-black text-white' : 'border border-black/10'
              }`}
            >
              {/* Rank + name + score */}
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-3">
                  <span className={`text-sm tabular-nums ${isMe ? 'text-zinc-400' : 'text-zinc-400'}`}>
                    {ordinalFr(i + 1)}
                  </span>
                  <span className="font-medium">{m.prenom}</span>
                </span>
                <span className={`font-semibold ${isMe ? 'text-white' : 'text-black'}`}>
                  {m.score} pts
                </span>
              </div>

              {/* Breakdown */}
              <div className={`flex gap-3 text-xs ml-7 ${isMe ? 'text-zinc-400' : 'text-zinc-500'}`}>
                <span>{m.days_sport}j sport</span>
                <span>{m.days_super_healthy}j super healthy</span>
                <span>{m.days_no_alcohol}j sans alcool</span>
              </div>
            </div>
          )
        })}

        {ranked.length === 0 && (
          <p className="text-center text-zinc-500 text-sm py-8">
            Aucun check-in ce mois-ci.
          </p>
        )}
      </section>
    </div>
  )
}
