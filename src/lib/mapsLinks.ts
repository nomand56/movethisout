/** Open turn-by-turn navigation in Google Maps (mobile opens app). */
export function googleMapsNavigate(lat: number, lng: number, address?: string) {
  const dest = address
    ? encodeURIComponent(address)
    : `${lat},${lng}`
  return `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving`
}

export function googleMapsNavigateToAddress(address: string) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}&travelmode=driving`
}
