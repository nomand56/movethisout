import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import Spinner from '../../components/ui/Spinner'
import { MapPin, Clock, Package } from 'lucide-react'
import { format } from 'date-fns'
import type { Job } from '../../types'

const TIME_LABELS = { morning: '8am–12pm', afternoon: '12pm–5pm', evening: '5pm–8pm' }

export default function RequestCenterPage() {
  const { profile } = useAuthStore()
  const qc = useQueryClient()
  const [filter, setFilter] = useState({ date: '', minKm: '', maxKm: '' })

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
  })

  // Realtime: new jobs / job claimed
  useEffect(() => {
    const ch = supabase.channel('request-center')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, () => {
        qc.invalidateQueries({ queryKey: ['open-jobs'] })
      })
      .subscribe()
    return () => { ch.unsubscribe() }
  }, [qc])

  const filtered = (jobs ?? []).filter((j) => {
    if (filter.date && j.scheduled_date !== filter.date) return false
    if (filter.minKm && j.distance_km !== null && j.distance_km < parseFloat(filter.minKm)) return false
    if (filter.maxKm && j.distance_km !== null && j.distance_km > parseFloat(filter.maxKm)) return false
    return true
  })

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Request Center</h1>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <input
          type="date"
          value={filter.date}
          onChange={(e) => setFilter((f) => ({ ...f, date: e.target.value }))}
          className="rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
          placeholder="Date"
        />
        <input
          type="number"
          placeholder="Min km"
          value={filter.minKm}
          onChange={(e) => setFilter((f) => ({ ...f, minKm: e.target.value }))}
          className="w-20 rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <input
          type="number"
          placeholder="Max km"
          value={filter.maxKm}
          onChange={(e) => setFilter((f) => ({ ...f, maxKm: e.target.value }))}
          className="w-20 rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        {(filter.date || filter.minKm || filter.maxKm) && (
          <button onClick={() => setFilter({ date: '', minKm: '', maxKm: '' })} className="text-xs text-brand-500 hover:underline px-2">Clear</button>
        )}
      </div>

      {isLoading && <div className="flex justify-center py-12"><Spinner className="h-8 w-8" /></div>}

      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400">No open jobs right now. Check back soon.</div>
      )}

      <div className="flex flex-col gap-3">
        {filtered.map((job) => (
          <Link
            key={job.id}
            to={`/mover/jobs/${job.id}`}
            className="block bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <MapPin size={12} />
                {job.distance_km ? `${job.distance_km} km` : '— km'}
              </div>
              {job.mover_payout && (
                <span className="text-green-600 dark:text-green-400 font-bold">${job.mover_payout.toFixed(2)}</span>
              )}
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{job.pickup_address}</p>
            <p className="text-xs text-gray-500 truncate">→ {job.dropoff_address}</p>
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
              <span className="flex items-center gap-1"><Clock size={11} />{format(new Date(job.scheduled_date), 'dd MMM')} · {TIME_LABELS[job.time_window]}</span>
              {job.items && <span className="flex items-center gap-1"><Package size={11} />{job.items.reduce((s, i) => s + i.quantity, 0)} items</span>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
