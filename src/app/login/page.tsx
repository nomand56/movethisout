'use client'

import { useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') ?? '/dashboard'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      window.location.href = redirectTo
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <label style={{ display: 'block', fontFamily: 'Barlow, sans-serif', fontWeight: 600, fontSize: 13, color: '#141414', marginBottom: 6 }}>Email</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="brand-input"
          placeholder="you@example.com"
        />
      </div>
      <div>
        <label style={{ display: 'block', fontFamily: 'Barlow, sans-serif', fontWeight: 600, fontSize: 13, color: '#141414', marginBottom: 6 }}>Password</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          className="brand-input"
          placeholder="••••••••"
        />
      </div>

      {error && (
        <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13, color: '#F25800', border: '1.5px solid #F25800', padding: '10px 14px' }}>{error}</div>
      )}

      <button type="submit" disabled={loading} className="btn-primary" style={{ justifyContent: 'center', marginTop: 4 }}>
        {loading ? 'Logging in…' : 'Log in'}
      </button>
    </form>
  )
}

export default function LoginPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px', background: '#FFFFFF' }}>
      <div style={{ width: '100%', maxWidth: 420, border: '3px solid #141414', background: '#FFFFFF', padding: 40, boxShadow: '4px 4px 0 #141414' }}>
        <Link href="/" style={{ display: 'inline-block', marginBottom: 32, textDecoration: 'none' }}>
          <span style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 20, letterSpacing: '0.02em', textTransform: 'uppercase', color: '#141414' }}>MoveThis</span>
          <span style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 20, letterSpacing: '0.02em', textTransform: 'uppercase', color: '#F25800' }}>Out →</span>
        </Link>

        <h1 style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 28, textTransform: 'uppercase', letterSpacing: '0.02em', color: '#141414', marginBottom: 4 }}>Welcome back</h1>
        <p style={{ fontFamily: 'Barlow, sans-serif', fontSize: 14, color: '#6b7280', marginBottom: 28 }}>Log in to your account</p>

        <Suspense fallback={<div style={{ height: 160, background: '#EFEDEA' }} />}>
          <LoginForm />
        </Suspense>

        <p style={{ textAlign: 'center', fontFamily: 'Barlow, sans-serif', fontSize: 13, color: '#6b7280', marginTop: 24 }}>
          No account?{' '}
          <Link href="/signup" style={{ color: '#F25800', fontWeight: 700, textDecoration: 'none' }}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
