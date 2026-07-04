import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, UserCheck, Briefcase, Users, TrendingUp, LogOut, DollarSign } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import HazardStripe from '../brand/HazardStripe'

export default function AdminLayout() {
  const navigate = useNavigate()
  const logout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 px-3 py-2 text-sm font-condensed font-bold uppercase tracking-wider transition border-3 ${
      isActive
        ? 'bg-haul text-white border-jet shadow-hard-sm'
        : 'bg-white text-jet border-transparent hover:bg-concrete'
    }`

  return (
    <div className="min-h-screen bg-concrete flex">
      <aside className="w-56 bg-white border-r-3 border-jet hidden md:flex flex-col min-h-screen">
        <div className="px-4 h-14 flex items-center border-b-3 border-jet bg-jet">
          <span className="font-display text-lg uppercase text-white">Move<span className="text-haul">This</span>Out</span>
        </div>
        <HazardStripe />
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          <NavLink to="/admin/dashboard" className={linkClass}><LayoutDashboard size={18} />Dashboard</NavLink>
          <NavLink to="/admin/approvals" className={linkClass}><UserCheck size={18} />Approvals</NavLink>
          <NavLink to="/admin/jobs" className={linkClass}><Briefcase size={18} />Jobs</NavLink>
          <NavLink to="/admin/users" className={linkClass}><Users size={18} />Users</NavLink>
          <NavLink to="/admin/revenue" className={linkClass}><TrendingUp size={18} />Revenue</NavLink>
          <NavLink to="/admin/pricing" className={linkClass}><DollarSign size={18} />Pricing</NavLink>
        </nav>
        <div className="px-3 pb-4">
          <button onClick={logout} className="flex items-center gap-2 px-3 py-2 text-sm font-condensed font-bold uppercase tracking-wider text-jet hover:bg-concrete transition w-full">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-h-screen bg-white">
        <header className="bg-jet text-white border-b-3 border-jet h-14 flex items-center px-6 md:hidden">
          <span className="font-display text-lg uppercase">Admin</span>
        </header>
        <main className="flex-1 px-4 md:px-8 py-6 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
