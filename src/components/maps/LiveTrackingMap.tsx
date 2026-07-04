import { useEffect, useState } from 'react'
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

export default function LiveTrackingMap({ moverLat, moverLng, pickupLat, pickupLng, dropoffLat, dropoffLng, trail }: Props) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY,
  })
  const [eta, setEta] = useState<string | null>(null)
  const [routePath, setRoutePath] = useState<google.maps.LatLng[]>([])

  useEffect(() => {
    if (!isLoaded || !window.google) return
    const service = new google.maps.DirectionsService()
    service.route(
      {
        origin: { lat: moverLat, lng: moverLng },
        destination: { lat: dropoffLat, lng: dropoffLng },
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === 'OK' && result?.routes[0]) {
          setEta(result.routes[0].legs[0]?.duration?.text ?? null)
          setRoutePath(result.routes[0].overview_path)
        }
      },
    )
  }, [isLoaded, moverLat, moverLng, dropoffLat, dropoffLng])

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-60 card-yard">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {eta && (
        <div className="card-yard px-4 py-2 bg-caution text-center">
          <p className="font-condensed font-bold uppercase text-sm text-jet">ETA to drop-off: <span className="text-haul">{eta}</span></p>
        </div>
      )}
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '360px' }}
        center={{ lat: moverLat, lng: moverLng }}
        zoom={14}
        options={{ disableDefaultUI: true, zoomControl: true }}
      >
        <Marker position={{ lat: moverLat, lng: moverLng }} label={{ text: '🚛', fontSize: '24px' }} title="Mover" />
        <Marker position={{ lat: pickupLat, lng: pickupLng }} label="P" title="Pickup" />
        <Marker position={{ lat: dropoffLat, lng: dropoffLng }} label="D" title="Drop-off" />
        {routePath.length > 1 && (
          <Polyline path={routePath} options={{ strokeColor: '#141414', strokeWeight: 4, strokeOpacity: 0.6 }} />
        )}
        {trail && trail.length > 1 && (
          <Polyline path={trail} options={{ strokeColor: '#F25800', strokeWeight: 3, strokeOpacity: 0.7 }} />
        )}
      </GoogleMap>
    </div>
  )
}
