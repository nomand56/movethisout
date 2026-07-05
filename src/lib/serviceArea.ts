/** Canada-wide service */
export const LAUNCH_MARKET = {
  primary: 'Canada',
  hq: 'Kamloops, BC',
  mapCenter: { lat: 56.1304, lng: -106.3468 },
  tagline: 'Moves across Canada — price upfront',
}

export const FEATURED_CITIES = [
  'Toronto, ON',
  'Vancouver, BC',
  'Montreal, QC',
  'Calgary, AB',
  'Kamloops, BC',
  'Ottawa, ON',
] as const

export const SERVICE_AREA_LABEL = 'Canada'

export const BRAND_NAME = 'MoveThisOut'

export const BRAND_FULL = BRAND_NAME

export const PROMO_LAUNCH = 'KAMLOOPS20'

/** Approximate geographic bounds for Canada */
const CANADA_BOUNDS = {
  minLat: 41.68,
  maxLat: 83.11,
  minLng: -141.0,
  maxLng: -52.62,
}

export function isInServiceArea(lat: number, lng: number): boolean {
  return (
    lat >= CANADA_BOUNDS.minLat &&
    lat <= CANADA_BOUNDS.maxLat &&
    lng >= CANADA_BOUNDS.minLng &&
    lng <= CANADA_BOUNDS.maxLng
  )
}

export function serviceAreaError(): string {
  return 'Please choose an address in Canada.'
}

/** Restrict Google Places suggestions to Canadian addresses */
export const CANADA_AUTOCOMPLETE_OPTIONS: google.maps.places.AutocompleteOptions = {
  fields: ['formatted_address', 'geometry'],
  componentRestrictions: { country: 'ca' },
}
