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
}

export default function BottomNav({ items }: Props) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-3 border-jet safe-area-pb">
      <div className="max-w-lg mx-auto flex">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              clsx(
                'flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] font-condensed font-bold text-[11px] uppercase tracking-wider transition-colors',
                item.accent
                  ? isActive
                    ? 'bg-haul text-white'
                    : 'bg-haul text-white hover:bg-haul-hot'
                  : isActive
                  ? 'text-haul bg-concrete'
                  : 'text-jet hover:bg-concrete',
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
  { to: '/app/jobs/new', label: 'Book', icon: <Plus size={22} />, accent: true },
  { to: '/app/settings', label: 'Account', icon: <User size={20} /> },
]

export const moverNav: NavItem[] = [
  { to: '/mover/dashboard', label: 'Home', icon: <Home size={20} /> },
  { to: '/mover/jobs', label: 'Jobs', icon: <Inbox size={20} /> },
  { to: '/mover/active', label: 'Active', icon: <Zap size={20} /> },
  { to: '/mover/settings', label: 'Account', icon: <User size={20} /> },
]
