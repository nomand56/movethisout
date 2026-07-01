import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import { setPostAuthRedirect } from '../../lib/postAuthRedirect'
import { setReferralCode } from '../../lib/referralCapture'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'

const schema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().min(7, 'Enter a valid phone number'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})
type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const role = params.get('role') === 'mover' ? 'mover' : 'requester'
  const redirect = params.get('redirect')
  const ref = params.get('ref')
  const [serverError, setServerError] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setServerError('')
    if (redirect) setPostAuthRedirect(redirect)
    if (ref) setReferralCode(ref)
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { full_name: data.full_name, phone: data.phone, role },
      },
    })
    if (error) {
      setServerError(error.message)
      return
    }
    navigate('/verify-email')
  }

  const handleGoogleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/auth/callback?role=' + role },
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-8">
        <h1 className="text-2xl font-bold text-center mb-2 text-gray-900 dark:text-gray-100">{t('auth.register.title')}</h1>
        <p className="text-gray-500 text-center mb-8 text-sm">
          {t('auth.register.registering_as')} <span className="font-semibold text-brand-500 capitalize">{role}</span>
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input label={t('auth.register.full_name_label')} placeholder={t('auth.register.full_name_placeholder')} error={errors.full_name?.message} {...register('full_name')} />
          <Input label={t('auth.register.email_label')} type="email" placeholder={t('auth.register.email_placeholder')} error={errors.email?.message} {...register('email')} />
          <Input label={t('auth.register.phone_label')} type="tel" placeholder={t('auth.register.phone_placeholder')} error={errors.phone?.message} {...register('phone')} />
          <Input
            label={t('auth.register.password_label')}
            type="password"
            placeholder={t('auth.register.password_placeholder')}
            error={errors.password?.message}
            hint={t('auth.register.password_hint')}
            {...register('password')}
          />
          {serverError && <p className="text-sm text-red-600 text-center">{serverError}</p>}
          <Button type="submit" fullWidth loading={isSubmitting}>{t('auth.register.submit')}</Button>
        </form>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          <span className="text-xs text-gray-400">{t('auth.register.divider_or')}</span>
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
        </div>

        <Button type="button" variant="secondary" fullWidth onClick={handleGoogleSignIn}>{t('auth.register.google')}</Button>

        <p className="text-center text-sm text-gray-500 mt-6">
          {t('auth.register.have_account')}{' '}
          <Link to="/login" className="text-brand-500 font-medium hover:underline">{t('auth.register.signin')}</Link>
        </p>
      </div>
    </div>
  )
}
