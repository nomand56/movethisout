import { Outlet, useLocation } from 'react-router-dom'
import BottomNav, { moverNav } from './BottomNav'
import { clsx } from '../../lib/clsx'

export default function MoverLayout() {
  const { pathname } = useLocation()
  const isActiveDrive = pathname === '/mover/active'

  return (
    <div className="min-h-dvh bg-surface-muted flex flex-col max-w-lg mx-auto w-full">
      <header className="bg-mover text-white sticky top-0 z-40 shrink-0">
        <div className="px-4 flex items-center justify-between h-14">
          <div>
            <p className="text-base font-bold">Driver</p>
            <p className="text-[10px] text-white/60">MoveThisOut · Kamloops</p>
          </div>
          <span className="text-xs bg-white/10 px-2.5 py-1 rounded-lg font-medium">Mover</span>
        </div>
      </header>
      <main
        className={clsx(
          'flex-1 w-full min-h-0 relative',
          isActiveDrive ? 'overflow-hidden' : 'px-4 py-5 main-with-nav overflow-y-auto',
        )}
      >
        <Outlet />
      </main>
      <BottomNav items={moverNav} variant="mover" />
    </div>
  )
}
