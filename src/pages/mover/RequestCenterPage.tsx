import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import { format } from 'date-fns'
import type { Job, ItemSize } from '../../types'
import { vehicleCanHandleJob } from '../../lib/vehicleSize'

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

export default function RequestCenterPage() {
  const { profile } = useAuthStore()
  const qc = useQueryClient()
  const [filter, setFilter] = useState({ date: '', minKm: '', maxKm: '', vehicleOnly: true })

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

  if (!moverProfile?.is_online) {
    return (
      <div className="card-yard p-8 text-center bg-concrete">
        <p className="font-display text-xl uppercase mb-2">You&apos;re offline</p>
        <p className="text-sm text-gray-600 mb-4">Go online from Home to see available jobs.</p>
        <Link to="/mover/dashboard"><Button>Go online ▸</Button></Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-3xl uppercase">Available jobs</h1>

      <div className="flex gap-2 flex-wrap">
        <input type="date" value={filter.date} onChange={(e) => setFilter((f) => ({ ...f, date: e.target.value }))}
          className="border-3 border-jet px-3 py-2 text-sm bg-white font-condensed font-bold uppercase" />
        <input type="number" placeholder="Min km" value={filter.minKm} onChange={(e) => setFilter((f) => ({ ...f, minKm: e.target.value }))}
          className="w-20 border-3 border-jet px-3 py-2 text-sm bg-white" />
        <input type="number" placeholder="Max km" value={filter.maxKm} onChange={(e) => setFilter((f) => ({ ...f, maxKm: e.target.value }))}
          className="w-20 border-3 border-jet px-3 py-2 text-sm bg-white" />
        <label className="flex items-center gap-2 text-sm font-condensed font-bold uppercase">
          <input type="checkbox" checked={filter.vehicleOnly} onChange={(e) => setFilter((f) => ({ ...f, vehicleOnly: e.target.checked }))} />
          My vehicle only
        </label>
      </div>

      {isLoading && <div className="flex justify-center py-12"><Spinner className="h-8 w-8" /></div>}

      {!isLoading && filtered.length === 0 && (
        <div className="card-yard p-8 text-center text-gray-500">No jobs right now. Stay online.</div>
      )}

      <div className="flex flex-col gap-4">
        {filtered.map((job) => (
          <Link key={job.id} to={`/mover/jobs/${job.id}`} className="card-yard block overflow-hidden hover:shadow-hard transition-shadow">
            <div className="bg-jet text-white px-4 py-2 flex justify-between items-center">
              <span className="font-condensed font-bold text-sm uppercase tracking-widest">
                {job.distance_km ? `${job.distance_km} km` : '— km'}
              </span>
              <span className="border-2 border-haul bg-haul px-2 py-0.5 font-condensed font-bold text-[10px] uppercase">Live</span>
            </div>
            <div className="p-4">
              <h4 className="font-display text-lg uppercase mb-1">
                {job.items?.length ? `${job.items.reduce((s, i) => s + i.quantity, 0)} items` : 'Move job'}
              </h4>
              <p className="font-condensed font-semibold text-sm uppercase tracking-wide text-gray-700">
                {suburb(job.pickup_address)} ▸ {suburb(job.dropoff_address)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {format(new Date(job.scheduled_date), 'dd MMM')} · {TIME_LABELS[job.time_window]}
                {sizeBreakdown(job.items) ? ` · ${sizeBreakdown(job.items)}` : ''}
              </p>
              <div className="mt-3 flex items-end justify-between">
                <div>
                  <p className="price-hero text-4xl text-haul">${job.mover_payout?.toFixed(0) ?? '—'}</p>
                  <p className="font-condensed font-bold text-[10px] uppercase tracking-widest text-gray-500">You keep</p>
                </div>
                <span className="btn-like font-sans font-extrabold text-sm uppercase bg-haul text-white border-3 border-jet px-4 py-2 shadow-hard-sm">
                  View ▸
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
