import { useEffect, useState } from 'react'
import { useJobCreationStore } from '../../../store/jobCreationStore'
import { supabase } from '../../../lib/supabase'
import Button from '../../../components/ui/Button'
import Spinner from '../../../components/ui/Spinner'
import { format } from 'date-fns'

interface Props { onBack: () => void; onConfirm: () => Promise<void> }

const TIME_LABELS = { morning: '8am – 12pm', afternoon: '12pm – 5pm', evening: '5pm – 8pm' }

export default function StepReview({ onBack, onConfirm }: Props) {
  const store = useJobCreationStore()
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchQuote = async () => {
      setLoading(true)
      setError('')
      const { data: { session } } = await supabase.auth.getSession()
      try {
        const res = await supabase.functions.invoke('calculate-price', {
          body: {
            pickup_lat: store.pickup_lat,
            pickup_lng: store.pickup_lng,
            dropoff_lat: store.dropoff_lat,
            dropoff_lng: store.dropoff_lng,
            items: store.items.map((i) => ({ size: i.size, quantity: i.quantity })),
            scheduled_date: store.scheduled_date,
            time_window: store.time_window,
          },
        })
        if (res.error) throw res.error
        store.setQuote(res.data)
      } catch {
        setError('Could not calculate price. Check your addresses and try again.')
      }
      setLoading(false)
    }
    fetchQuote()
  }, [])

  const handleConfirm = async () => {
    setConfirming(true)
    await onConfirm()
    setConfirming(false)
  }

  const q = store.quote

  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-semibold text-gray-900 dark:text-gray-100">Review your booking</h2>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <p className="text-xs text-gray-500 mb-1">Pickup</p>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{store.pickup_address}</p>
        </div>
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <p className="text-xs text-gray-500 mb-1">Drop-off</p>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{store.dropoff_address}</p>
        </div>
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 grid grid-cols-2">
          <div>
            <p className="text-xs text-gray-500 mb-1">Date</p>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{store.scheduled_date ? format(new Date(store.scheduled_date), 'EEE, dd MMM yyyy') : '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Time</p>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">{store.time_window ? TIME_LABELS[store.time_window as keyof typeof TIME_LABELS] : '—'}</p>
          </div>
        </div>
        <div className="p-4">
          <p className="text-xs text-gray-500 mb-1">{store.items.length} item(s)</p>
          {store.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
              <span>{item.name} × {item.quantity}</span>
              <span className="text-xs text-gray-400 capitalize">{item.size.replace('_', ' ')}</span>
            </div>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-3 py-4">
          <Spinner /> <span className="text-sm text-gray-500">Calculating price…</span>
        </div>
      )}

      {error && <p className="text-sm text-red-600 text-center">{error}</p>}

      {q && !loading && (
        <div className="bg-brand-50 dark:bg-brand-900/20 rounded-2xl p-4 flex flex-col gap-2">
          <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
            <span>Distance</span><span>{q.distance_km} km</span>
          </div>
          <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
            <span>Base price</span><span>${q.base_price.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
            <span>Items</span><span>${q.item_cost.toFixed(2)}</span>
          </div>
          {q.is_peak && (
            <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
              <span>Peak hour surcharge</span><span>×{q.time_multiplier}</span>
            </div>
          )}
          <div className="border-t border-brand-200 dark:border-brand-800 pt-2 flex justify-between font-bold text-gray-900 dark:text-gray-100">
            <span>Total</span><span>${q.quoted_price.toFixed(2)}</span>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="secondary" fullWidth onClick={onBack} disabled={confirming}>Back</Button>
        <Button fullWidth loading={confirming} disabled={!q || loading} onClick={handleConfirm}>
          Confirm Booking
        </Button>
      </div>

      <p className="text-xs text-gray-400 text-center">Payment will be collected at a later step. No charge now.</p>
    </div>
  )
}
