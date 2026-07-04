import { GoogleMap, Marker, DirectionsRenderer } from '@react-google-maps/api'
import { useEffect, useMemo, useState } from 'react'
import { useGoogleMapsLoader } from '../../hooks/useGoogleMapsLoader'
import Spinner from '../ui/Spinner'

interface Props {
  pickupLat: number
  pickupLng: number
  dropoffLat: number
  dropoffLng: number
  /** Where the mover should drive next */
  destination: 'pickup' | 'dropoff'
  moverPosition?: { lat: number; lng: number } | null
  className?: string
  onEtaChange?: (eta: string | null, distance: string | null) => void
}

export default function MoverDrivingMap({
  pickupLat,
  pickupLng,
  dropoffLat,
  dropoffLng,
  destination,
  moverPosition,
  className = '',
  onEtaChange,
}: Props) {
  const { isLoaded } = useGoogleMapsLoader()
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null)

  const dest = destination === 'pickup'
    ? { lat: pickupLat, lng: pickupLng }
    : { lat: dropoffLat, lng: dropoffLng }

  const origin = moverPosition ?? { lat: pickupLat, lng: pickupLng }

  const center = useMemo(() => {
    if (moverPosition) {
      return {
        lat: (moverPosition.lat + dest.lat) / 2,
        lng: (moverPosition.lng + dest.lng) / 2,
      }
    }
    return {
      lat: (pickupLat + dropoffLat) / 2,
      lng: (pickupLng + dropoffLng) / 2,
    }
  }, [moverPosition, dest, pickupLat, pickupLng, dropoffLat, dropoffLng])

  useEffect(() => {
    if (!isLoaded || !window.google?.maps) return
    const service = new google.maps.DirectionsService()
    service.route(
      {
        origin,
        destination: dest,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === 'OK' && result) {
          setDirections(result)
          const leg = result.routes[0]?.legs[0]
          onEtaChange?.(leg?.duration?.text ?? null, leg?.distance?.text ?? null)
        } else {
          setDirections(null)
          onEtaChange?.(null, null)
        }
      },
    )
  }, [isLoaded, origin.lat, origin.lng, dest.lat, dest.lng])

  if (!isLoaded) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className={className}>
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={center}
        zoom={moverPosition ? 13 : 12}
        options={{
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: 'greedy',
          styles: [
            { featureType: 'poi', stylers: [{ visibility: 'off' }] },
          ],
        }}
      >
        <Marker
          position={{ lat: pickupLat, lng: pickupLng }}
          label={{ text: 'A', color: '#fff', fontWeight: '700' }}
          title="Pickup"
        />
        <Marker
          position={{ lat: dropoffLat, lng: dropoffLng }}
          label={{ text: 'B', color: '#fff', fontWeight: '700' }}
          title="Drop-off"
        />
        {moverPosition && (
          <Marker
            position={moverPosition}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: '#E85D04',
              fillOpacity: 1,
              strokeColor: '#fff',
              strokeWeight: 3,
            }}
            title="You"
          />
        )}
        {directions && (
          <DirectionsRenderer
            directions={directions}
            options={{ suppressMarkers: true, polylineOptions: { strokeColor: '#E85D04', strokeWeight: 5 } }}
          />
        )}
      </GoogleMap>
    </div>
  )
}
