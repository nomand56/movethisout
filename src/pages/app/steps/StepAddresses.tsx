import { useJobCreationStore } from '../../../store/jobCreationStore'
import AddressAutocomplete from '../../../components/maps/AddressAutocomplete'
import Button from '../../../components/ui/Button'
import { useState } from 'react'

interface Props { onNext: () => void }

export default function StepAddresses({ onNext }: Props) {
  const store = useJobCreationStore()
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const e: Record<string, string> = {}
    if (!store.pickup_address) e.pickup = 'Select a pickup address'
    if (!store.dropoff_address) e.dropoff = 'Select a drop-off address'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  return (
    <div className="flex flex-col gap-6">
      <AddressAutocomplete
        label="Pickup address"
        placeholder="123 Main St, Sydney NSW"
        error={errors.pickup}
        defaultValue={store.pickup_address}
        onPlaceSelected={({ address, lat, lng }) =>
          store.setAddresses({ ...store, pickup_address: address, pickup_lat: lat, pickup_lng: lng })
        }
      />
      <AddressAutocomplete
        label="Drop-off address"
        placeholder="456 Park Ave, Melbourne VIC"
        error={errors.dropoff}
        defaultValue={store.dropoff_address}
        onPlaceSelected={({ address, lat, lng }) =>
          store.setAddresses({ ...store, dropoff_address: address, dropoff_lat: lat, dropoff_lng: lng })
        }
      />
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Notes for mover (optional)</label>
        <textarea
          className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-4 py-3 text-base bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
          rows={3}
          placeholder="Gate code, parking info, fragile items…"
          value={store.notes}
          onChange={(e) => store.setNotes(e.target.value)}
        />
      </div>
      <Button fullWidth onClick={() => validate() && onNext()}>Continue</Button>
    </div>
  )
}
