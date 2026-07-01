import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, Package } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { StatusBadge } from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import type { Job } from '../../types'
import { format } from 'date-fns'

export default function RequesterDashboard() {
  const { profile } = useAuthStore()

  const { data: jobs, isLoading } = useQuery({
    queryKey: ['requester-jobs', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select('*, items:job_items(*)')
        .eq('requester_id', profile!.id)
        .order('scheduled_date', { ascending: false })
      if (error) throw error
      return data as Job[]
    },
    enabled: !!profile,
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">My Moves</h1>
          <p className="text-sm text-gray-500">Welcome back, {profile?.full_name?.split(' ')[0]}</p>
        </div>
        <Link to="/app/jobs/new">
          <Button size="sm"><Plus size={16} className="mr-1" />New Move</Button>
        </Link>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12"><Spinner className="h-8 w-8" /></div>
      )}

      {!isLoading && (!jobs || jobs.length === 0) && (
        <div className="text-center py-16">
          <Package size={48} className="mx-auto text-gray-300 dark:text-gray-700 mb-4" />
          <p className="text-gray-500 mb-4">No moves yet</p>
          <Link to="/app/jobs/new">
            <Button>Book your first move</Button>
          </Link>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {jobs?.map((job) => (
          <Link
            key={job.id}
            to={`/app/jobs/${job.id}`}
            className="block bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm hover:shadow-md transition border border-gray-100 dark:border-gray-800"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <StatusBadge status={job.status} />
              {job.quoted_price && (
                <span className="font-bold text-gray-900 dark:text-gray-100">${job.quoted_price.toFixed(2)}</span>
              )}
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{job.pickup_address}</p>
            <p className="text-xs text-gray-500 truncate">→ {job.dropoff_address}</p>
            <p className="text-xs text-gray-400 mt-1">{format(new Date(job.scheduled_date), 'EEE, dd MMM yyyy')}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
