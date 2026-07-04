import { useEffect, useRef, useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { useWakeLock } from '../../hooks/useWakeLock'
import { queueGpsEvent } from '../../hooks/useGpsQueue'
import { useGpsQueueFlush } from '../../hooks/useGpsQueueFlush'
import { useGoogleMapsLoader } from '../../hooks/useGoogleMapsLoader'
import MoverDrivingMap from '../../components/maps/MoverDrivingMap'
import { googleMapsNavigateToAddress } from '../../lib/mapsLinks'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import SignaturePad from '../../components/signature/SignaturePad'
import ChatPanel from '../../components/chat/ChatPanel'
import {
  Navigation,
  MapPin,
  MessageCircle,
  Camera,
  PenLine,
  Truck,
  ChevronUp,
  Radio,
} from 'lucide-react'
import type { Job } from '../../types'

/** Mover delivery stages (inDrive / Talabat style) */
type Stage = 'to_pickup' | 'at_pickup' | 'to_dropoff' | 'finish'

const STAGE_LABELS: Record<Stage, string> = {
  to_pickup: 'Drive to pickup',
  at_pickup: 'Load items',
  to_dropoff: 'Drive to drop-off',
  finish: 'Complete delivery',
}

const PROGRESS = ['Pickup', 'Load', 'Drop-off', 'Done']

export default function ActiveJobPage() {
  const { profile } = useAuthStore()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { request: requestWakeLock, release: releaseWakeLock } = useWakeLock()
  const { isLoaded: mapsLoaded } = useGoogleMapsLoader()

  const watchIdRef = useRef<number | null>(null)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const lastEmitRef = useRef(0)

  const [stage, setStage] = useState<Stage>('to_pickup')
  const [driving, setDriving] = useState(false)
  const [moverPos, setMoverPos] = useState<{ lat: number; lng: number } | null>(null)
  const [eta, setEta] = useState<string | null>(null)
  const [routeDistance, setRouteDistance] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(true)
  const [photoPath, setPhotoPath] = useState<string | null>(null)
  const [signaturePath, setSignaturePath] = useState<string | null>(null)
  const [completing, setCompleting] = useState(false)
  const [showChat, setShowChat] = useState(false)

  const { data: job, isLoading } = useQuery({
    queryKey: ['mover-active-job-full', profile?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('jobs')
        .select('*')
        .eq('mover_id', profile!.id)
        .in('status', ['claimed', 'in_progress'])
        .maybeSingle()
      return data as Job | null
    },
    enabled: !!profile,
    refetchInterval: 20_000,
  })

  useEffect(() => {
    if (!job) return
    if (job.status === 'in_progress' && stage === 'to_pickup') {
      setStage('at_pickup')
      setDriving(true)
    }
  }, [job?.status, job?.id])

  const mapDestination: 'pickup' | 'dropoff' =
    stage === 'to_dropoff' || stage === 'finish' ? 'dropoff' : 'pickup'

  const progressIndex =
    stage === 'to_pickup' ? 0 : stage === 'at_pickup' ? 1 : stage === 'to_dropoff' ? 2 : 3

  const insertGps = useCallback(async (jobId: string, lat: number, lng: number) => {
    await supabase.from('location_events').insert({ job_id: jobId, lat, lng })
  }, [])

  useGpsQueueFlush(insertGps)

  const emitGps = useCallback(async (lat: number, lng: number) => {
    if (!job) return
    setMoverPos({ lat, lng })

    if (job.status !== 'in_progress') return

    const now = Date.now()
    if (now - lastEmitRef.current < 5000) return
    lastEmitRef.current = now

    channelRef.current?.send({ type: 'broadcast', event: 'gps', payload: { lat, lng } })

    if (!navigator.onLine) {
      await queueGpsEvent(job.id, lat, lng)
      return
    }
    try {
      await insertGps(job.id, lat, lng)
    } catch {
      await queueGpsEvent(job.id, lat, lng)
    }
  }, [job, insertGps])

  const startPositionWatch = useCallback(() => {
    if (watchIdRef.current !== null) return
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => emitGps(pos.coords.latitude, pos.coords.longitude),
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000 },
    )
  }, [emitGps])

  const stopPositionWatch = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    channelRef.current?.unsubscribe()
    channelRef.current = null
  }, [])

  useEffect(() => {
    if (!job) return
    channelRef.current = supabase.channel(`job-gps-${job.id}`)
    channelRef.current.subscribe()
    return () => { channelRef.current?.unsubscribe() }
  }, [job?.id])

  useEffect(() => {
    if (driving) {
      startPositionWatch()
      requestWakeLock()
    }
    return () => {
      if (!driving) releaseWakeLock()
    }
  }, [driving, startPositionWatch, requestWakeLock, releaseWakeLock])

  useEffect(() => () => { stopPositionWatch(); releaseWakeLock() }, [stopPositionWatch, releaseWakeLock])

  const startTrip = useMutation({
    mutationFn: async () => {
      await supabase.from('jobs').update({ status: 'in_progress' }).eq('id', job!.id)
      try {
        await supabase.functions.invoke('notify-in-progress', { body: { job_id: job!.id } })
      } catch { /* optional */ }
    },
    onSuccess: () => {
      setStage('at_pickup')
      qc.invalidateQueries({ queryKey: ['mover-active-job-full', profile?.id] })
    },
  })

  const handlePhotoChange = async (file: File) => {
    const path = `${profile!.id}/${job!.id}_completion.${file.name.split('.').pop()}`
    const { data } = await supabase.storage.from('completion-photos').upload(path, file, { upsert: true })
    if (data) setPhotoPath(data.path)
  }

  const handleSignatureSave = async (dataUrl: string) => {
    const blob = await (await fetch(dataUrl)).blob()
    const path = `${profile!.id}/${job!.id}_signature.png`
    const { data } = await supabase.storage.from('completion-photos').upload(path, blob, { upsert: true, contentType: 'image/png' })
    if (data) setSignaturePath(data.path)
  }

  const completeJob = async () => {
    if (!photoPath || !signaturePath || !job) return
    setCompleting(true)
    const res = await supabase.functions.invoke('complete-job', {
      body: { job_id: job.id, completion_photo_url: photoPath, signature_url: signaturePath },
    })
    if (res.error || res.data?.error) {
      await supabase
        .from('jobs')
        .update({ status: 'completed', completion_photo_url: photoPath, signature_url: signaturePath })
        .eq('id', job.id)
        .eq('mover_id', profile!.id)
    }
    setCompleting(false)
    stopPositionWatch()
    releaseWakeLock()
    qc.invalidateQueries()
    navigate('/mover/dashboard')
  }

  const handleStartDriving = () => {
    setDriving(true)
    setStage('to_pickup')
    startPositionWatch()
  }

  const navigateUrl = googleMapsNavigateToAddress(
    mapDestination === 'pickup' ? job?.pickup_address ?? '' : job?.dropoff_address ?? '',
  )

  if (isLoading || !mapsLoaded) {
    return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>
  }

  if (!job) {
    return (
      <div className="text-center py-20 px-4">
        <p className="text-ink-muted mb-4">No active job.</p>
        <Button onClick={() => navigate('/mover/jobs')}>Find jobs</Button>
      </div>
    )
  }

  return (
    <div className="absolute inset-0 flex flex-col bg-surface-muted">
      <div className="relative flex-1 min-h-0">
        <MoverDrivingMap
          pickupLat={job.pickup_lat}
          pickupLng={job.pickup_lng}
          dropoffLat={job.dropoff_lat}
          dropoffLng={job.dropoff_lng}
          destination={mapDestination}
          moverPosition={driving ? moverPos : null}
          className="absolute inset-0 w-full h-full"
          onEtaChange={(e, d) => { setEta(e); setRouteDistance(d) }}
        />

        <div className="absolute top-3 left-3 right-3 flex flex-col gap-2 pointer-events-none">
          <div className="flex gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 bg-mover text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-md">
              <Truck size={14} />
              {STAGE_LABELS[stage]}
            </span>
            {driving && (
              <span className="inline-flex items-center gap-1.5 bg-white/95 text-accent text-xs font-semibold px-3 py-1.5 rounded-full shadow-md">
                <Radio size={12} className="animate-pulse" />
                {job.status === 'in_progress' ? 'Live · customer can track' : 'En route'}
              </span>
            )}
            {eta && (
              <span className="inline-flex bg-white/95 text-ink text-xs font-medium px-3 py-1.5 rounded-full shadow-md">
                {eta}{routeDistance ? ` · ${routeDistance}` : ''}
              </span>
            )}
          </div>
          <div className="self-start bg-white/95 rounded-xl px-3 py-2 shadow-md">
            <p className="text-lg font-bold text-accent">${job.mover_payout?.toFixed(0) ?? '—'}</p>
            <p className="text-[10px] text-ink-muted font-medium">You keep</p>
          </div>
        </div>
      </div>

      <div className={`shrink-0 bg-white rounded-t-3xl shadow-sheet border-t border-gray-100 ${sheetOpen ? 'max-h-[50%]' : 'max-h-12'}`}>
        <button type="button" onClick={() => setSheetOpen((o) => !o)} className="w-full flex flex-col items-center pt-3 pb-1">
          <div className="sheet-handle" />
          <ChevronUp size={18} className={`text-ink-muted transition ${sheetOpen ? '' : 'rotate-180'}`} />
        </button>

        {sheetOpen && (
          <div className="overflow-y-auto overscroll-contain px-4 pb-6 min-h-0">
            <div className="flex gap-1 mb-4">
              {PROGRESS.map((label, i) => (
                <div key={label} className="flex-1 flex flex-col items-center gap-1">
                  <div className={`h-1.5 w-full rounded-full ${i <= progressIndex ? 'bg-accent' : 'bg-gray-200'}`} />
                  <span className={`text-[10px] font-medium ${i <= progressIndex ? 'text-accent' : 'text-ink-muted'}`}>{label}</span>
                </div>
              ))}
            </div>

            <div className="flex items-start gap-2 mb-4">
              <MapPin size={18} className="text-accent shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-ink-muted font-medium">
                  {mapDestination === 'pickup' ? 'Pickup location' : 'Drop-off location'}
                </p>
                <p className="text-sm font-semibold text-ink leading-snug">
                  {mapDestination === 'pickup' ? job.pickup_address : job.dropoff_address}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 mb-3">
              <a href={navigateUrl} target="_blank" rel="noreferrer" className="block">
                <Button fullWidth size="lg" variant="secondary" className="gap-2">
                  <Navigation size={20} />
                  Navigate
                </Button>
              </a>

              {stage === 'to_pickup' && !driving && (
                <Button fullWidth size="lg" onClick={handleStartDriving}>
                  Start driving
                </Button>
              )}

              {stage === 'to_pickup' && driving && (
                <Button fullWidth size="lg" loading={startTrip.isPending} onClick={() => startTrip.mutate()}>
                  I&apos;ve arrived at pickup
                </Button>
              )}

              {stage === 'at_pickup' && (
                <Button
                  fullWidth
                  size="lg"
                  onClick={() => { setStage('to_dropoff'); setDriving(true) }}
                >
                  Items loaded — start driving to drop-off
                </Button>
              )}

              {stage === 'to_dropoff' && (
                <Button fullWidth size="lg" onClick={() => setStage('finish')}>
                  I&apos;ve arrived at drop-off
                </Button>
              )}
            </div>

            {(stage === 'finish' || stage === 'to_dropoff') && (
              <div className="border-t border-gray-100 pt-4 flex flex-col gap-3">
                <p className="text-sm font-semibold text-ink">Proof of delivery</p>
                <div>
                  <label className="flex items-center gap-2 text-sm text-ink-muted mb-2">
                    <Camera size={16} /> Photo
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhotoChange(f) }}
                    className="text-sm w-full"
                  />
                  {photoPath && <p className="text-xs text-green-600 mt-1">Photo saved</p>}
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm text-ink-muted mb-2">
                    <PenLine size={16} /> Signature
                  </label>
                  <SignaturePad onSave={handleSignatureSave} />
                  {signaturePath && <p className="text-xs text-green-600 mt-1">Signature saved</p>}
                </div>
                {stage === 'finish' && (
                  <Button fullWidth size="lg" loading={completing} disabled={!photoPath || !signaturePath} onClick={completeJob}>
                    Complete job & get paid
                  </Button>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowChat((c) => !c)}
              className="mt-4 w-full flex items-center justify-center gap-2 text-sm font-medium text-accent py-2"
            >
              <MessageCircle size={16} />
              {showChat ? 'Hide chat' : 'Message customer'}
            </button>
            {showChat && (
              <div className="mt-2 border border-gray-100 rounded-xl p-3 max-h-36 overflow-y-auto">
                <ChatPanel jobId={job.id} canSend={job.status === 'claimed' || job.status === 'in_progress'} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
