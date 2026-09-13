'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Newspaper, Plus, Trophy, CalendarDays, User } from 'lucide-react'

type NavItem = {
  href: string
  icon: React.ElementType
  label: string
}

const NAV_LEFT: NavItem[] = [
  { href: '/feed',       icon: Newspaper,    label: 'Fil'        },
  { href: '/classement', icon: Trophy,       label: 'Classement' },
]

const NAV_RIGHT: NavItem[] = [
  { href: '/historique', icon: CalendarDays, label: 'Historique' },
  { href: '/profil',     icon: User,         label: 'Profil'     },
]

export function BottomNav({ feedBadge }: { feedBadge: React.ReactNode }) {
  const pathname = usePathname()

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm">

      {/* ── Notch: same colour as page background, "punches" a hole in the bar ── */}
      <div
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 z-10 rounded-full bg-background"
        style={{ width: 72, height: 72, top: -34 }}
      />

      {/* ── Bar ── */}
      <nav
        aria-label="Navigation principale"
        className="relative flex h-[66px] items-center rounded-[22px] bg-ink px-5 shadow-[0_8px_32px_rgba(0,0,0,0.22)]"
      >
        {/* Left items */}
        <div className="flex flex-1 items-center justify-around">
          <NavButton
            item={NAV_LEFT[0]}
            active={isActive(NAV_LEFT[0].href)}
            badge={feedBadge}
          />
          <NavButton item={NAV_LEFT[1]} active={isActive(NAV_LEFT[1].href)} />
        </div>

        {/* Spacer keeps items away from the notch */}
        <div className="w-16 shrink-0" />

        {/* Right items */}
        <div className="flex flex-1 items-center justify-around">
          <NavButton item={NAV_RIGHT[0]} active={isActive(NAV_RIGHT[0].href)} />
          <NavButton item={NAV_RIGHT[1]} active={isActive(NAV_RIGHT[1].href)} />
        </div>
      </nav>

      {/* ── Check-in button sits in the notch ── */}
      <Link
        href="/checkin"
        aria-label="Faire mon check-in"
        className="absolute left-1/2 z-20 -translate-x-1/2 flex items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-accent shadow-[0_6px_20px_rgba(255,107,74,0.55)] transition-transform active:scale-95"
        style={{ width: 60, height: 60, top: -28 }}
      >
        <Plus size={26} strokeWidth={2.5} className="text-white" />
      </Link>
    </div>
  )
}

function NavButton({
  item,
  active,
  badge,
}: {
  item: NavItem
  active: boolean
  badge?: React.ReactNode
}) {
  const Icon = item.icon
  return (
    <div className="relative">
      <Link
        href={item.href}
        aria-label={item.label}
        className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors ${
          active ? 'bg-white/10 text-white' : 'text-muted hover:text-white'
        }`}
      >
        <Icon size={20} strokeWidth={active ? 2.5 : 2} />
      </Link>
      {badge && (
        <div className="pointer-events-none absolute -right-1 -top-1">{badge}</div>
      )}
    </div>
  )
}
