import { Outlet, Link } from 'react-router-dom'
import { Home, Plus, User } from 'lucide-react'
import BottomNav from './BottomNav'
import { BRAND_FULL, SERVICE_AREA_LABEL } from '../../lib/serviceArea'

const guestNav = [
  { to: '/', label: 'Home', icon: <Home size={20} /> },
  { to: '/book', label: 'Book', icon: <Plus size={20} />, accent: true },
  { to: '/login', label: 'Sign in', icon: <User size={20} /> },
]

/** Guest booking shell — keeps bottom nav visible, content above it. */
export default function GuestBookingLayout() {
  return (
    <div className="min-h-dvh bg-surface-muted flex flex-col max-w-lg mx-auto w-full h-dvh max-h-dvh overflow-hidden">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40 shrink-0">
        <div className="px-4 flex items-center justify-between h-14">
          <Link to="/" className="text-base font-bold text-ink">{BRAND_FULL}</Link>
          <span className="text-xs text-ink-muted">{SERVICE_AREA_LABEL}</span>
        </div>
      </header>

      <main className="flex-1 w-full min-h-0 relative overflow-hidden">
        <Outlet />
      </main>

      <BottomNav items={guestNav} />
    </div>
  )
}
