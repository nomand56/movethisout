'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { EffortBadge } from '@/components/effort-badge'
import { timeAgo } from '@/lib/utils'
import { Package, Plus, MapPin, Star, Check, X, Bell, Truck } from 'lucide-react'

const STATUS_STYLE: Record<string, { bg: string; color: string; borderColor: string }> = {
  open:        { bg: '#E8F5E9', color: '#2E7D32', borderColor: '#2E7D32' },
  accepted:    { bg: '#FFF3EE', color: '#F25800', borderColor: '#F25800' },
  in_progress: { bg: '#FFF9C4', color: '#F57F17', borderColor: '#F57F17' },
  completed:   { bg: '#F1F1F1', color: '#6b7280', borderColor: '#9ca3af' },
  cancelled:   { bg: '#FFEBEE', color: '#C62828', borderColor: '#C62828' },
}

interface Props {
  userId: string
  profile: any
  requests: any[]
  incomingOffers: any[]
}

export function RequesterBoard({ userId, profile, requests, incomingOffers }: Props) {
  const [tab, setTab] = useState<'requests' | 'offers'>(incomingOffers.length > 0 ? 'offers' : 'requests')
  const [processingOffer, setProcessingOffer] = useState<string | null>(null)
  const [localOffers, setLocalOffers] = useState(incomingOffers)
  const router = useRouter()

  async function handleOffer(offerId: string, action: 'accepted' | 'declined', requestId: string, moverId: string) {
    setProcessingOffer(offerId)
    const supabase = createClient()

    if (action === 'accepted') {
      await (supabase.from('profiles') as any).upsert(
        { id: moverId },
        { onConflict: 'id', ignoreDuplicates: true }
      )

      const { data: job } = await (supabase.from('jobs') as any)
        .insert({ request_id: requestId, volunteer_id: moverId })
        .select()
        .single() as { data: any }

      if (job) {
        await (supabase.from('requests') as any).update({ status: 'accepted' }).eq('id', requestId)
        await (supabase.from('offers') as any).update({ status: 'accepted' }).eq('id', offerId)
        await (supabase.from('offers') as any)
          .update({ status: 'declined' })
          .eq('request_id', requestId)
          .eq('status', 'pending')
          .neq('id', offerId)
        router.push(`/job/${job.id}`)
        return
      }
    } else {
      await (supabase.from('offers') as any).update({ status: 'declined' }).eq('id', offerId)
      setLocalOffers(prev => prev.filter(o => o.id !== offerId))
    }

    setProcessingOffer(null)
  }

  const pendingCount = localOffers.length
  const openRequests = requests.filter((r: any) => r.status === 'open')

  const tabs: { key: 'requests' | 'offers'; label: string; count: number }[] = [
    { key: 'requests', label: 'My Requests', count: requests.length },
    { key: 'offers', label: 'Incoming Offers', count: pendingCount },
  ]

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 16px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 28, textTransform: 'uppercase', letterSpacing: '0.02em', color: '#141414', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Package color="#F25800" size={22} />
            Requester Board
          </h1>
          <p style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13, color: '#6b7280', marginTop: 4 }}>
            {profile?.full_name ?? 'Welcome'} ·{' '}
            {profile?.rating_count > 0
              ? `★ ${Number(profile.rating_avg).toFixed(1)} (${profile.rating_count} reviews)`
              : 'No reviews yet'}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link href="/mover" style={{ fontFamily: 'Barlow, sans-serif', fontWeight: 600, fontSize: 12, color: '#6b7280', border: '3px solid #141414', padding: '6px 12px', textDecoration: 'none' }}>
            Switch to Mover →
          </Link>
          <Link href="/request/new" className="btn-primary" style={{ fontSize: 13, padding: '8px 16px' }}>
            <Plus size={14} />
            New Request
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Open', value: openRequests.length, bg: '#E8F5E9', color: '#2E7D32' },
          { label: 'Pending offers', value: pendingCount, bg: pendingCount > 0 ? '#FFF9C4' : '#F5F5F5', color: pendingCount > 0 ? '#F57F17' : '#6b7280' },
          { label: 'Total requests', value: requests.length, bg: '#FFF3EE', color: '#F25800' },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, border: '3px solid #141414', padding: '12px 16px' }}>
            <div style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 26, color: s.color }}>{s.value}</div>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '3px solid #141414', marginBottom: 24 }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '10px 16px',
              fontFamily: 'Barlow, sans-serif',
              fontWeight: 600,
              fontSize: 13,
              border: 'none',
              background: tab === t.key ? '#F25800' : 'transparent',
              color: tab === t.key ? '#FFFFFF' : '#6b7280',
              cursor: 'pointer',
              borderBottom: tab === t.key ? '3px solid #F25800' : '2px solid transparent',
              marginBottom: -2,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {t.label}
            {t.count > 0 && (
              <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, background: tab === t.key ? 'rgba(250,250,247,0.25)' : '#141414', color: '#FFFFFF', padding: '1px 6px', letterSpacing: '0.05em' }}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* My requests tab */}
      {tab === 'requests' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {requests.length === 0 && (
            <div style={{ textAlign: 'center', padding: '64px 16px', border: '2px dashed #9ca3af', color: '#9ca3af' }}>
              <Package size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <p style={{ fontFamily: 'Barlow, sans-serif', marginBottom: 16 }}>No requests yet.</p>
              <Link href="/request/new" className="btn-primary" style={{ fontSize: 13, padding: '8px 20px' }}>
                <Plus size={14} /> Post your first request
              </Link>
            </div>
          )}
          {requests.map((req: any) => {
            const pendingOffers = (req.offers ?? []).filter((o: any) => o.status === 'pending').length
            const ss = STATUS_STYLE[req.status] ?? STATUS_STYLE.completed
            return (
              <Link
                key={req.id}
                href={`/requests/${req.id}`}
                style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', background: '#FFFFFF', border: '3px solid #141414', padding: 20, textDecoration: 'none' }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                    <span style={{ fontFamily: 'Barlow, sans-serif', fontWeight: 700, fontSize: 15, color: '#141414', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{req.title}</span>
                    <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '2px 7px', background: ss.bg, border: `1.5px solid ${ss.borderColor}`, color: ss.color }}>
                      {req.status.replace('_', ' ')}
                    </span>
                    {pendingOffers > 0 && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '2px 7px', background: '#FFF9C4', border: '1.5px solid #F57F17', color: '#F57F17' }}>
                        <Bell size={9} /> {pendingOffers} offer{pendingOffers > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <MapPin size={11} color="#F25800" />
                    {req.pickup_address?.split(',')[0]} → {req.dropoff_address?.split(',')[0]}
                  </div>
                  <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, color: '#9ca3af', marginTop: 4, letterSpacing: '0.05em' }}>{timeAgo(req.created_at)}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, marginLeft: 12, flexShrink: 0 }}>
                  {req.effort_score !== null && <EffortBadge score={req.effort_score} />}
                  <span style={{ color: '#9ca3af', fontSize: 16 }}>›</span>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Incoming offers tab */}
      {tab === 'offers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {localOffers.length === 0 && (
            <div style={{ textAlign: 'center', padding: '64px 0', color: '#9ca3af' }}>
              <Bell size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <p style={{ fontFamily: 'Barlow, sans-serif' }}>No pending offers yet.</p>
              <p style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13, marginTop: 4 }}>When movers make offers on your requests, they'll appear here.</p>
            </div>
          )}
          {localOffers.map((offer: any) => (
            <div key={offer.id} style={{ background: '#FFFFFF', border: '3px solid #141414' }}>
              {/* Request header */}
              <div style={{ padding: '10px 20px', background: '#EFEDEA', borderBottom: '3px solid #141414', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'Barlow, sans-serif', fontWeight: 700, fontSize: 13, color: '#141414' }}>{offer.requests?.title}</span>
                <Link href={`/requests/${offer.request_id}`} style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12, color: '#F25800', fontWeight: 600, textDecoration: 'none' }}>
                  View →
                </Link>
              </div>

              <div style={{ padding: 20 }}>
                {/* Mover info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 40, height: 40, background: '#FFF3EE', border: '3px solid #F25800', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Truck color="#F25800" size={18} />
                  </div>
                  <div>
                    <div style={{ fontFamily: 'Barlow, sans-serif', fontWeight: 700, fontSize: 14, color: '#141414' }}>{offer.profiles?.full_name ?? 'Community mover'}</div>
                    {offer.profiles?.rating_count > 0 ? (
                      <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Star size={11} color="#F57F17" fill="#F57F17" />
                        {Number(offer.profiles.rating_avg).toFixed(1)} · {offer.profiles.rating_count} reviews
                      </div>
                    ) : (
                      <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, color: '#9ca3af', letterSpacing: '0.05em' }}>New mover</div>
                    )}
                  </div>
                  <div style={{ marginLeft: 'auto', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, color: '#9ca3af', letterSpacing: '0.05em' }}>{timeAgo(offer.created_at)}</div>
                </div>

                {/* Message */}
                <div style={{ background: '#EFEDEA', padding: '12px 16px', marginBottom: 14, fontFamily: 'Barlow, sans-serif', fontSize: 14, color: '#141414', fontStyle: 'italic' }}>
                  "{offer.message}"
                </div>

                {/* Proposed value */}
                {offer.proposed_value && (
                  <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13, color: '#6b7280', marginBottom: 14 }}>
                    Proposed effort value:{' '}
                    <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, color: '#141414' }}>${offer.proposed_value}</span>
                    <span style={{ color: '#9ca3af', marginLeft: 4 }}>(informational)</span>
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={() => handleOffer(offer.id, 'declined', offer.request_id, offer.mover_id)}
                    disabled={processingOffer === offer.id}
                    className="btn-secondary"
                    style={{ flex: 1, justifyContent: 'center', fontSize: 13, padding: '10px 16px' }}
                  >
                    <X size={14} />
                    Decline
                  </button>
                  <button
                    onClick={() => handleOffer(offer.id, 'accepted', offer.request_id, offer.mover_id)}
                    disabled={processingOffer === offer.id}
                    className="btn-primary"
                    style={{ flex: 1, justifyContent: 'center', fontSize: 13, padding: '10px 16px', background: '#1B6B35', borderColor: '#1B6B35' }}
                  >
                    <Check size={14} />
                    {processingOffer === offer.id ? 'Processing…' : 'Accept Offer'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
