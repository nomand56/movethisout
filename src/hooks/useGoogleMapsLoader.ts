import { useJsApiLoader } from '@react-google-maps/api'

const LIBRARIES: ('places')[] = ['places']

/** Loads the Maps JS API + Places library (shared config for address autocomplete). */
export function useGoogleMapsLoader() {
  return useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY as string,
    libraries: LIBRARIES,
  })
}
