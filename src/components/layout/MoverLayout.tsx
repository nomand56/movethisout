import { Outlet } from 'react-router-dom'
import BottomNav, { moverNav } from './BottomNav'

export default function MoverLayout() {
  return (
    <div className="min-h-screen bg-surface-muted flex flex-col">
      <header className="bg-mover text-white sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 flex items-center justify-between h-14">
          <div>
            <p className="text-base font-bold">Driver</p>
            <p className="text-[10px] text-white/60">MoveThisOut · Kamloops</p>
          </div>
          <span className="text-xs bg-white/10 px-2.5 py-1 rounded-lg font-medium">Mover</span>
        </div>
      </header>
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-5 pb-24">
        <Outlet />
      </main>
      <BottomNav items={moverNav} variant="mover" />
    </div>
  )
}
