'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, Send, Clock } from 'lucide-react'

interface Props {
  requestId: string
  requestTitle: string
  suggestedValue: number | null
  onClose: () => void
  onSuccess: () => void
}

export function OfferModal({ requestId, requestTitle, suggestedValue, onClose, onSuccess }: Props) {
  const [message, setMessage] = useState('')
  const [proposedValue, setProposedValue] = useState(suggestedValue?.toString() ?? '')
  const [etaMinutes, setEtaMinutes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim()) return
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }

    await (supabase.from('profiles') as any).upsert(
      { id: user.id, full_name: user.user_metadata?.full_name ?? null },
      { onConflict: 'id', ignoreDuplicates: true }
    )

    const { error: offerError } = await (supabase.from('offers') as any).insert({
      request_id: requestId,
      mover_id: user.id,
      message: message.trim(),
      proposed_value: proposedValue ? parseInt(proposedValue) : null,
      eta_minutes: etaMinutes ? parseInt(etaMinutes) : null,
    })

    if (offerError) {
      if (offerError.code === '23505') {
        setError('You already made an offer on this request.')
      } else {
        setError(offerError.message)
      }
      setLoading(false)
      return
    }

    onSuccess()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(27,31,38,0.7)' }}>
      <div style={{ background: '#FFFFFF', border: '3px solid #141414', width: '100%', maxWidth: 440, boxShadow: '4px 4px 0 #141414', maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '3px solid #141414', position: 'sticky', top: 0, background: '#FFFFFF', zIndex: 1 }}>
          <div>
            <h2 style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 18, textTransform: 'uppercase', letterSpacing: '0.02em', color: '#141414' }}>Make an Offer</h2>
            <p style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12, color: '#6b7280', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 280 }}>{requestTitle}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', display: 'flex' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontFamily: 'Barlow, sans-serif', fontWeight: 600, fontSize: 13, color: '#141414', marginBottom: 6 }}>
              Message to requester <span style={{ color: '#F25800' }}>*</span>
            </label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              required
              rows={4}
              placeholder="Introduce yourself, describe your vehicle, confirm availability, or propose different terms..."
              className="brand-input"
              style={{ resize: 'none' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontFamily: 'Barlow, sans-serif', fontWeight: 600, fontSize: 13, color: '#141414', marginBottom: 6 }}>
                Your price (optional)
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13, color: '#6b7280' }}>$</span>
                <input
                  type="number"
                  value={proposedValue}
                  onChange={e => setProposedValue(e.target.value)}
                  min={0}
                  placeholder={suggestedValue?.toString() ?? '0'}
                  className="brand-input"
                  style={{ paddingLeft: 28 }}
                />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontFamily: 'Barlow, sans-serif', fontWeight: 600, fontSize: 13, color: '#141414', marginBottom: 6 }}>
                ETA (minutes)
              </label>
              <div style={{ position: 'relative' }}>
                <Clock size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
                <input
                  type="number"
                  value={etaMinutes}
                  onChange={e => setEtaMinutes(e.target.value)}
                  min={1}
                  max={240}
                  placeholder="e.g. 20"
                  className="brand-input"
                  style={{ paddingLeft: 32 }}
                />
              </div>
            </div>
          </div>
          <p style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, color: '#9ca3af', letterSpacing: '0.05em', marginTop: -8 }}>
            Price is informational only — not a charge. Suggested: {suggestedValue ? `$${suggestedValue}` : 'N/A'}
          </p>

          {error && (
            <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13, color: '#F25800', border: '1.5px solid #F25800', padding: '10px 14px' }}>{error}</div>
          )}

          <div style={{ display: 'flex', gap: 12, paddingTop: 4 }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              style={{ flex: 1, justifyContent: 'center' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !message.trim()}
              className="btn-primary"
              style={{ flex: 1, justifyContent: 'center' }}
            >
              <Send size={15} />
              {loading ? 'Sending…' : 'Send Offer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
