import { Outlet } from 'react-router-dom'
import Wordmark from '../brand/Wordmark'
import HazardStripe from '../brand/HazardStripe'
import BottomNav, { requesterNav } from './BottomNav'

export default function RequesterLayout() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="bg-haul text-white sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 flex items-center justify-between h-14">
          <Wordmark variant="billboard" className="!text-2xl !shadow-none" linkTo="/app/dashboard" />
        </div>
        <HazardStripe />
      </header>
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-5 pb-24">
        <Outlet />
      </main>
      <BottomNav items={requesterNav} />
    </div>
  )
}
