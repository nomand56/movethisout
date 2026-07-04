import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import Spinner from '../../components/ui/Spinner'
import { Briefcase, Users, Radio, DollarSign, UserCheck } from 'lucide-react'
import { startOfMonth, format } from 'date-fns'

export default function AdminDashboard() {
  const today = format(new Date(), 'yyyy-MM-dd')
  const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd')

  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [todayJobs, openJobs, onlineMovers, monthRevenue, pendingMovers] = await Promise.all([
        supabase.from('jobs').select('id', { count: 'exact', head: true }).eq('scheduled_date', today),
        supabase.from('jobs').select('id', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('mover_profiles').select('id', { count: 'exact', head: true }).eq('is_online', true),
        supabase.from('jobs').select('quoted_price').eq('status', 'completed').gte('created_at', monthStart),
        supabase.from('mover_profiles').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      ])
      const gmv = (monthRevenue.data ?? []).reduce((s, j) => s + (j.quoted_price ?? 0), 0)
      return {
        todayJobs: todayJobs.count ?? 0,
        openJobs: openJobs.count ?? 0,
        onlineMovers: onlineMovers.count ?? 0,
        gmv,
        pendingMovers: pendingMovers.count ?? 0,
      }
    },
    refetchInterval: 30000,
  })

  if (isLoading) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>

  const cards = [
    { label: 'Jobs today', value: stats?.todayJobs, icon: Briefcase },
    { label: 'Open jobs', value: stats?.openJobs, icon: Radio },
    { label: 'Online movers', value: stats?.onlineMovers, icon: Users },
    { label: 'GMV this month', value: `$${(stats?.gmv ?? 0).toFixed(0)}`, icon: DollarSign },
    { label: 'Pending approvals', value: stats?.pendingMovers, icon: UserCheck },
  ]

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl uppercase">Admin dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {cards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="card-yard p-4">
            <div className="w-10 h-10 border-3 border-jet bg-caution flex items-center justify-center mb-3 text-jet">
              <Icon size={20} />
            </div>
            <p className="price-hero text-3xl">{value}</p>
            <p className="text-xs font-condensed font-bold uppercase tracking-wider text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
