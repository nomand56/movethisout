import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import type { UserRole } from '../../types'
import Spinner from '../ui/Spinner'

interface Props {
  role: UserRole
}

function loginPathFor(role: UserRole): string {
  if (role === 'admin') return '/admin/login'
  if (role === 'mover') return '/mover/login'
  return '/login'
}

export default function ProtectedRoute({ role }: Props) {
  const { profile, session, loading } = useAuthStore()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner className="h-10 w-10" />
      </div>
    )
  }

  if (!profile) return <Navigate to={loginPathFor(role)} replace />

  if (session && !session.user.email_confirmed_at) {
    return <Navigate to="/verify-email" replace />
  }

  if (profile.is_suspended) {
    return (
      <div className="flex h-screen items-center justify-center p-4">
        <div className="max-w-sm text-center card-yard p-6">
          <h2 className="font-display text-xl uppercase mb-2">Account suspended</h2>
          <p className="text-gray-600 text-sm">Your account has been suspended. Please contact support.</p>
        </div>
      </div>
    )
  }

  if (profile.role !== role) {
    if (profile.role === 'admin') return <Navigate to="/admin/dashboard" replace />
    if (profile.role === 'mover') return <Navigate to="/mover/dashboard" replace />
    return <Navigate to="/app/dashboard" replace />
  }

  return <Outlet />
}
