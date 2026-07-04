import { useEffect, useState } from 'react'
import { useJobCreationStore } from '../../../store/jobCreationStore'
import { supabase, getFunctionErrorMessage } from '../../../lib/supabase'
import Button from '../../../components/ui/Button'
import Spinner from '../../../components/ui/Spinner'
import { format } from 'date-fns'

interface Props {
  onBack: () => void
  onConfirm: () => Promise<void>
  confirmLabel?: string
  /** Guest on /book — skip price API, prompt sign-in instead */
  guestMode?: boolean
  /** Shown when draft job insert fails (e.g. DB schema) */
  bookingError?: string
}

const TIME_LABELS = {
  morning: '8am – 12pm',
  afternoon: '12pm – 5pm',
  evening: '5pm – 8pm',
}

export default function StepReview({ onBack, onConfirm, confirmLabel, guestMode, bookingError }: Props) {
  const store = useJobCreationStore()
  const [loading, setLoading] = useState(!guestMode)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState('')
  const [promoMsg, setPromoMsg] = useState('')

  useEffect(() => {
    if (guestMode) return

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
            apply_credit: !!session,
            promo_code: store.promo_code || undefined,
          },
        })
        if (res.error) throw new Error(await getFunctionErrorMessage(res.error))
        if (res.data?.error) throw new Error(res.data.error as string)
        store.setQuote(res.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not calculate price. Check your addresses and try again.')
      }
      setLoading(false)
    }
    fetchQuote()
  }, [guestMode])

  const applyPromo = async () => {
    if (guestMode || !store.promo_code.trim()) return
    setLoading(true)
    setError('')
    setPromoMsg('')
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
          apply_credit: !!session,
          promo_code: store.promo_code.trim(),
        },
      })
      if (res.error) throw new Error(await getFunctionErrorMessage(res.error))
      if (res.data?.error) throw new Error(res.data.error as string)
      store.setQuote(res.data)
      if ((res.data.promo_discount ?? 0) > 0) {
        setPromoMsg(`Promo ${res.data.promo_code} applied — you save $${Number(res.data.promo_discount).toFixed(2)}`)
      } else {
        setPromoMsg('That promo code is invalid or expired.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not apply promo code')
    }
    setLoading(false)
  }

  const handleConfirm = async () => {
    setConfirming(true)
    await onConfirm()
    setConfirming(false)
  }

  const q = store.quote

  return (
    <div className="flex flex-col gap-5">
      <h2 className="font-display text-2xl uppercase">Your quote</h2>

      <div className="card-yard overflow-hidden">
        <div className="p-4 border-b-3 border-jet">
          <p className="font-condensed text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Pickup</p>
          <p className="text-sm font-bold text-jet">{store.pickup_address}</p>
        </div>
        <div className="p-4 border-b-3 border-jet">
          <p className="font-condensed text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Drop-off</p>
          <p className="text-sm font-bold text-jet">{store.dropoff_address}</p>
        </div>
        <div className="p-4 border-b-3 border-jet grid grid-cols-2 gap-3">
          <div>
            <p className="font-condensed text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Date</p>
            <p className="text-sm font-bold text-jet">{store.scheduled_date ? format(new Date(store.scheduled_date), 'EEE, dd MMM') : '—'}</p>
          </div>
          <div>
            <p className="font-condensed text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Time</p>
            <p className="text-sm font-bold text-jet capitalize">{store.time_window ? TIME_LABELS[store.time_window as keyof typeof TIME_LABELS] : '—'}</p>
          </div>
        </div>
        <div className="p-4">
          <p className="font-condensed text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">{store.items.length} items</p>
          {store.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm py-0.5 text-jet">
              <span>{item.name} × {item.quantity}</span>
              <span className="text-gray-500 capitalize">{item.size.replace('_', ' ')}</span>
            </div>
          ))}
        </div>
      </div>

      {guestMode && (
        <div className="card-yard p-5 bg-caution text-center">
          <p className="font-display text-xl uppercase text-jet mb-1">Almost there</p>
          <p className="text-sm text-jet font-medium">
            Sign in or create an account to get your price and book.
          </p>
        </div>
      )}

      {!guestMode && loading && (
        <div className="flex items-center justify-center gap-3 py-4">
          <Spinner /> <span className="text-sm text-gray-600">Calculating your price…</span>
        </div>
      )}

      {!guestMode && error && (
        <div className="border-3 border-red-600 bg-red-50 p-3 text-sm text-red-700 font-medium">{error}</div>
      )}

      {bookingError && (
        <div className="border-3 border-red-600 bg-red-50 p-3 text-sm text-red-700 font-medium">{bookingError}</div>
      )}

      {!guestMode && !loading && (
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Promo code"
            value={store.promo_code}
            onChange={(e) => store.setPromoCode(e.target.value.toUpperCase())}
            className="flex-1 border-3 border-jet px-4 py-3 text-sm bg-white uppercase"
          />
          <Button variant="secondary" onClick={applyPromo} disabled={!store.promo_code.trim() || loading}>Apply</Button>
        </div>
      )}

      {promoMsg && !error && (
        <p className={`text-sm font-medium ${promoMsg.includes('applied') ? 'text-green-700' : 'text-amber-700'}`}>{promoMsg}</p>
      )}

      {!guestMode && q && !loading && (
        <div className="card-yard p-4 bg-concrete">
          <div className="flex justify-between text-sm py-1 text-jet"><span>Distance</span><span className="font-bold">{q.distance_km} km</span></div>
          <div className="flex justify-between text-sm py-1 text-jet"><span>Base</span><span className="font-bold">${q.base_price.toFixed(2)}</span></div>
          <div className="flex justify-between text-sm py-1 text-jet"><span>Items</span><span className="font-bold">${q.item_cost.toFixed(2)}</span></div>
          {q.is_peak && <div className="flex justify-between text-sm py-1 text-jet"><span>Peak</span><span className="font-bold">×{q.time_multiplier}</span></div>}
          {q.credit_applied > 0 && <div className="flex justify-between text-sm py-1 text-haul"><span>Credit</span><span className="font-bold">-${q.credit_applied.toFixed(2)}</span></div>}
          {(q.promo_discount ?? 0) > 0 && <div className="flex justify-between text-sm py-1 text-haul"><span>Promo {q.promo_code}</span><span className="font-bold">-${q.promo_discount.toFixed(2)}</span></div>}
          <div className="border-t-3 border-jet mt-2 pt-3 flex justify-between items-center">
            <span className="font-condensed font-bold uppercase tracking-wider text-jet">Total</span>
            <span className="price-hero text-4xl text-haul">${q.quoted_price.toFixed(0)}</span>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="secondary" fullWidth onClick={onBack} disabled={confirming}>Back</Button>
        <Button
          fullWidth
          loading={confirming}
          disabled={guestMode ? false : !q || loading}
          onClick={handleConfirm}
        >
          {confirmLabel ?? (guestMode ? 'Sign in to book ▸' : 'Continue ▸')}
        </Button>
      </div>
    </div>
  )
}
