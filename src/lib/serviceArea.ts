/** Launch market — Kamloops primary, nearby cities supported */
export const LAUNCH_MARKET = {
  primary: 'Kamloops',
  province: 'BC',
  nearby: ['Merritt', 'Salmon Arm'] as const,
  mapCenter: { lat: 50.6745, lng: -120.3273 },
  tagline: 'Local moves in Kamloops & nearby',
}

export const SERVICE_AREA_LABEL = 'Kamloops · Merritt · Salmon Arm'

export const BRAND_NAME = 'MoveThisOut'

export const BRAND_FULL = `${BRAND_NAME} · ${LAUNCH_MARKET.primary}`

export const PROMO_LAUNCH = 'KAMLOOPS20'

/** Rough bounds covering Kamloops, Merritt, Salmon Arm + nearby */
const SERVICE_BOUNDS = {
  minLat: 49.85,
  maxLat: 51.25,
  minLng: -121.35,
  maxLng: -118.75,
}

export function isInServiceArea(lat: number, lng: number): boolean {
  return (
    lat >= SERVICE_BOUNDS.minLat &&
    lat <= SERVICE_BOUNDS.maxLat &&
    lng >= SERVICE_BOUNDS.minLng &&
    lng <= SERVICE_BOUNDS.maxLng
  )
}

export function serviceAreaError(): string {
  return 'We only serve Kamloops, Merritt, and Salmon Arm right now. Pick addresses in that area.'
}
