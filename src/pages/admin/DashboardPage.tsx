import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import Spinner from '../../components/ui/Spinner'
import { Briefcase, Users, Radio, DollarSign, UserCheck } from 'lucide-react'
import { startOfMonth, endOfMonth, format } from 'date-fns'

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
    { label: 'Jobs Today', value: stats?.todayJobs, icon: Briefcase, color: 'blue' },
    { label: 'Open Jobs', value: stats?.openJobs, icon: Radio, color: 'orange' },
    { label: 'Online Movers', value: stats?.onlineMovers, icon: Users, color: 'green' },
    { label: 'GMV This Month', value: `$${(stats?.gmv ?? 0).toFixed(0)}`, icon: DollarSign, color: 'purple' },
    { label: 'Pending Approvals', value: stats?.pendingMovers, icon: UserCheck, color: 'yellow' },
  ]

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600',
    orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600',
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Admin Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colorMap[color]}`}>
              <Icon size={20} />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
