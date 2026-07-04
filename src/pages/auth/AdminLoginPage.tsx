import { Link } from 'react-router-dom'
import LoginForm from '../../components/auth/LoginForm'

export default function AdminLoginPage() {
  return (
    <LoginForm
      title="Operations sign in"
      subtitle="Manage jobs, movers, pricing, and support."
      registerHref="/login"
      registerLabel="Not an admin?"
      afterLoginPath="/admin/dashboard"
      header={(
        <div className="bg-white border-b border-gray-200 px-4 py-6">
          <div className="max-w-sm mx-auto flex items-center justify-between">
            <div>
              <p className="text-lg font-bold text-ink">MoveThisOut Ops</p>
              <p className="text-xs text-ink-muted">Admin portal</p>
            </div>
            <span className="text-[10px] font-medium uppercase tracking-wider text-ink-muted bg-gray-100 px-2 py-1 rounded-md">Internal</span>
          </div>
          <Link to="/" className="text-xs text-ink-muted hover:text-ink mt-3 inline-block">← Public site</Link>
        </div>
      )}
    />
  )
}
