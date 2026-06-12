import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { timeAgo } from '@/lib/utils'
import { Briefcase, MapPin, Clock, ArrowRight, PlayCircle, CheckCircle, XCircle } from 'lucide-react'

const STATUS_STYLE: Record<string, { bg: string; color: string; border: string; label: string; icon: React.ReactNode }> = {
  accepted:    { bg: '#FFF3EE', color: '#F25800', border: '#F25800', label: 'Accepted',    icon: null },
  in_progress: { bg: '#FFF9C4', color: '#F57F17', border: '#F57F17', label: 'In Progress', icon: null },
  completed:   { bg: '#E8F5E9', color: '#2E7D32', border: '#2E7D32', label: 'Completed',   icon: null },
  cancelled:   { bg: '#FFEBEE', color: '#C62828', border: '#C62828', label: 'Cancelled',   icon: null },
}

export default async function MoverJobsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/mover-app/login?redirectTo=/mover-app/jobs')

  const { data: profile } = await (supabase.from('profiles') as any)
    .select('is_mover, mover_status')
    .eq('id', user.id)
    .single() as { data: any }

  if (!profile?.is_mover || profile?.mover_status !== 'active') redirect('/mover-app/onboarding')

  const { data: jobsData } = await (supabase.from('jobs') as any)
    .select(`
      id,
      started_at,
      completed_at,
      created_at,
      requests(
        id, title, pickup_address, dropoff_address, status,
        estimated_distance_km, estimated_duration_min, item_size,
        profiles(full_name, rating_avg, rating_count)
      ),
      offers(proposed_value, eta_minutes, message)
    `)
    .eq('volunteer_id', user.id)
    .order('created_at', { ascending: false })

  const jobs = (jobsData ?? []) as any[]

  const active = jobs.filter(j => ['accepted', 'in_progress'].includes(j.requests?.status))
  const past = jobs.filter(j => ['completed', 'cancelled'].includes(j.requests?.status))

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '28px 16px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 28, textTransform: 'uppercase', letterSpacing: '0.02em', color: '#141414' }}>My Jobs</h1>
        <p style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13, color: '#6b7280', marginTop: 4 }}>Your active and completed delivery jobs.</p>
      </div>

      {jobs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0', color: '#9ca3af' }}>
          <Briefcase size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <p style={{ fontFamily: 'Barlow, sans-serif', fontSize: 15 }}>No jobs yet.</p>
          <p style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13, marginTop: 4 }}>Accept offers on the board to start earning.</p>
          <Link href="/mover-app/board" className="btn-primary" style={{ display: 'inline-flex', marginTop: 16, fontSize: 13, padding: '10px 20px' }}>
            Browse Requests →
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

          {active.length > 0 && (
            <div>
              <h2 style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 16, textTransform: 'uppercase', letterSpacing: '0.02em', color: '#141414', marginBottom: 12 }}>
                Active ({active.length})
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {active.map((job: any) => <JobCard key={job.id} job={job} />)}
              </div>
            </div>
          )}

          {past.length > 0 && (
            <div>
              <h2 style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 16, textTransform: 'uppercase', letterSpacing: '0.02em', color: '#141414', marginBottom: 12 }}>
                Completed ({past.length})
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {past.map((job: any) => <JobCard key={job.id} job={job} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function JobCard({ job }: { job: any }) {
  const req = job.requests
  const offer = Array.isArray(job.offers) ? job.offers[0] : job.offers
  const status = req?.status ?? 'accepted'
  const ss = STATUS_STYLE[status] ?? STATUS_STYLE.accepted
  const requester = req?.profiles

  return (
    <div style={{ background: '#FFFFFF', border: '3px solid #141414', padding: 20 }}>

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Barlow, sans-serif', fontWeight: 700, fontSize: 15, color: '#141414', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {req?.title ?? 'Job'}
          </div>
          <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
            {requester?.full_name ?? 'Requester'}
            {requester?.rating_count > 0 && <span style={{ marginLeft: 6 }}>★ {Number(requester.rating_avg).toFixed(1)}</span>}
          </div>
        </div>
        <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '3px 8px', border: `1.5px solid ${ss.border}`, background: ss.bg, color: ss.color, flexShrink: 0 }}>
          {ss.label}
        </span>
      </div>

      {/* Route */}
      {req?.pickup_address && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 12 }}>
          <MapPin size={13} color="#F25800" style={{ marginTop: 2, flexShrink: 0 }} />
          <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13, color: '#6b7280' }}>
            {req.pickup_address.split(',')[0]} → {req.dropoff_address?.split(',')[0]}
          </div>
        </div>
      )}

      {/* Stats row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 14px', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, color: '#9ca3af', marginBottom: 14 }}>
        {req?.estimated_distance_km && (
          <span>{Number(req.estimated_distance_km).toFixed(1)} km</span>
        )}
        {req?.estimated_duration_min && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Clock size={10} />~{req.estimated_duration_min} min
          </span>
        )}
        {offer?.proposed_value && (
          <span style={{ color: '#141414', fontWeight: 600 }}>${offer.proposed_value}</span>
        )}
        {status === 'in_progress' && job.started_at && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <PlayCircle size={10} /> Started {timeAgo(job.started_at)}
          </span>
        )}
        {status === 'completed' && job.completed_at && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <CheckCircle size={10} /> Done {timeAgo(job.completed_at)}
          </span>
        )}
      </div>

      {/* CTA */}
      <Link
        href={`/job/${job.id}`}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'Barlow, sans-serif', fontWeight: 700, fontSize: 13, color: '#FFFFFF', background: '#F25800', border: '3px solid #F25800', padding: '10px 16px', textDecoration: 'none' }}
      >
        {status === 'completed' ? 'View Summary' : 'Open Job Card'}
        <ArrowRight size={13} />
      </Link>
    </div>
  )
}
