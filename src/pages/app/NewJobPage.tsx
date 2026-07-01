import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useJsApiLoader } from '@react-google-maps/api'
import { useJobCreationStore } from '../../store/jobCreationStore'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../lib/supabase'
import StepAddresses from './steps/StepAddresses'
import StepSchedule from './steps/StepSchedule'
import StepItems from './steps/StepItems'
import StepReview from './steps/StepReview'
import Spinner from '../../components/ui/Spinner'

const STEPS = ['Addresses', 'Schedule', 'Items', 'Review']
const LIBRARIES: ('places')[] = ['places']

export default function NewJobPage() {
  const [step, setStep] = useState(0)
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const store = useJobCreationStore()

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY,
    libraries: LIBRARIES,
  })

  const confirmJob = async () => {
    if (!profile || !store.quote) return
    const { data: job, error } = await supabase
      .from('jobs')
      .insert({
        requester_id: profile.id,
        pickup_address: store.pickup_address,
        pickup_lat: store.pickup_lat,
        pickup_lng: store.pickup_lng,
        dropoff_address: store.dropoff_address,
        dropoff_lat: store.dropoff_lat,
        dropoff_lng: store.dropoff_lng,
        scheduled_date: store.scheduled_date,
        time_window: store.time_window,
        notes: store.notes,
        status: 'open',
        quoted_price: store.quote.quoted_price,
        platform_fee: store.quote.platform_fee,
        mover_payout: store.quote.mover_payout,
        distance_km: store.quote.distance_km,
      })
      .select()
      .single()

    if (error || !job) return

    // Insert items
    if (store.items.length > 0) {
      const items = store.items.map((item) => ({
        job_id: job.id,
        name: item.name,
        size: item.size,
        quantity: item.quantity,
        photo_url: item.photo_url ?? null,
      }))
      await supabase.from('job_items').insert(items)
    }

    store.reset()
    navigate(`/app/jobs/${job.id}`)
  }

  if (!isLoaded) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Book a Move</h1>
        <div className="flex gap-2 mt-3">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1 flex flex-col items-center gap-1">
              <div className={`h-1.5 w-full rounded-full transition ${i <= step ? 'bg-brand-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
              <span className={`text-xs ${i === step ? 'text-brand-500 font-semibold' : 'text-gray-400'}`}>{s}</span>
            </div>
          ))}
        </div>
      </div>

      {step === 0 && <StepAddresses onNext={() => setStep(1)} />}
      {step === 1 && <StepSchedule onBack={() => setStep(0)} onNext={() => setStep(2)} />}
      {step === 2 && <StepItems onBack={() => setStep(1)} onNext={() => setStep(3)} />}
      {step === 3 && <StepReview onBack={() => setStep(2)} onConfirm={confirmJob} />}
    </div>
  )
}
