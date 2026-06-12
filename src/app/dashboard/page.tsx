import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { MapPin, Clock, MessageCircle, Star, Package, ArrowRight, Plus } from 'lucide-react'
import { EffortBadge } from '@/components/effort-badge'
import type { Profile, Request, Job } from '@/types/database'

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    open: 'bg-green-100 text-green-700',
    accepted: 'bg-blue-100 text-blue-700',
    in_progress: 'bg-yellow-100 text-yellow-700',
    completed: 'bg-gray-100 text-gray-600',
    cancelled: 'bg-red-100 text-red-600',
  }
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${styles[status] ?? 'bg-gray-100 text-gray-500'}`}>
      {status.replace('_', ' ')}
    </span>
  )
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  const profile = profileData as Profile | null

  // My posted requests
  const { data: requestsData } = await supabase
    .from('requests')
    .select('*')
    .eq('requester_id', user.id)
    .order('created_at', { ascending: false })
  const myRequests = (requestsData ?? []) as Request[]

  // Jobs I'm volunteering
  const { data: jobsData } = await supabase
    .from('jobs')
    .select('*, requests(title, pickup_address, dropoff_address, effort_score, status, estimated_distance_km, estimated_duration_min)')
    .eq('volunteer_id', user.id)
    .order('created_at', { ascending: false })
  const myJobs = (jobsData ?? []) as (Job & { requests: Partial<Request> | null })[]

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Profile header */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{profile?.full_name ?? 'Welcome'}</h1>
          <div className="text-sm text-gray-500 mt-1">{user.email}</div>
          {(profile?.rating_count ?? 0) > 0 && (
            <div className="flex items-center gap-1 mt-2 text-sm text-gray-600">
              <Star size={14} className="text-yellow-400 fill-yellow-400" />
              {Number(profile!.rating_avg).toFixed(1)} · {profile!.rating_count} reviews
            </div>
          )}
        </div>
        <Link
          href="/request/new"
          className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition"
        >
          <Plus size={16} />
          New request
        </Link>
      </div>

      {/* My requests */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-gray-900 mb-4">My move requests</h2>
        {!myRequests?.length ? (
          <div className="text-center py-10 text-gray-400 bg-white border border-dashed border-gray-200 rounded-2xl">
            <Package size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">You haven't posted any requests yet.</p>
            <Link href="/request/new" className="text-indigo-500 text-sm mt-1 hover:underline">Post your first one →</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {myRequests.map(req => (
              <Link
                key={req.id}
                href={`/requests/${req.id}`}
                className="block bg-white border border-gray-200 rounded-2xl p-5 hover:border-indigo-300 transition group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">{req.title}</h3>
                      <StatusBadge status={req.status} />
                    </div>
                    <div className="text-sm text-gray-500 flex items-center gap-1">
                      <MapPin size={12} className="text-indigo-400" />
                      {req.pickup_address.split(',')[0]} → {req.dropoff_address.split(',')[0]}
                    </div>
                    {req.estimated_distance_km && (
                      <div className="text-xs text-gray-400 mt-1">{req.estimated_distance_km.toFixed(1)} km · ~{req.estimated_duration_min} min</div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {req.effort_score !== null && <EffortBadge score={req.effort_score} />}
                    <ArrowRight size={16} className="text-gray-400 group-hover:text-indigo-500 transition" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Jobs volunteering */}
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Jobs I'm helping with</h2>
        {!myJobs?.length ? (
          <div className="text-center py-10 text-gray-400 bg-white border border-dashed border-gray-200 rounded-2xl">
            <Package size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">You haven't volunteered for any jobs yet.</p>
            <Link href="/requests" className="text-indigo-500 text-sm mt-1 hover:underline">Browse open requests →</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {myJobs.map(job => {
              const req = (job as any).requests
              return (
                <Link
                  key={job.id}
                  href={`/job/${job.id}`}
                  className="block bg-white border border-gray-200 rounded-2xl p-5 hover:border-indigo-300 transition group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">{req?.title}</h3>
                        <StatusBadge status={req?.status ?? ''} />
                      </div>
                      <div className="text-sm text-gray-500 flex items-center gap-1">
                        <MapPin size={12} className="text-indigo-400" />
                        {req?.pickup_address?.split(',')[0]} → {req?.dropoff_address?.split(',')[0]}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {req?.effort_score !== null && req?.effort_score !== undefined && (
                        <EffortBadge score={req.effort_score} />
                      )}
                      <MessageCircle size={16} className="text-gray-400 group-hover:text-indigo-500 transition" />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
