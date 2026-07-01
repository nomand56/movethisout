import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useJsApiLoader } from '@react-google-maps/api'
import { useTranslation } from 'react-i18next'
import { useJobCreationStore } from '../../store/jobCreationStore'
import AddressAutocomplete from '../../components/maps/AddressAutocomplete'
import AddressPinMap from '../../components/maps/AddressPinMap'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'

const LIBRARIES: ('places')[] = ['places']

export default function LandingPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const store = useJobCreationStore()
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(
    store.pickup_address ? { lat: store.pickup_lat, lng: store.pickup_lng } : null
  )

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY,
    libraries: LIBRARIES,
  })

  const handleContinue = () => {
    navigate('/book')
  }

  if (!isLoaded) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-lg mx-auto px-4 py-12 flex flex-col gap-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">{t('landing.hero_title')}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-lg">{t('landing.hero_subtitle')}</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-6 flex flex-col gap-4">
          <AddressAutocomplete
            label={t('landing.pickup_label')}
            placeholder={t('landing.pickup_placeholder')}
            defaultValue={store.pickup_address}
            onPlaceSelected={({ address, lat, lng }) => {
              store.setAddresses({ ...store, pickup_address: address, pickup_lat: lat, pickup_lng: lng })
              setPin({ lat, lng })
            }}
          />

          {pin && <AddressPinMap lat={pin.lat} lng={pin.lng} />}

          {pin && (
            <Button fullWidth onClick={handleContinue}>{t('landing.continue')}</Button>
          )}
        </div>
      </div>
    </div>
  )
}
