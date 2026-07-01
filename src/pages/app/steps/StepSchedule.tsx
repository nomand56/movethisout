import { useState } from 'react'
import { useJobCreationStore } from '../../../store/jobCreationStore'
import Button from '../../../components/ui/Button'
import type { TimeWindow } from '../../../types'
import { format } from 'date-fns'

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
    if (!store.scheduled_date) e.date = 'Select a date'
    if (!store.time_window) e.window = 'Select a time window'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Preferred date</label>
        <input
          type="date"
          min={today}
          value={store.scheduled_date}
          onChange={(e) => store.setSchedule(e.target.value, store.time_window as TimeWindow)}
          className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-4 py-3 text-base bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500 min-h-[44px]"
        />
        {errors.date && <p className="text-sm text-red-600">{errors.date}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Time window</label>
        <div className="grid grid-cols-3 gap-3">
          {TIME_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => store.setSchedule(store.scheduled_date, opt.value)}
              className={`rounded-xl border p-3 text-center transition ${
                store.time_window === opt.value
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400'
                  : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-brand-300'
              }`}
            >
              <div className="font-semibold text-sm">{opt.label}</div>
              <div className="text-xs opacity-70">{opt.desc}</div>
            </button>
          ))}
        </div>
        {errors.window && <p className="text-sm text-red-600">{errors.window}</p>}
      </div>

      <div className="flex gap-3">
        <Button variant="secondary" fullWidth onClick={onBack}>Back</Button>
        <Button fullWidth onClick={() => validate() && onNext()}>Continue</Button>
      </div>
    </div>
  )
}
