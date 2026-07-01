import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { StatusBadge } from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import { Star, Zap, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'
import { requestPushPermission } from '../../hooks/usePushNotifications'
import type { Job, MoverProfile } from '../../types'

export default function MoverDashboard() {
  const { profile } = useAuthStore()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: moverProfile, isFetched: moverProfileFetched } = useQuery({
    queryKey: ['mover-profile-self', profile?.id],
    queryFn: async () => {
      const { data } = await supabase.from('mover_profiles').select('*').eq('id', profile!.id).maybeSingle()
      return data as MoverProfile | null
    },
    enabled: !!profile,
  })

  // Redirect pending / not-yet-applied movers
  const [checked, setChecked] = useState(false)
  useEffect(() => {
    if (!moverProfileFetched) return
    if (!moverProfile || !moverProfile.licence_url) navigate('/mover/application', { replace: true })
    else if (moverProfile.status === 'pending') navigate('/mover/pending', { replace: true })
    else setChecked(true)
  }, [moverProfile, moverProfileFetched, navigate])

  const { data: activeJob } = useQuery({
    queryKey: ['mover-active-job', profile?.id],
    queryFn: async () => {
      const { data } = await supabase.from('jobs').select('*').eq('mover_id', profile!.id).in('status', ['claimed', 'in_progress']).maybeSingle()
      return data as Job | null
    },
    enabled: !!profile,
    refetchInterval: 30000,
  })

  const toggleOnline = useMutation({
    mutationFn: async (online: boolean) => {
      await supabase.from('mover_profiles').update({ is_online: online }).eq('id', profile!.id)
      if (online) requestPushPermission()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mover-profile-self', profile?.id] }),
  })

  if (!moverProfile || !checked) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
          <p className="text-sm text-gray-500">Welcome, {profile?.full_name?.split(' ')[0]}</p>
        </div>
        {/* Online/Offline toggle */}
        <button
          onClick={() => toggleOnline.mutate(!moverProfile.is_online)}
          disabled={toggleOnline.isPending}
          className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition ${
            moverProfile.is_online
              ? 'bg-green-500 text-white hover:bg-green-600'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${moverProfile.is_online ? 'bg-white animate-pulse' : 'bg-gray-400'}`} />
          {moverProfile.is_online ? 'Online' : 'Offline'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle size={16} className="text-green-500" />
            <span className="text-xs text-gray-500">Completed</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{moverProfile.total_jobs}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2 mb-1">
            <Star size={16} className="text-yellow-400 fill-yellow-400" />
            <span className="text-xs text-gray-500">Rating</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {moverProfile.avg_rating ? moverProfile.avg_rating.toFixed(1) : '—'}
          </p>
        </div>
      </div>

      {/* Active job */}
      {activeJob && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={16} className="text-orange-500" />
            <span className="font-semibold text-orange-700 dark:text-orange-400 text-sm">Active Job</span>
            <StatusBadge status={activeJob.status} />
          </div>
          <p className="text-sm text-gray-900 dark:text-gray-100 truncate">{activeJob.pickup_address}</p>
          <p className="text-xs text-gray-500 truncate">→ {activeJob.dropoff_address}</p>
          <p className="text-xs text-gray-400 mt-1">{format(new Date(activeJob.scheduled_date), 'EEE, dd MMM')}</p>
          <Link to="/mover/active">
            <Button size="sm" fullWidth className="mt-3">Continue Job</Button>
          </Link>
        </div>
      )}

      {!activeJob && moverProfile.is_online && (
        <div className="text-center py-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">
          <p className="text-gray-500 text-sm mb-3">You're online! Browse available jobs.</p>
          <Link to="/mover/jobs">
            <Button>View Request Center</Button>
          </Link>
        </div>
      )}

      {!moverProfile.is_online && !activeJob && (
        <div className="text-center py-8 bg-gray-100 dark:bg-gray-800/50 rounded-2xl">
          <p className="text-gray-500 text-sm">You're offline. Toggle online to start receiving jobs.</p>
        </div>
      )}
    </div>
  )
}
