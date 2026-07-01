import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Button from '../../components/ui/Button'

const WELCOME_SEEN_KEY = 'movethisout-seen-welcome'

export default function ChooseRoleInterstitial() {
  const navigate = useNavigate()

  useEffect(() => {
    sessionStorage.setItem(WELCOME_SEEN_KEY, '1')
  }, [])

  const handleRequester = () => {
    navigate('/app/dashboard', { replace: true })
  }

  const handleMover = async () => {
    try {
      await supabase.functions.invoke('set-mover-role', { body: {} })
    } catch (err) {
      console.error('Failed to set mover role', err)
    }
    navigate('/mover/application', { replace: true })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-8">
        <h1 className="text-2xl font-bold text-center mb-2 text-gray-900 dark:text-gray-100">Welcome to MoveThisOut</h1>
        <p className="text-gray-500 text-center mb-8 text-sm">What brings you here?</p>

        <div className="flex flex-col gap-3">
          <Button type="button" fullWidth onClick={handleRequester}>I need to move things</Button>
          <Button type="button" variant="secondary" fullWidth onClick={handleMover}>I want to be a mover</Button>
        </div>
      </div>
    </div>
  )
}
