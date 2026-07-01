import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { useNavigate } from 'react-router-dom'

export function useAuth() {
  const { session, profile, loading } = useAuthStore()
  const navigate = useNavigate()

  const logout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return { session, profile, loading, logout, isAuthenticated: !!session }
}
