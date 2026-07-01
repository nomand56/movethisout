import { WifiOff } from 'lucide-react'
import { useOnlineStatus } from '../../hooks/useOnlineStatus'

export default function OfflineBanner() {
  const online = useOnlineStatus()
  if (online) return null
  return (
    <div className="fixed top-0 inset-x-0 z-50 flex items-center justify-center gap-2 bg-red-600 text-white text-sm font-medium py-2 px-4">
      <WifiOff size={16} />
      You are offline — some features may be unavailable
    </div>
  )
}
