import { useRef, useEffect, useState } from 'react'
import { Autocomplete } from '@react-google-maps/api'
import { clsx } from '../../lib/clsx'

const AUTOCOMPLETE_OPTIONS: google.maps.places.AutocompleteOptions = {
  fields: ['formatted_address', 'geometry'],
}

interface Props {
  label?: string
  placeholder?: string
  error?: string
  onPlaceSelected: (place: { address: string; lat: number; lng: number }) => void
  defaultValue?: string
}

export default function AddressAutocomplete({ label, placeholder, error, onPlaceSelected, defaultValue }: Props) {
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [ready, setReady] = useState(false)

  // Avoid React Strict Mode double-mount issues with the Places Autocomplete widget.
  useEffect(() => {
    setReady(true)
    return () => {
      autocompleteRef.current = null
      setReady(false)
    }
  }, [])

  const onLoad = (autocomplete: google.maps.places.Autocomplete) => {
    autocompleteRef.current = autocomplete
  }

  const onPlaceChanged = () => {
    const place = autocompleteRef.current?.getPlace()
    if (!place || !place.geometry?.location) return
    onPlaceSelected({
      address: place.formatted_address ?? inputRef.current?.value ?? '',
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng(),
    })
  }

  const inputClass = clsx(
    'w-full rounded-xl border px-4 py-3 text-[15px] bg-white text-ink placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent min-h-[48px]',
    error ? 'border-red-400' : 'border-gray-200',
  )

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-gray-700">{label}</label>
      )}
      {ready ? (
        <Autocomplete onLoad={onLoad} onPlaceChanged={onPlaceChanged} options={AUTOCOMPLETE_OPTIONS}>
          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            defaultValue={defaultValue}
            className={inputClass}
          />
        </Autocomplete>
      ) : (
        <input
          type="text"
          placeholder={placeholder}
          defaultValue={defaultValue}
          className={inputClass}
          readOnly
        />
      )}
      {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
    </div>
  )
}