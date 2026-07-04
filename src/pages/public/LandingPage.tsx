import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useGoogleMapsLoader } from '../../hooks/useGoogleMapsLoader'
import { useJobCreationStore } from '../../store/jobCreationStore'
import AddressAutocomplete from '../../components/maps/AddressAutocomplete'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import HazardStripe from '../../components/brand/HazardStripe'
import Wordmark from '../../components/brand/Wordmark'

export default function LandingPage() {
  const navigate = useNavigate()
  const store = useJobCreationStore()
  const [ready, setReady] = useState(!!store.pickup_address)

  const { isLoaded } = useGoogleMapsLoader()

  if (!isLoaded) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Billboard header — Skip-style location entry */}
      <div className="bg-haul text-white px-4 pt-10 pb-8 relative">
        <Wordmark variant="billboard" className="mb-2" />
        <p className="font-condensed font-bold text-jet text-lg uppercase tracking-wide">
          Local movers. Your stuff. Moved today. ▸
        </p>
        <div className="absolute right-4 top-6 bg-caution text-jet border-3 border-jet shadow-hard px-3 py-2 rotate-3 text-center">
          <p className="font-condensed font-bold text-[10px] uppercase tracking-widest">From</p>
          <p className="font-display text-3xl leading-none">$39</p>
        </div>
      </div>
      <HazardStripe />

      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-6 flex flex-col gap-5">
        <div className="card-yard p-5">
          <h2 className="font-display text-2xl uppercase mb-1">Where&apos;s the pickup?</h2>
          <p className="text-sm text-gray-600 mb-4">Two addresses. One price. No truck rental.</p>

          <AddressAutocomplete
            label="Pickup address"
            placeholder="123 Main St, Vancouver"
            defaultValue={store.pickup_address}
            onPlaceSelected={({ address, lat, lng }) => {
              store.setAddresses({ ...store, pickup_address: address, pickup_lat: lat, pickup_lng: lng })
              setReady(true)
            }}
          />
        </div>

        {ready && (
          <Button fullWidth size="lg" onClick={() => navigate('/book')}>
            Get my price ▸
          </Button>
        )}

        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="card-yard p-4 bg-concrete">
            <p className="font-display text-lg uppercase">No U-Haul</p>
            <p className="text-xs text-gray-600 mt-1">We send the truck with the person</p>
          </div>
          <div className="card-yard p-4 bg-concrete">
            <p className="font-display text-lg uppercase">Real price</p>
            <p className="text-xs text-gray-600 mt-1">What you see is what you pay</p>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500">
          Got a truck?{' '}
          <Link to="/register?role=mover" className="text-haul font-bold hover:underline">
            Get paid ▸
          </Link>
        </p>
        <p className="text-center text-sm">
          <Link to="/login" className="text-jet font-condensed font-bold uppercase tracking-wider hover:text-haul">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
