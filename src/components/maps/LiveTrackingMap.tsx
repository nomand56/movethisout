import { GoogleMap, Marker, Polyline, useJsApiLoader } from '@react-google-maps/api'
import Spinner from '../ui/Spinner'

interface Props {
  moverLat: number
  moverLng: number
  pickupLat: number
  pickupLng: number
  dropoffLat: number
  dropoffLng: number
  trail?: { lat: number; lng: number }[]
}

const mapContainerStyle = { width: '100%', height: '360px', borderRadius: '12px' }

export default function LiveTrackingMap({ moverLat, moverLng, pickupLat, pickupLng, dropoffLat, dropoffLng, trail }: Props) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY,
  })

  if (!isLoaded) return (
    <div className="flex items-center justify-center h-60 bg-gray-100 dark:bg-gray-800 rounded-xl">
      <Spinner />
    </div>
  )

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={{ lat: moverLat, lng: moverLng }}
      zoom={14}
      options={{ disableDefaultUI: true, zoomControl: true }}
    >
      <Marker
        position={{ lat: moverLat, lng: moverLng }}
        label={{ text: '🚛', fontSize: '24px' }}
        title="Mover"
      />
      <Marker
        position={{ lat: pickupLat, lng: pickupLng }}
        label="P"
        title="Pickup"
      />
      <Marker
        position={{ lat: dropoffLat, lng: dropoffLng }}
        label="D"
        title="Drop-off"
      />
      {trail && trail.length > 1 && (
        <Polyline
          path={trail}
          options={{ strokeColor: '#f97316', strokeWeight: 3, strokeOpacity: 0.7 }}
        />
      )}
    </GoogleMap>
  )
}
