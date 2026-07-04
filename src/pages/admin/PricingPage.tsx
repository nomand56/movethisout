import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import type { PricingConfig } from '../../types'

export default function AdminPricingPage() {
  const qc = useQueryClient()
  const [saved, setSaved] = useState(false)
  const [promoCode, setPromoCode] = useState('')
  const [promoType, setPromoType] = useState<'percent' | 'fixed'>('percent')
  const [promoValue, setPromoValue] = useState('10')

  const { data: config, isLoading } = useQuery({
    queryKey: ['pricing-config'],
    queryFn: async () => {
      const { data } = await supabase.from('pricing_config').select('*').limit(1).single()
      return data as PricingConfig
    },
  })

  const { data: promos, refetch: refetchPromos } = useQuery({
    queryKey: ['promo-codes'],
    queryFn: async () => {
      const { data } = await supabase.from('promo_codes').select('*').order('created_at', { ascending: false })
      return data ?? []
    },
  })

  const [form, setForm] = useState<Partial<PricingConfig>>({})
  const effective = { ...config, ...form }

  const save = useMutation({
    mutationFn: async () => {
      if (!config?.id) return
      const { error } = await supabase.from('pricing_config').update({
        rate_per_km: Number(effective.rate_per_km),
        rate_small: Number(effective.rate_small),
        rate_medium: Number(effective.rate_medium),
        rate_large: Number(effective.rate_large),
        rate_extra_large: Number(effective.rate_extra_large),
        peak_multiplier: Number(effective.peak_multiplier),
        commission_rate: Number(effective.commission_rate),
        referral_credit_amount: Number(effective.referral_credit_amount ?? 10),
        cancel_fee_open: Number(effective.cancel_fee_open ?? 0),
        support_email: effective.support_email ?? 'support@movethisout.com',
        support_phone: effective.support_phone ?? null,
        peak_weekend_morning: effective.peak_weekend_morning ?? true,
        peak_evening: effective.peak_evening ?? true,
      }).eq('id', config.id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pricing-config'] })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    },
  })

  const addPromo = async () => {
    if (!promoCode.trim()) return
    await supabase.from('promo_codes').insert({
      code: promoCode.trim().toUpperCase(),
      discount_type: promoType,
      discount_value: Number(promoValue),
      active: true,
    })
    setPromoCode('')
    refetchPromos()
  }

  const togglePromo = async (id: string, active: boolean) => {
    await supabase.from('promo_codes').update({ active }).eq('id', id)
    refetchPromos()
  }

  const set = (key: string, value: string | boolean) => setForm((f) => ({ ...f, [key]: value }))

  if (isLoading) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>

  return (
    <div className="flex flex-col gap-8 max-w-lg">
      <h1 className="font-display text-2xl uppercase text-jet">Pricing &amp; promos</h1>

      <div className="flex flex-col gap-4">
        <Input label="Rate per km ($)" type="number" step="0.01" value={effective.rate_per_km ?? ''} onChange={(e) => set('rate_per_km', e.target.value)} />
        <Input label="Small item ($)" type="number" step="0.01" value={effective.rate_small ?? ''} onChange={(e) => set('rate_small', e.target.value)} />
        <Input label="Medium item ($)" type="number" step="0.01" value={effective.rate_medium ?? ''} onChange={(e) => set('rate_medium', e.target.value)} />
        <Input label="Large item ($)" type="number" step="0.01" value={effective.rate_large ?? ''} onChange={(e) => set('rate_large', e.target.value)} />
        <Input label="Extra large ($)" type="number" step="0.01" value={effective.rate_extra_large ?? ''} onChange={(e) => set('rate_extra_large', e.target.value)} />
        <Input label="Peak multiplier" type="number" step="0.01" value={effective.peak_multiplier ?? ''} onChange={(e) => set('peak_multiplier', e.target.value)} />
        <Input label="Commission (0–1)" type="number" step="0.01" value={effective.commission_rate ?? ''} onChange={(e) => set('commission_rate', e.target.value)} />
        <Input label="Referral credit ($)" type="number" step="0.01" value={effective.referral_credit_amount ?? ''} onChange={(e) => set('referral_credit_amount', e.target.value)} />
        <Input label="Cancel fee — open jobs ($)" type="number" step="0.01" value={effective.cancel_fee_open ?? ''} onChange={(e) => set('cancel_fee_open', e.target.value)} />
        <Input label="Support email" type="email" value={effective.support_email ?? ''} onChange={(e) => set('support_email', e.target.value)} />
        <Input label="Support phone" type="tel" value={effective.support_phone ?? ''} onChange={(e) => set('support_phone', e.target.value)} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={effective.peak_weekend_morning ?? true} onChange={(e) => set('peak_weekend_morning', e.target.checked)} />
          Peak: weekend mornings
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={effective.peak_evening ?? true} onChange={(e) => set('peak_evening', e.target.checked)} />
          Peak: evening
        </label>
      </div>

      <Button loading={save.isPending} onClick={() => save.mutate()}>{saved ? 'Saved!' : 'Save pricing'}</Button>

      <div className="border-t-3 border-jet pt-6 flex flex-col gap-4">
        <h2 className="font-display text-xl uppercase">Promo codes</h2>
        <div className="flex gap-2 flex-wrap">
          <Input placeholder="CODE" value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())} />
          <select value={promoType} onChange={(e) => setPromoType(e.target.value as 'percent' | 'fixed')} className="border-3 border-jet px-3 py-2">
            <option value="percent">%</option>
            <option value="fixed">$</option>
          </select>
          <Input type="number" value={promoValue} onChange={(e) => setPromoValue(e.target.value)} className="w-24" />
          <Button size="sm" onClick={addPromo}>Add</Button>
        </div>
        {promos?.map((p: { id: string; code: string; discount_type: string; discount_value: number; uses_count: number; active: boolean }) => (
          <div key={p.id} className="flex justify-between items-center card-yard p-3 text-sm">
            <span className="font-bold">{p.code} — {p.discount_type === 'percent' ? `${p.discount_value}%` : `$${p.discount_value}`} ({p.uses_count} uses)</span>
            <button type="button" className="text-haul font-bold text-xs" onClick={() => togglePromo(p.id, !p.active)}>
              {p.active ? 'Disable' : 'Enable'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
