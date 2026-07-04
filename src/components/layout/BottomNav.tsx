import { NavLink } from 'react-router-dom'
import { Home, Plus, User, Inbox, Zap } from 'lucide-react'
import { clsx } from '../../lib/clsx'

interface NavItem {
  to: string
  label: string
  icon: React.ReactNode
  accent?: boolean
}

interface Props {
  items: NavItem[]
  variant?: 'customer' | 'mover'
}

export default function BottomNav({ items, variant = 'customer' }: Props) {
  const isMover = variant === 'mover'

  return (
    <nav
      className={clsx(
        'fixed bottom-0 left-0 right-0 z-40 border-t nav-safe-pb',
        isMover ? 'bg-mover border-slate-600' : 'bg-white border-gray-200',
      )}
    >
      <div className="max-w-lg mx-auto flex items-stretch px-1 pt-1">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              clsx(
                'flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-[52px] text-[11px] font-medium transition-colors rounded-lg mx-0.5',
                item.accent
                  ? isActive
                    ? 'bg-accent text-white'
                    : 'bg-accent/90 text-white hover:bg-accent'
                  : isMover
                  ? isActive
                    ? 'text-white bg-white/10'
                    : 'text-white/60 hover:text-white'
                  : isActive
                  ? 'text-accent bg-accent-soft'
                  : 'text-ink-muted hover:text-ink hover:bg-gray-50',
              )
            }
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

export const requesterNav: NavItem[] = [
  { to: '/app/dashboard', label: 'Orders', icon: <Home size={20} /> },
  { to: '/app/jobs/new', label: 'Book', icon: <Plus size={20} />, accent: true },
  { to: '/app/settings', label: 'Account', icon: <User size={20} /> },
]

export const moverNav: NavItem[] = [
  { to: '/mover/dashboard', label: 'Home', icon: <Home size={20} /> },
  { to: '/mover/jobs', label: 'Jobs', icon: <Inbox size={20} /> },
  { to: '/mover/active', label: 'Active', icon: <Zap size={20} /> },
  { to: '/mover/settings', label: 'Account', icon: <User size={20} /> },
]
