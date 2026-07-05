import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, UserCheck, Briefcase, Users, TrendingUp, LogOut, DollarSign, Palette } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export default function AdminLayout() {
  const navigate = useNavigate()
  const logout = async () => {
    await supabase.auth.signOut()
    navigate('/admin/login')
  }

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium rounded-lg transition ${
      isActive
        ? 'bg-accent-soft text-accent'
        : 'text-ink-muted hover:bg-gray-100 hover:text-ink'
    }`

  return (
    <div className="min-h-screen bg-surface-muted flex">
      <aside className="w-60 bg-white border-r border-gray-200 hidden md:flex flex-col min-h-screen">
        <div className="px-5 h-16 flex flex-col justify-center border-b border-gray-100">
          <span className="font-bold text-ink">MoveThisOut</span>
          <span className="text-xs text-ink-muted">Operations</span>
        </div>
        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
          <NavLink to="/admin/dashboard" className={linkClass}><LayoutDashboard size={18} />Dashboard</NavLink>
          <NavLink to="/admin/approvals" className={linkClass}><UserCheck size={18} />Approvals</NavLink>
          <NavLink to="/admin/jobs" className={linkClass}><Briefcase size={18} />Jobs</NavLink>
          <NavLink to="/admin/users" className={linkClass}><Users size={18} />Users</NavLink>
          <NavLink to="/admin/revenue" className={linkClass}><TrendingUp size={18} />Revenue</NavLink>
          <NavLink to="/admin/pricing" className={linkClass}><DollarSign size={18} />Pricing</NavLink>
          <NavLink to="/admin/theme" className={linkClass}><Palette size={18} />Theme</NavLink>
        </nav>
        <div className="px-3 pb-4">
          <button onClick={logout} className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-ink-muted hover:bg-gray-100 rounded-lg transition w-full">
            <LogOut size={18} /> Sign out
          </button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="bg-white border-b border-gray-200 h-14 flex items-center px-6 md:hidden">
          <span className="font-bold text-ink">Admin</span>
        </header>
        <main className="flex-1 px-4 md:px-8 py-6 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
