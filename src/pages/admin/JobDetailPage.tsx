import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { StatusBadge } from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import { format } from 'date-fns'
import { ArrowLeft } from 'lucide-react'
import GpsTrailMap from '../../components/maps/GpsTrailMap'
import type { Job, LocationEvent } from '../../types'

const TIME_LABELS = { morning: '8am – 12pm', afternoon: '12pm – 5pm', evening: '5pm – 8pm' }

export default function AdminJobDetailPage() {
  const { id } = useParams<{ id: string }>()

  const { data: job, isLoading } = useQuery({
    queryKey: ['admin-job', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('jobs')
        .select(`
          *,
          items:job_items(*),
          status_history:job_status_history(*),
          requester:profiles!jobs_requester_id_fkey(full_name, email, phone),
          mover:profiles!jobs_mover_id_fkey(full_name, email, phone),
          mover_profile:mover_profiles!jobs_mover_id_fkey(vehicle_type, avg_rating)
        `)
        .eq('id', id!)
        .single()
      return data as Job & {
        requester: { full_name: string; email: string; phone: string }
        mover?: { full_name: string; email: string; phone: string }
        mover_profile?: { vehicle_type: string; avg_rating: number }
      }
    },
  })

  const { data: trail } = useQuery({
    queryKey: ['admin-job-trail', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('location_events')
        .select('*')
        .eq('job_id', id!)
        .order('created_at', { ascending: true })
      return data as LocationEvent[]
    },
    enabled: !!job,
  })

  if (isLoading) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>
  if (!job) return <p className="text-center text-gray-500 py-20">Job not found.</p>

  const photoUrl = job.completion_photo_url
    ? (job.completion_photo_url.startsWith('http')
      ? job.completion_photo_url
      : supabase.storage.from('completion-photos').getPublicUrl(job.completion_photo_url).data.publicUrl)
    : null
  const sigUrl = job.signature_url
    ? supabase.storage.from('completion-photos').getPublicUrl(job.signature_url).data.publicUrl
    : null

  return (
    <div className="flex flex-col gap-6">
      <Link to="/admin/jobs" className="flex items-center gap-2 text-sm text-haul hover:underline w-fit">
        <ArrowLeft size={16} /> Back to jobs
      </Link>

      <div className="flex items-center gap-3">
        <h1 className="font-display text-2xl uppercase text-jet">Job {job.id.slice(0, 8)}…</h1>
        <StatusBadge status={job.status} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card-yard p-4">
          <p className="text-xs text-gray-500 mb-2">Requester</p>
          <p className="font-semibold">{job.requester?.full_name}</p>
          <p className="text-sm text-gray-500">{job.requester?.email}</p>
          <p className="text-sm text-gray-500">{job.requester?.phone}</p>
        </div>
        {job.mover && (
          <div className="card-yard p-4">
            <p className="text-xs text-gray-500 mb-2">Mover</p>
            <p className="font-semibold">{job.mover.full_name}</p>
            <p className="text-sm text-gray-500">{job.mover.email}</p>
            {job.mover_profile && (
              <p className="text-sm text-gray-500 capitalize mt-1">
                {job.mover_profile.vehicle_type.replace('_', ' ')} · ★ {job.mover_profile.avg_rating?.toFixed(1) ?? '—'}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="card-yard p-4">
        <p className="text-xs text-gray-500 mb-1">Route</p>
        <p className="text-sm font-medium">{job.pickup_address}</p>
        <p className="text-sm text-gray-500">→ {job.dropoff_address}</p>
        <p className="text-xs text-gray-400 mt-2">
          {format(new Date(job.scheduled_date), 'EEE, dd MMM yyyy')} · {TIME_LABELS[job.time_window]}
          {job.distance_km ? ` · ${job.distance_km} km` : ''}
        </p>
        {job.quoted_price && (
          <p className="text-sm font-bold mt-2">${job.quoted_price.toFixed(2)}</p>
        )}
      </div>

      {job.items && job.items.length > 0 && (
        <div className="card-yard p-4">
          <p className="text-xs text-gray-500 mb-3">Items</p>
          {job.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm py-1">
              <span>{item.name} × {item.quantity}</span>
              <span className="text-gray-400 capitalize">{item.size.replace('_', ' ')}</span>
            </div>
          ))}
        </div>
      )}

      {trail && trail.length > 0 && (
        <div className="card-yard p-4">
          <p className="text-xs font-condensed font-bold uppercase tracking-wider text-gray-500 mb-3">GPS trail ({trail.length} points)</p>
          <GpsTrailMap
            trail={trail.map((p) => ({ lat: p.lat, lng: p.lng }))}
            pickupLat={job.pickup_lat}
            pickupLng={job.pickup_lng}
            dropoffLat={job.dropoff_lat}
            dropoffLng={job.dropoff_lng}
          />
        </div>
      )}

      {(photoUrl || sigUrl) && (
        <div className="grid md:grid-cols-2 gap-4">
          {photoUrl && (
            <div>
              <p className="text-xs text-gray-500 mb-2">Completion photo</p>
              <img src={photoUrl} alt="Completion" className="rounded-xl max-h-64 object-cover" />
            </div>
          )}
          {sigUrl && (
            <div>
              <p className="text-xs text-gray-500 mb-2">E-signature</p>
              <img src={sigUrl} alt="Signature" className="rounded-xl max-h-64 bg-white border" />
            </div>
          )}
        </div>
      )}

      {job.status_history && job.status_history.length > 0 && (
        <div className="card-yard p-4">
          <p className="text-xs text-gray-500 mb-3">Status history</p>
          {[...job.status_history]
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
            .map((h) => (
              <div key={h.id} className="flex justify-between text-sm py-1">
                <span className="capitalize">{h.status.replace('_', ' ')}</span>
                <span className="text-gray-400">{format(new Date(h.created_at), 'dd MMM HH:mm')}</span>
              </div>
            ))}
        </div>
      )}

      {job.cancel_reason && (
        <div className="card-yard bg-red-50 p-4">
          <p className="text-xs text-red-600 font-semibold">Cancellation reason</p>
          <p className="text-sm">{job.cancel_reason}</p>
        </div>
      )}
    </div>
  )
}
