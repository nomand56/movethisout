import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Button from '../../components/ui/Button'
import HazardStripe from '../../components/brand/HazardStripe'
import Wordmark from '../../components/brand/Wordmark'

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
    <div className="min-h-screen flex flex-col bg-white">
      <div className="bg-haul px-4 py-8">
        <Wordmark variant="billboard" className="mb-1" />
        <p className="font-condensed font-bold text-jet uppercase tracking-wide">Welcome aboard</p>
      </div>
      <HazardStripe />

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm card-yard p-8">
          <h1 className="font-display text-2xl uppercase text-center mb-2">What brings you here?</h1>
          <p className="text-gray-600 text-center mb-8 text-sm">Pick your path — you can always switch later.</p>

          <div className="flex flex-col gap-3">
            <Button type="button" fullWidth onClick={handleRequester}>I need to move things ▸</Button>
            <Button type="button" variant="deal" fullWidth onClick={handleMover}>I want to be a mover ▸</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
