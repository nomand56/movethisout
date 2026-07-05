import { Link } from 'react-router-dom'
import LoginForm from '../../components/auth/LoginForm'

export default function LoginPage() {
  return (
    <LoginForm
      title="Welcome back"
      subtitle="Book and track your moves across Canada."
      registerHref="/register?role=requester"
      registerLabel="New here?"
      afterLoginPath="/"
      header={(
        <div className="bg-white border-b border-gray-100 px-4 py-6">
          <div className="max-w-sm mx-auto">
            <Link to="/" className="text-lg font-bold text-ink">MoveThisOut</Link>
            <p className="text-xs text-ink-muted mt-0.5">Customer sign in</p>
          </div>
        </div>
      )}
    />
  )
}
