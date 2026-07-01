import { GoogleMap, Marker } from '@react-google-maps/api'

interface Props {
  lat: number
  lng: number
  zoom?: number
}

const mapContainerStyle = { width: '100%', height: '240px', borderRadius: '12px' }

// Relies on the parent (LandingPage / BookingWizardShell) already having loaded
// the Maps JS API via its own useJsApiLoader — calling useJsApiLoader again here
// with different options throws ("Loader must not be called again with different
// options"), since @react-google-maps/api's script loader is a single global instance.
export default function AddressPinMap({ lat, lng, zoom = 15 }: Props) {
  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={{ lat, lng }}
      zoom={zoom}
      options={{ disableDefaultUI: true, zoomControl: true }}
    >
      <Marker position={{ lat, lng }} />
    </GoogleMap>
  )
}
