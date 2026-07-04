import { Clock } from 'lucide-react'

export default function MoverPendingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-20 h-20 border-3 border-jet bg-caution flex items-center justify-center mb-4">
        <Clock size={36} className="text-jet" />
      </div>
      <h1 className="font-display text-xl uppercase mb-2">Application under review</h1>
      <p className="text-gray-600 max-w-sm text-sm">
        Your mover application is being reviewed by our team. We&apos;ll email you when it&apos;s approved — usually 1–2 business days.
      </p>
    </div>
  )
}
