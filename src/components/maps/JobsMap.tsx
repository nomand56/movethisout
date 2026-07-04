import { GoogleMap, Marker } from '@react-google-maps/api'
import { useMemo } from 'react'
import { LAUNCH_MARKET } from '../../lib/serviceArea'
import type { Job } from '../../types'

interface Props {
  jobs: Job[]
  selectedId?: string | null
  onSelect?: (job: Job | null) => void
  className?: string
}

export default function JobsMap({ jobs, selectedId, onSelect, className = '' }: Props) {
  const mappable = jobs.filter((j) => j.pickup_lat != null && j.pickup_lng != null)

  const center = useMemo(() => {
    if (mappable.length === 0) return LAUNCH_MARKET.mapCenter
    const lat = mappable.reduce((s, j) => s + j.pickup_lat!, 0) / mappable.length
    const lng = mappable.reduce((s, j) => s + j.pickup_lng!, 0) / mappable.length
    return { lat, lng }
  }, [mappable])

  return (
    <div className={className}>
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%', borderRadius: '16px' }}
        center={center}
        zoom={mappable.length > 1 ? 11 : 12}
        options={{
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: 'greedy',
          styles: [{ featureType: 'poi', stylers: [{ visibility: 'off' }] }],
        }}
      >
        {mappable.map((job) => (
          <Marker
            key={job.id}
            position={{ lat: job.pickup_lat!, lng: job.pickup_lng! }}
            onClick={() => onSelect?.(job)}
            label={{
              text: `$${job.mover_payout?.toFixed(0) ?? '?'}`,
              color: selectedId === job.id ? '#FFFFFF' : '#1A1A1A',
              fontWeight: '700',
              fontSize: '11px',
            }}
            opacity={selectedId && selectedId !== job.id ? 0.6 : 1}
          />
        ))}
      </GoogleMap>
    </div>
  )
}
