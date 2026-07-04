import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import HazardStripe from '../../components/brand/HazardStripe'
import Wordmark from '../../components/brand/Wordmark'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})
type FormData = z.infer<typeof schema>

export default function LoginPage() {
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
    navigate('/')
  }

  const handleGoogleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/auth/callback' },
    })
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <div className="bg-haul px-4 py-8">
        <Wordmark variant="billboard" className="mb-1" />
        <p className="font-condensed font-bold text-jet uppercase tracking-wide">Sign in to track your move</p>
      </div>
      <HazardStripe />

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm card-yard p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input label="Email" type="email" autoComplete="email" placeholder="you@email.com" error={errors.email?.message} {...register('email')} />
            <Input label="Password" type="password" autoComplete="current-password" placeholder="••••••••" error={errors.password?.message} {...register('password')} />
            {serverError && <p className="text-sm text-red-600 text-center font-medium">{serverError}</p>}
            <Button type="submit" fullWidth loading={isSubmitting}>Sign in ▸</Button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-0.5 bg-jet" />
            <span className="text-xs font-condensed font-bold uppercase text-gray-400">Or</span>
            <div className="flex-1 h-0.5 bg-jet" />
          </div>

          <Button type="button" variant="secondary" fullWidth onClick={handleGoogleSignIn}>Google</Button>

          <p className="text-center text-sm text-gray-600 mt-6">
            New here?{' '}
            <Link to="/register?role=requester" className="text-haul font-bold hover:underline">Book a move</Link>
            {' · '}
            <Link to="/register?role=mover" className="text-haul font-bold hover:underline">Drive</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
