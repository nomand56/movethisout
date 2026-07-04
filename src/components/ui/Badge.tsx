import type { JobStatus } from '../../types'

const STATUS_STYLES: Record<JobStatus, string> = {
  draft: 'bg-concrete text-jet border-jet',
  open: 'bg-white text-jet border-jet',
  claimed: 'bg-caution text-jet border-jet',
  in_progress: 'bg-haul text-white border-jet',
  completed: 'bg-jet text-white border-jet',
  cancelled: 'bg-red-100 text-red-800 border-red-800',
}

const STATUS_LABELS: Record<JobStatus, string> = {
  draft: 'Awaiting confirmation',
  open: 'Finding mover',
  claimed: 'Mover assigned',
  in_progress: 'On the way',
  completed: 'Delivered',
  cancelled: 'Cancelled',
}

export function StatusBadge({ status }: { status: JobStatus }) {
  return (
    <span className={`inline-flex items-center border-2 px-2 py-0.5 text-[11px] font-condensed font-bold uppercase tracking-wider ${STATUS_STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  )
}

export function Badge({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center border-2 border-jet bg-haul text-white px-2 py-0.5 text-[11px] font-condensed font-bold uppercase tracking-wider ${className}`}>
      {children}
    </span>
  )
}
