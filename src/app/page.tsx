import Link from 'next/link'
import { ArrowRight, Package, Truck, Star, Shield, Clock } from 'lucide-react'

export default function Home() {
  return (
    <div className="flex flex-col">

      {/* Hero */}
      <section style={{ background: '#141414' }} className="px-6 py-24">
        <div className="max-w-3xl mx-auto text-center">
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, letterSpacing: '0.15em', color: '#F25800', textTransform: 'uppercase', marginBottom: 24 }}>
            Community-powered logistics
          </div>
          <h1 style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 'clamp(48px, 8vw, 80px)', lineHeight: 1.0, textTransform: 'uppercase', letterSpacing: '0.02em', color: '#FFFFFF', marginBottom: 24 }}>
            Move anything.<br />
            <span style={{ color: '#F25800' }}>Together. →</span>
          </h1>
          <p style={{ fontFamily: 'Barlow, sans-serif', fontSize: 18, color: '#9ca3af', maxWidth: 520, margin: '0 auto 48px', lineHeight: 1.6 }}>
            Post a move request or volunteer to help — coordinate, negotiate, and get things moving in your community.
          </p>

          {/* Two paths */}
          <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            <Link
              href="/requester"
              style={{ background: '#F25800', border: '3px solid #F25800', color: '#FFFFFF', padding: '28px 24px', textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', boxShadow: '4px 4px 0 rgba(250,250,247,0.12)' }}
            >
              <Package size={28} style={{ marginBottom: 16 }} />
              <div style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 22, textTransform: 'uppercase', letterSpacing: '0.02em', marginBottom: 8 }}>I need a move</div>
              <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 14, color: 'rgba(250,250,247,0.7)', marginBottom: 16, lineHeight: 1.5 }}>Post a request and get help from movers in your area.</div>
              <div style={{ fontFamily: 'Barlow, sans-serif', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, marginTop: 'auto' }}>
                Post a request <ArrowRight size={14} />
              </div>
            </Link>

            <Link
              href="/mover"
              style={{ background: '#FFFFFF', border: '2px solid #FFFFFF', color: '#141414', padding: '28px 24px', textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', boxShadow: '4px 4px 0 rgba(250,250,247,0.12)' }}
            >
              <Truck size={28} style={{ marginBottom: 16 }} />
              <div style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 22, textTransform: 'uppercase', letterSpacing: '0.02em', marginBottom: 8 }}>I'm a mover</div>
              <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 14, color: '#6b7280', marginBottom: 16, lineHeight: 1.5 }}>Browse requests, make offers, and earn community trust.</div>
              <div style={{ fontFamily: 'Barlow, sans-serif', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, marginTop: 'auto' }}>
                Browse jobs <ArrowRight size={14} />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ background: '#EFEDEA' }} className="px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center" style={{ marginBottom: 48 }}>
            <h2 style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 'clamp(28px, 4vw, 42px)', textTransform: 'uppercase', letterSpacing: '0.02em', color: '#141414' }}>How it works</h2>
            <p style={{ fontFamily: 'Barlow, sans-serif', color: '#6b7280', marginTop: 8 }}>Simple, transparent, community-driven.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { icon: Package, step: '01', title: 'Post a request', desc: 'Share pickup & dropoff, item details, photos. The system calculates distance and an effort score automatically.' },
              { icon: Truck, step: '02', title: 'Movers respond', desc: 'Community movers browse your request. They can accept directly or negotiate with a message and proposed terms.' },
              { icon: Star, step: '03', title: 'Move & rate', desc: 'Coordinate in-app chat, complete the move, then rate each other. Reputation is everything.' },
            ].map(({ icon: Icon, step, title, desc }) => (
              <div key={step} style={{ background: '#FFFFFF', border: '3px solid #141414', padding: '28px 24px', boxShadow: '4px 4px 0 #141414' }}>
                <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, letterSpacing: '0.15em', color: '#F25800', textTransform: 'uppercase', marginBottom: 16 }}>Step {step}</div>
                <Icon size={24} color="#F25800" style={{ marginBottom: 12 }} />
                <h3 style={{ fontFamily: 'Barlow, sans-serif', fontWeight: 700, fontSize: 16, color: '#141414', marginBottom: 8 }}>{title}</h3>
                <p style={{ fontFamily: 'Barlow, sans-serif', fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust pillars */}
      <section style={{ background: '#FFFFFF', borderTop: '3px solid #141414' }} className="px-6 py-16">
        <div className="max-w-3xl mx-auto grid sm:grid-cols-3 gap-8 text-center">
          {[
            { icon: Shield, label: 'Auth-protected', desc: 'Every action requires a verified account' },
            { icon: Clock, label: 'Effort scoring', desc: 'Fair, transparent distance & time estimates' },
            { icon: Star, label: 'Mutual ratings', desc: 'Both sides rate — accountability for all' },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <Icon color="#F25800" size={26} />
              <div style={{ fontFamily: 'Barlow, sans-serif', fontWeight: 700, fontSize: 14, color: '#141414' }}>{label}</div>
              <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>{desc}</div>
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}
