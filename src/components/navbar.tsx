'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import { ChevronDown, Package, Truck, Plus, Star } from 'lucide-react'
import type { User as SupabaseUser } from '@supabase/supabase-js'

export function Navbar() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<{ full_name: string | null; rating_avg: number; rating_count: number } | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  // Hide on mover subdomain pages
  if (pathname.startsWith('/mover-app')) return null

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
    router.push('/')
    router.refresh()
  }

  const isActive = (p: string) => pathname === p || pathname.startsWith(p + '/')

  return (
    <nav style={{ background: '#141414', borderBottom: '3px solid #141414' }} className="sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">

        {/* Wordmark */}
        <Link href="/" className="flex items-center gap-0 font-display text-xl uppercase tracking-wide" style={{ fontFamily: 'Anton, Impact, sans-serif', letterSpacing: '0.02em' }}>
          <span style={{ color: '#FFFFFF' }}>MoveThis</span>
          <span style={{ color: '#F25800' }}>Out</span>
          <span style={{ color: '#F25800' }}> →</span>
        </Link>

        {/* Centre nav — only when logged in */}
        {user && (
          <div className="hidden sm:flex items-center gap-1">
            <Link href="/requester" style={{
              color: isActive('/requester') ? '#FFFFFF' : '#9ca3af',
              background: isActive('/requester') ? '#F25800' : 'transparent',
              fontFamily: 'Barlow, sans-serif', fontWeight: 600, fontSize: 14,
              padding: '5px 14px', textDecoration: 'none', letterSpacing: '0.02em',
            }}>
              My Requests
            </Link>
            <Link href="/mover" style={{
              color: isActive('/mover') ? '#141414' : '#9ca3af',
              background: isActive('/mover') ? '#FFFFFF' : 'transparent',
              fontFamily: 'Barlow, sans-serif', fontWeight: 600, fontSize: 14,
              padding: '5px 14px', textDecoration: 'none', letterSpacing: '0.02em',
            }}>
              Move Board
            </Link>
          </div>
        )}

        {/* Right */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link href="/request/new" className="btn-primary hidden sm:inline-flex" style={{ fontSize: 13, padding: '7px 16px' }}>
                <Plus size={14} /> Post Job
              </Link>

              <div className="relative">
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
                    <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                    <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, width: 220, background: '#141414', border: '3px solid #F25800', zIndex: 20 }}>
                      <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(250,250,247,0.1)' }}>
                        <div style={{ fontFamily: 'Barlow, sans-serif', fontWeight: 700, color: '#FFFFFF', fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {profile?.full_name ?? 'Account'}
                        </div>
                        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, color: '#6b7280', marginTop: 2 }}>{user.email}</div>
                        {(profile?.rating_count ?? 0) > 0 && (
                          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
                            ★ {Number(profile!.rating_avg).toFixed(1)} · {profile!.rating_count} reviews
                          </div>
                        )}
                      </div>
                      {[
                        { href: '/requester', label: 'My Requests' },
                        { href: '/mover', label: 'Move Board' },
                        { href: '/request/new', label: 'Post New Job' },
                      ].map(item => (
                        <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}
                          style={{ display: 'block', padding: '10px 16px', color: '#FFFFFF', fontFamily: 'Barlow, sans-serif', fontSize: 14, textDecoration: 'none', borderBottom: '1px solid rgba(250,250,247,0.07)' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#F25800')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          {item.label}
                        </Link>
                      ))}
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
            </>
          ) : (
            <>
              <Link href="/login" style={{ color: '#9ca3af', fontFamily: 'Barlow, sans-serif', fontSize: 14, fontWeight: 600, padding: '6px 12px', textDecoration: 'none' }}>
                Log in
              </Link>
              <Link href="/signup" className="btn-primary" style={{ fontSize: 13, padding: '7px 16px' }}>
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
