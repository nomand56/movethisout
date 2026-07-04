import { useState } from 'react'
import { useJobCreationStore } from '../../../store/jobCreationStore'
import Button from '../../../components/ui/Button'
import type { TimeWindow } from '../../../types'
import { format } from 'date-fns'
import { clsx } from '../../../lib/clsx'

interface Props { onBack: () => void; onNext: () => void }

const TIME_OPTIONS: { value: TimeWindow; label: string; desc: string }[] = [
  { value: 'morning', label: 'Morning', desc: '8am – 12pm' },
  { value: 'afternoon', label: 'Afternoon', desc: '12pm – 5pm' },
  { value: 'evening', label: 'Evening', desc: '5pm – 8pm' },
]

export default function StepSchedule({ onBack, onNext }: Props) {
  const store = useJobCreationStore()
  const today = format(new Date(), 'yyyy-MM-dd')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const e: Record<string, string> = {}
    if (!store.scheduled_date) e.date = 'Pick a date'
    if (!store.time_window) e.window = 'Pick a time window'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-bold text-ink">When?</h2>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700">Move date</label>
        <input
          type="date"
          min={today}
          value={store.scheduled_date}
          onChange={(e) => store.setSchedule(e.target.value, store.time_window as TimeWindow)}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-[15px] bg-white focus:outline-none focus:ring-2 focus:ring-accent/25 min-h-[48px]"
        />
        {errors.date && <p className="text-sm text-red-600">{errors.date}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700">Time window</label>
        <div className="grid grid-cols-3 gap-2">
          {TIME_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => store.setSchedule(store.scheduled_date, opt.value)}
              className={clsx(
                'rounded-xl border p-3 text-center transition',
                store.time_window === opt.value
                  ? 'border-accent bg-accent-soft text-accent font-semibold'
                  : 'border-gray-200 bg-white text-ink hover:bg-gray-50',
              )}
            >
              <div className="font-medium text-sm">{opt.label}</div>
              <div className="text-[10px] text-ink-muted mt-0.5">{opt.desc}</div>
            </button>
          ))}
        </div>
        {errors.window && <p className="text-sm text-red-600">{errors.window}</p>}
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="secondary" fullWidth onClick={onBack}>Back</Button>
        <Button fullWidth onClick={() => validate() && onNext()}>Continue</Button>
      </div>
    </div>
  )
}
