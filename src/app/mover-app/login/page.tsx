'use client'

import { useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function MoverLoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') ?? '/mover-app/board'

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
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="brand-input" placeholder="you@example.com" />
      </div>
      <div>
        <label style={{ display: 'block', fontFamily: 'Barlow, sans-serif', fontWeight: 600, fontSize: 13, color: '#141414', marginBottom: 6 }}>Password</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="brand-input" placeholder="••••••••" />
      </div>
      {error && <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13, color: '#F25800', border: '1.5px solid #F25800', padding: '10px 14px' }}>{error}</div>}
      <button type="submit" disabled={loading} className="btn-primary" style={{ justifyContent: 'center', marginTop: 4 }}>
        {loading ? 'Logging in…' : 'Log in'}
      </button>
    </form>
  )
}

export default function MoverLoginPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px', background: '#141414' }}>
      <div style={{ width: '100%', maxWidth: 400, border: '3px solid #F25800', background: '#FFFFFF', padding: 40, boxShadow: '4px 4px 0 #F25800' }}>
        <Link href="/mover-app" style={{ display: 'inline-block', marginBottom: 28, textDecoration: 'none' }}>
          <span style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 18, letterSpacing: '0.02em', textTransform: 'uppercase', color: '#141414' }}>MoveThis</span>
          <span style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 18, letterSpacing: '0.02em', textTransform: 'uppercase', color: '#F25800' }}>Out</span>
          <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, letterSpacing: '0.15em', color: '#F25800', border: '1.5px solid #F25800', padding: '1px 5px', marginLeft: 6, textTransform: 'uppercase' }}>MOVER</span>
        </Link>
        <h1 style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 26, textTransform: 'uppercase', letterSpacing: '0.02em', color: '#141414', marginBottom: 4 }}>Welcome back</h1>
        <p style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13, color: '#6b7280', marginBottom: 24 }}>Log in to your mover account</p>
        <Suspense fallback={<div style={{ height: 140, background: '#EFEDEA' }} />}>
          <MoverLoginForm />
        </Suspense>
        <p style={{ textAlign: 'center', fontFamily: 'Barlow, sans-serif', fontSize: 13, color: '#6b7280', marginTop: 20 }}>
          No account?{' '}
          <Link href="/mover-app/signup" style={{ color: '#F25800', fontWeight: 700, textDecoration: 'none' }}>Join as Mover</Link>
        </p>
      </div>
    </div>
  )
}
