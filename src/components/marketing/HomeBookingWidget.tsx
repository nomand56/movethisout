import { useRef, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Autocomplete } from '@react-google-maps/api'
import { useJobCreationStore } from '../../store/jobCreationStore'
import { isInServiceArea, serviceAreaError } from '../../lib/serviceArea'
import { LocationChip, ScheduleChip } from '../layout/PublicHeader'
import { Link } from 'react-router-dom'
import { Circle, Square } from 'lucide-react'

const AUTOCOMPLETE_OPTIONS: google.maps.places.AutocompleteOptions = {
  fields: ['formatted_address', 'geometry'],
}

export default function HomeBookingWidget() {
  const navigate = useNavigate()
  const store = useJobCreationStore()
  const [pickupError, setPickupError] = useState('')
  const [dropoffError, setDropoffError] = useState('')
  const [ready, setReady] = useState(false)

  const pickupRef = useRef<google.maps.places.Autocomplete | null>(null)
  const dropoffRef = useRef<google.maps.places.Autocomplete | null>(null)
  const pickupInputRef = useRef<HTMLInputElement | null>(null)
  const dropoffInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    setReady(true)
    return () => setReady(false)
  }, [])

  const handlePickup = (address: string, lat: number, lng: number) => {
    if (!isInServiceArea(lat, lng)) {
      setPickupError(serviceAreaError())
      return
    }
    setPickupError('')
    store.setAddresses({ ...store, pickup_address: address, pickup_lat: lat, pickup_lng: lng })
    dropoffInputRef.current?.focus()
  }

  const handleDropoff = (address: string, lat: number, lng: number) => {
    if (!isInServiceArea(lat, lng)) {
      setDropoffError(serviceAreaError())
      return
    }
    setDropoffError('')
    store.setAddresses({ ...store, dropoff_address: address, dropoff_lat: lat, dropoff_lng: lng })
  }

  const canBook = store.pickup_lat && store.dropoff_lat

  const inputClass =
    'w-full bg-surface-muted border-0 rounded-xl px-4 py-3.5 text-[15px] text-ink placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/30 min-h-[52px]'

  return (
    <div className="max-w-xl">
      <LocationChip />
      <h1 className="text-4xl sm:text-5xl font-bold text-ink tracking-tight leading-[1.1] mb-5">
        Move anything with {''}
        <span className="text-accent">MoveThisOut</span>
      </h1>
      <ScheduleChip />

      <div className="relative flex flex-col gap-0 mb-2">
        <div className="absolute left-[19px] top-[52px] bottom-[52px] w-0.5 bg-gray-300 z-0" />

        <div className="relative z-10 flex items-stretch gap-3">
          <div className="flex flex-col items-center pt-4 shrink-0 w-10">
            <Circle size={14} className="text-ink fill-ink" strokeWidth={0} />
          </div>
          <div className="flex-1">
            {ready ? (
              <Autocomplete
                onLoad={(a) => { pickupRef.current = a }}
                onPlaceChanged={() => {
                  const place = pickupRef.current?.getPlace()
                  if (!place?.geometry?.location) return
                  handlePickup(
                    place.formatted_address ?? pickupInputRef.current?.value ?? '',
                    place.geometry.location.lat(),
                    place.geometry.location.lng(),
                  )
                }}
                options={AUTOCOMPLETE_OPTIONS}
              >
                <input
                  ref={pickupInputRef}
                  type="text"
                  placeholder="Pickup location"
                  defaultValue={store.pickup_address}
                  className={inputClass}
                />
              </Autocomplete>
            ) : (
              <input type="text" placeholder="Pickup location" className={inputClass} disabled />
            )}
            {pickupError && <p className="text-xs text-red-600 mt-1">{pickupError}</p>}
          </div>
        </div>

        <div className="relative z-10 flex items-stretch gap-3 mt-2">
          <div className="flex flex-col items-center pt-4 shrink-0 w-10">
            <Square size={12} className="text-accent fill-accent" strokeWidth={0} />
          </div>
          <div className="flex-1">
            {ready ? (
              <Autocomplete
                onLoad={(a) => { dropoffRef.current = a }}
                onPlaceChanged={() => {
                  const place = dropoffRef.current?.getPlace()
                  if (!place?.geometry?.location) return
                  handleDropoff(
                    place.formatted_address ?? dropoffInputRef.current?.value ?? '',
                    place.geometry.location.lat(),
                    place.geometry.location.lng(),
                  )
                }}
                options={AUTOCOMPLETE_OPTIONS}
              >
                <input
                  ref={dropoffInputRef}
                  type="text"
                  placeholder="Dropoff location"
                  defaultValue={store.dropoff_address}
                  className={inputClass}
                />
              </Autocomplete>
            ) : (
              <input type="text" placeholder="Dropoff location" className={inputClass} disabled />
            )}
            {dropoffError && <p className="text-xs text-red-600 mt-1">{dropoffError}</p>}
          </div>
        </div>
      </div>

      <button
        type="button"
        disabled={!canBook}
        onClick={() => navigate('/book')}
        className="w-full mt-4 py-3.5 rounded-xl bg-ink text-white font-semibold text-[15px] hover:bg-ink/90 disabled:opacity-40 disabled:cursor-not-allowed transition"
      >
        See prices
      </button>

      <p className="mt-4 text-sm text-ink-muted">
        <Link to="/login" className="underline underline-offset-2 hover:text-ink">
          Log in
        </Link>
        {' '}to see your recent moves
      </p>
    </div>
  )
}
