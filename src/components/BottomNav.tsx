'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Newspaper, Plus, Trophy, CalendarDays, User } from 'lucide-react'

type NavItem = {
  href: string
  icon: React.ElementType
  label: string
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard',  icon: Home,        label: 'Accueil'    },
  { href: '/feed',       icon: Newspaper,   label: 'Fil'        },
  { href: '/classement', icon: Trophy,      label: 'Classement' },
  { href: '/historique', icon: CalendarDays, label: 'Historique' },
  { href: '/profil',     icon: User,        label: 'Profil'     },
]

export function BottomNav({ feedBadge }: { feedBadge: React.ReactNode }) {
  const pathname = usePathname()

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 rounded-full bg-ink px-2 py-2 shadow-[0_8px_32px_rgba(0,0,0,0.25)]"
    >
      {/* Accueil + Fil — left of CTA */}
      {NAV_ITEMS.slice(0, 2).map((item) => (
        <NavButton
          key={item.href}
          item={item}
          active={isActive(item.href)}
          badge={item.href === '/feed' ? feedBadge : undefined}
        />
      ))}

      {/* Central Check-in CTA */}
      <Link
        href="/checkin"
        aria-label="Faire mon check-in"
        className="mx-1 flex h-14 w-14 items-center justify-center rounded-full bg-accent shadow-[0_4px_16px_rgba(255,107,74,0.45)] transition-transform active:scale-95"
      >
        <Plus size={26} strokeWidth={2.5} className="text-white" />
      </Link>

      {/* Classement + Historique + Profil — right of CTA */}
      {NAV_ITEMS.slice(2).map((item) => (
        <NavButton
          key={item.href}
          item={item}
          active={isActive(item.href)}
        />
      ))}
    </nav>
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
        className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors ${
          active
            ? 'bg-white/10 text-white'
            : 'text-muted hover:text-white'
        }`}
      >
        <Icon size={20} strokeWidth={active ? 2.5 : 2} />
      </Link>
      {badge && (
        <div className="pointer-events-none absolute -right-1 -top-1">
          {badge}
        </div>
      )}
    </div>
  )
}
