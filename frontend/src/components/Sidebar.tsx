'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Wallet, Target } from 'lucide-react'
import { cn } from '@/lib/utils'

const nav = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/assets', label: 'Assets', icon: Wallet },
  { href: '/milestones', label: 'Milestones', icon: Target },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-full w-56 shrink-0 flex-col border-r border-border bg-card px-4 py-6">
      <div className="mb-8 px-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Mission Control
        </p>
        <h1 className="mt-1 text-lg font-bold text-foreground">fin-shark</h1>
      </div>

      <nav className="flex flex-col gap-1">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              pathname === href
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground',
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
