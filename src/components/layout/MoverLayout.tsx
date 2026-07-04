import { Outlet } from 'react-router-dom'
import Wordmark from '../brand/Wordmark'
import HazardStripe from '../brand/HazardStripe'
import BottomNav, { moverNav } from './BottomNav'

export default function MoverLayout() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="bg-jet text-white sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 flex items-center justify-between h-14">
          <Wordmark variant="billboard" className="!text-xl !text-white [&_span]:!text-haul-hot" linkTo="/mover/dashboard" />
          <span className="font-condensed font-bold text-xs uppercase tracking-widest text-gray-400">Mover</span>
        </div>
        <HazardStripe />
      </header>
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-5 pb-24">
        <Outlet />
      </main>
      <BottomNav items={moverNav} />
    </div>
  )
}
