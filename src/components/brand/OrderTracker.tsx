import type { JobStatus } from '../../types'
import { clsx } from '../../lib/clsx'

const STEPS = [
  { key: 'placed', label: 'Booked', statuses: ['draft', 'open'] as JobStatus[] },
  { key: 'assigned', label: 'Mover found', statuses: ['claimed'] as JobStatus[] },
  { key: 'moving', label: 'On the way', statuses: ['in_progress'] as JobStatus[] },
  { key: 'done', label: 'Delivered', statuses: ['completed'] as JobStatus[] },
]

function stepIndex(status: JobStatus) {
  if (status === 'cancelled') return -1
  return STEPS.findIndex((s) => s.statuses.includes(status))
}

export default function OrderTracker({ status }: { status: JobStatus }) {
  const current = stepIndex(status)
  if (status === 'cancelled') {
    return <p className="text-sm font-condensed font-bold uppercase tracking-wider text-red-600">Order cancelled</p>
  }

  return (
    <div className="flex items-center gap-0 w-full">
      {STEPS.map((step, i) => {
        const done = i < current
        const active = i === current
        return (
          <div key={step.key} className="flex-1 flex flex-col items-center gap-1 min-w-0">
            <div
              className={clsx(
                'h-3 w-3 border-2 border-jet',
                done && 'bg-haul',
                active && 'bg-caution',
                !done && !active && 'bg-white',
              )}
            />
            <span
              className={clsx(
                'text-[10px] font-condensed font-bold uppercase tracking-wide text-center leading-tight',
                active ? 'text-haul' : done ? 'text-jet' : 'text-gray-400',
              )}
            >
              {step.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
