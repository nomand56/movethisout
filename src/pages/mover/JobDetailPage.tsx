import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, getFunctionErrorMessage } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { StatusBadge } from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import { MapPin, Clock, Package, DollarSign } from 'lucide-react'
import { format } from 'date-fns'
import type { Job } from '../../types'

const TIME_LABELS = { morning: '8am – 12pm', afternoon: '12pm – 5pm', evening: '5pm – 8pm' }

export default function MoverJobDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { profile } = useAuthStore()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [claimError, setClaimError] = useState('')

  const { data: job, isLoading } = useQuery({
    queryKey: ['mover-job', id],
    queryFn: async () => {
      const { data } = await supabase.from('jobs').select('*, items:job_items(*)').eq('id', id!).single()
      return data as Job
    },
  })

  const { data: activeJob } = useQuery({
    queryKey: ['mover-active-job', profile?.id],
    queryFn: async () => {
      const { data } = await supabase.from('jobs').select('id').eq('mover_id', profile!.id).in('status', ['claimed', 'in_progress']).maybeSingle()
      return data
    },
    enabled: !!profile,
  })

  const claimMutation = useMutation({
    mutationFn: async () => {
      const res = await supabase.functions.invoke('claim-job', { body: { job_id: id } })
      if (res.error) throw new Error(await getFunctionErrorMessage(res.error))
      if (res.data?.error) throw new Error(res.data.error)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mover-active-job', profile?.id] })
      navigate('/mover/active')
    },
    onError: (err: Error) => setClaimError(err.message),
  })

  if (isLoading) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>
  if (!job) return <p className="text-center text-gray-500 py-20">Job not found.</p>

  const hasActiveJob = !!activeJob

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <StatusBadge status={job.status} />
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
        <div className="p-4">
          <div className="flex items-start gap-2">
            <MapPin size={16} className="text-brand-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500">Pickup</p>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{job.pickup_address}</p>
            </div>
          </div>
        </div>
        <div className="p-4">
          <div className="flex items-start gap-2">
            <MapPin size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500">Drop-off</p>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{job.dropoff_address}</p>
            </div>
          </div>
        </div>
        <div className="p-4 grid grid-cols-2">
          <div className="flex items-start gap-2">
            <Clock size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500">Date & Time</p>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {format(new Date(job.scheduled_date), 'dd MMM')} · {TIME_LABELS[job.time_window]}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <MapPin size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500">Distance</p>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{job.distance_km ?? '—'} km</p>
            </div>
          </div>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-2">
            <DollarSign size={16} className="text-green-500 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500">Your payout</p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">${job.mover_payout?.toFixed(2) ?? '—'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Items */}
      {job.items && job.items.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Package size={16} className="text-gray-400" />
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Items ({job.items.reduce((s, i) => s + i.quantity, 0)})</p>
          </div>
          {job.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm py-1">
              <span className="text-gray-900 dark:text-gray-100">{item.name} × {item.quantity}</span>
              <span className="text-gray-400 capitalize">{item.size.replace('_', ' ')}</span>
            </div>
          ))}
        </div>
      )}

      {job.notes && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl p-4">
          <p className="text-xs text-yellow-700 dark:text-yellow-400 font-semibold mb-1">Notes from requester</p>
          <p className="text-sm text-gray-900 dark:text-gray-100">{job.notes}</p>
        </div>
      )}

      {claimError && <p className="text-sm text-red-600 text-center">{claimError}</p>}

      {job.status === 'open' && (
        <Button
          fullWidth
          size="lg"
          loading={claimMutation.isPending}
          disabled={hasActiveJob}
          onClick={() => claimMutation.mutate()}
        >
          {hasActiveJob ? 'You have an active job' : 'Claim this Job'}
        </Button>
      )}
      {hasActiveJob && job.status === 'open' && (
        <p className="text-xs text-center text-gray-400">Complete your current job before claiming a new one.</p>
      )}
    </div>
  )
}
