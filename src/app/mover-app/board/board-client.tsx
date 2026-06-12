'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { EffortBadge } from '@/components/effort-badge'
import { OfferModal } from '@/components/offer-modal'
import { estimatedValue } from '@/lib/effort'
import { timeAgo } from '@/lib/utils'
import { MapPin, Clock, Zap, Send, CheckCircle, Users, Truck } from 'lucide-react'

const SIZE_ICON: Record<string, string> = {
  small: '📦', medium: '🗃️', large: '🛋️', extra_large: '🚛'
}

const VEHICLE_ICON: Record<string, string> = {
  sedan: '🚗', suv: '🚙', pickup: '🛻', van: '🚐', truck: '🚛', other: '🚌'
}

interface Props {
  userId: string
  profile: any
  initialRequests: any[]
  initialOfferCounts: Record<string, number>
  initialMyOffers: Record<string, any>
}

export function BoardClient({ userId, profile, initialRequests, initialOfferCounts, initialMyOffers }: Props) {
  const [requests, setRequests] = useState(initialRequests)
  const [offerCounts, setOfferCounts] = useState<Record<string, number>>(initialOfferCounts)
  const [myOffers, setMyOffers] = useState<Record<string, any>>(initialMyOffers)
  const [offerTarget, setOfferTarget] = useState<{ id: string; title: string; value: number | null } | null>(null)
  const [filter, setFilter] = useState<'all' | 'small' | 'medium' | 'large' | 'extra_large'>('all')

  useEffect(() => {
    const supabase = createClient()

    // Real-time: new requests posted
    const reqChannel = supabase.channel('board-requests')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'requests',
      }, (payload) => {
        const newReq = payload.new as any
        if (newReq.status === 'open' && newReq.requester_id !== userId) {
          setRequests(prev => [newReq, ...prev])
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'requests',
      }, (payload) => {
        const updated = payload.new as any
        if (updated.status !== 'open') {
          setRequests(prev => prev.filter(r => r.id !== updated.id))
        }
      })
      .subscribe()

    // Real-time: new offers (update counts)
    const offersChannel = supabase.channel('board-offers')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'offers',
      }, (payload) => {
        const offer = payload.new as any
        setOfferCounts(prev => ({
          ...prev,
          [offer.request_id]: (prev[offer.request_id] ?? 0) + 1,
        }))
      })
      .subscribe()

    return () => {
      supabase.removeChannel(reqChannel)
      supabase.removeChannel(offersChannel)
    }
  }, [userId])

  const filtered = filter === 'all'
    ? requests
    : requests.filter(r => r.item_size === filter)

  const activeOfferCount = Object.values(myOffers).filter(o => o.status === 'pending').length

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 16px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 28, textTransform: 'uppercase', letterSpacing: '0.02em', color: '#141414' }}>
            Request Board
          </h1>
          <p style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13, color: '#6b7280', marginTop: 3, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>{VEHICLE_ICON[profile?.vehicle_type ?? ''] ?? '🚗'} {profile?.vehicle_type ?? ''}</span>
            <span>·</span>
            <span>{profile?.service_city ?? ''}</span>
            {(profile?.rating_count ?? 0) > 0 && (
              <>
                <span>·</span>
                <span>★ {Number(profile.rating_avg).toFixed(1)}</span>
              </>
            )}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, color: '#2E7D32', border: '1.5px solid #2E7D32', padding: '4px 10px', background: '#E8F5E9' }}>
            <div style={{ width: 7, height: 7, background: '#2E7D32', borderRadius: '50%' }} />
            LIVE · {requests.length} open
          </div>
          {activeOfferCount > 0 && (
            <Link href="/mover-app/offers" style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, color: '#F57F17', border: '1.5px solid #F57F17', padding: '4px 10px', background: '#FFF9C4', textDecoration: 'none', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              {activeOfferCount} offer{activeOfferCount > 1 ? 's' : ''} pending
            </Link>
          )}
        </div>
      </div>

      {/* Size filter */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {(['all', 'small', 'medium', 'large', 'extra_large'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase',
            padding: '4px 10px', border: '2px solid', cursor: 'pointer',
            borderColor: filter === f ? '#141414' : '#e5e7eb',
            background: filter === f ? '#141414' : '#FFFFFF',
            color: filter === f ? '#FFFFFF' : '#6b7280',
          }}>
            {f === 'all' ? 'All sizes' : f === 'extra_large' ? 'XL' : f}
            {f !== 'all' && (
              <span style={{ marginLeft: 4 }}>{SIZE_ICON[f]}</span>
            )}
          </button>
        ))}
      </div>

      {/* Request cards */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#9ca3af' }}>
          <Truck size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
          <p style={{ fontFamily: 'Barlow, sans-serif', fontSize: 15 }}>No open requests right now.</p>
          <p style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13, marginTop: 4 }}>New requests appear here in real-time.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((req: any) => {
            const myOffer = myOffers[req.id]
            const count = offerCounts[req.id] ?? 0
            const suggestedVal = req.estimated_distance_km
              ? estimatedValue(req.estimated_distance_km, req.item_size)
              : null

            return (
              <div key={req.id} style={{ background: '#FFFFFF', border: '3px solid #141414', padding: 20 }}>

                {/* Top row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                  <span style={{ fontSize: 24, flexShrink: 0 }}>{SIZE_ICON[req.item_size] ?? '📦'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'Barlow, sans-serif', fontWeight: 700, fontSize: 16, color: '#141414', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {req.title}
                    </div>
                    <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                      by {req.profiles?.full_name ?? 'Community member'}
                      {req.profiles?.rating_count > 0 && <span style={{ marginLeft: 6 }}>★ {Number(req.profiles.rating_avg).toFixed(1)}</span>}
                      <span style={{ marginLeft: 6 }}>· {timeAgo(req.created_at)}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                    {req.effort_score !== null && <EffortBadge score={req.effort_score} />}
                    {count > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#F57F17', border: '1.5px solid #F57F17', padding: '2px 7px', background: '#FFF9C4' }}>
                        <Users size={9} /> {count} offer{count > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </div>

                {/* Route + stats */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px', fontFamily: 'Barlow, sans-serif', fontSize: 13, color: '#6b7280', marginBottom: 14 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <MapPin size={12} color="#F25800" />
                    {req.pickup_address?.split(',')[0]} → {req.dropoff_address?.split(',')[0]}
                  </span>
                  {req.estimated_distance_km && (
                    <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11 }}>
                      {Number(req.estimated_distance_km).toFixed(1)} km
                    </span>
                  )}
                  {req.estimated_duration_min && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11 }}>
                      <Clock size={10} />~{req.estimated_duration_min} min
                    </span>
                  )}
                  {suggestedVal && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, color: '#9ca3af' }}>
                      <Zap size={10} />${suggestedVal} suggested
                    </span>
                  )}
                </div>

                {/* CTA */}
                {myOffer ? (
                  <div>
                    {myOffer.status === 'pending' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'Barlow, sans-serif', fontSize: 13, color: '#F57F17', background: '#FFF9C4', border: '1.5px solid #F57F17', padding: '10px 14px' }}>
                        <Send size={13} />
                        Offer sent — waiting for requester
                        {myOffer.proposed_value && <span style={{ fontFamily: 'Barlow Condensed, sans-serif', marginLeft: 'auto' }}>${myOffer.proposed_value}</span>}
                        {myOffer.eta_minutes && <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, color: '#9ca3af' }}>{myOffer.eta_minutes} min ETA</span>}
                      </div>
                    )}
                    {myOffer.status === 'accepted' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'Barlow, sans-serif', fontSize: 13, fontWeight: 700, color: '#2E7D32', background: '#E8F5E9', border: '1.5px solid #2E7D32', padding: '10px 14px', justifyContent: 'space-between' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <CheckCircle size={15} />
                          Offer accepted!
                        </span>
                        <Link href={`/job`} style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, color: '#F25800', textDecoration: 'none', letterSpacing: '0.05em' }}>
                          View Job →
                        </Link>
                      </div>
                    )}
                    {myOffer.status === 'declined' && (
                      <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13, color: '#9ca3af', background: '#F5F5F5', border: '1.5px solid #e5e7eb', padding: '10px 14px' }}>
                        Your offer was declined by the requester.
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 10 }}>
                    <Link href={`/requests/${req.id}`} style={{ flex: 1, textAlign: 'center', border: '3px solid #141414', color: '#141414', padding: '10px', fontFamily: 'Barlow, sans-serif', fontWeight: 600, fontSize: 13, textDecoration: 'none' }}>
                      View Details
                    </Link>
                    <button
                      onClick={() => setOfferTarget({ id: req.id, title: req.title, value: suggestedVal })}
                      className="btn-primary"
                      style={{ flex: 1, justifyContent: 'center', fontSize: 13, padding: '10px 16px' }}
                    >
                      <Send size={13} />
                      Send Offer
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Offer modal */}
      {offerTarget && (
        <OfferModal
          requestId={offerTarget.id}
          requestTitle={offerTarget.title}
          suggestedValue={offerTarget.value}
          onClose={() => setOfferTarget(null)}
          onSuccess={() => {
            // Optimistically mark offer as sent
            setMyOffers(prev => ({
              ...prev,
              [offerTarget.id]: { request_id: offerTarget.id, status: 'pending' }
            }))
            setOfferTarget(null)
          }}
        />
      )}
    </div>
  )
}
