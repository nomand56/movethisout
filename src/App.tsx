import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from './lib/supabase'
import { normalizeProfile } from './lib/profile'
import { queryClient } from './lib/queryClient'
import { useAuthStore } from './store/authStore'
import { consumePostAuthRedirect } from './lib/postAuthRedirect'
import { useReferralCapture } from './hooks/useReferralCapture'
import OfflineBanner from './components/ui/OfflineBanner'
import Spinner from './components/ui/Spinner'
import ProtectedRoute from './components/auth/ProtectedRoute'

// Layouts
import RequesterLayout from './components/layout/RequesterLayout'
import MoverLayout from './components/layout/MoverLayout'
import AdminLayout from './components/layout/AdminLayout'

// Public pages
import LandingPage from './pages/public/LandingPage'

// Auth pages
import LoginPage from './pages/auth/LoginPage'
import MoverLoginPage from './pages/auth/MoverLoginPage'
import AdminLoginPage from './pages/auth/AdminLoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import VerifyEmailPage from './pages/auth/VerifyEmailPage'
import AuthCallbackPage from './pages/auth/AuthCallbackPage'
import ChooseRoleInterstitial from './pages/auth/ChooseRoleInterstitial'

// Requester pages
import RequesterDashboard from './pages/app/DashboardPage'
import BookingWizardShell from './pages/app/BookingWizardShell'
import RequesterJobDetail from './pages/app/JobDetailPage'
import SettingsPage from './pages/app/SettingsPage'

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
import AdminJobDetailPage from './pages/admin/JobDetailPage'
import AdminUsersPage from './pages/admin/UsersPage'
import RevenuePage from './pages/admin/RevenuePage'
import AdminPricingPage from './pages/admin/PricingPage'
import MoverRouteGuard from './components/auth/MoverRouteGuard'
import InstallPrompt from './components/pwa/InstallPrompt'

function RootRedirect() {
  const { profile, loading } = useAuthStore()
  if (loading) return <div className="flex h-screen items-center justify-center"><Spinner className="h-10 w-10" /></div>
  if (profile) {
    const redirect = consumePostAuthRedirect()
    if (redirect) return <Navigate to={redirect} replace />
  }
  if (!profile) return <LandingPage />
  if (profile.role === 'admin') return <Navigate to="/admin/dashboard" replace />
  if (profile.role === 'mover') return <Navigate to="/mover/dashboard" replace />
  return <Navigate to="/app/dashboard" replace />
}

export default function App() {
  const { setSession, setProfile, setLoading } = useAuthStore()

  useReferralCapture()

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      if (session) {
        const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
        setProfile(normalizeProfile(data))
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      if (session) {
        const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
        setProfile(normalizeProfile(data))
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
        <InstallPrompt />
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/mover/login" element={<MoverLoginPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/welcome" element={<ChooseRoleInterstitial />} />
          <Route path="/book" element={<BookingWizardShell authRequired={false} />} />

          {/* Requester */}
          <Route element={<ProtectedRoute role="requester" />}>
            <Route element={<RequesterLayout />}>
              <Route path="/app/dashboard" element={<RequesterDashboard />} />
              <Route path="/app/jobs/new" element={<BookingWizardShell authRequired={true} />} />
              <Route path="/app/jobs/:id" element={<RequesterJobDetail />} />
              <Route path="/app/settings" element={<SettingsPage />} />
            </Route>
          </Route>

          {/* Mover */}
          <Route element={<ProtectedRoute role="mover" />}>
            <Route element={<MoverLayout />}>
              <Route element={<MoverRouteGuard />}>
                <Route path="/mover/dashboard" element={<MoverDashboard />} />
                <Route path="/mover/jobs" element={<RequestCenterPage />} />
                <Route path="/mover/jobs/:id" element={<MoverJobDetail />} />
                <Route path="/mover/active" element={<ActiveJobPage />} />
                <Route path="/mover/settings" element={<SettingsPage />} />
              </Route>
              <Route path="/mover/application" element={<MoverApplicationPage />} />
              <Route path="/mover/pending" element={<MoverPendingPage />} />
            </Route>
          </Route>

          {/* Admin */}
          <Route element={<ProtectedRoute role="admin" />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/approvals" element={<ApprovalQueuePage />} />
              <Route path="/admin/jobs" element={<AdminJobsPage />} />
              <Route path="/admin/jobs/:id" element={<AdminJobDetailPage />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="/admin/revenue" element={<RevenuePage />} />
              <Route path="/admin/pricing" element={<AdminPricingPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
