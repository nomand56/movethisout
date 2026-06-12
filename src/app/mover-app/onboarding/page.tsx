'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Truck, User, MapPin, CheckCircle } from 'lucide-react'
import type { VehicleType, VehicleCapacity } from '@/types/database'

const VEHICLE_TYPES: { value: VehicleType; label: string; icon: string }[] = [
  { value: 'sedan',  label: 'Sedan',   icon: '🚗' },
  { value: 'suv',    label: 'SUV',     icon: '🚙' },
  { value: 'pickup', label: 'Pickup',  icon: '🛻' },
  { value: 'van',    label: 'Van',     icon: '🚐' },
  { value: 'truck',  label: 'Truck',   icon: '🚛' },
  { value: 'other',  label: 'Other',   icon: '🚌' },
]

const VEHICLE_CAPACITIES: { value: VehicleCapacity; label: string; desc: string }[] = [
  { value: 'light',  label: 'Light',  desc: 'Small boxes, bags, lamps' },
  { value: 'medium', label: 'Medium', desc: 'Furniture pieces, appliances' },
  { value: 'heavy',  label: 'Heavy',  desc: 'Multiple large pieces, full loads' },
]

const STEPS = [
  { num: 1, label: 'Basic info',   icon: User  },
  { num: 2, label: 'Your vehicle', icon: Truck },
  { num: 3, label: 'Service area', icon: MapPin },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [vehicleType, setVehicleType] = useState<VehicleType | ''>('')
  const [vehicleCapacity, setVehicleCapacity] = useState<VehicleCapacity | ''>('')
  const [serviceCity, setServiceCity] = useState('')
  const [bio, setBio] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function handleFinish() {
    if (!vehicleType || !vehicleCapacity || !serviceCity.trim()) {
      setError('Please complete all required fields.')
      return
    }
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/mover-app/login'; return }

    const { error: err } = await (supabase.from('profiles') as any).upsert({
      id: user.id,
      full_name: fullName.trim() || user.user_metadata?.full_name || null,
      phone: phone.trim() || null,
      is_mover: true,
      mover_status: 'active',
      vehicle_type: vehicleType,
      vehicle_capacity: vehicleCapacity,
      service_city: serviceCity.trim(),
      bio: bio.trim() || null,
    }, { onConflict: 'id' })

    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }

    setDone(true)
    setTimeout(() => { window.location.href = '/mover-app/board' }, 1800)
  }

  if (done) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#141414', padding: '0 16px' }}>
        <div style={{ textAlign: 'center' }}>
          <CheckCircle color="#F25800" size={64} style={{ margin: '0 auto 20px' }} />
          <h1 style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 32, textTransform: 'uppercase', letterSpacing: '0.02em', color: '#FFFFFF', marginBottom: 8 }}>You're all set!</h1>
          <p style={{ fontFamily: 'Barlow, sans-serif', fontSize: 15, color: '#9ca3af' }}>Taking you to the request board…</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#141414', padding: '40px 16px' }}>
      <div style={{ maxWidth: 520, margin: '0 auto' }}>

        {/* Progress header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 26, textTransform: 'uppercase', letterSpacing: '0.02em', color: '#FFFFFF', marginBottom: 20 }}>
            Set up your mover profile
          </h1>
          <div style={{ display: 'flex', gap: 0 }}>
            {STEPS.map((s, i) => (
              <div key={s.num} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{
                    width: 32, height: 32, border: '2px solid',
                    borderColor: step > s.num ? '#F25800' : step === s.num ? '#FFFFFF' : '#6b7280',
                    background: step > s.num ? '#F25800' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: step > s.num ? '#FFFFFF' : step === s.num ? '#FFFFFF' : '#6b7280',
                    fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13,
                  }}>
                    {step > s.num ? '✓' : s.num}
                  </div>
                  <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: step === s.num ? '#FFFFFF' : '#6b7280' }}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{ flex: 1, height: 2, background: step > s.num ? '#F25800' : '#6b7280', margin: '0 4px', marginBottom: 20 }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step content */}
        <div style={{ background: '#FFFFFF', border: '3px solid #F25800', padding: 32, boxShadow: '4px 4px 0 #F25800' }}>

          {/* Step 1: Basic info */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h2 style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 20, textTransform: 'uppercase', letterSpacing: '0.02em', color: '#141414', marginBottom: 4 }}>Basic info</h2>
              <div>
                <label style={{ display: 'block', fontFamily: 'Barlow, sans-serif', fontWeight: 600, fontSize: 13, color: '#141414', marginBottom: 6 }}>Full name</label>
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="brand-input" placeholder="Jane Smith" />
              </div>
              <div>
                <label style={{ display: 'block', fontFamily: 'Barlow, sans-serif', fontWeight: 600, fontSize: 13, color: '#141414', marginBottom: 6 }}>Phone number <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span></label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="brand-input" placeholder="+1 (555) 000-0000" />
              </div>
              <div>
                <label style={{ display: 'block', fontFamily: 'Barlow, sans-serif', fontWeight: 600, fontSize: 13, color: '#141414', marginBottom: 6 }}>Short bio <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span></label>
                <textarea value={bio} onChange={e => setBio(e.target.value)} rows={2} className="brand-input" style={{ resize: 'none' }} placeholder="e.g. Reliable driver with a pickup truck and 2 years helping neighbours move." />
              </div>
              <button onClick={() => setStep(2)} className="btn-primary" style={{ justifyContent: 'center', marginTop: 8 }}>
                Next: Vehicle info →
              </button>
            </div>
          )}

          {/* Step 2: Vehicle */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <h2 style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 20, textTransform: 'uppercase', letterSpacing: '0.02em', color: '#141414', marginBottom: 4 }}>Your vehicle</h2>

              <div>
                <label style={{ display: 'block', fontFamily: 'Barlow, sans-serif', fontWeight: 600, fontSize: 13, color: '#141414', marginBottom: 10 }}>Vehicle type <span style={{ color: '#F25800' }}>*</span></label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {VEHICLE_TYPES.map(v => (
                    <button key={v.value} type="button" onClick={() => setVehicleType(v.value)} style={{
                      padding: '12px 8px', border: vehicleType === v.value ? '3px solid #F25800' : '3px solid #141414',
                      background: vehicleType === v.value ? '#FFF3EE' : '#FFFFFF',
                      cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    }}>
                      <span style={{ fontSize: 22 }}>{v.icon}</span>
                      <span style={{ fontFamily: 'Barlow, sans-serif', fontWeight: 600, fontSize: 12, color: vehicleType === v.value ? '#F25800' : '#141414' }}>{v.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontFamily: 'Barlow, sans-serif', fontWeight: 600, fontSize: 13, color: '#141414', marginBottom: 10 }}>What can you carry? <span style={{ color: '#F25800' }}>*</span></label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {VEHICLE_CAPACITIES.map(c => (
                    <button key={c.value} type="button" onClick={() => setVehicleCapacity(c.value)} style={{
                      padding: '12px 16px', border: vehicleCapacity === c.value ? '3px solid #F25800' : '3px solid #141414',
                      background: vehicleCapacity === c.value ? '#FFF3EE' : '#FFFFFF',
                      cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                      <div>
                        <div style={{ fontFamily: 'Barlow, sans-serif', fontWeight: 700, fontSize: 14, color: vehicleCapacity === c.value ? '#F25800' : '#141414' }}>{c.label}</div>
                        <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12, color: '#6b7280', marginTop: 1 }}>{c.desc}</div>
                      </div>
                      {vehicleCapacity === c.value && <CheckCircle size={16} color="#F25800" />}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button onClick={() => setStep(1)} className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>← Back</button>
                <button onClick={() => { if (!vehicleType || !vehicleCapacity) { setError('Select vehicle type and capacity.'); return } setError(''); setStep(3) }} className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                  Next: Service area →
                </button>
              </div>
              {error && <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13, color: '#F25800', border: '1.5px solid #F25800', padding: '8px 12px' }}>{error}</div>}
            </div>
          )}

          {/* Step 3: Service area */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h2 style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 20, textTransform: 'uppercase', letterSpacing: '0.02em', color: '#141414', marginBottom: 4 }}>Service area</h2>
              <p style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13, color: '#6b7280', marginTop: -8 }}>Where are you based? Requesters in this area will see your offers first.</p>
              <div>
                <label style={{ display: 'block', fontFamily: 'Barlow, sans-serif', fontWeight: 600, fontSize: 13, color: '#141414', marginBottom: 6 }}>City / Region <span style={{ color: '#F25800' }}>*</span></label>
                <input type="text" value={serviceCity} onChange={e => setServiceCity(e.target.value)} required className="brand-input" placeholder="e.g. Toronto, ON" />
              </div>

              {/* Summary */}
              <div style={{ background: '#EFEDEA', border: '3px solid #141414', padding: 16, marginTop: 4 }}>
                <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6b7280', marginBottom: 8 }}>Profile summary</div>
                <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13, color: '#141414', display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <div><strong>Vehicle:</strong> {VEHICLE_TYPES.find(v => v.value === vehicleType)?.icon} {vehicleType || '—'}</div>
                  <div><strong>Capacity:</strong> {vehicleCapacity || '—'}</div>
                  <div><strong>Area:</strong> {serviceCity || '—'}</div>
                </div>
              </div>

              {error && <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13, color: '#F25800', border: '1.5px solid #F25800', padding: '8px 12px' }}>{error}</div>}

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button onClick={() => setStep(2)} className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>← Back</button>
                <button onClick={handleFinish} disabled={loading || !serviceCity.trim()} className="btn-primary" style={{ flex: 2, justifyContent: 'center' }}>
                  {loading ? 'Setting up…' : 'Go to Board →'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
