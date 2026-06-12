'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { usePathname } from 'next/navigation'
import { ChevronDown, Truck, LayoutGrid, Send, Briefcase } from 'lucide-react'
import type { User as SupabaseUser } from '@supabase/supabase-js'

export function MoverNavbar() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<{ full_name: string | null; rating_avg: number; rating_count: number } | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      if (data.user) loadProfile(data.user.id)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
      if (session?.user) loadProfile(session.user.id)
      else setProfile(null)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function loadProfile(id: string) {
    const { data } = await (supabase.from('profiles') as any)
      .select('full_name, rating_avg, rating_count')
      .eq('id', id).single()
    if (data) setProfile(data)
  }

  async function signOut() {
    await supabase.auth.signOut()
    window.location.href = '/mover-app'
  }

  const navLinks = [
    { href: '/mover-app/board', label: 'Board', icon: LayoutGrid },
    { href: '/mover-app/offers', label: 'My Offers', icon: Send },
    { href: '/mover-app/jobs', label: 'My Jobs', icon: Briefcase },
  ]

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  return (
    <nav style={{ background: '#141414', borderBottom: '3px solid #F25800' }} className="sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">

        {/* Wordmark */}
        <Link href="/mover-app" style={{ display: 'flex', alignItems: 'center', gap: 0, textDecoration: 'none', fontFamily: 'Anton, Impact, sans-serif', fontSize: 18, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
          <span style={{ color: '#FFFFFF' }}>MoveThis</span>
          <span style={{ color: '#F25800' }}>Out</span>
          <span style={{ fontSize: 13, fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.15em', marginLeft: 8, padding: '2px 6px', border: '1.5px solid #F25800', color: '#F25800', textTransform: 'uppercase' }}>MOVER</span>
        </Link>

        {/* Centre nav — only when logged in */}
        {user && (
          <div className="hidden sm:flex items-center gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} style={{
                color: isActive(href) ? '#FFFFFF' : '#9ca3af',
                background: isActive(href) ? '#F25800' : 'transparent',
                fontFamily: 'Barlow, sans-serif', fontWeight: 600, fontSize: 13,
                padding: '5px 14px', textDecoration: 'none', letterSpacing: '0.02em',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <Icon size={13} />
                {label}
              </Link>
            ))}
          </div>
        )}

        {/* Right */}
        <div className="flex items-center gap-2">
          {user ? (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setMenuOpen(o => !o)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', cursor: 'pointer', background: 'transparent', border: 'none', color: '#FFFFFF' }}
              >
                <div style={{ width: 28, height: 28, background: '#F25800', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Anton, Impact, sans-serif', fontSize: 14, color: '#FFFFFF' }}>
                  {profile?.full_name?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase() ?? '?'}
                </div>
                <ChevronDown size={13} color="#9ca3af" />
              </button>

              {menuOpen && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setMenuOpen(false)} />
                  <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, width: 220, background: '#141414', border: '3px solid #F25800', zIndex: 20 }}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(250,250,247,0.1)' }}>
                      <div style={{ fontFamily: 'Barlow, sans-serif', fontWeight: 700, color: '#FFFFFF', fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {profile?.full_name ?? 'Mover'}
                      </div>
                      <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, color: '#6b7280', marginTop: 2 }}>{user.email}</div>
                      {(profile?.rating_count ?? 0) > 0 && (
                        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
                          ★ {Number(profile!.rating_avg).toFixed(1)} · {profile!.rating_count} reviews
                        </div>
                      )}
                    </div>
                    {/* Mobile nav links */}
                    <div className="sm:hidden">
                      {navLinks.map(({ href, label }) => (
                        <Link key={href} href={href} onClick={() => setMenuOpen(false)}
                          style={{ display: 'block', padding: '10px 16px', color: '#FFFFFF', fontFamily: 'Barlow, sans-serif', fontSize: 14, textDecoration: 'none', borderBottom: '1px solid rgba(250,250,247,0.07)' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#F25800')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          {label}
                        </Link>
                      ))}
                    </div>
                    <button onClick={() => { setMenuOpen(false); signOut() }}
                      style={{ width: '100%', textAlign: 'left', padding: '10px 16px', color: '#F25800', fontFamily: 'Barlow, sans-serif', fontSize: 14, background: 'transparent', border: 'none', cursor: 'pointer' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,107,44,0.1)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <Link href="/mover-app/login" style={{ color: '#9ca3af', fontFamily: 'Barlow, sans-serif', fontSize: 14, fontWeight: 600, padding: '6px 12px', textDecoration: 'none' }}>
                Log in
              </Link>
              <Link href="/mover-app/signup" className="btn-primary" style={{ fontSize: 13, padding: '7px 16px' }}>
                Join as Mover
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
