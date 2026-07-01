import { Clock } from 'lucide-react'

export default function MoverPendingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-20 h-20 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center mb-4">
        <Clock size={36} className="text-yellow-500" />
      </div>
      <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Application Under Review</h1>
      <p className="text-gray-500 max-w-sm">
        Your mover application is being reviewed by our team. We'll email you when it's approved — this usually takes 1–2 business days.
      </p>
    </div>
  )
}
