import { GoogleMap, Marker, DirectionsRenderer } from '@react-google-maps/api'
import { useEffect, useMemo, useState } from 'react'

const KAMLOOPS = { lat: 50.6745, lng: -120.3273 }

interface Pin {
  lat: number
  lng: number
  label: string
}

interface Props {
  pickup?: Pin | null
  dropoff?: Pin | null
  className?: string
  height?: string
}

export default function BookingMap({ pickup, dropoff, className = '', height = '100%' }: Props) {
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null)

  const center = useMemo(() => {
    if (pickup && dropoff) {
      return {
        lat: (pickup.lat + dropoff.lat) / 2,
        lng: (pickup.lng + dropoff.lng) / 2,
      }
    }
    if (pickup) return { lat: pickup.lat, lng: pickup.lng }
    if (dropoff) return { lat: dropoff.lat, lng: dropoff.lng }
    return KAMLOOPS
  }, [pickup, dropoff])

  useEffect(() => {
    if (!pickup || !dropoff || !window.google?.maps) {
      setDirections(null)
      return
    }
    const service = new google.maps.DirectionsService()
    service.route(
      {
        origin: { lat: pickup.lat, lng: pickup.lng },
        destination: { lat: dropoff.lat, lng: dropoff.lng },
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === 'OK' && result) setDirections(result)
        else setDirections(null)
      },
    )
  }, [pickup, dropoff])

  return (
    <div className={className} style={{ height }}>
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={center}
        zoom={pickup && dropoff ? 12 : 11}
        options={{
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: 'greedy',
          styles: [
            { featureType: 'poi', stylers: [{ visibility: 'off' }] },
            { featureType: 'transit', stylers: [{ visibility: 'off' }] },
          ],
        }}
      >
        {pickup && (
          <Marker
            position={{ lat: pickup.lat, lng: pickup.lng }}
            label={{ text: 'A', color: 'white', fontWeight: '700' }}
          />
        )}
        {dropoff && (
          <Marker
            position={{ lat: dropoff.lat, lng: dropoff.lng }}
            label={{ text: 'B', color: 'white', fontWeight: '700' }}
          />
        )}
        {directions && <DirectionsRenderer directions={directions} options={{ suppressMarkers: true }} />}
      </GoogleMap>
    </div>
  )
}
