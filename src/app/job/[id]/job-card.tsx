'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { EffortBadge } from '@/components/effort-badge'
import { MapPin, Clock, Send, Phone, Star, Package, CheckCircle, PlayCircle } from 'lucide-react'
import type { Job, Request, Message, Profile } from '@/types/database'

interface Props {
  job: Job
  request: Request & { profiles: Profile }
  currentUserId: string
  isVolunteer: boolean
  initialMessages: (Message & { profiles: Profile })[]
  volunteerProfile: Profile
  requesterProfile: Profile
}

const STATUS_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  open:        { bg: '#E8F5E9', color: '#2E7D32', border: '#2E7D32' },
  accepted:    { bg: '#FFF3EE', color: '#F25800', border: '#F25800' },
  in_progress: { bg: '#FFF9C4', color: '#F57F17', border: '#F57F17' },
  completed:   { bg: '#E8F5E9', color: '#2E7D32', border: '#2E7D32' },
  cancelled:   { bg: '#FFEBEE', color: '#C62828', border: '#C62828' },
}

export function JobCard({ job, request, currentUserId, isVolunteer, initialMessages, volunteerProfile, requesterProfile }: Props) {
  const [messages, setMessages] = useState(initialMessages)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [jobStatus, setJobStatus] = useState(request.status)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const channel = supabase
      .channel(`job-${job.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `job_id=eq.${job.id}` },
        async (payload) => {
          const { data } = await supabase
            .from('messages')
            .select('*, profiles(full_name)')
            .eq('id', payload.new.id)
            .single()
          if (data) setMessages(prev => [...prev, data as any])
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [job.id])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim()) return
    setSending(true)
    await (supabase.from('messages') as any).insert({
      job_id: job.id,
      sender_id: currentUserId,
      content: newMessage.trim(),
    })
    setNewMessage('')
    setSending(false)
  }

  async function updateStatus(newStatus: string) {
    await (supabase.from('requests') as any).update({ status: newStatus }).eq('id', request.id)
    if (newStatus === 'in_progress') {
      await (supabase.from('jobs') as any).update({ started_at: new Date().toISOString() }).eq('id', job.id)
    }
    if (newStatus === 'completed') {
      await (supabase.from('jobs') as any).update({ completed_at: new Date().toISOString() }).eq('id', job.id)
    }
    setJobStatus(newStatus as any)
    if (newStatus === 'completed') {
      router.push(`/job/${job.id}/rate`)
    }
  }

  const otherPerson = isVolunteer ? requesterProfile : volunteerProfile
  const ss = STATUS_STYLE[jobStatus] ?? { bg: '#F1F1F1', color: '#6b7280', border: '#9ca3af' }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Job header */}
      <div style={{ background: '#FFFFFF', border: '3px solid #141414', padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Package color="#F25800" size={18} />
            <h1 style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 20, textTransform: 'uppercase', letterSpacing: '0.02em', color: '#141414' }}>{request.title}</h1>
          </div>
          <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '3px 8px', border: `1.5px solid ${ss.border}`, background: ss.bg, color: ss.color, flexShrink: 0 }}>
            {jobStatus.replace('_', ' ')}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <MapPin size={13} color="#2E7D32" style={{ marginTop: 2, flexShrink: 0 }} />
            <div>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af' }}>Pickup</div>
              <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13, color: '#141414' }}>{request.pickup_address}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <MapPin size={13} color="#C62828" style={{ marginTop: 2, flexShrink: 0 }} />
            <div>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af' }}>Dropoff</div>
              <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13, color: '#141414' }}>{request.dropoff_address}</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', alignItems: 'center' }}>
          {request.estimated_distance_km && (
            <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, color: '#6b7280' }}>{request.estimated_distance_km.toFixed(1)} km</span>
          )}
          {request.estimated_duration_min && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, color: '#6b7280' }}>
              <Clock size={11} /> ~{request.estimated_duration_min} min
            </span>
          )}
          {request.effort_score !== null && <EffortBadge score={request.effort_score!} />}
        </div>
      </div>

      {/* Other person card */}
      <div style={{ background: '#FFFFFF', border: '3px solid #141414', padding: 20 }}>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af', marginBottom: 12 }}>
          {isVolunteer ? 'Requester' : 'Volunteer'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: 'Barlow, sans-serif', fontWeight: 700, fontSize: 15, color: '#141414' }}>{otherPerson?.full_name ?? 'Community member'}</div>
            {otherPerson?.rating_count > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'Barlow, sans-serif', fontSize: 13, color: '#6b7280', marginTop: 3 }}>
                <Star size={12} color="#F57F17" fill="#F57F17" />
                {Number(otherPerson.rating_avg).toFixed(1)} · {otherPerson.rating_count} reviews
              </div>
            )}
          </div>
          {otherPerson?.phone && (
            <a
              href={`tel:${otherPerson.phone}`}
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'Barlow, sans-serif', fontWeight: 600, fontSize: 13, color: '#F25800', border: '3px solid #F25800', padding: '6px 14px', textDecoration: 'none' }}
            >
              <Phone size={13} />
              Call
            </a>
          )}
        </div>
      </div>

      {/* Photos */}
      {request.photo_urls?.length > 0 && (
        <div style={{ background: '#FFFFFF', border: '3px solid #141414', padding: 20 }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af', marginBottom: 12 }}>Item photos</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {request.photo_urls.map((url, i) => (
              <img key={i} src={url} alt="" style={{ width: 88, height: 88, objectFit: 'cover', border: '3px solid #141414' }} />
            ))}
          </div>
        </div>
      )}

      {/* Status actions */}
      {isVolunteer && jobStatus === 'accepted' && (
        <button
          onClick={() => updateStatus('in_progress')}
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'center', fontSize: 15, padding: '14px', background: '#F57F17', borderColor: '#F57F17' }}
        >
          <PlayCircle size={18} />
          Mark as Picked Up — Start Delivery
        </button>
      )}
      {isVolunteer && jobStatus === 'in_progress' && (
        <button
          onClick={() => updateStatus('completed')}
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'center', fontSize: 15, padding: '14px', background: '#1B6B35', borderColor: '#1B6B35' }}
        >
          <CheckCircle size={18} />
          Mark as Delivered — Complete Job
        </button>
      )}

      {/* Chat */}
      <div style={{ background: '#FFFFFF', border: '3px solid #141414' }}>
        <div style={{ padding: '12px 20px', borderBottom: '3px solid #141414' }}>
          <span style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.02em', color: '#141414' }}>Chat</span>
        </div>
        <div style={{ height: 320, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', fontFamily: 'Barlow, sans-serif', fontSize: 13, color: '#9ca3af', paddingTop: 32 }}>
              No messages yet. Say hi!
            </div>
          )}
          {messages.map(msg => {
            const isMine = msg.sender_id === currentUserId
            return (
              <div key={msg.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                <div style={{ maxWidth: '75%', display: 'flex', flexDirection: 'column', gap: 3, alignItems: isMine ? 'flex-end' : 'flex-start' }}>
                  {!isMine && (
                    <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, color: '#9ca3af', letterSpacing: '0.05em' }}>
                      {(msg as any).profiles?.full_name ?? 'Unknown'}
                    </span>
                  )}
                  <div style={{
                    padding: '10px 14px',
                    fontFamily: 'Barlow, sans-serif',
                    fontSize: 14,
                    background: isMine ? '#F25800' : '#EFEDEA',
                    color: isMine ? '#FFFFFF' : '#141414',
                    border: isMine ? '3px solid #F25800' : '3px solid #141414',
                  }}>
                    {msg.content}
                  </div>
                  <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 9, color: '#9ca3af', letterSpacing: '0.05em' }}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={sendMessage} style={{ padding: '12px 16px', borderTop: '3px solid #141414', display: 'flex', gap: 10 }}>
          <input
            type="text"
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            placeholder="Type a message…"
            className="brand-input"
            style={{ flex: 1, padding: '8px 14px' }}
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="btn-primary"
            style={{ padding: '8px 14px', fontSize: 13 }}
          >
            <Send size={15} />
          </button>
        </form>
      </div>
    </div>
  )
}
