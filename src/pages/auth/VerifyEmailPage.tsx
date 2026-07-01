import { Link } from 'react-router-dom'
import { Mail } from 'lucide-react'

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <div className="max-w-sm text-center bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-8">
        <div className="mx-auto w-16 h-16 rounded-full bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center mb-4">
          <Mail size={32} className="text-brand-500" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Check your email</h1>
        <p className="text-gray-500 mb-6 text-sm">
          We sent a verification link to your email address. Click the link to activate your account.
        </p>
        <p className="text-sm text-gray-500">
          Already verified?{' '}
          <Link to="/login" className="text-brand-500 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
