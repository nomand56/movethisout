import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})
type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState('')
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setServerError('')
    const { error } = await supabase.auth.signInWithPassword({ email: data.email, password: data.password })
    if (error) {
      setServerError(t('auth.login.server_error'))
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-8">
        <h1 className="text-2xl font-bold text-center mb-2 text-gray-900 dark:text-gray-100">{t('auth.login.title')}</h1>
        <p className="text-gray-500 text-center mb-8 text-sm">{t('auth.login.subtitle')}</p>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input
            label={t('auth.login.email_label')}
            type="email"
            autoComplete="email"
            placeholder={t('auth.login.email_placeholder')}
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            label={t('auth.login.password_label')}
            type="password"
            autoComplete="current-password"
            placeholder={t('auth.login.password_placeholder')}
            error={errors.password?.message}
            {...register('password')}
          />
          {serverError && <p className="text-sm text-red-600 text-center">{serverError}</p>}
          <Button type="submit" fullWidth loading={isSubmitting}>{t('auth.login.submit')}</Button>
        </form>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          <span className="text-xs text-gray-400">{t('auth.login.divider_or')}</span>
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
        </div>

        <Button type="button" variant="secondary" fullWidth onClick={handleGoogleSignIn}>{t('auth.login.google')}</Button>

        <p className="text-center text-sm text-gray-500 mt-6">
          {t('auth.login.no_account')}{' '}
          <Link to="/register?role=requester" className="text-brand-500 font-medium hover:underline">{t('auth.login.signup_requester')}</Link>
          {t('auth.login.signup_mover_prefix')}
          <Link to="/register?role=mover" className="text-brand-500 font-medium hover:underline">{t('auth.login.signup_mover')}</Link>
        </p>
      </div>
    </div>
  )
}
