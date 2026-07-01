import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, UserCheck, Briefcase, Users, TrendingUp, LogOut } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export default function AdminLayout() {
  const navigate = useNavigate()
  const logout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${isActive ? 'bg-brand-500 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
      <aside className="w-56 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 hidden md:flex flex-col min-h-screen">
        <div className="px-4 h-14 flex items-center">
          <span className="font-bold text-brand-500 text-lg">MoveThisOut</span>
        </div>
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          <NavLink to="/admin/dashboard" className={linkClass}><LayoutDashboard size={18} />Dashboard</NavLink>
          <NavLink to="/admin/approvals" className={linkClass}><UserCheck size={18} />Mover Approvals</NavLink>
          <NavLink to="/admin/jobs" className={linkClass}><Briefcase size={18} />Jobs</NavLink>
          <NavLink to="/admin/users" className={linkClass}><Users size={18} />Users</NavLink>
          <NavLink to="/admin/revenue" className={linkClass}><TrendingUp size={18} />Revenue</NavLink>
        </nav>
        <div className="px-3 pb-4">
          <button onClick={logout} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition w-full">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 h-14 flex items-center px-6 md:hidden">
          <span className="font-bold text-brand-500 text-lg">MoveThisOut Admin</span>
        </header>
        <main className="flex-1 px-4 md:px-8 py-6 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
