import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { timeAgo } from '@/lib/utils'
import { Send, Clock, CheckCircle, X, ArrowRight } from 'lucide-react'

const STATUS_STYLE: Record<string, { bg: string; color: string; border: string; label: string }> = {
  pending:  { bg: '#FFF9C4', color: '#F57F17', border: '#F57F17', label: 'Pending' },
  accepted: { bg: '#E8F5E9', color: '#2E7D32', border: '#2E7D32', label: 'Accepted' },
  declined: { bg: '#F5F5F5', color: '#9ca3af', border: '#e5e7eb', label: 'Declined' },
}

export default async function MyOffersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/mover-app/login?redirectTo=/mover-app/offers')

  const { data: profile } = await (supabase.from('profiles') as any)
    .select('is_mover, mover_status')
    .eq('id', user.id)
    .single() as { data: any }

  if (!profile?.is_mover || profile?.mover_status !== 'active') redirect('/mover-app/onboarding')

  const { data: offersData } = await (supabase.from('offers') as any)
    .select('*, requests(id, title, pickup_address, dropoff_address, status, estimated_distance_km, effort_score)')
    .eq('mover_id', user.id)
    .order('created_at', { ascending: false })

  const offers = (offersData ?? []) as any[]
  const pending = offers.filter(o => o.status === 'pending')
  const others = offers.filter(o => o.status !== 'pending')

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '28px 16px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 28, textTransform: 'uppercase', letterSpacing: '0.02em', color: '#141414' }}>My Offers</h1>
        <p style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13, color: '#6b7280', marginTop: 4 }}>Track all offers you've sent to requesters.</p>
      </div>

      {offers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0', color: '#9ca3af' }}>
          <Send size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <p style={{ fontFamily: 'Barlow, sans-serif', fontSize: 15 }}>No offers sent yet.</p>
          <Link href="/mover-app/board" className="btn-primary" style={{ display: 'inline-flex', marginTop: 16, fontSize: 13, padding: '10px 20px' }}>
            Browse Requests →
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Pending offers */}
          {pending.length > 0 && (
            <div>
              <h2 style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 16, textTransform: 'uppercase', letterSpacing: '0.02em', color: '#141414', marginBottom: 12 }}>
                Awaiting response ({pending.length})
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {pending.map((offer: any) => <OfferCard key={offer.id} offer={offer} />)}
              </div>
            </div>
          )}

          {/* Past offers */}
          {others.length > 0 && (
            <div>
              <h2 style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 16, textTransform: 'uppercase', letterSpacing: '0.02em', color: '#141414', marginBottom: 12 }}>
                Past offers ({others.length})
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {others.map((offer: any) => <OfferCard key={offer.id} offer={offer} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function OfferCard({ offer }: { offer: any }) {
  const ss = STATUS_STYLE[offer.status] ?? STATUS_STYLE.declined
  const req = offer.requests

  return (
    <div style={{ background: '#FFFFFF', border: '3px solid #141414', padding: 18 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Barlow, sans-serif', fontWeight: 700, fontSize: 15, color: '#141414', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {req?.title ?? 'Request'}
          </div>
          {req?.pickup_address && (
            <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12, color: '#6b7280', marginTop: 2 }}>
              {req.pickup_address.split(',')[0]} → {req.dropoff_address?.split(',')[0]}
            </div>
          )}
        </div>
        <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '3px 8px', border: `1.5px solid ${ss.border}`, background: ss.bg, color: ss.color, flexShrink: 0 }}>
          {ss.label}
        </span>
      </div>

      <div style={{ background: '#EFEDEA', padding: '10px 14px', fontFamily: 'Barlow, sans-serif', fontSize: 13, color: '#141414', fontStyle: 'italic', marginBottom: 10 }}>
        "{offer.message}"
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, color: '#6b7280' }}>
        {offer.proposed_value && <span>${offer.proposed_value}</span>}
        {offer.eta_minutes && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Clock size={10} /> {offer.eta_minutes} min ETA
          </span>
        )}
        <span style={{ marginLeft: 'auto' }}>{timeAgo(offer.created_at)}</span>
      </div>

      {offer.status === 'accepted' && req?.id && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(27,31,38,0.1)' }}>
          <Link href={`/mover-app/jobs`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'Barlow, sans-serif', fontWeight: 700, fontSize: 13, color: '#F25800', textDecoration: 'none' }}>
            Open Job Card <ArrowRight size={13} />
          </Link>
        </div>
      )}
    </div>
  )
}
