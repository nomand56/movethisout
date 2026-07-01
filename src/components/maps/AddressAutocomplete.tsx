import { useRef } from 'react'
import { Autocomplete } from '@react-google-maps/api'
import { clsx } from '../../lib/clsx'

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

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      )}
      <Autocomplete onLoad={onLoad} onPlaceChanged={onPlaceChanged}>
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          defaultValue={defaultValue}
          className={clsx(
            'w-full rounded-xl border px-4 py-3 text-base bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition min-h-[44px]',
            error ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
          )}
        />
      </Autocomplete>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
