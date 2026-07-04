import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGoogleMapsLoader } from '../../hooks/useGoogleMapsLoader'
import { useJobCreationStore } from '../../store/jobCreationStore'
import { useAuthStore } from '../../store/authStore'
import { supabase, getFunctionErrorMessage, getPostgrestErrorMessage } from '../../lib/supabase'
import StepAddresses from './steps/StepAddresses'
import StepSchedule from './steps/StepSchedule'
import StepItems from './steps/StepItems'
import StepReview from './steps/StepReview'
import StepPayment from './steps/StepPayment'
import StepAuth from './steps/StepAuth'
import Spinner from '../../components/ui/Spinner'
import { requestPushPermission } from '../../hooks/usePushNotifications'
import { notifyBookingConfirmed } from '../../lib/confirmBooking'
import { markFirstActionCompleted } from '../../components/pwa/InstallPrompt'

interface Props { authRequired: boolean }

const STEPS = ['Addresses', 'Schedule', 'Items', 'Review', 'Confirm']

export default function BookingWizardShell({ authRequired }: Props) {
  const [step, setStep] = useState(0)
  const [confirming, setConfirming] = useState(false)
  const [confirmError, setConfirmError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [draftError, setDraftError] = useState('')
  const navigate = useNavigate()
  const { profile, session } = useAuthStore()
  const store = useJobCreationStore()

  const isGuest = !authRequired && !profile

  const { isLoaded } = useGoogleMapsLoader()

  const fetchQuote = async (): Promise<boolean> => {
    try {
      const res = await supabase.functions.invoke('calculate-price', {
        body: {
          pickup_lat: store.pickup_lat,
          pickup_lng: store.pickup_lng,
          dropoff_lat: store.dropoff_lat,
          dropoff_lng: store.dropoff_lng,
          items: store.items.map((i) => ({ size: i.size, quantity: i.quantity })),
          scheduled_date: store.scheduled_date,
          time_window: store.time_window,
          apply_credit: true,
          promo_code: store.promo_code || undefined,
        },
      })
      if (res.error) throw new Error(await getFunctionErrorMessage(res.error))
      if (res.data?.error) throw new Error(res.data.error as string)
      store.setQuote(res.data)
      return true
    } catch {
      return false
    }
  }

  const createJob = async (status: 'draft' | 'open'): Promise<string | null> => {
    const requesterId = session?.user?.id ?? profile?.id
    if (!requesterId || !store.quote) {
      setDraftError('Sign in to continue, then try again.')
      return null
    }

    const row: Record<string, unknown> = {
      requester_id: requesterId,
      pickup_address: store.pickup_address,
      pickup_lat: Number(store.pickup_lat),
      pickup_lng: Number(store.pickup_lng),
      dropoff_address: store.dropoff_address,
      dropoff_lat: Number(store.dropoff_lat),
      dropoff_lng: Number(store.dropoff_lng),
      scheduled_date: store.scheduled_date,
      time_window: store.time_window,
      notes: store.notes || null,
      status,
      quoted_price: store.quote.quoted_price,
      platform_fee: store.quote.platform_fee,
      mover_payout: store.quote.mover_payout,
      distance_km: store.quote.distance_km,
    }

    if (status === 'open') {
      row.paid_at = new Date().toISOString()
      row.payment_method = 'confirmed'
    }

    if (store.quote.promo_code) {
      row.promo_code = store.quote.promo_code
      row.promo_discount = store.quote.promo_discount ?? 0
    }

    const credit = store.quote.credit_applied
    if (credit && credit > 0) row.credit_applied = credit

    let { data: job, error } = await supabase.from('jobs').insert(row).select().single()

    if (error?.code === 'PGRST204') {
      const fallback = { ...row }
      delete fallback.credit_applied
      delete fallback.promo_code
      delete fallback.promo_discount
      delete fallback.paid_at
      delete fallback.payment_method
      ;({ data: job, error } = await supabase.from('jobs').insert(fallback).select().single())
    }

    if (error || !job) {
      setConfirmError(getPostgrestErrorMessage(error))
      return null
    }

    if (store.items.length > 0) {
      const items = store.items.map((item) => ({
        job_id: job.id,
        name: item.name,
        size: item.size,
        quantity: item.quantity,
        photo_url: item.photo_url ?? null,
      }))
      const { error: itemsError } = await supabase.from('job_items').insert(items)
      if (itemsError) {
        setConfirmError(getPostgrestErrorMessage(itemsError))
        return null
      }
    }

    if (status === 'open') await notifyBookingConfirmed(job)
    setDraftError('')
    setConfirmError('')
    return job.id
  }

  const handleConfirmBooking = async () => {
    setConfirming(true)
    setConfirmError('')
    const jobId = await createJob('open')
    setConfirming(false)
    if (!jobId) return
    requestPushPermission()
    markFirstActionCompleted()
    store.reset()
    navigate(`/app/jobs/${jobId}`)
  }

  const handleReviewConfirm = async () => {
    if (isGuest) {
      setDraftError('')
      setStep(5)
      return
    }
    setDraftError('')
    setStep(4)
  }

  // After sign-in: fetch price → confirm step
  useEffect(() => {
    if (step !== 5 || !profile) return

    let cancelled = false
    setAuthLoading(true)

    const afterAuth = async () => {
      if (!store.quote) await fetchQuote()
      if (!cancelled) {
        setStep(4)
        setAuthLoading(false)
      }
    }
    afterAuth()

    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, step])

  if (authRequired && session && !session.user.email_confirmed_at) {
    return (
      <div className="card-yard p-6 text-center bg-concrete">
        <h2 className="font-display text-xl uppercase mb-2">Verify email first</h2>
        <p className="text-sm text-gray-600 mb-4">Check your inbox before booking.</p>
        <a href="/verify-email" className="text-haul font-bold text-sm hover:underline">Resend link ▸</a>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  const progressStep = step === 5 ? 3 : step

  return (
    <>
      {!authRequired && (
        <div className="bg-haul text-white px-4 py-6 -mx-4 -mt-5 mb-2 border-b-3 border-jet">
          <p className="font-display text-2xl uppercase [text-shadow:2px_2px_0_#141414]">MoveThisOut ▸</p>
          <p className="font-condensed font-bold text-jet text-sm uppercase tracking-wide">Get your price in 2 minutes</p>
        </div>
      )}
      <div className="flex flex-col gap-5 pb-4">
        <div>
          <h1 className="font-display text-3xl uppercase">Book it</h1>
          <div className="flex gap-1 mt-3 border-3 border-jet">
            {STEPS.map((s, i) => (
              <div
                key={s}
                className={`flex-1 py-2 text-center font-condensed font-bold text-[10px] uppercase tracking-wider border-r-3 border-jet last:border-r-0 ${
                  i <= progressStep ? 'bg-haul text-white' : 'bg-white text-gray-400'
                }`}
              >
                {s}
              </div>
            ))}
          </div>
        </div>

        {step === 0 && <StepAddresses onNext={() => setStep(1)} />}
        {step === 1 && <StepSchedule onBack={() => setStep(0)} onNext={() => setStep(2)} />}
        {step === 2 && <StepItems onBack={() => setStep(1)} onNext={() => setStep(3)} />}
        {step === 3 && (
          <StepReview
            guestMode={isGuest}
            onBack={() => setStep(2)}
            onConfirm={handleReviewConfirm}
            confirmLabel={isGuest ? 'Sign in to book ▸' : 'Continue to confirm ▸'}
            bookingError={draftError}
          />
        )}
        {step === 4 && profile && (
          <StepPayment
            onBack={() => setStep(3)}
            loading={confirming}
            error={confirmError}
            onConfirm={handleConfirmBooking}
          />
        )}
        {step === 5 && !authLoading && <StepAuth onBack={() => setStep(3)} />}
        {step === 5 && authLoading && (
          <div className="flex flex-col items-center gap-3 py-16">
            <Spinner className="h-10 w-10" />
            <p className="font-condensed font-bold uppercase tracking-wider text-gray-600">Getting your price…</p>
          </div>
        )}
      </div>
    </>
  )
}
