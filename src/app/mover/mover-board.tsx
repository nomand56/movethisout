'use client'

import { useState } from 'react'
import Link from 'next/link'
import { EffortBadge } from '@/components/effort-badge'
import { OfferModal } from '@/components/offer-modal'
import { estimatedValue } from '@/lib/effort'
import { timeAgo } from '@/lib/utils'
import { Truck, MapPin, Clock, Star, Package, CheckCircle, MessageCircle, Zap, Send } from 'lucide-react'

interface Props {
  userId: string
  profile: any
  requests: any[]
  activeJobs: any[]
  pendingOffers: any[]
  completedCount: number
}

const TAB_KEYS = ['browse', 'jobs', 'offers'] as const
type Tab = typeof TAB_KEYS[number]

export function MoverBoard({ userId, profile, requests, activeJobs, pendingOffers, completedCount }: Props) {
  const [tab, setTab] = useState<Tab>('browse')
  const [offerTarget, setOfferTarget] = useState<{ id: string; title: string; value: number | null } | null>(null)
  const [offerSentId, setOfferSentId] = useState<string | null>(null)

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'browse', label: 'Browse Requests', count: requests.length },
    { key: 'jobs', label: 'My Active Jobs', count: activeJobs.length },
    { key: 'offers', label: 'My Offers', count: pendingOffers.length },
  ]

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 16px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 28, textTransform: 'uppercase', letterSpacing: '0.02em', color: '#141414', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Truck color="#F25800" size={22} />
            Mover Board
          </h1>
          <p style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13, color: '#6b7280', marginTop: 4 }}>
            {profile?.full_name ?? 'Welcome'} ·{' '}
            {profile?.rating_count > 0
              ? `★ ${Number(profile.rating_avg).toFixed(1)} (${profile.rating_count} reviews)`
              : 'No reviews yet'}
          </p>
        </div>
        <Link href="/requester" style={{ fontFamily: 'Barlow, sans-serif', fontWeight: 600, fontSize: 12, color: '#F25800', border: '3px solid #F25800', padding: '6px 12px', textDecoration: 'none' }}>
          Switch to Requester →
        </Link>
      </div>

      {/* Stats bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Active jobs', value: activeJobs.length, bg: '#FFF3EE', color: '#F25800' },
          { label: 'Pending offers', value: pendingOffers.length, bg: '#FFF9C4', color: '#F57F17' },
          { label: 'Completed', value: completedCount, bg: '#E8F5E9', color: '#2E7D32' },
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

      {/* Browse tab */}
      {tab === 'browse' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {requests.length === 0 && (
            <div style={{ textAlign: 'center', padding: '64px 0', color: '#9ca3af' }}>
              <Package size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <p style={{ fontFamily: 'Barlow, sans-serif' }}>No open requests right now. Check back soon!</p>
            </div>
          )}
          {requests.map((req: any) => {
            const alreadyOffered = offerSentId === req.id
            const suggestedVal = req.estimated_distance_km
              ? estimatedValue(req.estimated_distance_km, req.item_size)
              : null

            return (
              <div key={req.id} style={{ background: '#FFFFFF', border: '3px solid #141414', padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'Barlow, sans-serif', fontWeight: 700, fontSize: 15, color: '#141414', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{req.title}</div>
                    <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12, color: '#9ca3af', marginTop: 3 }}>
                      by {req.profiles?.full_name ?? 'Community member'}
                      {req.profiles?.rating_count > 0 && (
                        <span style={{ marginLeft: 8 }}>
                          ★ {Number(req.profiles.rating_avg).toFixed(1)}
                        </span>
                      )}
                      <span style={{ marginLeft: 8 }}>· {timeAgo(req.created_at)}</span>
                    </div>
                  </div>
                  {req.effort_score !== null && <EffortBadge score={req.effort_score} />}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px', fontFamily: 'Barlow, sans-serif', fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <MapPin size={12} color="#F25800" />
                    {req.pickup_address?.split(',')[0]} → {req.dropoff_address?.split(',')[0]}
                  </span>
                  {req.estimated_distance_km && (
                    <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11 }}>{Number(req.estimated_distance_km).toFixed(1)} km</span>
                  )}
                  {req.estimated_duration_min && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={11} color="#F25800" />
                      ~{req.estimated_duration_min} min
                    </span>
                  )}
                  {suggestedVal && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11 }}>
                      <Zap size={11} />
                      ${suggestedVal} suggested
                    </span>
                  )}
                </div>

                {alreadyOffered ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'Barlow, sans-serif', fontSize: 13, color: '#2E7D32', background: '#E8F5E9', border: '1.5px solid #2E7D32', padding: '10px 14px' }}>
                    <CheckCircle size={15} />
                    Offer sent — waiting for requester response
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 10 }}>
                    <Link
                      href={`/requests/${req.id}`}
                      style={{ flex: 1, textAlign: 'center', border: '3px solid #141414', color: '#141414', padding: '10px', fontFamily: 'Barlow, sans-serif', fontWeight: 600, fontSize: 13, textDecoration: 'none' }}
                    >
                      View Details
                    </Link>
                    <button
                      onClick={() => setOfferTarget({ id: req.id, title: req.title, value: suggestedVal })}
                      className="btn-primary"
                      style={{ flex: 1, justifyContent: 'center', fontSize: 13, padding: '10px 16px' }}
                    >
                      <Send size={13} />
                      Make Offer
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Active jobs tab */}
      {tab === 'jobs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {activeJobs.length === 0 && (
            <div style={{ textAlign: 'center', padding: '64px 0', color: '#9ca3af' }}>
              <Truck size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <p style={{ fontFamily: 'Barlow, sans-serif' }}>No active jobs yet.</p>
              <button onClick={() => setTab('browse')} style={{ fontFamily: 'Barlow, sans-serif', color: '#F25800', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', marginTop: 8 }}>
                Browse requests →
              </button>
            </div>
          )}
          {activeJobs.map((job: any) => {
            const req = job.requests
            return (
              <Link
                key={job.id}
                href={`/job/${job.id}`}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FFFFFF', border: '3px solid #141414', padding: 20, textDecoration: 'none' }}
              >
                <div>
                  <div style={{ fontFamily: 'Barlow, sans-serif', fontWeight: 700, fontSize: 15, color: '#141414' }}>{req?.title}</div>
                  <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13, color: '#6b7280', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <MapPin size={11} color="#F25800" />
                    {req?.pickup_address?.split(',')[0]} → {req?.dropoff_address?.split(',')[0]}
                  </div>
                  <div style={{
                    display: 'inline-block', marginTop: 8,
                    fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase',
                    padding: '2px 8px', border: '1.5px solid #141414',
                    background: req?.status === 'in_progress' ? '#FFF9C4' : '#FFF3EE',
                    color: req?.status === 'in_progress' ? '#F57F17' : '#F25800',
                  }}>
                    {req?.status?.replace('_', ' ')}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {req?.effort_score !== null && <EffortBadge score={req.effort_score} />}
                  <MessageCircle size={18} color="#9ca3af" />
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Offers tab */}
      {tab === 'offers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {pendingOffers.length === 0 && (
            <div style={{ textAlign: 'center', padding: '64px 0', color: '#9ca3af' }}>
              <Send size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <p style={{ fontFamily: 'Barlow, sans-serif' }}>No pending offers.</p>
            </div>
          )}
          {pendingOffers.map((offer: any) => (
            <div key={offer.id} style={{ background: '#FFFFFF', border: '3px solid #141414', padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
                <div>
                  <div style={{ fontFamily: 'Barlow, sans-serif', fontWeight: 700, fontSize: 15, color: '#141414' }}>{offer.requests?.title}</div>
                  <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, color: '#9ca3af', marginTop: 3, letterSpacing: '0.05em' }}>{timeAgo(offer.created_at)}</div>
                </div>
                <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '2px 8px', background: '#FFF9C4', border: '1.5px solid #F57F17', color: '#F57F17' }}>
                  Pending
                </span>
              </div>
              <p style={{ fontFamily: 'Barlow, sans-serif', fontSize: 14, color: '#141414', background: '#EFEDEA', padding: '12px 16px', fontStyle: 'italic', marginBottom: 12 }}>
                "{offer.message}"
              </p>
              {offer.proposed_value && (
                <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13, color: '#6b7280', marginBottom: 12 }}>
                  Proposed value: <strong style={{ color: '#141414', fontFamily: 'Barlow Condensed, sans-serif' }}>${offer.proposed_value}</strong>
                </div>
              )}
              <Link
                href={`/requests/${offer.request_id}`}
                style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13, color: '#F25800', fontWeight: 600, textDecoration: 'none' }}
              >
                View request →
              </Link>
            </div>
          ))}
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
            setOfferSentId(offerTarget.id)
            setOfferTarget(null)
          }}
        />
      )}
    </div>
  )
}
