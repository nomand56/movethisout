import { useEffect, useRef, useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { useWakeLock } from '../../hooks/useWakeLock'
import { queueGpsEvent, flushGpsQueue } from '../../hooks/useGpsQueue'
import { useGpsQueueFlush } from '../../hooks/useGpsQueueFlush'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import SignaturePad from '../../components/signature/SignaturePad'
import ChatPanel from '../../components/chat/ChatPanel'
import { Navigation, CheckCircle, Camera, PenLine, MessageCircle } from 'lucide-react'
import type { Job } from '../../types'

type Step = 'navigate_pickup' | 'confirm_arrival' | 'loading' | 'navigate_dropoff' | 'delivery' | 'complete'

const STEP_ORDER: Step[] = ['navigate_pickup', 'confirm_arrival', 'loading', 'navigate_dropoff', 'delivery', 'complete']

const STEP_LABELS: Record<Step, string> = {
  navigate_pickup: 'Navigate to Pickup',
  confirm_arrival: 'Confirm Arrival at Pickup',
  loading: 'Confirm Loading Complete',
  navigate_dropoff: 'Navigate to Drop-off',
  delivery: 'Confirm Delivery',
  complete: 'Complete Job',
}

function stepFromJob(job: Job): Step {
  if (job.status === 'claimed') return 'navigate_pickup'
  if (job.status === 'in_progress') return 'navigate_dropoff'
  return 'navigate_pickup'
}

export default function ActiveJobPage() {
  const { profile } = useAuthStore()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { request: requestWakeLock, release: releaseWakeLock } = useWakeLock()
  const watchIdRef = useRef<number | null>(null)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const lastEmitRef = useRef(0)
  const [currentStep, setCurrentStep] = useState<Step>('navigate_pickup')
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPath, setPhotoPath] = useState<string | null>(null)
  const [signaturePath, setSignaturePath] = useState<string | null>(null)
  const [completing, setCompleting] = useState(false)

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
  })

  useEffect(() => {
    if (job) setCurrentStep(stepFromJob(job))
  }, [job?.id, job?.status])

  const insertGps = useCallback(async (jobId: string, lat: number, lng: number) => {
    await supabase.from('location_events').insert({ job_id: jobId, lat, lng })
  }, [])

  useGpsQueueFlush(insertGps)

  const emitGps = useCallback(async (lat: number, lng: number) => {
    if (!job) return
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

  const startGPS = useCallback(() => {
    if (!job) return
    channelRef.current = supabase.channel(`job-gps-${job.id}`)
    channelRef.current.subscribe()

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => emitGps(pos.coords.latitude, pos.coords.longitude),
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000 },
    )
  }, [job, emitGps])

  const stopGPS = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    channelRef.current?.unsubscribe()
    channelRef.current = null
  }, [])

  useEffect(() => {
    if (job?.status === 'in_progress') {
      requestWakeLock()
      startGPS()
    }
    return () => { stopGPS(); releaseWakeLock() }
  }, [job?.status, startGPS, stopGPS, requestWakeLock, releaseWakeLock])

  const updateStatus = useMutation({
    mutationFn: async (status: 'in_progress') => {
      await supabase.from('jobs').update({ status }).eq('id', job!.id)
      await supabase.functions.invoke('notify-in-progress', { body: { job_id: job!.id } })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mover-active-job-full', profile?.id] }),
  })

  const handlePhotoChange = async (file: File) => {
    setPhoto(file)
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
    setCompleting(false)
    if (!res.error) {
      stopGPS()
      releaseWakeLock()
      qc.invalidateQueries()
      navigate('/mover/dashboard')
    }
  }

  const advanceStep = async () => {
    const idx = STEP_ORDER.indexOf(currentStep)
    if (currentStep === 'confirm_arrival' && job) {
      await updateStatus.mutateAsync('in_progress')
    }
    if (currentStep === 'complete') {
      await completeJob()
      return
    }
    setCurrentStep(STEP_ORDER[idx + 1])
  }

  const mapsLink = (address: string) =>
    `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`

  if (isLoading) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>

  if (!job) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 mb-4">No active job found.</p>
        <Button onClick={() => navigate('/mover/jobs')}>Find a Job</Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-xl uppercase text-jet">Active Job</h1>
        {job.status === 'in_progress' && (
          <p className="text-xs text-orange-500 font-medium mt-1 flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
            GPS broadcasting every 5s · Screen awake
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {STEP_ORDER.map((step, i) => {
          const idx = STEP_ORDER.indexOf(currentStep)
          const done = i < idx
          const active = step === currentStep
          return (
            <div
              key={step}
              className={`rounded-2xl p-4 border transition ${
                active
                  ? 'border-brand-500 bg-caution'
                  : done
                  ? 'border-green-200 bg-green-50'
                  : 'border-gray-100 bg-white opacity-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {done ? (
                    <CheckCircle size={18} className="text-green-500" />
                  ) : (
                    <div className={`h-5 w-5 rounded-full border-2 ${active ? 'border-brand-500' : 'border-gray-300'} flex items-center justify-center`}>
                      {active && <div className="h-2 w-2 rounded-full bg-haul" />}
                    </div>
                  )}
                  <span className={`text-sm font-medium ${active ? 'text-brand-700' : done ? 'text-green-700' : 'text-gray-400'}`}>
                    {STEP_LABELS[step]}
                  </span>
                </div>

                {active && (step === 'navigate_pickup' || step === 'navigate_dropoff') && (
                  <a
                    href={mapsLink(step === 'navigate_pickup' ? job.pickup_address : job.dropoff_address)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-xs text-haul font-medium"
                  >
                    <Navigation size={14} /> Open Maps
                  </a>
                )}
              </div>

              {active && step === 'complete' && (
                <div className="mt-4 flex flex-col gap-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <Camera size={16} /> Delivery photo
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhotoChange(f) }}
                      className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-caution file:text-brand-700"
                    />
                    {photo && <p className="text-xs text-green-600 mt-1">✓ Photo ready</p>}
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <PenLine size={16} /> Requester signature
                    </label>
                    <SignaturePad onSave={handleSignatureSave} />
                    {signaturePath && <p className="text-xs text-green-600 mt-1">✓ Signature captured</p>}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="card-yard p-4">
        <div className="flex items-center gap-2 mb-3">
          <MessageCircle size={16} className="text-haul" />
          <p className="text-sm font-medium text-jet">Messages</p>
        </div>
        <ChatPanel jobId={job.id} canSend={job.status === 'claimed' || job.status === 'in_progress'} />
      </div>

      {currentStep !== 'complete' ? (
        <Button fullWidth size="lg" loading={updateStatus.isPending} onClick={advanceStep}>
          {STEP_LABELS[STEP_ORDER[STEP_ORDER.indexOf(currentStep) + 1]] ? `Next: ${STEP_LABELS[STEP_ORDER[STEP_ORDER.indexOf(currentStep) + 1]]}` : 'Next'}
        </Button>
      ) : (
        <Button
          fullWidth
          size="lg"
          loading={completing}
          disabled={!photoPath || !signaturePath}
          onClick={completeJob}
        >
          Complete Job
        </Button>
      )}
    </div>
  )
}
