import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'
import { useInstallPrompt } from '../../hooks/useInstallPrompt'
import Button from '../ui/Button'

export default function InstallPrompt() {
  const { canInstall, prompt, dismiss } = useInstallPrompt()
  const [show, setShow] = useState(false)

  useEffect(() => {
    const completed = localStorage.getItem('first-action-completed') === '1'
    if (completed && canInstall) setShow(true)
  }, [canInstall])

  if (!show || !canInstall) return null

  return (
    <div className="fixed bottom-[calc(var(--bottom-nav-h)+env(safe-area-inset-bottom,0px)+0.5rem)] left-4 right-4 z-30 mx-auto max-w-md card p-4 flex items-start gap-3 shadow-soft">
      <Download size={20} className="text-haul mt-0.5 flex-shrink-0" />
      <div className="flex-1">
        <p className="font-bold text-sm text-jet">Install MoveThisOut</p>
        <p className="text-xs text-gray-600 mt-0.5">Add to your home screen for the best experience.</p>
        <div className="flex gap-2 mt-3">
          <Button size="sm" onClick={async () => { await prompt(); setShow(false) }}>Install</Button>
          <Button size="sm" variant="secondary" onClick={() => { dismiss(); setShow(false) }}>Not now</Button>
        </div>
      </div>
      <button onClick={() => { dismiss(); setShow(false) }} className="text-gray-400 hover:text-gray-600">
        <X size={16} />
      </button>
    </div>
  )
}

export function markFirstActionCompleted() {
  localStorage.setItem('first-action-completed', '1')
}
