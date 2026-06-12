import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { MapPin, Clock, Package } from 'lucide-react'
import { EffortBadge } from '@/components/effort-badge'
import { ItemSize } from '@/types/database'

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

const SIZE_LABEL: Record<ItemSize, string> = {
  small: 'Small', medium: 'Medium', large: 'Large', extra_large: 'XL',
}

export default async function RequestsPage() {
  const supabase = await createClient()
  const { data: requests } = await supabase
    .from('requests')
    .select('*, profiles(full_name, rating_avg, rating_count)')
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 32, textTransform: 'uppercase', letterSpacing: '0.02em', color: '#141414' }}>Open Requests</h1>
          <p style={{ fontFamily: 'Barlow, sans-serif', fontSize: 14, color: '#6b7280', marginTop: 4 }}>Pick a request and help your community</p>
        </div>
        <Link href="/request/new" className="btn-primary" style={{ fontSize: 13, padding: '8px 18px' }}>
          Post a request
        </Link>
      </div>

      {!requests?.length ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#9ca3af' }}>
          <Package size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
          <p style={{ fontFamily: 'Barlow, sans-serif', fontSize: 16 }}>No open requests right now.</p>
          <p style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13, marginTop: 4 }}>Be the first to post one!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {requests.map(req => (
            <Link
              key={req.id}
              href={`/requests/${req.id}`}
              style={{ display: 'block', background: '#FFFFFF', border: '3px solid #141414', padding: 20, textDecoration: 'none', transition: 'box-shadow 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = '4px 4px 0 #141414')}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '2px 7px', border: '1.5px solid #141414', color: '#6b7280' }}>
                      {SIZE_LABEL[req.item_size as ItemSize]}
                    </span>
                    <h2 style={{ fontFamily: 'Barlow, sans-serif', fontWeight: 700, fontSize: 15, color: '#141414', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{req.title}</h2>
                  </div>

                  {req.description && (
                    <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13, color: '#6b7280', marginBottom: 8, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>{req.description}</div>
                  )}

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px', fontFamily: 'Barlow, sans-serif', fontSize: 13, color: '#6b7280' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={12} color="#F25800" />
                      {req.pickup_address.split(',')[0]} → {req.dropoff_address.split(',')[0]}
                    </span>
                    {req.estimated_distance_km && (
                      <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11 }}>{req.estimated_distance_km.toFixed(1)} km</span>
                    )}
                    {req.estimated_duration_min && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={11} color="#F25800" />
                        ~{req.estimated_duration_min} min
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                  {req.effort_score !== null && <EffortBadge score={req.effort_score!} />}
                  <span style={{ color: '#9ca3af', fontSize: 18 }}>›</span>
                </div>
              </div>

              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(27,31,38,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12, color: '#9ca3af' }}>by {(req as any).profiles?.full_name ?? 'Community member'}</span>
                <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, color: '#9ca3af', letterSpacing: '0.05em' }}>{timeAgo(req.created_at)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
