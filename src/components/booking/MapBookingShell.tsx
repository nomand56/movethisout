import { ReactNode } from 'react'
import BookingMap from '../maps/BookingMap'

interface Pin {
  lat: number
  lng: number
  label: string
}

interface Props {
  step: number
  stepLabels: string[]
  pickup: Pin | null
  dropoff: Pin | null
  children: ReactNode
  /** Show step progress dots under the layout header */
  showProgress?: boolean
}

/**
 * Map + bottom sheet that lives INSIDE the layout main area.
 * Map + bottom sheet inside the layout main (main sits above bottom nav in flex layout).
 */
export default function MapBookingShell({
  step,
  stepLabels,
  pickup,
  dropoff,
  children,
  showProgress = true,
}: Props) {
  return (
    <div className="absolute inset-0 flex flex-col bg-surface-muted">
      {/* Map */}
      <div className="relative flex-1 min-h-0">
        <BookingMap pickup={pickup} dropoff={dropoff} className="absolute inset-0 w-full h-full" />
        {showProgress && (
          <div className="absolute top-2 right-3 z-10 flex gap-1 bg-white/90 rounded-full px-2 py-1 shadow-sm">
            {stepLabels.map((label, i) => (
              <div
                key={label}
                className={`h-1.5 rounded-full transition-all ${i <= step ? 'w-5 bg-accent' : 'w-2 bg-gray-300'}`}
                title={label}
              />
            ))}
          </div>
        )}
      </div>

      {/* Sheet — scrollable; pb clears last buttons inside scroll area */}
      <div className="shrink-0 flex flex-col max-h-[48%] bg-white rounded-t-3xl shadow-sheet border-t border-gray-100 z-20">
        <div className="sheet-handle shrink-0 mt-3" />
        <div className="overflow-y-auto overscroll-contain px-4 sm:px-5 pt-1 pb-6 min-h-0">
          {children}
        </div>
      </div>
    </div>
  )
}
