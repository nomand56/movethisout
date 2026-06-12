'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Mail } from 'lucide-react'

export default function MoverSignupPage() {
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
      // Logged in — go to onboarding
      window.location.href = '/mover-app/onboarding'
    } else {
      setEmailSent(true)
      setLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px', background: '#141414' }}>
        <div style={{ width: '100%', maxWidth: 400, border: '3px solid #F25800', background: '#FFFFFF', padding: 40, boxShadow: '4px 4px 0 #F25800', textAlign: 'center' }}>
          <div style={{ width: 52, height: 52, background: '#EFEDEA', border: '3px solid #141414', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Mail color="#F25800" size={22} />
          </div>
          <h1 style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 24, textTransform: 'uppercase', letterSpacing: '0.02em', color: '#141414', marginBottom: 8 }}>Check your email</h1>
          <p style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13, color: '#6b7280', marginBottom: 24, lineHeight: 1.6 }}>
            We sent a confirmation link to <strong style={{ color: '#141414' }}>{email}</strong>. Click it to activate your account.
          </p>
          <Link href="/mover-app/login" className="btn-primary" style={{ display: 'block', textAlign: 'center', justifyContent: 'center' }}>
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px', background: '#141414' }}>
      <div style={{ width: '100%', maxWidth: 400, border: '3px solid #F25800', background: '#FFFFFF', padding: 40, boxShadow: '4px 4px 0 #F25800' }}>
        <Link href="/mover-app" style={{ display: 'inline-block', marginBottom: 28, textDecoration: 'none' }}>
          <span style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 18, letterSpacing: '0.02em', textTransform: 'uppercase', color: '#141414' }}>MoveThis</span>
          <span style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 18, letterSpacing: '0.02em', textTransform: 'uppercase', color: '#F25800' }}>Out</span>
          <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, letterSpacing: '0.15em', color: '#F25800', border: '1.5px solid #F25800', padding: '1px 5px', marginLeft: 6, textTransform: 'uppercase' }}>MOVER</span>
        </Link>
        <h1 style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 26, textTransform: 'uppercase', letterSpacing: '0.02em', color: '#141414', marginBottom: 4 }}>Join as mover</h1>
        <p style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13, color: '#6b7280', marginBottom: 24 }}>Set up your free mover account</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontFamily: 'Barlow, sans-serif', fontWeight: 600, fontSize: 13, color: '#141414', marginBottom: 6 }}>Full name</label>
            <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required className="brand-input" placeholder="Jane Smith" />
          </div>
          <div>
            <label style={{ display: 'block', fontFamily: 'Barlow, sans-serif', fontWeight: 600, fontSize: 13, color: '#141414', marginBottom: 6 }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="brand-input" placeholder="you@example.com" />
          </div>
          <div>
            <label style={{ display: 'block', fontFamily: 'Barlow, sans-serif', fontWeight: 600, fontSize: 13, color: '#141414', marginBottom: 6 }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} className="brand-input" placeholder="At least 6 characters" />
          </div>
          {error && <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13, color: '#F25800', border: '1.5px solid #F25800', padding: '10px 14px' }}>{error}</div>}
          <button type="submit" disabled={loading} className="btn-primary" style={{ justifyContent: 'center', marginTop: 4 }}>
            {loading ? 'Creating account…' : 'Create mover account →'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontFamily: 'Barlow, sans-serif', fontSize: 13, color: '#6b7280', marginTop: 20 }}>
          Already have an account?{' '}
          <Link href="/mover-app/login" style={{ color: '#F25800', fontWeight: 700, textDecoration: 'none' }}>Log in</Link>
        </p>
      </div>
    </div>
  )
}
