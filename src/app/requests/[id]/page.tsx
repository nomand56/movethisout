import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { effortLabel } from '@/lib/effort'
import { estimatedValue } from '@/lib/effort'
import { MapPin, Clock, Package, Star, Zap, CheckCircle, Info } from 'lucide-react'
import { RequestActions } from './request-actions'
import type { ItemSize } from '@/types/database'

const SIZE_LABELS: Record<ItemSize, string> = {
  small: 'Small', medium: 'Medium', large: 'Large', extra_large: 'Extra large'
}

const EFFORT_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  Light:       { bg: '#E8F5E9', color: '#2E7D32', border: '#2E7D32' },
  Moderate:    { bg: '#FFF9C4', color: '#F57F17', border: '#F57F17' },
  Challenging: { bg: '#FFF3E0', color: '#E65100', border: '#E65100' },
  Heavy:       { bg: '#FFEBEE', color: '#C62828', border: '#C62828' },
}

const STATUS_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  open:        { bg: '#E8F5E9', color: '#2E7D32', border: '#2E7D32' },
  accepted:    { bg: '#FFF3EE', color: '#F25800', border: '#F25800' },
  in_progress: { bg: '#FFF9C4', color: '#F57F17', border: '#F57F17' },
  completed:   { bg: '#F1F1F1', color: '#6b7280', border: '#9ca3af' },
}

export default async function RequestDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ posted?: string }>
}) {
  const { id } = await params
  const { posted } = await searchParams
  const supabase = await createClient()

  const { data: reqData } = await (supabase.from('requests') as any)
    .select('*, profiles(full_name, rating_avg, rating_count)')
    .eq('id', id)
    .single()

  if (!reqData) notFound()
  const req = reqData as any

  const { data: { user } } = await supabase.auth.getUser()
  const isOwner = user?.id === req.requester_id

  let offers: any[] = []
  if (isOwner) {
    const { data } = await (supabase.from('offers') as any)
      .select('*, profiles(full_name, rating_avg, rating_count, phone)')
      .eq('request_id', id)
      .order('created_at', { ascending: false })
    offers = data ?? []
  }

  let myOffer: any = null
  let existingJob: any = null
  if (user && !isOwner) {
    const { data: offerData } = await (supabase.from('offers') as any)
      .select('*')
      .eq('request_id', id)
      .eq('mover_id', user.id)
      .single()
    myOffer = offerData

    const { data: jobData } = await (supabase.from('jobs') as any)
      .select('id')
      .eq('request_id', id)
      .single()
    existingJob = jobData
  }

  const effort = req.effort_score
  const effortLbl = effort !== null ? effortLabel(effort) : null
  const effortStyle = effortLbl ? EFFORT_COLORS[effortLbl] : null
  const statusStyle = STATUS_STYLE[req.status] ?? STATUS_STYLE.completed
  const value = req.estimated_distance_km
    ? estimatedValue(req.estimated_distance_km, req.item_size as ItemSize)
    : null

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '32px 16px' }}>
      {posted === '1' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#E8F5E9', border: '2px solid #2E7D32', padding: '12px 16px', marginBottom: 20 }}>
          <CheckCircle color="#2E7D32" size={16} />
          <span style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13, color: '#1B6B35', fontWeight: 600 }}>Your request is live! Movers can see it and send offers.</span>
        </div>
      )}

      {/* Request card */}
      <div style={{ background: '#FFFFFF', border: '3px solid #141414', padding: 24, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 20 }}>
          <Package color="#F25800" size={20} style={{ marginTop: 3, flexShrink: 0 }} />
          <div>
            <h1 style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 26, textTransform: 'uppercase', letterSpacing: '0.02em', color: '#141414', lineHeight: 1.1 }}>{req.title}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '2px 7px', border: '1.5px solid #141414', color: '#6b7280' }}>
                {SIZE_LABELS[req.item_size as ItemSize]}
              </span>
              <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '2px 7px', border: `1.5px solid ${statusStyle.border}`, background: statusStyle.bg, color: statusStyle.color }}>
                {req.status.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>

        {req.description && (
          <p style={{ fontFamily: 'Barlow, sans-serif', fontSize: 14, color: '#6b7280', lineHeight: 1.6, marginBottom: 16 }}>{req.description}</p>
        )}

        {req.photo_urls?.length > 0 && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            {req.photo_urls.map((url: string, i: number) => (
              <img key={i} src={url} alt="" style={{ width: 88, height: 88, objectFit: 'cover', border: '3px solid #141414' }} />
            ))}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <MapPin size={14} color="#2E7D32" style={{ marginTop: 3, flexShrink: 0 }} />
            <div>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af', marginBottom: 2 }}>Pickup</div>
              <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 14, color: '#141414' }}>{req.pickup_address}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <MapPin size={14} color="#C62828" style={{ marginTop: 3, flexShrink: 0 }} />
            <div>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af', marginBottom: 2 }}>Dropoff</div>
              <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 14, color: '#141414' }}>{req.dropoff_address}</div>
            </div>
          </div>
        </div>

        {req.preferred_time && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'Barlow, sans-serif', fontSize: 13, color: '#6b7280', marginBottom: 14 }}>
            <Clock size={13} />
            Preferred: {new Date(req.preferred_time).toLocaleString()}
          </div>
        )}

        <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12, color: '#9ca3af' }}>
          Posted by {req.profiles?.full_name ?? 'Community member'}
          {req.profiles?.rating_count > 0 && (
            <span style={{ marginLeft: 8 }}>
              <Star size={10} color="#F57F17" fill="#F57F17" style={{ display: 'inline', verticalAlign: 'middle' }} />{' '}
              {Number(req.profiles.rating_avg).toFixed(1)}
            </span>
          )}
        </div>
      </div>

      {/* Effort card */}
      {effort !== null && effortStyle && (
        <div style={{ background: '#FFFFFF', border: '3px solid #141414', padding: 24, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <Zap color="#F25800" size={16} />
            <h2 style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 16, textTransform: 'uppercase', letterSpacing: '0.02em', color: '#141414' }}>Effort estimate</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 16, textAlign: 'center' }}>
            <div>
              <div style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 28, color: '#141414' }}>{Number(req.estimated_distance_km).toFixed(1)}</div>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af', marginTop: 4 }}>km distance</div>
            </div>
            <div>
              <div style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 28, color: '#141414' }}>~{req.estimated_duration_min}</div>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af', marginTop: 4 }}>min travel</div>
            </div>
            <div>
              <div style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 28, color: effortStyle.color }}>{effort}</div>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af', marginTop: 4 }}>effort score</div>
            </div>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '4px 10px', border: `1.5px solid ${effortStyle.border}`, background: effortStyle.bg, color: effortStyle.color }}>
            <Zap size={12} />{effortLbl} effort
          </div>
          {value !== null && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontFamily: 'Barlow, sans-serif', fontSize: 13, color: '#6b7280', background: '#EFEDEA', border: '1.5px solid #141414', padding: '10px 14px', marginTop: 14 }}>
              <Info size={14} color="#141414" style={{ marginTop: 1, flexShrink: 0 }} />
              Suggested effort value: <strong style={{ color: '#141414', fontFamily: 'Barlow Condensed, sans-serif', marginLeft: 4 }}>${value}</strong> — informational only, not a charge.
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <RequestActions
        requestId={req.id}
        requestTitle={req.title}
        requestStatus={req.status}
        suggestedValue={value}
        userId={user?.id ?? null}
        isOwner={isOwner}
        existingJob={existingJob}
        myOffer={myOffer}
        offers={offers}
      />
    </div>
  )
}
