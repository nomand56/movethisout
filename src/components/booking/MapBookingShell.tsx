import { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import BookingMap from '../maps/BookingMap'
import { BRAND_FULL } from '../../lib/serviceArea'

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
  showBrand?: boolean
  backHref?: string
}

export default function MapBookingShell({
  step,
  stepLabels,
  pickup,
  dropoff,
  children,
  showBrand = true,
  backHref,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-surface-muted">
      <div className="absolute inset-0 bottom-[48%] sm:bottom-[44%]">
        <BookingMap pickup={pickup} dropoff={dropoff} className="w-full h-full" />
      </div>

      {showBrand && (
        <div className="absolute top-0 left-0 right-0 z-10 px-4 pt-3 pb-2 bg-gradient-to-b from-white/95 to-transparent">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <div>
              {backHref ? (
                <Link to={backHref} className="text-lg font-bold text-ink">{BRAND_FULL}</Link>
              ) : (
                <p className="text-lg font-bold text-ink">{BRAND_FULL}</p>
              )}
              <p className="text-xs text-ink-muted">Upfront price · live tracking</p>
            </div>
            <div className="flex gap-1">
              {stepLabels.map((label, i) => (
                <div
                  key={label}
                  className={`h-1.5 rounded-full transition-all ${
                    i <= step ? 'w-6 bg-accent' : 'w-3 bg-gray-300'
                  }`}
                  title={label}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 z-20 max-w-lg mx-auto w-full max-h-[52%] sm:max-h-[48%]">
        <div className="bg-white rounded-t-3xl shadow-sheet border-t border-gray-100 flex flex-col max-h-full">
          <div className="sheet-handle shrink-0 mt-3" />
          <div className="overflow-y-auto px-5 pb-8 pt-1 flex-1">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
