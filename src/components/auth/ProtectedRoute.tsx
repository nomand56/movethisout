import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import type { UserRole } from '../../types'
import Spinner from '../ui/Spinner'

interface Props {
  role: UserRole
}

export default function ProtectedRoute({ role }: Props) {
  const { profile, loading } = useAuthStore()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner className="h-10 w-10" />
      </div>
    )
  }

  if (!profile) return <Navigate to="/login" replace />

  if (profile.is_suspended) {
    return (
      <div className="flex h-screen items-center justify-center p-4">
        <div className="max-w-sm text-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Account Suspended</h2>
          <p className="text-gray-600 dark:text-gray-400">Your account has been suspended. Please contact support.</p>
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
