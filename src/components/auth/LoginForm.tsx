import { useState, ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Input from '../ui/Input'
import Button from '../ui/Button'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})
type FormData = z.infer<typeof schema>

interface Props {
  title: string
  subtitle: string
  registerHref: string
  registerLabel: string
  header: ReactNode
  afterLoginPath?: string
}

export default function LoginForm({ title, subtitle, registerHref, registerLabel, header, afterLoginPath = '/' }: Props) {
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
    navigate(afterLoginPath)
  }

  const handleGoogleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/auth/callback' },
    })
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface-muted">
      {header}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm card p-6">
          <h1 className="text-xl font-bold text-ink mb-1">{title}</h1>
          <p className="text-sm text-ink-muted mb-5">{subtitle}</p>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input label="Email" type="email" autoComplete="email" placeholder="you@email.com" error={errors.email?.message} {...register('email')} />
            <Input label="Password" type="password" autoComplete="current-password" placeholder="••••••••" error={errors.password?.message} {...register('password')} />
            {serverError && <p className="text-sm text-red-600 text-center">{serverError}</p>}
            <Button type="submit" fullWidth loading={isSubmitting}>Sign in</Button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-ink-muted">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <Button variant="secondary" fullWidth onClick={handleGoogleSignIn}>Continue with Google</Button>

          <p className="text-center text-sm text-ink-muted mt-5">
            {registerLabel}{' '}
            <Link to={registerHref} className="text-accent font-semibold hover:underline">Create account</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
