'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { OfferModal } from '@/components/offer-modal'
import { timeAgo } from '@/lib/utils'
import { Send, CheckCircle, Star, X, Check, Truck, LogIn, Clock, ArrowUpDown, Zap } from 'lucide-react'

interface Props {
  requestId: string
  requestTitle: string
  requestStatus: string
  suggestedValue: number | null
  userId: string | null
  isOwner: boolean
  existingJob: { id: string } | null
  myOffer: { id: string; message: string; status: string; proposed_value: number | null } | null
  offers: any[]
}

type SortKey = 'newest' | 'price_asc' | 'rating_desc'

const SORT_LABELS: Record<SortKey, string> = {
  newest:      'Newest',
  price_asc:   'Price ↑',
  rating_desc: 'Rating ↓',
}

export function RequestActions({
  requestId, requestTitle, requestStatus, suggestedValue,
  userId, isOwner, existingJob, myOffer, offers,
}: Props) {
  const [showOfferModal, setShowOfferModal] = useState(false)
  const [offerSent, setOfferSent] = useState(false)
  const [acceptingDirect, setAcceptingDirect] = useState(false)
  const [processingOffer, setProcessingOffer] = useState<string | null>(null)
  const [localOffers, setLocalOffers] = useState(offers)
  const [newOfferIds, setNewOfferIds] = useState<Set<string>>(new Set())
  const [sortKey, setSortKey] = useState<SortKey>('newest')
  const router = useRouter()

  useEffect(() => {
    if (!isOwner || requestStatus !== 'open') return

    const supabase = createClient()
    const channel = supabase.channel(`request-offers-${requestId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'offers',
        filter: `request_id=eq.${requestId}`,
      }, async (payload) => {
        const { data } = await supabase
          .from('offers')
          .select('*, profiles(full_name, rating_avg, rating_count, phone)')
          .eq('id', payload.new.id)
          .single()
        if (data) {
          setLocalOffers(prev => [data as any, ...prev])
          setNewOfferIds(prev => new Set(prev).add((data as any).id))
          setTimeout(() => {
            setNewOfferIds(prev => {
              const next = new Set(prev)
              next.delete((data as any).id)
              return next
            })
          }, 8000)
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [requestId, isOwner, requestStatus])

  function sortedOffers(list: any[]) {
    const copy = [...list]
    if (sortKey === 'price_asc') {
      copy.sort((a, b) => (a.proposed_value ?? Infinity) - (b.proposed_value ?? Infinity))
    } else if (sortKey === 'rating_desc') {
      copy.sort((a, b) => (b.profiles?.rating_avg ?? 0) - (a.profiles?.rating_avg ?? 0))
    }
    return copy
  }

  function requireAuth() {
    window.location.href = `/login?redirectTo=/requests/${requestId}`
  }

  async function acceptDirect() {
    if (!userId) { requireAuth(); return }
    setAcceptingDirect(true)
    const supabase = createClient()

    await (supabase.from('profiles') as any).upsert(
      { id: userId },
      { onConflict: 'id', ignoreDuplicates: true }
    )

    const { data: job, error } = await (supabase.from('jobs') as any)
      .insert({ request_id: requestId, volunteer_id: userId })
      .select()
      .single() as { data: any; error: any }

    if (error) {
      alert('Could not accept — someone may have taken it already.')
      setAcceptingDirect(false)
      return
    }

    await (supabase.from('requests') as any).update({ status: 'accepted' }).eq('id', requestId)
    router.push(`/job/${job.id}`)
  }

  async function handleOfferAction(offerId: string, action: 'accepted' | 'declined', moverId: string) {
    setProcessingOffer(offerId)
    const supabase = createClient()

    if (action === 'accepted') {
      await (supabase.from('profiles') as any).upsert({ id: moverId }, { onConflict: 'id', ignoreDuplicates: true })

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

  // ── Not logged in ──
  if (!userId) {
    return (
      <div style={{ background: '#EFEDEA', border: '3px solid #141414', padding: 24, textAlign: 'center' }}>
        <LogIn color="#F25800" size={28} style={{ margin: '0 auto 12px' }} />
        <h3 style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 18, textTransform: 'uppercase', letterSpacing: '0.02em', color: '#141414', marginBottom: 6 }}>Sign in to respond</h3>
        <p style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13, color: '#6b7280', marginBottom: 20 }}>Create an account or log in to make an offer or accept this request.</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <a href={`/login?redirectTo=/requests/${requestId}`} className="btn-secondary" style={{ fontSize: 13, padding: '8px 20px' }}>
            Log in
          </a>
          <a href="/signup" className="btn-primary" style={{ fontSize: 13, padding: '8px 20px' }}>
            Sign up
          </a>
        </div>
      </div>
    )
  }

  // ── Already has a job ──
  if (existingJob) {
    return (
      <a href={`/job/${existingJob.id}`} className="btn-primary" style={{ display: 'block', textAlign: 'center', justifyContent: 'center', fontSize: 16, padding: '16px' }}>
        Open Job Card →
      </a>
    )
  }

  // ── Owner view: see incoming offers ──
  if (isOwner) {
    const pending = localOffers.filter(o => o.status === 'pending')
    const others = localOffers.filter(o => o.status !== 'pending')
    const sorted = sortedOffers(pending)

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {requestStatus === 'open' && (
          <div style={{ textAlign: 'center', fontFamily: 'Barlow, sans-serif', fontSize: 13, color: '#6b7280', background: '#EFEDEA', border: '3px solid #141414', padding: '12px 16px' }}>
            {pending.length === 0
              ? 'Waiting for movers to make offers on your request.'
              : `${pending.length} offer${pending.length > 1 ? 's' : ''} waiting — pick the best one!`}
          </div>
        )}

        {pending.length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3 style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 16, textTransform: 'uppercase', letterSpacing: '0.02em', color: '#141414', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Truck color="#F25800" size={16} />
                Offers ({pending.length})
              </h3>
              <div style={{ display: 'flex', gap: 4 }}>
                {(Object.keys(SORT_LABELS) as SortKey[]).map(k => (
                  <button
                    key={k}
                    onClick={() => setSortKey(k)}
                    style={{
                      fontFamily: 'Barlow Condensed, sans-serif', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase',
                      padding: '3px 8px', border: '1.5px solid', cursor: 'pointer',
                      borderColor: sortKey === k ? '#141414' : '#e5e7eb',
                      background: sortKey === k ? '#141414' : '#FFFFFF',
                      color: sortKey === k ? '#FFFFFF' : '#6b7280',
                    }}
                  >
                    {SORT_LABELS[k]}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {sorted.map((offer: any) => (
                <div
                  key={offer.id}
                  style={{
                    background: newOfferIds.has(offer.id) ? '#FFF3EE' : '#FFFFFF',
                    border: newOfferIds.has(offer.id) ? '3px solid #F25800' : '3px solid #141414',
                    padding: 20,
                    transition: 'background 0.4s, border-color 0.4s',
                  }}
                >
                  {newOfferIds.has(offer.id) && (
                    <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#F25800', marginBottom: 8 }}>
                      ● New offer
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <div style={{ width: 36, height: 36, background: '#FFF3EE', border: '3px solid #F25800', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Truck color="#F25800" size={15} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: 'Barlow, sans-serif', fontWeight: 700, fontSize: 14, color: '#141414' }}>{offer.profiles?.full_name ?? 'Community mover'}</div>
                      {offer.profiles?.rating_count > 0 ? (
                        <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Star size={10} color="#F57F17" fill="#F57F17" />
                          {Number(offer.profiles.rating_avg).toFixed(1)} · {offer.profiles.rating_count} reviews
                        </div>
                      ) : (
                        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, color: '#9ca3af', letterSpacing: '0.05em' }}>New mover</div>
                      )}
                    </div>
                    <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, color: '#9ca3af', letterSpacing: '0.05em', flexShrink: 0 }}>{timeAgo(offer.created_at)}</div>
                  </div>

                  <p style={{ fontFamily: 'Barlow, sans-serif', fontSize: 14, color: '#141414', background: '#EFEDEA', padding: '12px 16px', fontStyle: 'italic', marginBottom: 12 }}>"{offer.message}"</p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 12, color: '#141414', marginBottom: 14 }}>
                    {offer.proposed_value && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Zap size={11} color="#F25800" />
                        <strong>${offer.proposed_value}</strong>
                        {suggestedValue && (
                          <span style={{ fontSize: 10, color: '#9ca3af' }}>(suggested ${suggestedValue})</span>
                        )}
                      </span>
                    )}
                    {offer.eta_minutes && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#6b7280' }}>
                        <Clock size={11} />
                        {offer.eta_minutes} min ETA
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      onClick={() => handleOfferAction(offer.id, 'declined', offer.mover_id)}
                      disabled={processingOffer === offer.id}
                      className="btn-secondary"
                      style={{ flex: 1, justifyContent: 'center', fontSize: 13, padding: '10px' }}
                    >
                      <X size={13} /> Decline
                    </button>
                    <button
                      onClick={() => handleOfferAction(offer.id, 'accepted', offer.mover_id)}
                      disabled={processingOffer === offer.id}
                      className="btn-primary"
                      style={{ flex: 1, justifyContent: 'center', fontSize: 13, padding: '10px', background: '#1B6B35', borderColor: '#1B6B35' }}
                    >
                      <Check size={13} /> {processingOffer === offer.id ? 'Processing…' : 'Accept'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {others.length > 0 && (
          <div>
            <h3 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af', marginBottom: 8 }}>Past offers</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {others.map((offer: any) => (
                <div key={offer.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FFFFFF', border: '1.5px solid #e5e7eb', padding: '10px 16px' }}>
                  <span style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13, color: '#6b7280' }}>{offer.profiles?.full_name ?? 'Mover'}</span>
                  <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '2px 7px', border: '1.5px solid #e5e7eb', color: '#6b7280' }}>{offer.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Request is no longer open ──
  if (requestStatus !== 'open') {
    return (
      <div style={{ textAlign: 'center', fontFamily: 'Barlow, sans-serif', fontSize: 13, color: '#9ca3af', background: '#EFEDEA', border: '3px solid #141414', padding: '16px' }}>
        This request has already been filled.
      </div>
    )
  }

  // ── Mover already sent an offer ──
  if (myOffer || offerSent) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#E8F5E9', border: '2px solid #2E7D32', padding: '16px 20px' }}>
        <CheckCircle color="#2E7D32" size={20} style={{ flexShrink: 0 }} />
        <div>
          <div style={{ fontFamily: 'Barlow, sans-serif', fontWeight: 700, fontSize: 14, color: '#1B6B35' }}>Offer sent!</div>
          <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13, color: '#6b7280', marginTop: 2 }}>
            {myOffer?.status === 'declined'
              ? 'Your offer was declined by the requester.'
              : "Waiting for the requester to respond. You'll see it in your Mover Board."}
          </div>
        </div>
      </div>
    )
  }

  // ── Mover: make offer or accept directly ──
  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button
          onClick={() => setShowOfferModal(true)}
          className="btn-secondary"
          style={{ width: '100%', justifyContent: 'center', fontSize: 15, padding: '14px' }}
        >
          <Send size={16} />
          Make an Offer (Negotiate)
        </button>
        <button
          onClick={acceptDirect}
          disabled={acceptingDirect}
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'center', fontSize: 15, padding: '14px' }}
        >
          {acceptingDirect ? 'Accepting…' : 'Accept at System Estimate →'}
        </button>
        <p style={{ textAlign: 'center', fontFamily: 'Barlow, sans-serif', fontSize: 12, color: '#9ca3af' }}>
          "Make an Offer" lets you message the requester and propose your own terms before committing.
        </p>
      </div>

      {showOfferModal && (
        <OfferModal
          requestId={requestId}
          requestTitle={requestTitle}
          suggestedValue={suggestedValue}
          onClose={() => setShowOfferModal(false)}
          onSuccess={() => { setShowOfferModal(false); setOfferSent(true) }}
        />
      )}
    </>
  )
}
