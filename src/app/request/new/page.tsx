'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { AddressAutocomplete } from '@/components/address-autocomplete'
import { calculateEffortScore, effortLabel, estimatedValue } from '@/lib/effort'
import { Upload, X, Clock, MapPin, Zap } from 'lucide-react'
import Script from 'next/script'
import type { ItemSize } from '@/types/database'

interface Location {
  address: string
  lat: number
  lng: number
}

const SIZE_LABELS: Record<ItemSize, string> = {
  small: 'Small — fits in a bag',
  medium: 'Medium — box or lamp',
  large: 'Large — furniture piece',
  extra_large: 'Extra large — multiple pieces / heavy',
}

export default function NewRequestPage() {
  const router = useRouter()
  const [pickup, setPickup] = useState<Location | null>(null)
  const [dropoff, setDropoff] = useState<Location | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [itemSize, setItemSize] = useState<ItemSize>('medium')
  const [preferredTime, setPreferredTime] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const [routeInfo, setRouteInfo] = useState<{ distanceKm: number; durationMin: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!pickup || !dropoff || !window.google) return
    const service = new window.google.maps.DistanceMatrixService()
    service.getDistanceMatrix(
      {
        origins: [{ lat: pickup.lat, lng: pickup.lng }],
        destinations: [{ lat: dropoff.lat, lng: dropoff.lng }],
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === ('OK' as string) && result?.rows[0]?.elements[0]?.status === 'OK') {
          const el = result.rows[0].elements[0]
          setRouteInfo({
            distanceKm: el.distance.value / 1000,
            durationMin: Math.round(el.duration.value / 60),
          })
        }
      }
    )
  }, [pickup, dropoff])

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 4)
    setPhotos(files)
    setPhotoPreviews(files.map(f => URL.createObjectURL(f)))
  }

  function removePhoto(index: number) {
    setPhotos(p => p.filter((_, i) => i !== index))
    setPhotoPreviews(p => p.filter((_, i) => i !== index))
  }

  async function uploadPhotos(requestId: string): Promise<string[]> {
    const supabase = createClient()
    const urls: string[] = []
    for (const file of photos) {
      const ext = file.name.split('.').pop()
      const path = `${requestId}/${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('item-photos').upload(path, file)
      if (!error) {
        const { data } = supabase.storage.from('item-photos').getPublicUrl(path)
        urls.push(data.publicUrl)
      }
    }
    return urls
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!pickup || !dropoff) {
      setError('Please select both pickup and dropoff addresses.')
      return
    }
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    await (supabase.from('profiles') as any).upsert(
      { id: user.id, full_name: user.user_metadata?.full_name ?? null },
      { onConflict: 'id', ignoreDuplicates: true }
    )

    const effortScore = routeInfo
      ? calculateEffortScore(routeInfo.distanceKm, routeInfo.durationMin, itemSize)
      : null

    const { data: request, error: insertError } = await supabase
      .from('requests')
      .insert({
        requester_id: user.id,
        pickup_address: pickup.address,
        pickup_lat: pickup.lat,
        pickup_lng: pickup.lng,
        dropoff_address: dropoff.address,
        dropoff_lat: dropoff.lat,
        dropoff_lng: dropoff.lng,
        title,
        description: description || null,
        item_size: itemSize,
        preferred_time: preferredTime || null,
        estimated_distance_km: routeInfo?.distanceKm ?? null,
        estimated_duration_min: routeInfo?.durationMin ?? null,
        effort_score: effortScore,
      })
      .select()
      .single()

    if (insertError || !request) {
      setError(insertError?.message ?? 'Failed to post request.')
      setLoading(false)
      return
    }

    if (photos.length > 0) {
      const photoUrls = await uploadPhotos(request.id)
      await supabase.from('requests').update({ photo_urls: photoUrls }).eq('id', request.id)
    }

    router.push(`/requests/${request.id}?posted=1`)
  }

  const effort = routeInfo ? calculateEffortScore(routeInfo.distanceKm, routeInfo.durationMin, itemSize) : null
  const value = routeInfo ? estimatedValue(routeInfo.distanceKm, itemSize) : null

  return (
    <>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&loading=async`}
        strategy="afterInteractive"
      />

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '32px 16px' }}>
        <h1 style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 32, textTransform: 'uppercase', letterSpacing: '0.02em', color: '#141414', marginBottom: 6 }}>Post a Move Request</h1>
        <p style={{ fontFamily: 'Barlow, sans-serif', fontSize: 14, color: '#6b7280', marginBottom: 28 }}>Tell the community what needs moving and where.</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Locations */}
          <div style={{ background: '#FFFFFF', border: '3px solid #141414', padding: 24 }}>
            <h2 style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 16, textTransform: 'uppercase', letterSpacing: '0.02em', color: '#141414', marginBottom: 16 }}>Locations</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <AddressAutocomplete
                label="Pickup address"
                placeholder="Where should the volunteer pick up from?"
                onChange={r => setPickup(r)}
              />
              <AddressAutocomplete
                label="Dropoff address"
                placeholder="Where should it be delivered?"
                onChange={r => setDropoff(r)}
              />
            </div>

            {/* Route summary */}
            {routeInfo && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(27,31,38,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'Barlow Condensed, sans-serif', fontSize: 12, color: '#141414' }}>
                  <MapPin size={13} color="#F25800" />
                  {routeInfo.distanceKm.toFixed(1)} km
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'Barlow Condensed, sans-serif', fontSize: 12, color: '#141414' }}>
                  <Clock size={13} color="#F25800" />
                  ~{routeInfo.durationMin} min
                </div>
                {effort !== null && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '3px 10px', border: '1.5px solid #F25800', color: '#F25800', background: '#FFF3EE' }}>
                    <Zap size={12} />
                    {effortLabel(effort)} ({effort}/100)
                  </div>
                )}
                {value !== null && (
                  <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13, color: '#6b7280' }}>
                    Suggested effort value: <strong style={{ fontFamily: 'Barlow Condensed, sans-serif', color: '#141414' }}>${value}</strong> <span style={{ color: '#9ca3af' }}>(informational)</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Item details */}
          <div style={{ background: '#FFFFFF', border: '3px solid #141414', padding: 24 }}>
            <h2 style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 16, textTransform: 'uppercase', letterSpacing: '0.02em', color: '#141414', marginBottom: 16 }}>Item details</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontFamily: 'Barlow, sans-serif', fontWeight: 600, fontSize: 13, color: '#141414', marginBottom: 6 }}>What needs moving?</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                  maxLength={100}
                  className="brand-input"
                  placeholder="e.g. Couch + 2 chairs"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontFamily: 'Barlow, sans-serif', fontWeight: 600, fontSize: 13, color: '#141414', marginBottom: 6 }}>Additional details (optional)</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={3}
                  className="brand-input"
                  style={{ resize: 'none' }}
                  placeholder="Any special instructions, fragile items, access codes, etc."
                />
              </div>
              <div>
                <label style={{ display: 'block', fontFamily: 'Barlow, sans-serif', fontWeight: 600, fontSize: 13, color: '#141414', marginBottom: 8 }}>Item size</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {(Object.keys(SIZE_LABELS) as ItemSize[]).map(size => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setItemSize(size)}
                      style={{
                        textAlign: 'left',
                        padding: '12px 14px',
                        border: itemSize === size ? '3px solid #F25800' : '3px solid #141414',
                        background: itemSize === size ? '#FFF3EE' : '#FFFFFF',
                        color: itemSize === size ? '#F25800' : '#141414',
                        fontFamily: 'Barlow, sans-serif',
                        fontSize: 13,
                        cursor: 'pointer',
                      }}
                    >
                      {SIZE_LABELS[size]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Photos */}
          <div style={{ background: '#FFFFFF', border: '3px solid #141414', padding: 24 }}>
            <h2 style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 16, textTransform: 'uppercase', letterSpacing: '0.02em', color: '#141414', marginBottom: 16 }}>Photos (optional)</h2>
            <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed #9ca3af', padding: '32px 16px', cursor: 'pointer' }}>
              <Upload color="#9ca3af" size={24} style={{ marginBottom: 8 }} />
              <span style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13, color: '#9ca3af' }}>Click to upload photos (max 4)</span>
              <input type="file" multiple accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
            </label>
            {photoPreviews.length > 0 && (
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
                {photoPreviews.map((src, i) => (
                  <div key={i} style={{ position: 'relative' }}>
                    <img src={src} alt="" style={{ width: 76, height: 76, objectFit: 'cover', border: '3px solid #141414' }} />
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      style={{ position: 'absolute', top: -6, right: -6, background: '#F25800', border: 'none', color: '#FFFFFF', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Time */}
          <div style={{ background: '#FFFFFF', border: '3px solid #141414', padding: 24 }}>
            <label style={{ display: 'block', fontFamily: 'Barlow, sans-serif', fontWeight: 600, fontSize: 13, color: '#141414', marginBottom: 8 }}>Preferred time (optional)</label>
            <input
              type="datetime-local"
              value={preferredTime}
              onChange={e => setPreferredTime(e.target.value)}
              className="brand-input"
            />
          </div>

          {error && (
            <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13, color: '#F25800', border: '1.5px solid #F25800', padding: '12px 16px' }}>{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', fontSize: 16, padding: '16px' }}
          >
            {loading ? 'Posting…' : 'Post Move Request →'}
          </button>
        </form>
      </div>
    </>
  )
}
