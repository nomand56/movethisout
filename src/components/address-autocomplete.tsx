'use client'

import { useEffect, useRef, useState } from 'react'
import { MapPin } from 'lucide-react'

interface AddressResult {
  address: string
  lat: number
  lng: number
}

interface Props {
  label: string
  placeholder?: string
  onChange: (result: AddressResult) => void
}

export function AddressAutocomplete({ label, placeholder, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let mounted = true

    async function init() {
      // Wait for Maps JS API (loading=async means no callback)
      while (!window.google?.maps?.importLibrary) {
        if (!mounted) return
        await new Promise(r => setTimeout(r, 150))
      }

      const { Autocomplete } = await (window.google.maps as any).importLibrary('places') as any
      if (!mounted || !inputRef.current) return

      const ac = new Autocomplete(inputRef.current, { types: ['address'] })

      ac.addListener('place_changed', () => {
        const place = ac.getPlace()
        if (!place?.geometry?.location) return
        onChange({
          address: place.formatted_address ?? inputRef.current!.value,
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        })
      })

      setReady(true)
    }

    init()
    return () => { mounted = false }
  }, [])

  return (
    <div>
      <label style={{ display: 'block', fontFamily: 'Barlow, sans-serif', fontWeight: 600, fontSize: 13, color: '#141414', marginBottom: 6 }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <MapPin style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#F25800' }} size={15} />
        <input
          ref={inputRef}
          type="text"
          placeholder={ready ? placeholder : 'Loading map…'}
          disabled={!ready}
          className="brand-input"
          style={{ paddingLeft: 36, opacity: ready ? 1 : 0.6 }}
        />
      </div>
    </div>
  )
}
