import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Map, List } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { useGoogleMapsLoader } from '../../hooks/useGoogleMapsLoader'
import JobsMap from '../../components/maps/JobsMap'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import { format } from 'date-fns'
import type { Job } from '../../types'
import { vehicleCanHandleJob } from '../../lib/vehicleSize'
import { SERVICE_AREA_LABEL } from '../../lib/serviceArea'

const TIME_LABELS = { morning: '8am–12pm', afternoon: '12pm–5pm', evening: '5pm–8pm' }

function suburb(address: string) {
  const parts = address.split(',')
  return parts.length > 1 ? parts[parts.length - 2].trim() : parts[0].trim()
}

function sizeBreakdown(items: Job['items']) {
  if (!items?.length) return ''
  const counts: Record<string, number> = {}
  for (const item of items) {
    counts[item.size] = (counts[item.size] ?? 0) + item.quantity
  }
  return Object.entries(counts).map(([s, n]) => `${n} ${s.replace('_', ' ')}`).join(', ')
}

function JobCard({ job, compact }: { job: Job; compact?: boolean }) {
  return (
    <Link
      to={`/mover/jobs/${job.id}`}
      className={`card block overflow-hidden hover:shadow-md transition-shadow ${compact ? '' : ''}`}
    >
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="font-semibold text-ink">
              {suburb(job.pickup_address)} → {suburb(job.dropoff_address)}
            </p>
            <p className="text-xs text-ink-muted mt-0.5">
              {format(new Date(job.scheduled_date), 'dd MMM')} · {TIME_LABELS[job.time_window]}
              {job.distance_km ? ` · ${job.distance_km} km` : ''}
            </p>
          </div>
          <span className="text-xs font-semibold bg-accent-soft text-accent px-2 py-1 rounded-lg">Open</span>
        </div>
        {sizeBreakdown(job.items) && (
          <p className="text-xs text-ink-muted mb-2">{sizeBreakdown(job.items)}</p>
        )}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-2xl font-bold text-accent">${job.mover_payout?.toFixed(0) ?? '—'}</p>
            <p className="text-[10px] text-ink-muted font-medium">You keep</p>
          </div>
          <span className="text-sm font-semibold text-accent">View →</span>
        </div>
      </div>
    </Link>
  )
}

export default function RequestCenterPage() {
  const { profile } = useAuthStore()
  const qc = useQueryClient()
  const [view, setView] = useState<'map' | 'list'>('map')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filter, setFilter] = useState({ date: '', minKm: '', maxKm: '', vehicleOnly: true })

  const { isLoaded } = useGoogleMapsLoader()

  const { data: moverProfile } = useQuery({
    queryKey: ['mover-profile-self', profile?.id],
    queryFn: async () => {
      const { data } = await supabase.from('mover_profiles').select('is_online, vehicle_type').eq('id', profile!.id).single()
      return data
    },
    enabled: !!profile,
  })

  const { data: jobs, isLoading } = useQuery({
    queryKey: ['open-jobs'],
    queryFn: async () => {
      const { data } = await supabase
        .from('jobs')
        .select('*, items:job_items(*)')
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(100)
      return data as Job[]
    },
    enabled: moverProfile?.is_online === true,
  })

  useEffect(() => {
    if (moverProfile?.is_online !== true) return
    const ch = supabase.channel('request-center')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, () => {
        qc.invalidateQueries({ queryKey: ['open-jobs'] })
      })
      .subscribe()
    return () => { ch.unsubscribe() }
  }, [qc, moverProfile?.is_online])

  const filtered = (jobs ?? []).filter((j) => {
    if (filter.date && j.scheduled_date !== filter.date) return false
    if (filter.minKm && j.distance_km !== null && j.distance_km < parseFloat(filter.minKm)) return false
    if (filter.maxKm && j.distance_km !== null && j.distance_km > parseFloat(filter.maxKm)) return false
    if (filter.vehicleOnly && moverProfile?.vehicle_type && j.items?.length) {
      if (!vehicleCanHandleJob(moverProfile.vehicle_type, j.items)) return false
    }
    return true
  })

  const selectedJob = filtered.find((j) => j.id === selectedId)

  if (!moverProfile?.is_online) {
    return (
      <div className="card p-8 text-center">
        <p className="text-xl font-bold mb-2">You&apos;re offline</p>
        <p className="text-sm text-ink-muted mb-4">Go online from Home to see jobs on the map.</p>
        <Link to="/mover/dashboard"><Button>Go online</Button></Link>
      </div>
    )
  }

  if (!isLoaded) {
    return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>
  }

  return (
    <div className="flex flex-col gap-4 -mx-4 -mt-2">
      <div className="px-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink">Available jobs</h1>
          <p className="text-xs text-ink-muted">{SERVICE_AREA_LABEL}</p>
        </div>
        <div className="flex rounded-xl border border-gray-200 overflow-hidden">
          <button
            type="button"
            onClick={() => setView('map')}
            className={`px-3 py-2 flex items-center gap-1 text-sm font-medium ${view === 'map' ? 'bg-mover text-white' : 'bg-white text-ink-muted'}`}
          >
            <Map size={16} /> Map
          </button>
          <button
            type="button"
            onClick={() => setView('list')}
            className={`px-3 py-2 flex items-center gap-1 text-sm font-medium ${view === 'list' ? 'bg-mover text-white' : 'bg-white text-ink-muted'}`}
          >
            <List size={16} /> List
          </button>
        </div>
      </div>

      <div className="px-4 flex gap-2 flex-wrap">
        <input
          type="date"
          value={filter.date}
          onChange={(e) => setFilter((f) => ({ ...f, date: e.target.value }))}
          className="rounded-xl border border-gray-200 px-3 py-2 text-sm bg-white"
        />
        <input
          type="number"
          placeholder="Min km"
          value={filter.minKm}
          onChange={(e) => setFilter((f) => ({ ...f, minKm: e.target.value }))}
          className="w-20 rounded-xl border border-gray-200 px-3 py-2 text-sm bg-white"
        />
        <input
          type="number"
          placeholder="Max km"
          value={filter.maxKm}
          onChange={(e) => setFilter((f) => ({ ...f, maxKm: e.target.value }))}
          className="w-20 rounded-xl border border-gray-200 px-3 py-2 text-sm bg-white"
        />
        <label className="flex items-center gap-2 text-sm text-ink-muted">
          <input
            type="checkbox"
            checked={filter.vehicleOnly}
            onChange={(e) => setFilter((f) => ({ ...f, vehicleOnly: e.target.checked }))}
            className="rounded"
          />
          My vehicle
        </label>
      </div>

      {isLoading && <div className="flex justify-center py-12"><Spinner className="h-8 w-8" /></div>}

      {!isLoading && filtered.length === 0 && (
        <div className="card mx-4 p-8 text-center text-ink-muted">No jobs right now. Stay online.</div>
      )}

      {view === 'map' && !isLoading && filtered.length > 0 && (
        <div className="px-4 flex flex-col gap-3">
          <div className="h-56 sm:h-64">
            <JobsMap
              jobs={filtered}
              selectedId={selectedId}
              onSelect={(job) => setSelectedId(job?.id ?? null)}
              className="w-full h-full"
            />
          </div>
          {selectedJob ? (
            <JobCard job={selectedJob} compact />
          ) : (
            <p className="text-center text-sm text-ink-muted py-2">Tap a pin to see job details</p>
          )}
          {filtered.length > 1 && !selectedJob && (
            <p className="text-xs text-center text-ink-muted">{filtered.length} jobs on map</p>
          )}
        </div>
      )}

      {view === 'list' && !isLoading && (
        <div className="px-4 flex flex-col gap-3 pb-4">
          {filtered.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  )
}
