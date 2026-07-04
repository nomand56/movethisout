import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useGoogleMapsLoader } from '../../hooks/useGoogleMapsLoader'
import { useJobCreationStore } from '../../store/jobCreationStore'
import AddressAutocomplete from '../../components/maps/AddressAutocomplete'
import BookingMap from '../../components/maps/BookingMap'
import LandingSheet from '../../components/booking/LandingSheet'
import MarketingSections from '../../components/marketing/MarketingSections'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import { BRAND_FULL, SERVICE_AREA_LABEL } from '../../lib/serviceArea'

export default function LandingPage() {
  const navigate = useNavigate()
  const store = useJobCreationStore()
  const [step, setStep] = useState<'pickup' | 'dropoff'>('pickup')

  const { isLoaded } = useGoogleMapsLoader()

  const hasPickup = !!store.pickup_lat
  const hasDropoff = !!store.dropoff_lat
  const canBook = hasPickup && hasDropoff

  const pickupPin = hasPickup
    ? { lat: store.pickup_lat!, lng: store.pickup_lng!, label: 'Pickup' }
    : null
  const dropoffPin = hasDropoff
    ? { lat: store.dropoff_lat!, lng: store.dropoff_lng!, label: 'Drop-off' }
    : null

  if (!isLoaded) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-muted flex flex-col">
      {/* Map hero */}
      <div className="relative w-full max-w-lg mx-auto flex-1 min-h-[38vh]">
        <BookingMap pickup={pickupPin} dropoff={dropoffPin} className="absolute inset-0 w-full h-full" />
        <div className="absolute top-0 left-0 right-0 z-10 px-4 pt-4 pb-8 bg-gradient-to-b from-white/95 to-transparent">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-bold text-ink tracking-tight">{BRAND_FULL}</p>
              <p className="text-xs text-ink-muted">{SERVICE_AREA_LABEL} · upfront price</p>
            </div>
            <Link to="/login" className="text-sm font-medium text-accent hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>

      <LandingSheet className="-mt-4">
        <h1 className="text-2xl font-bold text-ink mb-1">
          {step === 'pickup' ? 'Where from?' : 'Where to?'}
        </h1>
        <p className="text-sm text-ink-muted mb-4">
          Local movers. See your price before you book.
        </p>

        {step === 'pickup' ? (
          <AddressAutocomplete
            label="Pickup address"
            placeholder="e.g. 450 Lansdowne St, Kamloops"
            defaultValue={store.pickup_address}
            onPlaceSelected={({ address, lat, lng }) => {
              store.setAddresses({ ...store, pickup_address: address, pickup_lat: lat, pickup_lng: lng })
              setStep('dropoff')
            }}
          />
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-sm text-ink-muted bg-accent-soft rounded-xl px-3 py-2">
              <span className="font-semibold text-accent">A</span>
              <span className="truncate">{store.pickup_address}</span>
              <button type="button" className="text-accent font-medium ml-auto shrink-0" onClick={() => setStep('pickup')}>
                Edit
              </button>
            </div>
            <AddressAutocomplete
              label="Drop-off address"
              placeholder="e.g. Aberdeen Mall, Kamloops"
              defaultValue={store.dropoff_address}
              onPlaceSelected={({ address, lat, lng }) => {
                store.setAddresses({ ...store, dropoff_address: address, dropoff_lat: lat, dropoff_lng: lng })
              }}
            />
          </div>
        )}

        {canBook && (
          <Button fullWidth size="lg" className="mt-5" onClick={() => navigate('/book')}>
            Get my price
          </Button>
        )}

        <p className="text-center text-xs text-ink-muted mt-4">
          Also serving Merritt &amp; Salmon Arm ·{' '}
          <Link to="/mover/login" className="text-accent font-medium">Drive with us</Link>
        </p>
      </LandingSheet>

      <MarketingSections />
    </div>
  )
}
