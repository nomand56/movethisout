import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import Spinner from '../ui/Spinner'
import type { MoverProfile } from '../../types'

const ALLOWED_PATHS = ['/mover/application', '/mover/pending']

export default function MoverRouteGuard() {
  const { profile } = useAuthStore()
  const location = useLocation()

  const { data: moverProfile, isLoading } = useQuery({
    queryKey: ['mover-profile-guard', profile?.id],
    queryFn: async () => {
      const { data } = await supabase.from('mover_profiles').select('*').eq('id', profile!.id).maybeSingle()
      return data as MoverProfile | null
    },
    enabled: !!profile,
  })

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (ALLOWED_PATHS.some((p) => location.pathname.startsWith(p))) {
    return <Outlet />
  }

  if (!moverProfile || !moverProfile.licence_url) {
    return <Navigate to="/mover/application" replace />
  }

  if (moverProfile.status === 'pending') {
    return <Navigate to="/mover/pending" replace />
  }

  if (moverProfile.status === 'suspended') {
    return (
      <div className="flex h-64 items-center justify-center p-4">
        <div className="max-w-sm text-center card-yard p-6">
          <h2 className="font-display text-xl uppercase mb-2">Not approved</h2>
          <p className="text-gray-600 text-sm">Your mover account is suspended. Contact support for help.</p>
        </div>
      </div>
    )
  }

  return <Outlet />
}
