import { Outlet, useLocation, Link } from 'react-router-dom'
import { BRAND_FULL, SERVICE_AREA_LABEL } from '../../lib/serviceArea'
import BottomNav, { requesterNav } from './BottomNav'
import { clsx } from '../../lib/clsx'

export default function RequesterLayout() {
  const { pathname } = useLocation()
  const isBooking = pathname === '/app/jobs/new'

  return (
    <div className="min-h-dvh bg-surface-muted flex flex-col max-w-lg mx-auto w-full">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40 shrink-0">
        <div className="px-4 flex items-center justify-between h-14">
          <Link to="/app/dashboard" className="text-base font-bold text-ink tracking-tight">
            {BRAND_FULL}
          </Link>
          <span className="text-xs text-ink-muted">{SERVICE_AREA_LABEL}</span>
        </div>
      </header>

      <main
        className={clsx(
          'flex-1 w-full min-h-0 relative',
          isBooking ? 'overflow-hidden' : 'px-4 py-5 main-with-nav overflow-y-auto',
        )}
      >
        <Outlet />
      </main>

      <BottomNav items={requesterNav} />
    </div>
  )
}
