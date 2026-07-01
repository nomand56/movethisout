import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import Spinner from '../../components/ui/Spinner'

const WELCOME_SEEN_KEY = 'movethisout-seen-welcome'

export default function AuthCallbackPage() {
  const { profile, loading } = useAuthStore()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner className="h-10 w-10" />
      </div>
    )
  }

  if (profile) {
    if (profile.role === 'requester' && !sessionStorage.getItem(WELCOME_SEEN_KEY)) {
      sessionStorage.setItem(WELCOME_SEEN_KEY, '1')
      return <Navigate to="/welcome" replace />
    }
    return <Navigate to="/" replace />
  }

  return (
    <div className="flex h-screen items-center justify-center">
      <Spinner className="h-10 w-10" />
    </div>
  )
}
