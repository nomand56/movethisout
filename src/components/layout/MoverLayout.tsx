import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Inbox, Zap, LogOut } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export default function MoverLayout() {
  const navigate = useNavigate()
  const logout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${isActive ? 'bg-brand-500 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 flex items-center justify-between h-14">
          <span className="font-bold text-brand-500 text-lg">MoveThisOut <span className="text-xs font-normal text-gray-500">Mover</span></span>
          <nav className="flex items-center gap-1">
            <NavLink to="/mover/dashboard" className={linkClass}>
              <LayoutDashboard size={18} /> <span className="hidden sm:inline">Dashboard</span>
            </NavLink>
            <NavLink to="/mover/jobs" className={linkClass}>
              <Inbox size={18} /> <span className="hidden sm:inline">Jobs</span>
            </NavLink>
            <NavLink to="/mover/active" className={linkClass}>
              <Zap size={18} /> <span className="hidden sm:inline">Active</span>
            </NavLink>
            <button onClick={logout} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition">
              <LogOut size={18} />
            </button>
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
