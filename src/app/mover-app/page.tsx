import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Truck, ArrowRight, Star, Shield, Zap } from 'lucide-react'

export default async function MoverAppLanding() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    // Check onboarding status
    const { data: profile } = await (supabase.from('profiles') as any)
      .select('is_mover, mover_status')
      .eq('id', user.id)
      .single() as { data: any }

    if (profile?.is_mover && profile?.mover_status === 'active') {
      redirect('/mover-app/board')
    }
    redirect('/mover-app/onboarding')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#141414' }}>
      {/* Hero */}
      <section style={{ padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, letterSpacing: '0.15em', color: '#F25800', textTransform: 'uppercase', marginBottom: 24, border: '1.5px solid #F25800', padding: '4px 12px' }}>
            <Truck size={12} /> Mover Portal
          </div>
          <h1 style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 'clamp(48px, 8vw, 72px)', lineHeight: 1.0, textTransform: 'uppercase', letterSpacing: '0.02em', color: '#FFFFFF', marginBottom: 20 }}>
            Turn spare time<br />into <span style={{ color: '#F25800' }}>community rep →</span>
          </h1>
          <p style={{ fontFamily: 'Barlow, sans-serif', fontSize: 17, color: '#9ca3af', maxWidth: 480, margin: '0 auto 40px', lineHeight: 1.6 }}>
            Browse move requests near you, send offers at your own price, and build a rated profile people trust.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/mover-app/signup" className="btn-primary" style={{ fontSize: 15, padding: '14px 28px' }}>
              Join as Mover <ArrowRight size={16} />
            </Link>
            <Link href="/mover-app/login" className="btn-secondary" style={{ fontSize: 15, padding: '14px 28px', background: 'transparent', border: '2px solid #FFFFFF', color: '#FFFFFF' }}>
              Log in
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ background: '#EFEDEA', padding: '64px 24px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 'clamp(26px, 4vw, 36px)', textTransform: 'uppercase', letterSpacing: '0.02em', color: '#141414', textAlign: 'center', marginBottom: 40 }}>
            How it works
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            {[
              { icon: Truck, step: '01', title: 'Browse requests', desc: 'See all open move requests in real-time. Filter by distance, size, and effort score.' },
              { icon: Zap, step: '02', title: 'Send your offer', desc: 'Name your price, set your ETA, and write a short message. The requester picks the best offer.' },
              { icon: Star, step: '03', title: 'Complete & get rated', desc: 'Coordinate via in-app chat, do the move, and build your rating with every job.' },
            ].map(({ icon: Icon, step, title, desc }) => (
              <div key={step} style={{ background: '#FFFFFF', border: '3px solid #141414', padding: '24px 20px', boxShadow: '4px 4px 0 #141414' }}>
                <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, letterSpacing: '0.15em', color: '#F25800', textTransform: 'uppercase', marginBottom: 12 }}>Step {step}</div>
                <Icon size={22} color="#F25800" style={{ marginBottom: 10 }} />
                <h3 style={{ fontFamily: 'Barlow, sans-serif', fontWeight: 700, fontSize: 15, color: '#141414', marginBottom: 6 }}>{title}</h3>
                <p style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section style={{ background: '#141414', borderTop: '3px solid #F25800', padding: '48px 24px' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, textAlign: 'center' }}>
          {[
            { icon: Shield, label: 'Verified accounts', desc: 'Email-verified signup' },
            { icon: Star, label: 'Rated profiles', desc: 'Requesters rate every job' },
            { icon: Zap, label: 'Your price', desc: 'You set the offer, no middleman' },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label}>
              <Icon color="#F25800" size={24} style={{ margin: '0 auto 8px' }} />
              <div style={{ fontFamily: 'Barlow, sans-serif', fontWeight: 700, fontSize: 13, color: '#FFFFFF', marginBottom: 3 }}>{label}</div>
              <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12, color: '#6b7280' }}>{desc}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
