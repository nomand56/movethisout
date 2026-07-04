import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'
import { setPostAuthRedirect } from '../../../lib/postAuthRedirect'
import Input from '../../../components/ui/Input'
import Button from '../../../components/ui/Button'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})
type FormData = z.infer<typeof schema>

interface Props {
  onBack?: () => void
}

export default function StepAuth({ onBack }: Props) {
  const navigate = useNavigate()
  const [serverError, setServerError] = useState('')
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setServerError('')
    const { error } = await supabase.auth.signInWithPassword({ email: data.email, password: data.password })
    if (error) {
      setServerError('Invalid email or password.')
      return
    }
    // BookingWizardShell picks up profile change → fetches price → confirm step
  }

  const handleCreateAccount = () => {
    setPostAuthRedirect('/book')
    navigate('/register?role=requester&redirect=/book')
  }

  const handleGoogleSignIn = async () => {
    setPostAuthRedirect('/book')
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/auth/callback' },
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="font-display text-2xl uppercase text-jet">Sign in to book</h2>
        <p className="text-sm text-gray-600 mt-1">
          You&apos;re almost done. Sign in or create an account — then you&apos;ll see your price and pay.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 card-yard p-5">
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@email.com"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password')}
        />
        {serverError && <p className="text-sm text-red-600 text-center font-medium">{serverError}</p>}
        <Button type="submit" fullWidth loading={isSubmitting}>Sign in ▸</Button>
      </form>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-0.5 bg-jet" />
        <span className="text-xs font-condensed font-bold uppercase text-gray-400">Or</span>
        <div className="flex-1 h-0.5 bg-jet" />
      </div>

      <Button type="button" variant="secondary" fullWidth onClick={handleGoogleSignIn}>Google</Button>

      <div className="card-yard p-4 bg-concrete text-center">
        <p className="text-sm text-jet mb-3">New here?</p>
        <Button type="button" variant="deal" fullWidth onClick={handleCreateAccount}>
          Create account ▸
        </Button>
      </div>

      {onBack && (
        <Button variant="ghost" fullWidth onClick={onBack}>← Back to review</Button>
      )}

      <p className="text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link to="/login" className="text-haul font-bold hover:underline" onClick={() => setPostAuthRedirect('/book')}>
          Sign in on full page
        </Link>
      </p>
    </div>
  )
}
