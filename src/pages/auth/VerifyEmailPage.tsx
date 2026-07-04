import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import Button from '../../components/ui/Button'
import HazardStripe from '../../components/brand/HazardStripe'
import Wordmark from '../../components/brand/Wordmark'

export default function VerifyEmailPage() {
  const { session } = useAuthStore()
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)

  const handleResend = async () => {
    if (!session?.user.email) return
    setSending(true)
    await supabase.auth.resend({ type: 'signup', email: session.user.email })
    setSent(true)
    setSending(false)
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <div className="bg-haul px-4 py-8">
        <Wordmark variant="billboard" className="mb-1" />
        <p className="font-condensed font-bold text-jet uppercase tracking-wide">Almost there</p>
      </div>
      <HazardStripe />

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-sm text-center card-yard p-8">
          <div className="mx-auto w-16 h-16 border-3 border-jet bg-caution flex items-center justify-center mb-4">
            <Mail size={32} className="text-jet" />
          </div>
          <h1 className="font-display text-xl uppercase mb-2">Check your email</h1>
          <p className="text-gray-600 mb-4 text-sm">
            We sent a verification link{session?.user.email ? ` to ${session.user.email}` : ''}. Click it to activate your account before booking.
          </p>
          {session?.user.email && (
            <Button fullWidth loading={sending} onClick={handleResend} className="mb-4">
              {sent ? 'Email sent again ✓' : 'Resend verification email'}
            </Button>
          )}
          <p className="text-sm text-gray-600">
            Already verified?{' '}
            <Link to="/login" className="text-haul font-bold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
