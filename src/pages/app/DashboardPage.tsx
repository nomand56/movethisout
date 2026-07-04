import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { StatusBadge } from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import OrderTracker from '../../components/brand/OrderTracker'
import type { Job } from '../../types'
import { format } from 'date-fns'

export default function RequesterDashboard() {
  const { profile } = useAuthStore()

  const { data: jobs, isLoading } = useQuery({
    queryKey: ['requester-jobs', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select('*, items:job_items(*), mover:profiles!jobs_mover_id_fkey(full_name)')
        .eq('requester_id', profile!.id)
        .order('scheduled_date', { ascending: false })
      if (error) throw error
      return data as Job[]
    },
    enabled: !!profile,
  })

  const active = jobs?.filter((j) => !['completed', 'cancelled'].includes(j.status)) ?? []
  const past = jobs?.filter((j) => ['completed', 'cancelled'].includes(j.status)) ?? []

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-3xl uppercase">Your orders</h1>
        <p className="text-sm text-gray-600">Hey {profile?.full_name?.split(' ')[0]} — track live moves here.</p>
      </div>

      <Link to="/app/jobs/new">
        <Button fullWidth size="lg">Book a move ▸</Button>
      </Link>

      {isLoading && <div className="flex justify-center py-12"><Spinner className="h-8 w-8" /></div>}

      {!isLoading && (!jobs || jobs.length === 0) && (
        <div className="card-yard p-8 text-center bg-concrete">
          <p className="font-display text-xl uppercase mb-2">No moves yet</p>
          <p className="text-sm text-gray-600 mb-4">Bought something? We&apos;ll move it. From $39.</p>
          <Link to="/app/jobs/new"><Button>Book it ▸</Button></Link>
        </div>
      )}

      {active.length > 0 && (
        <section>
          <h2 className="font-condensed font-bold text-sm uppercase tracking-widest text-haul mb-3">Active</h2>
          <div className="flex flex-col gap-3">
            {active.map((job) => (
              <JobOrderCard key={job.id} job={job} />
            ))}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <h2 className="font-condensed font-bold text-sm uppercase tracking-widest text-gray-500 mb-3">Past</h2>
          <div className="flex flex-col gap-3">
            {past.map((job) => (
              <JobOrderCard key={job.id} job={job} dimmed />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function JobOrderCard({ job, dimmed }: { job: Job; dimmed?: boolean }) {
  return (
    <Link to={`/app/jobs/${job.id}`} className={`card-yard block overflow-hidden ${dimmed ? 'opacity-80' : ''}`}>
      <div className="bg-jet text-white px-4 py-2 flex justify-between items-center">
        <StatusBadge status={job.status} />
        {job.quoted_price && (
          <span className="price-hero text-2xl text-haul">${job.quoted_price.toFixed(0)}</span>
        )}
      </div>
      <div className="p-4">
        {!dimmed && job.status !== 'draft' && (
          <div className="mb-3">
            <OrderTracker status={job.status} />
          </div>
        )}
        <p className="font-sans font-bold text-sm truncate">{job.pickup_address}</p>
        <p className="font-condensed text-sm text-gray-600 truncate uppercase tracking-wide">▸ {job.dropoff_address}</p>
        <p className="text-xs text-gray-400 mt-2">{format(new Date(job.scheduled_date), 'EEE, dd MMM')}</p>
        {job.mover?.full_name && (
          <p className="text-xs font-bold text-haul mt-1">{job.mover.full_name} is your mover</p>
        )}
      </div>
    </Link>
  )
}
