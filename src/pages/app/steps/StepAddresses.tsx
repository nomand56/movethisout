import { useQuery } from '@tanstack/react-query'
import { useJobCreationStore } from '../../../store/jobCreationStore'
import { useAuthStore } from '../../../store/authStore'
import { supabase, isSchemaMissingError } from '../../../lib/supabase'
import { isInServiceArea, serviceAreaError } from '../../../lib/serviceArea'
import AddressAutocomplete from '../../../components/maps/AddressAutocomplete'
import Button from '../../../components/ui/Button'
import { useState } from 'react'
import type { SavedAddress } from '../../../types'

interface Props { onNext: () => void }

export default function StepAddresses({ onNext }: Props) {
  const store = useJobCreationStore()
  const { profile } = useAuthStore()
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { data: saved } = useQuery({
    queryKey: ['saved-addresses', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('saved_addresses').select('*').eq('user_id', profile!.id).order('created_at', { ascending: false })
      if (error && isSchemaMissingError(error)) return []
      if (error) throw error
      return (data ?? []) as SavedAddress[]
    },
    enabled: !!profile,
    retry: false,
  })

  const validate = () => {
    const e: Record<string, string> = {}
    if (!store.pickup_address) e.pickup = 'Enter a pickup address'
    if (!store.dropoff_address) e.dropoff = 'Enter a drop-off address'
    if (store.pickup_lat != null && store.pickup_lng != null && !isInServiceArea(store.pickup_lat, store.pickup_lng)) {
      e.pickup = serviceAreaError()
    }
    if (store.dropoff_lat != null && store.dropoff_lng != null && !isInServiceArea(store.dropoff_lat, store.dropoff_lng)) {
      e.dropoff = serviceAreaError()
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const applySaved = (addr: SavedAddress, field: 'pickup' | 'dropoff') => {
    if (field === 'pickup') {
      store.setAddresses({
        ...store,
        pickup_address: addr.address,
        pickup_lat: addr.lat,
        pickup_lng: addr.lng,
      })
    } else {
      store.setAddresses({
        ...store,
        dropoff_address: addr.address,
        dropoff_lat: addr.lat,
        dropoff_lng: addr.lng,
      })
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-bold text-ink">Your route</h2>

      {saved && saved.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="font-condensed font-bold uppercase tracking-wider text-xs text-gray-500">Saved places</p>
          <div className="flex gap-2 flex-wrap">
            {saved.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => applySaved(a, 'pickup')}
                className="border-3 border-jet px-3 py-1 text-xs font-bold bg-concrete hover:bg-caution"
              >
                {a.label} → pickup
              </button>
            ))}
          </div>
        </div>
      )}

      <AddressAutocomplete
        label="Pickup"
        placeholder="350 Lansdowne St, Kamloops"
        error={errors.pickup}
        defaultValue={store.pickup_address}
        onPlaceSelected={({ address, lat, lng }) =>
          store.setAddresses({ ...store, pickup_address: address, pickup_lat: lat, pickup_lng: lng })
        }
      />
      <AddressAutocomplete
        label="Drop-off"
        placeholder="450 Lansdowne St, Kamloops"
        error={errors.dropoff}
        defaultValue={store.dropoff_address}
        onPlaceSelected={({ address, lat, lng }) =>
          store.setAddresses({ ...store, dropoff_address: address, dropoff_lat: lat, dropoff_lng: lng })
        }
      />

      {saved && saved.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {saved.map((a) => (
            <button
              key={`d-${a.id}`}
              type="button"
              onClick={() => applySaved(a, 'dropoff')}
              className="border-3 border-jet px-3 py-1 text-xs font-bold bg-white hover:bg-caution"
            >
              {a.label} → drop-off
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label className="text-sm font-condensed font-bold uppercase tracking-wider text-jet">Notes (optional)</label>
        <textarea
          className="w-full border-3 border-jet px-4 py-3 text-base bg-white text-jet placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-haul resize-none"
          rows={3}
          placeholder="Stairs, parking, fragile items…"
          value={store.notes}
          onChange={(e) => store.setNotes(e.target.value)}
        />
      </div>
      <Button fullWidth onClick={() => validate() && onNext()}>Continue</Button>
    </div>
  )
}
