import Button from '../../../components/ui/Button'
import { useJobCreationStore } from '../../../store/jobCreationStore'
import { format } from 'date-fns'

const TIME_LABELS = {
  morning: '8am – 12pm',
  afternoon: '12pm – 5pm',
  evening: '5pm – 8pm',
}

interface Props {
  onBack: () => void
  onConfirm: () => Promise<void>
  loading?: boolean
  error?: string
}

export default function StepPayment({ onBack, onConfirm, loading, error }: Props) {
  const store = useJobCreationStore()
  const q = store.quote

  return (
    <div className="flex flex-col gap-5">
      <h2 className="font-display text-2xl uppercase">Confirm &amp; book</h2>
      <p className="text-sm text-gray-600">
        Review your price below. When you confirm, your job goes live for movers to claim.
      </p>

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
            <p className="text-sm font-bold text-jet">
              {store.scheduled_date ? format(new Date(store.scheduled_date), 'EEE, dd MMM') : '—'}
            </p>
          </div>
          <div>
            <p className="font-condensed text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Time</p>
            <p className="text-sm font-bold text-jet capitalize">
              {store.time_window ? TIME_LABELS[store.time_window as keyof typeof TIME_LABELS] : '—'}
            </p>
          </div>
        </div>
        {q && (
          <div className="p-4 bg-caution">
            <div className="flex justify-between items-center">
              <span className="font-condensed font-bold uppercase tracking-wider text-jet">Your total</span>
              <span className="price-hero text-5xl text-haul">${q.quoted_price.toFixed(0)}</span>
            </div>
            {(q.promo_discount ?? 0) > 0 && (
              <p className="text-xs text-jet mt-1 font-medium">Includes promo {q.promo_code}</p>
            )}
            {q.credit_applied > 0 && (
              <p className="text-xs text-jet mt-1 font-medium">Includes ${q.credit_applied.toFixed(2)} account credit</p>
            )}
          </div>
        )}
      </div>

      <div className="card-yard p-4 bg-concrete text-sm text-jet">
        <p className="font-bold mb-1">What happens next?</p>
        <ul className="list-disc list-inside text-gray-600 space-y-1">
          <li>Your job is published to online movers</li>
          <li>You get notified when someone claims it</li>
          <li>Track the move live in your orders</li>
        </ul>
      </div>

      {error && (
        <div className="border-3 border-red-600 bg-red-50 p-3 text-sm text-red-700 font-medium">{error}</div>
      )}

      <div className="flex gap-3">
        <Button variant="secondary" fullWidth onClick={onBack} disabled={loading}>Back</Button>
        <Button fullWidth loading={loading} onClick={onConfirm}>Confirm &amp; book ▸</Button>
      </div>
    </div>
  )
}
