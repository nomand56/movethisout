import { WifiOff } from 'lucide-react'
import { useOnlineStatus } from '../../hooks/useOnlineStatus'

export default function OfflineBanner() {
  const online = useOnlineStatus()
  if (online) return null
  return (
    <div className="fixed top-0 inset-x-0 z-50 flex items-center justify-center gap-2 bg-jet text-white text-sm font-condensed font-bold uppercase tracking-wider py-2 px-4 border-b-3 border-haul">
      <WifiOff size={16} />
      You&apos;re offline — some features may not work
    </div>
  )
}
