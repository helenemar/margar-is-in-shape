import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server'

const DAYS_FR = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

const pad = (n: number) => String(n).padStart(2, '0')

function parseYM(raw?: string): { year: number; month: number } {
  if (raw && /^\d{4}-\d{2}$/.test(raw)) {
    const [y, m] = raw.split('-').map(Number)
    if (m >= 1 && m <= 12) return { year: y, month: m }
  }
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}

function monthLabel(year: number, month: number): string {
  const s = new Date(year, month - 1, 1).toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function adjacentYM(year: number, month: number, delta: -1 | 1): string {
  const d = new Date(year, month - 1 + delta, 1)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
}

type DayStatus = 'sport' | 'no_sport'

export async function ActivityCalendar({
  profileId,
  ym,
}: {
  profileId: string
  ym?: string
}) {
  const { year, month } = parseYM(ym)
  const lastDay = new Date(year, month, 0).getDate()
  const start = `${year}-${pad(month)}-01`
  const end = `${year}-${pad(month)}-${pad(lastDay)}`

  const supabase = createAdminClient()
  const { data } = await supabase
    .from('checkins')
    .select('date, activities(id)')
    .eq('user_id', profileId)
    .gte('date', start)
    .lte('date', end)

  const statusMap = new Map<string, DayStatus>()
  for (const row of (data ?? []) as { date: string; activities: { id: string }[] }[]) {
    statusMap.set(row.date, row.activities.length > 0 ? 'sport' : 'no_sport')
  }

  // Build grid: Monday-first, pad start and end with nulls
  const firstDow = new Date(year, month - 1, 1).getDay() // 0 = Sunday
  const startOffset = firstDow === 0 ? 6 : firstDow - 1  // Mon = 0

  const cells: (number | null)[] = [
    ...Array<null>(startOffset).fill(null),
    ...Array.from({ length: lastDay }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const now = new Date()
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
  const nowYM = { year: now.getFullYear(), month: now.getMonth() + 1 }
  const isAfterCurrentMonth =
    year > nowYM.year || (year === nowYM.year && month >= nowYM.month)

  const prevYM = adjacentYM(year, month, -1)
  const nextYM = adjacentYM(year, month, 1)

  return (
    <div className="flex flex-col gap-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <Link
          href={`/profil?cal=${prevYM}`}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-100 text-ink hover:bg-zinc-200 text-sm transition-colors"
        >
          ←
        </Link>
        <span className="text-sm font-semibold">{monthLabel(year, month)}</span>
        {isAfterCurrentMonth ? (
          <span className="w-8 h-8" /> // disabled placeholder
        ) : (
          <Link
            href={`/profil?cal=${nextYM}`}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-100 text-ink hover:bg-zinc-200 text-sm transition-colors"
          >
            →
          </Link>
        )}
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 gap-1">
        {DAYS_FR.map((d, i) => (
          <div
            key={i}
            className="flex items-center justify-center text-[11px] font-semibold text-muted py-1"
          >
            {d}
          </div>
        ))}

        {/* Day cells */}
        {cells.map((day, i) => {
          if (!day) return <div key={i} />

          const dayStr = `${year}-${pad(month)}-${pad(day)}`
          const status = statusMap.get(dayStr)
          const isFuture = dayStr > todayStr
          const isToday = dayStr === todayStr

          let cellClass: string
          if (isFuture) {
            cellClass = 'text-zinc-200'
          } else if (status === 'sport') {
            cellClass = 'bg-accent text-white'
          } else if (status === 'no_sport') {
            cellClass = 'bg-orange-100 text-orange-600'
          } else if (isToday) {
            cellClass = 'ring-2 ring-inset ring-ink text-ink'
          } else {
            cellClass = 'bg-zinc-100 text-zinc-400'
          }

          return (
            <div
              key={i}
              className={`aspect-square flex items-center justify-center rounded-xl text-sm font-medium ${cellClass}`}
            >
              {day}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-muted mt-1">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-accent inline-block" />
          Check-in + sport
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-orange-100 inline-block" />
          Check-in sans sport
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-zinc-100 inline-block" />
          Pas de check-in
        </span>
      </div>
    </div>
  )
}
