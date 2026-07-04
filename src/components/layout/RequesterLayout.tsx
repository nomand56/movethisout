import { Outlet, Link } from 'react-router-dom'
import { BRAND_FULL, SERVICE_AREA_LABEL } from '../../lib/serviceArea'
import BottomNav, { requesterNav } from './BottomNav'
export default function RequesterLayout() {
  return (
    <div className="min-h-screen bg-surface-muted flex flex-col">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 flex items-center justify-between h-14">
          <Link to="/app/dashboard" className="text-base font-bold text-ink tracking-tight">
            {BRAND_FULL}
          </Link>
          <span className="text-xs text-ink-muted">{SERVICE_AREA_LABEL}</span>
        </div>
      </header>
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-5 pb-24">
        <Outlet />
      </main>
      <BottomNav items={requesterNav} />
    </div>
  )
}
