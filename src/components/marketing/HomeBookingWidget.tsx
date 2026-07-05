import { useRef, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Autocomplete } from '@react-google-maps/api'
import { useJobCreationStore } from '../../store/jobCreationStore'
import { isInServiceArea, serviceAreaError, CANADA_AUTOCOMPLETE_OPTIONS } from '../../lib/serviceArea'
import { useTheme } from '../theme/ThemeProvider'
import { resolveBarColor } from '../../lib/theme'
import { LocationChip, ScheduleChip } from '../layout/PublicHeader'
import { Link } from 'react-router-dom'
import { MapPin, Navigation } from 'lucide-react'

const AUTOCOMPLETE_OPTIONS = CANADA_AUTOCOMPLETE_OPTIONS

export default function HomeBookingWidget() {
  const navigate = useNavigate()
  const store = useJobCreationStore()
  const { theme } = useTheme()
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
    'w-full bg-surface-muted border border-transparent rounded-xl px-4 py-3.5 text-[15px] text-ink placeholder:text-ink-muted/70 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/20 focus:bg-white min-h-[52px] transition-all duration-200'

  return (
    <div className="max-w-xl">
      <LocationChip />
      <h1 className="text-4xl sm:text-5xl font-bold text-ink tracking-tight leading-[1.1] mb-5 break-words">
        Move anything with{' '}
        <span className="text-accent inline-block">{theme.brand_name || 'MoveThisOut'}</span>
      </h1>
      <ScheduleChip />

      <div className="booking-route-stack relative flex flex-col gap-2 mb-2">
        <div className="booking-route-line" aria-hidden />

        <div className="relative z-10 flex items-center gap-3">
          <div className="booking-route-marker booking-route-marker--pickup" aria-hidden>
            <Navigation size={15} strokeWidth={2.5} className="text-ink" />
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

        <div className="relative z-10 flex items-center gap-3">
          <div className="booking-route-marker booking-route-marker--dropoff" aria-hidden>
            <MapPin size={16} strokeWidth={2.5} className="text-white" fill="currentColor" />
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
        style={{ backgroundColor: resolveBarColor(theme.header_color) }}
        className="w-full mt-4 py-3.5 rounded-xl text-white font-semibold text-[15px] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition"
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
