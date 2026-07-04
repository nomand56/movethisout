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
    <nav className={clsx(
      'fixed bottom-0 left-0 right-0 z-50 safe-area-pb border-t',
      isMover ? 'bg-mover border-slate-600' : 'bg-white border-gray-200',
    )}>
      <div className="max-w-lg mx-auto flex">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              clsx(
                'flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] text-[11px] font-medium transition-colors',
                item.accent
                  ? isActive
                    ? 'text-white'
                    : 'text-white'
                  : isMover
                  ? isActive
                    ? 'text-white'
                    : 'text-white/50 hover:text-white/80'
                  : isActive
                  ? 'text-accent'
                  : 'text-ink-muted hover:text-ink',
              )
            }
          >
            <span className={clsx(
              'flex items-center justify-center rounded-full',
              item.accent && 'bg-accent w-11 h-11 -mt-4 shadow-soft border-4 border-white',
            )}>
              {item.icon}
            </span>
            {!item.accent && <span>{item.label}</span>}
            {item.accent && <span className="text-[10px] font-semibold text-accent -mt-0.5">{item.label}</span>}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

export const requesterNav: NavItem[] = [
  { to: '/app/dashboard', label: 'Orders', icon: <Home size={20} /> },
  { to: '/app/jobs/new', label: 'Book', icon: <Plus size={22} />, accent: true },
  { to: '/app/settings', label: 'Account', icon: <User size={20} /> },
]

export const moverNav: NavItem[] = [
  { to: '/mover/dashboard', label: 'Home', icon: <Home size={20} /> },
  { to: '/mover/jobs', label: 'Jobs', icon: <Inbox size={20} /> },
  { to: '/mover/active', label: 'Active', icon: <Zap size={20} /> },
  { to: '/mover/settings', label: 'Account', icon: <User size={20} /> },
]
