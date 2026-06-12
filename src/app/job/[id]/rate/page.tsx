'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import { Star, CheckCircle } from 'lucide-react'
import Link from 'next/link'

const LABELS = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent']

export default function RatePage() {
  const { id } = useParams<{ id: string }>()
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [review, setReview] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!rating) return
    setLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: job } = await (supabase.from('jobs') as any)
      .select('*, requests(requester_id)')
      .eq('id', id)
      .single() as { data: any }

    if (!job) return

    const isVolunteer = user.id === job.volunteer_id
    const updateField = isVolunteer
      ? { volunteer_rating: rating, volunteer_review: review }
      : { requester_rating: rating, requester_review: review }

    await (supabase.from('jobs') as any).update(updateField).eq('id', id)

    const ratedUserId = isVolunteer ? job.requests.requester_id : job.volunteer_id
    const { data: profile } = await (supabase.from('profiles') as any)
      .select('rating_avg, rating_count')
      .eq('id', ratedUserId)
      .single() as { data: any }

    if (profile) {
      const newCount = profile.rating_count + 1
      const newAvg = (profile.rating_avg * profile.rating_count + rating) / newCount
      await (supabase.from('profiles') as any).update({ rating_avg: newAvg, rating_count: newCount }).eq('id', ratedUserId)
    }

    setDone(true)
    setLoading(false)
  }

  if (done) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px', background: '#FFFFFF' }}>
        <div style={{ textAlign: 'center' }}>
          <CheckCircle color="#2E7D32" size={64} style={{ margin: '0 auto 20px' }} />
          <h1 style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 32, textTransform: 'uppercase', letterSpacing: '0.02em', color: '#141414', marginBottom: 8 }}>Thanks for rating!</h1>
          <p style={{ fontFamily: 'Barlow, sans-serif', fontSize: 15, color: '#6b7280', marginBottom: 28 }}>Your feedback helps build community trust.</p>
          <Link href="/requester" className="btn-primary" style={{ fontSize: 14, padding: '12px 28px' }}>
            Go to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px', background: '#FFFFFF' }}>
      <div style={{ width: '100%', maxWidth: 420, border: '3px solid #141414', background: '#FFFFFF', padding: 40, boxShadow: '4px 4px 0 #141414' }}>
        <h1 style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 26, textTransform: 'uppercase', letterSpacing: '0.02em', color: '#141414', marginBottom: 4 }}>Rate your experience</h1>
        <p style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13, color: '#6b7280', marginBottom: 28 }}>How did it go? Your honest feedback helps the community.</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Stars */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHovered(star)}
                onMouseLeave={() => setHovered(0)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
              >
                <Star
                  size={40}
                  color={star <= (hovered || rating) ? '#F57F17' : '#e5e7eb'}
                  fill={star <= (hovered || rating) ? '#F57F17' : 'none'}
                  style={{ transition: 'all 0.1s' }}
                />
              </button>
            ))}
          </div>

          {rating > 0 && (
            <div style={{ textAlign: 'center', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#F25800' }}>
              {LABELS[rating]}
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontFamily: 'Barlow, sans-serif', fontWeight: 600, fontSize: 13, color: '#141414', marginBottom: 6 }}>
              Leave a review (optional)
            </label>
            <textarea
              value={review}
              onChange={e => setReview(e.target.value)}
              rows={3}
              placeholder="Describe your experience…"
              className="brand-input"
              style={{ resize: 'none' }}
            />
          </div>

          <button
            type="submit"
            disabled={!rating || loading}
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', fontSize: 15, padding: '14px' }}
          >
            {loading ? 'Submitting…' : 'Submit Rating →'}
          </button>

          <button
            type="button"
            onClick={() => router.push('/requester')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Barlow, sans-serif', fontSize: 13, color: '#9ca3af', textAlign: 'center' }}
          >
            Skip for now
          </button>
        </form>
      </div>
    </div>
  )
}
