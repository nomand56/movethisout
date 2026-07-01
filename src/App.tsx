import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from './lib/supabase'
import { queryClient } from './lib/queryClient'
import { useAuthStore } from './store/authStore'
import OfflineBanner from './components/ui/OfflineBanner'
import Spinner from './components/ui/Spinner'
import ProtectedRoute from './components/auth/ProtectedRoute'

// Layouts
import RequesterLayout from './components/layout/RequesterLayout'
import MoverLayout from './components/layout/MoverLayout'
import AdminLayout from './components/layout/AdminLayout'

// Auth pages
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import VerifyEmailPage from './pages/auth/VerifyEmailPage'

// Requester pages
import RequesterDashboard from './pages/app/DashboardPage'
import NewJobPage from './pages/app/NewJobPage'
import RequesterJobDetail from './pages/app/JobDetailPage'

// Mover pages
import MoverDashboard from './pages/mover/DashboardPage'
import MoverApplicationPage from './pages/mover/ApplicationPage'
import MoverPendingPage from './pages/mover/PendingPage'
import RequestCenterPage from './pages/mover/RequestCenterPage'
import MoverJobDetail from './pages/mover/JobDetailPage'
import ActiveJobPage from './pages/mover/ActiveJobPage'

// Admin pages
import AdminDashboard from './pages/admin/DashboardPage'
import ApprovalQueuePage from './pages/admin/ApprovalQueuePage'
import AdminJobsPage from './pages/admin/JobsPage'
import AdminUsersPage from './pages/admin/UsersPage'
import RevenuePage from './pages/admin/RevenuePage'

function RootRedirect() {
  const { profile, loading } = useAuthStore()
  if (loading) return <div className="flex h-screen items-center justify-center"><Spinner className="h-10 w-10" /></div>
  if (!profile) return <Navigate to="/login" replace />
  if (profile.role === 'admin') return <Navigate to="/admin/dashboard" replace />
  if (profile.role === 'mover') return <Navigate to="/mover/dashboard" replace />
  return <Navigate to="/app/dashboard" replace />
}

export default function App() {
  const { setSession, setProfile, setLoading } = useAuthStore()

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      if (session) {
        const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
        setProfile(data)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      if (session) {
        const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
        setProfile(data)
      } else {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [setSession, setProfile, setLoading])

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <OfflineBanner />
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />

          {/* Requester */}
          <Route element={<ProtectedRoute role="requester" />}>
            <Route element={<RequesterLayout />}>
              <Route path="/app/dashboard" element={<RequesterDashboard />} />
              <Route path="/app/jobs/new" element={<NewJobPage />} />
              <Route path="/app/jobs/:id" element={<RequesterJobDetail />} />
            </Route>
          </Route>

          {/* Mover */}
          <Route element={<ProtectedRoute role="mover" />}>
            <Route element={<MoverLayout />}>
              <Route path="/mover/dashboard" element={<MoverDashboard />} />
              <Route path="/mover/application" element={<MoverApplicationPage />} />
              <Route path="/mover/pending" element={<MoverPendingPage />} />
              <Route path="/mover/jobs" element={<RequestCenterPage />} />
              <Route path="/mover/jobs/:id" element={<MoverJobDetail />} />
              <Route path="/mover/active" element={<ActiveJobPage />} />
            </Route>
          </Route>

          {/* Admin */}
          <Route element={<ProtectedRoute role="admin" />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/approvals" element={<ApprovalQueuePage />} />
              <Route path="/admin/jobs" element={<AdminJobsPage />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="/admin/revenue" element={<RevenuePage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
