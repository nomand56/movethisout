import { Link } from 'react-router-dom'
import LoginForm from '../../components/auth/LoginForm'

export default function MoverLoginPage() {
  return (
    <LoginForm
      title="Mover sign in"
      subtitle="Claim jobs, navigate moves, and get paid — Kamloops area."
      registerHref="/register?role=mover"
      registerLabel="Want to drive?"
      afterLoginPath="/mover/dashboard"
      header={(
        <div className="bg-mover text-white px-4 py-8">
          <div className="max-w-sm mx-auto">
            <p className="text-lg font-bold">MoveThisOut Driver</p>
            <p className="text-sm text-white/70 mt-1">Kamloops mover portal</p>
            <Link to="/" className="text-xs text-white/60 hover:text-white mt-3 inline-block">← Customer site</Link>
          </div>
        </div>
      )}
    />
  )
}
