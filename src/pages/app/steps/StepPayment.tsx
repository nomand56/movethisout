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
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-bold text-ink">Confirm &amp; book</h2>
      <p className="text-sm text-ink-muted">
        Your job goes live for local movers when you confirm.
      </p>

      <div className="card overflow-hidden divide-y divide-gray-100">
        <div className="p-3">
          <p className="text-xs text-ink-muted mb-0.5">Pickup</p>
          <p className="text-sm font-medium text-ink">{store.pickup_address}</p>
        </div>
        <div className="p-3">
          <p className="text-xs text-ink-muted mb-0.5">Drop-off</p>
          <p className="text-sm font-medium text-ink">{store.dropoff_address}</p>
        </div>
        <div className="p-3 grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-ink-muted mb-0.5">Date</p>
            <p className="text-sm font-medium">
              {store.scheduled_date ? format(new Date(store.scheduled_date), 'EEE, dd MMM') : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-ink-muted mb-0.5">Time</p>
            <p className="text-sm font-medium capitalize">
              {store.time_window ? TIME_LABELS[store.time_window as keyof typeof TIME_LABELS] : '—'}
            </p>
          </div>
        </div>
        {q && (
          <div className="p-4 bg-accent-soft">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-ink">Your total</span>
              <span className="text-4xl font-bold text-accent">${q.quoted_price.toFixed(0)}</span>
            </div>
            {(q.promo_discount ?? 0) > 0 && (
              <p className="text-xs text-ink-muted mt-1">Includes promo {q.promo_code}</p>
            )}
            {q.credit_applied > 0 && (
              <p className="text-xs text-ink-muted mt-1">Includes ${q.credit_applied.toFixed(2)} credit</p>
            )}
          </div>
        )}
      </div>

      <div className="rounded-xl bg-surface-muted p-4 text-sm text-ink-muted">
        <p className="font-semibold text-ink mb-1">What happens next?</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Job published to movers in your area</li>
          <li>Notification when someone claims it</li>
          <li>Track live on the map</li>
        </ul>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <div className="flex gap-3">
        <Button variant="secondary" fullWidth onClick={onBack} disabled={loading}>Back</Button>
        <Button fullWidth loading={loading} onClick={onConfirm}>Confirm &amp; book</Button>
      </div>
    </div>
  )
}
