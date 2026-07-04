import { GoogleMap, Marker, Polyline } from '@react-google-maps/api'
import { useGoogleMapsLoader } from '../../hooks/useGoogleMapsLoader'
import Spinner from '../ui/Spinner'

interface Props {
  trail: { lat: number; lng: number }[]
  pickupLat?: number
  pickupLng?: number
  dropoffLat?: number
  dropoffLng?: number
}

export default function GpsTrailMap({ trail, pickupLat, pickupLng, dropoffLat, dropoffLng }: Props) {
  const { isLoaded } = useGoogleMapsLoader()

  if (!isLoaded) {
    return <div className="flex items-center justify-center h-60 card-yard"><Spinner /></div>
  }

  if (!trail.length) {
    return <div className="card-yard p-4 text-sm text-gray-500">No GPS trail recorded for this job.</div>
  }

  const center = trail[trail.length - 1]

  return (
    <GoogleMap
      mapContainerStyle={{ width: '100%', height: '360px' }}
      center={center}
      zoom={13}
      options={{ disableDefaultUI: true, zoomControl: true }}
    >
      <Polyline path={trail} options={{ strokeColor: '#F25800', strokeWeight: 4, strokeOpacity: 0.8 }} />
      {pickupLat != null && pickupLng != null && <Marker position={{ lat: pickupLat, lng: pickupLng }} label="P" />}
      {dropoffLat != null && dropoffLng != null && <Marker position={{ lat: dropoffLat, lng: dropoffLng }} label="D" />}
      <Marker position={trail[0]} label="Start" />
      <Marker position={trail[trail.length - 1]} label="End" />
    </GoogleMap>
  )
}
