'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Mail } from 'lucide-react'

export default function SignupPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else if (data.session) {
      window.location.href = '/dashboard'
    } else {
      setEmailSent(true)
      setLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px', background: '#FFFFFF' }}>
        <div style={{ width: '100%', maxWidth: 420, border: '3px solid #141414', background: '#FFFFFF', padding: 40, boxShadow: '4px 4px 0 #141414', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, background: '#EFEDEA', border: '3px solid #141414', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Mail color="#F25800" size={24} />
          </div>
          <h1 style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 26, textTransform: 'uppercase', letterSpacing: '0.02em', color: '#141414', marginBottom: 8 }}>Check your email</h1>
          <p style={{ fontFamily: 'Barlow, sans-serif', fontSize: 14, color: '#6b7280', marginBottom: 24, lineHeight: 1.6 }}>
            We sent a confirmation link to <strong style={{ color: '#141414' }}>{email}</strong>. Click it to activate your account, then log in.
          </p>
          <Link href="/login" className="btn-primary" style={{ display: 'block', textAlign: 'center', justifyContent: 'center' }}>
            Go to Login
          </Link>
          <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, color: '#9ca3af', marginTop: 16, lineHeight: 1.5 }}>
            To skip email confirmation, go to Supabase → Authentication → Email → disable "Confirm email".
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px', background: '#FFFFFF' }}>
      <div style={{ width: '100%', maxWidth: 420, border: '3px solid #141414', background: '#FFFFFF', padding: 40, boxShadow: '4px 4px 0 #141414' }}>
        <Link href="/" style={{ display: 'inline-block', marginBottom: 32, textDecoration: 'none' }}>
          <span style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 20, letterSpacing: '0.02em', textTransform: 'uppercase', color: '#141414' }}>MoveThis</span>
          <span style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 20, letterSpacing: '0.02em', textTransform: 'uppercase', color: '#F25800' }}>Out →</span>
        </Link>

        <h1 style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 28, textTransform: 'uppercase', letterSpacing: '0.02em', color: '#141414', marginBottom: 4 }}>Create account</h1>
        <p style={{ fontFamily: 'Barlow, sans-serif', fontSize: 14, color: '#6b7280', marginBottom: 28 }}>Join your community logistics network</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontFamily: 'Barlow, sans-serif', fontWeight: 600, fontSize: 13, color: '#141414', marginBottom: 6 }}>Full name</label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              required
              className="brand-input"
              placeholder="Jane Smith"
            />
          </div>
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
              minLength={6}
              className="brand-input"
              placeholder="At least 6 characters"
            />
          </div>

          {error && (
            <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13, color: '#F25800', border: '1.5px solid #F25800', padding: '10px 14px' }}>{error}</div>
          )}

          <button type="submit" disabled={loading} className="btn-primary" style={{ justifyContent: 'center', marginTop: 4 }}>
            {loading ? 'Creating account…' : 'Sign up'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontFamily: 'Barlow, sans-serif', fontSize: 13, color: '#6b7280', marginTop: 24 }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: '#F25800', fontWeight: 700, textDecoration: 'none' }}>
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}
