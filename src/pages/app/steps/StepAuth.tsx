import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'
import { setPostAuthRedirect } from '../../../lib/postAuthRedirect'
import Input from '../../../components/ui/Input'
import Button from '../../../components/ui/Button'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})
type FormData = z.infer<typeof schema>

export default function StepAuth() {
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
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-semibold text-gray-900 dark:text-gray-100">Sign in to confirm your booking</h2>
        <p className="text-sm text-gray-500 mt-1">You're almost done — sign in or create an account to complete your booking.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
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
        {serverError && <p className="text-sm text-red-600 text-center">{serverError}</p>}
        <Button type="submit" fullWidth loading={isSubmitting}>Sign In</Button>
      </form>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
        <span className="text-xs text-gray-400">or</span>
        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
      </div>

      <Button type="button" variant="secondary" fullWidth onClick={handleGoogleSignIn}>Continue with Google</Button>

      <div className="text-center text-sm text-gray-500">
        New here?{' '}
        <button type="button" onClick={handleCreateAccount} className="text-brand-500 font-medium hover:underline">
          Create an account
        </button>
      </div>
    </div>
  )
}
