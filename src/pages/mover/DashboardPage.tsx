import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { StatusBadge } from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import { format } from 'date-fns'
import { requestPushPermission } from '../../hooks/usePushNotifications'
import type { Job, MoverProfile } from '../../types'

export default function MoverDashboard() {
  const { profile } = useAuthStore()
  const qc = useQueryClient()

  const { data: moverProfile, isLoading } = useQuery({
    queryKey: ['mover-profile-self', profile?.id],
    queryFn: async () => {
      const { data } = await supabase.from('mover_profiles').select('*').eq('id', profile!.id).maybeSingle()
      return data as MoverProfile | null
    },
    enabled: !!profile,
  })

  const { data: earnings } = useQuery({
    queryKey: ['mover-payouts', profile?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('mover_payouts')
        .select('*, job:jobs(scheduled_date)')
        .eq('mover_id', profile!.id)
        .order('created_at', { ascending: false })
        .limit(8)
      return data ?? []
    },
    enabled: !!profile,
  })

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

  if (isLoading || !moverProfile) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>

  const totalEarned = earnings?.filter((e) => e.status !== 'cancelled').reduce((s, e) => s + Number(e.amount), 0) ?? 0
  const pendingPayout = earnings?.filter((e) => e.status === 'pending').reduce((s, e) => s + Number(e.amount), 0) ?? 0

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl uppercase">Hey {profile?.full_name?.split(' ')[0]}</h1>
          <p className="text-sm text-gray-600">Your truck. Your hours. Your town.</p>
        </div>
        <button
          onClick={() => toggleOnline.mutate(!moverProfile.is_online)}
          disabled={toggleOnline.isPending}
          className={`border-3 border-jet px-4 py-2 font-condensed font-bold text-sm uppercase tracking-wider shadow-hard-sm transition ${
            moverProfile.is_online ? 'bg-haul text-white' : 'bg-white text-jet'
          }`}
        >
          {moverProfile.is_online ? '● Online' : 'Go online'}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="card-yard p-3 text-center bg-concrete">
          <p className="price-hero text-2xl">{moverProfile.total_jobs}</p>
          <p className="font-condensed text-[10px] font-bold uppercase tracking-wider text-gray-500">Jobs</p>
        </div>
        <div className="card-yard p-3 text-center bg-concrete">
          <p className="price-hero text-2xl">{moverProfile.avg_rating ? moverProfile.avg_rating.toFixed(1) : '—'}</p>
          <p className="font-condensed text-[10px] font-bold uppercase tracking-wider text-gray-500">Rating</p>
        </div>
        <div className="card-yard p-3 text-center bg-caution">
          <p className="price-hero text-2xl">${totalEarned.toFixed(0)}</p>
          <p className="font-condensed text-[10px] font-bold uppercase tracking-wider text-jet">Earned</p>
          {pendingPayout > 0 && <p className="text-[10px] text-gray-600 mt-1">${pendingPayout.toFixed(0)} pending</p>}
        </div>
      </div>

      {activeJob && (
        <div className="card-yard overflow-hidden border-haul">
          <div className="bg-haul text-white px-4 py-2 flex justify-between items-center">
            <span className="font-condensed font-bold text-sm uppercase tracking-widest">Active delivery</span>
            <StatusBadge status={activeJob.status} />
          </div>
          <div className="p-4">
            <p className="font-bold text-sm truncate">{activeJob.pickup_address}</p>
            <p className="font-condensed text-sm uppercase text-gray-600 truncate">▸ {activeJob.dropoff_address}</p>
            <p className="price-hero text-3xl text-haul mt-2">${activeJob.mover_payout?.toFixed(0)}</p>
            <Link to="/mover/active"><Button fullWidth className="mt-3">Continue ▸</Button></Link>
          </div>
        </div>
      )}

      {!activeJob && moverProfile.is_online && (
        <Link to="/mover/jobs"><Button fullWidth size="lg">See available jobs ▸</Button></Link>
      )}

      {!moverProfile.is_online && !activeJob && (
        <div className="card-yard p-6 text-center bg-concrete">
          <p className="font-display text-lg uppercase mb-1">You&apos;re offline</p>
          <p className="text-sm text-gray-600">Tap Go online to start earning.</p>
        </div>
      )}

      {earnings && earnings.length > 0 && (
        <div className="card-yard p-4">
          <p className="font-condensed font-bold text-sm uppercase tracking-widest mb-3">Recent payouts</p>
          {earnings.map((e: { id: string; amount: number; status: string; job?: { scheduled_date: string } }) => (
            <div key={e.id} className="flex justify-between text-sm py-1 border-b border-concrete last:border-0">
              <span className="text-gray-600 capitalize">{e.status}{e.job?.scheduled_date ? ` · ${format(new Date(e.job.scheduled_date), 'dd MMM')}` : ''}</span>
              <span className="font-bold text-haul">${Number(e.amount).toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
