import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { publishDraftJob } from '../../lib/confirmBooking'
import { useAuthStore } from '../../store/authStore'
import { StatusBadge } from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import StarRating from '../../components/ui/StarRating'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import Modal from '../../components/ui/Modal'
import LiveTrackingMap from '../../components/maps/LiveTrackingMap'
import ChatPanel from '../../components/chat/ChatPanel'
import ChatUnreadDot from '../../components/chat/ChatUnreadDot'
import { useGoogleMapsLoader } from '../../hooks/useGoogleMapsLoader'
import type { Job, LocationEvent, MoverProfile } from '../../types'
import { format } from 'date-fns'
import { requestPushPermission } from '../../hooks/usePushNotifications'
import OrderTracker from '../../components/brand/OrderTracker'
import { MessageCircle } from 'lucide-react'


const TIME_LABELS = { morning: '8am – 12pm', afternoon: '12pm – 5pm', evening: '5pm – 8pm' }

export default function RequesterJobDetail() {
  const { id } = useParams<{ id: string }>()
  const { profile } = useAuthStore()
  const qc = useQueryClient()
  const [moverPos, setMoverPos] = useState<{ lat: number; lng: number } | null>(null)
  const [trail, setTrail] = useState<{ lat: number; lng: number }[]>([])
  const [showCancel, setShowCancel] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [paying, setPaying] = useState(false)
  const [confirmError, setConfirmError] = useState('')
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const { isLoaded } = useGoogleMapsLoader()

  const { data: job, isLoading } = useQuery({
    queryKey: ['job', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('jobs')
        .select(`*, items:job_items(*), status_history:job_status_history(*)`)
        .eq('id', id!)
        .single()
      return data as Job
    },
  })

  const { data: existingReview } = useQuery({
    queryKey: ['review', id],
    queryFn: async () => {
      const { data } = await supabase.from('reviews').select('*').eq('job_id', id!).maybeSingle()
      return data
    },
    enabled: job?.status === 'completed',
  })

  const { data: moverProfile } = useQuery({
    queryKey: ['mover-profile', job?.mover_id],
    queryFn: async () => {
      const [{ data: profileData }, { data: moverData }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', job!.mover_id!).single(),
        supabase.from('mover_profiles').select('*').eq('id', job!.mover_id!).single(),
      ])
      return { profile: profileData, mover: moverData as MoverProfile }
    },
    enabled: !!job?.mover_id,
  })

  // Subscribe to GPS updates when in_progress
  useEffect(() => {
    if (job?.status !== 'in_progress') return
    requestPushPermission()

    channelRef.current = supabase
      .channel(`job-gps-${id}`)
      .on('broadcast', { event: 'gps' }, ({ payload }) => {
        const pos = { lat: payload.lat as number, lng: payload.lng as number }
        setMoverPos(pos)
        setTrail((t) => [...t.slice(-49), pos])
      })
      .subscribe()

    // Also load recent trail from DB
    supabase.from('location_events').select('lat, lng').eq('job_id', id!).order('created_at', { ascending: false }).limit(50)
      .then(({ data }) => {
        if (data) setTrail(data.reverse() as { lat: number; lng: number }[])
      })

    return () => { channelRef.current?.unsubscribe() }
  }, [job?.status, id])

  // Realtime status updates
  useEffect(() => {
    if (!id) return
    const ch = supabase.channel(`job-status-${id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'jobs', filter: `id=eq.${id}` }, () => {
        qc.invalidateQueries({ queryKey: ['job', id] })
      })
      .subscribe()
    return () => { ch.unsubscribe() }
  }, [id, qc])

  const cancelMutation = useMutation({
    mutationFn: async () => {
      await supabase.from('jobs').update({ status: 'cancelled' }).eq('id', id!).eq('requester_id', profile!.id)
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['job', id] }); setShowCancel(false) },
  })

  const submitReview = async () => {
    if (!reviewRating || !job?.mover_id || !profile) return
    setReviewSubmitting(true)
    await supabase.from('reviews').insert({
      job_id: id!,
      requester_id: profile.id,
      mover_id: job.mover_id,
      rating: reviewRating,
      comment: reviewComment || null,
    })
    qc.invalidateQueries({ queryKey: ['review', id] })
    setReviewSubmitting(false)
  }

  if (isLoading) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>
  if (!job) return <p className="text-center text-gray-500 py-20">Job not found.</p>

  const canCancel = job.status === 'draft' || job.status === 'open'

  const confirmPayment = async () => {
    if (!id) return
    setPaying(true)
    setConfirmError('')
    const result = await publishDraftJob(id)
    setPaying(false)
    if (!result.ok) {
      setConfirmError(result.error)
      return
    }
    requestPushPermission()
    qc.invalidateQueries({ queryKey: ['job', id] })
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="card-yard overflow-hidden">
        <div className="bg-jet text-white px-4 py-3 flex items-center justify-between">
          <StatusBadge status={job.status} />
          {job.quoted_price && (
            <span className="price-hero text-3xl text-haul">${job.quoted_price.toFixed(0)}</span>
          )}
        </div>
        <div className="p-4">
          {job.status !== 'draft' && job.status !== 'cancelled' && (
            <div className="mb-4">
              <OrderTracker status={job.status} />
            </div>
          )}
          <p className="text-xs text-gray-500">{format(new Date(job.created_at), 'dd MMM yyyy')}</p>
          {job.paid_at && (
            <button
              type="button"
              className="mt-2 text-haul font-bold text-sm hover:underline"
              onClick={() => {
                const lines = [
                  'MoveThisOut — Receipt',
                  `Job ID: ${job.id}`,
                  `Date: ${format(new Date(job.paid_at!), 'dd MMM yyyy HH:mm')}`,
                  `Pickup: ${job.pickup_address}`,
                  `Drop-off: ${job.dropoff_address}`,
                  `Scheduled: ${job.scheduled_date} (${job.time_window})`,
                  `Total: $${Number(job.quoted_price).toFixed(2)}`,
                  job.promo_code ? `Promo: ${job.promo_code} (-$${Number(job.promo_discount ?? 0).toFixed(2)})` : '',
                ].filter(Boolean).join('\n')
                const blob = new Blob([lines], { type: 'text/plain' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `movethisout-receipt-${job.id.slice(0, 8)}.txt`
                a.click()
                URL.revokeObjectURL(url)
              }}
            >
              Download receipt ▸
            </button>
          )}
        </div>
      </div>

      {/* Live tracking map */}
      {job.status === 'in_progress' && isLoaded && moverPos && (
        <LiveTrackingMap
          moverLat={moverPos.lat}
          moverLng={moverPos.lng}
          pickupLat={job.pickup_lat}
          pickupLng={job.pickup_lng}
          dropoffLat={job.dropoff_lat}
          dropoffLng={job.dropoff_lng}
          trail={trail}
        />
      )}
      {job.status === 'in_progress' && !moverPos && (
        <div className="card-yard bg-caution p-4 text-center text-sm text-orange-700">
          Mover is on the way — waiting for GPS signal…
        </div>
      )}

      {/* Addresses */}
      <div className="card-yard divide-y divide-gray-100">
        <div className="p-4">
          <p className="text-xs text-gray-500 mb-1">Pickup</p>
          <p className="text-sm font-medium text-jet">{job.pickup_address}</p>
        </div>
        <div className="p-4">
          <p className="text-xs text-gray-500 mb-1">Drop-off</p>
          <p className="text-sm font-medium text-jet">{job.dropoff_address}</p>
        </div>
        <div className="p-4 grid grid-cols-2">
          <div>
            <p className="text-xs text-gray-500 mb-1">Date</p>
            <p className="text-sm font-medium text-jet">{format(new Date(job.scheduled_date), 'EEE, dd MMM')}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Time</p>
            <p className="text-sm font-medium text-jet">{TIME_LABELS[job.time_window]}</p>
          </div>
        </div>
        {job.quoted_price && (
          <div className="p-4 flex justify-between items-center">
            <span className="text-xs text-gray-500">Total Price</span>
            <span className="font-bold text-jet">${job.quoted_price.toFixed(2)}</span>
          </div>
        )}
      </div>

      {job.status === 'draft' && (
        <div className="card-yard bg-caution p-4 flex flex-col gap-3">
          <p className="text-sm font-medium text-jet">Ready to publish?</p>
          <p className="text-xs text-gray-600">Confirm your booking to make it visible to movers.</p>
          {confirmError && <p className="text-sm text-red-600 font-medium">{confirmError}</p>}
          <Button fullWidth loading={paying} onClick={confirmPayment}>Confirm &amp; book — ${job.quoted_price?.toFixed(2)}</Button>
        </div>
      )}

      {/* Mover info */}
      {moverProfile?.profile && (
        <div className="card-yard p-4">
          <p className="text-xs text-gray-500 mb-2">Your Mover</p>
          <p className="font-semibold text-jet">{moverProfile.profile.full_name}</p>
          <p className="text-sm text-gray-500">{moverProfile.profile.phone}</p>
          {moverProfile.mover && (
            <p className="text-sm text-gray-500 capitalize mt-1">
              {moverProfile.mover.vehicle_type.replace('_', ' ')}
              {moverProfile.mover.avg_rating ? ` · ★ ${moverProfile.mover.avg_rating.toFixed(1)}` : ''}
            </p>
          )}
        </div>
      )}

      {/* Messages */}
      {job.mover_id && (
        <button
          onClick={() => setShowChat(true)}
          className="flex items-center gap-2 card-yard p-4 text-left hover:shadow-md transition"
        >
          <MessageCircle size={18} className="text-haul" />
          <span className="text-sm font-medium text-jet">Messages</span>
          <ChatUnreadDot jobId={id!} />
        </button>
      )}

      {/* Items */}
      {job.items && job.items.length > 0 && (
        <div className="card-yard p-4">
          <p className="text-xs text-gray-500 mb-3">Items ({job.items.length})</p>
          <div className="flex flex-col gap-2">
            {job.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-jet">{item.name} × {item.quantity}</span>
                <span className="text-gray-400 capitalize">{item.size.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status timeline */}
      {job.status_history && job.status_history.length > 0 && (
        <div className="card-yard p-4">
          <p className="text-xs text-gray-500 mb-3">Timeline</p>
          <div className="flex flex-col gap-2">
            {[...job.status_history].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()).map((h) => (
              <div key={h.id} className="flex justify-between text-sm">
                <span className="capitalize text-gray-700">{h.status.replace('_', ' ')}</span>
                <span className="text-gray-400 text-xs">{format(new Date(h.created_at), 'dd MMM HH:mm')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Review */}
      {job.status === 'completed' && !existingReview && job.mover_id && (
        <div className="card-yard p-4">
          <p className="font-semibold text-jet mb-3">Leave a review</p>
          <StarRating value={reviewRating} onChange={setReviewRating} />
          <textarea
            className="w-full mt-3 border-3 border-jet px-4 py-3 text-sm bg-white text-jet focus:outline-none focus:ring-2 focus:ring-haul resize-none"
            rows={3}
            placeholder="How was the service? (optional)"
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
          />
          <Button fullWidth className="mt-3" loading={reviewSubmitting} disabled={!reviewRating} onClick={submitReview}>
            Submit Review
          </Button>
        </div>
      )}
      {existingReview && (
        <div className="card-yard bg-concrete p-4">
          <p className="text-sm text-gray-500 mb-1">Your review</p>
          <StarRating value={existingReview.rating} readonly />
          {existingReview.comment && <p className="text-sm text-gray-700 mt-2">{existingReview.comment}</p>}
        </div>
      )}

      {canCancel && (
        <Button variant="danger" fullWidth onClick={() => setShowCancel(true)}>Cancel Job</Button>
      )}

      <ConfirmDialog
        open={showCancel}
        onClose={() => setShowCancel(false)}
        onConfirm={() => cancelMutation.mutate()}
        title="Cancel this job?"
        message="This cannot be undone. The job will be cancelled and removed from the request center."
        confirmLabel="Yes, cancel"
        loading={cancelMutation.isPending}
        danger
      />

      <Modal open={showChat} onClose={() => setShowChat(false)} title="Messages">
        <ChatPanel jobId={id!} canSend={job.status === 'claimed' || job.status === 'in_progress'} />
      </Modal>
    </div>
  )
}
