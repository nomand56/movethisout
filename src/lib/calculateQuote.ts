import { supabase, getFunctionErrorMessage } from './supabase'
import type { PricingConfig, PriceQuote } from '../types'

type ItemInput = { size: 'small' | 'medium' | 'large' | 'extra_large'; quantity: number }

export interface QuoteInput {
  pickup_lat: number
  pickup_lng: number
  dropoff_lat: number
  dropoff_lng: number
  items: ItemInput[]
  scheduled_date: string
  time_window: 'morning' | 'afternoon' | 'evening'
  apply_credit?: boolean
  promo_code?: string
  userId?: string
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 100) / 100
}

function isPeak(
  scheduledDate: string,
  timeWindow: string,
  pricing: Pick<PricingConfig, 'peak_weekend_morning' | 'peak_evening'>,
) {
  const day = new Date(`${scheduledDate}T00:00:00Z`).getUTCDay()
  const isWeekend = day === 0 || day === 6
  const weekendMorning = pricing.peak_weekend_morning !== false && timeWindow === 'morning' && isWeekend
  const evening = pricing.peak_evening !== false && timeWindow === 'evening'
  return weekendMorning || evening
}

async function localQuote(input: QuoteInput): Promise<PriceQuote> {
  const distance_km = haversineKm(input.pickup_lat, input.pickup_lng, input.dropoff_lat, input.dropoff_lng)

  if (distance_km > 200) {
    throw new Error(
      'That route looks too long for a local move. Use addresses in Kamloops, Merritt, or Salmon Arm.',
    )
  }

  const { data: pricing, error } = await supabase.from('pricing_config').select('*').limit(1).single()
  if (error || !pricing) {
    throw new Error('Pricing is not configured. Run scripts/full-setup.sql in Supabase SQL Editor.')
  }

  const p = pricing as PricingConfig
  const sizeRate: Record<string, number> = {
    small: p.rate_small,
    medium: p.rate_medium,
    large: p.rate_large,
    extra_large: p.rate_extra_large,
  }

  const base_price = Math.round(distance_km * p.rate_per_km * 100) / 100
  const item_cost = Math.round(
    input.items.reduce((sum, item) => sum + (sizeRate[item.size] ?? 0) * item.quantity, 0) * 100,
  ) / 100
  const subtotal = base_price + item_cost
  const peak = isPeak(input.scheduled_date, input.time_window, p)
  const time_multiplier = peak ? Number(p.peak_multiplier) : 1
  const subtotal_before_credit = Math.round(subtotal * time_multiplier * 100) / 100
  const platform_fee = Math.round(subtotal_before_credit * Number(p.commission_rate) * 100) / 100
  const mover_payout = Math.round((subtotal_before_credit - platform_fee) * 100) / 100

  let credit_applied = 0
  if (input.apply_credit && input.userId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('account_credit')
      .eq('id', input.userId)
      .maybeSingle()
    credit_applied = Math.min(Number(profile?.account_credit ?? 0), subtotal_before_credit)
  }

  let promo_discount = 0
  let promo_code_applied: string | null = null
  if (input.promo_code?.trim()) {
    const code = input.promo_code.trim().toUpperCase()
    const { data: promo } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('code', code)
      .eq('active', true)
      .maybeSingle()
    if (promo) {
      const expired = promo.valid_until && new Date(promo.valid_until) < new Date()
      const maxed = promo.max_uses != null && promo.uses_count >= promo.max_uses
      if (!expired && !maxed) {
        promo_discount =
          promo.discount_type === 'percent'
            ? Math.round(subtotal_before_credit * (Number(promo.discount_value) / 100) * 100) / 100
            : Number(promo.discount_value)
        promo_discount = Math.min(promo_discount, subtotal_before_credit - credit_applied)
        promo_code_applied = code
      }
    }
  }

  const quoted_price = Math.round((subtotal_before_credit - credit_applied - promo_discount) * 100) / 100

  return {
    quoted_price,
    platform_fee,
    mover_payout,
    distance_km,
    base_price,
    item_cost,
    time_multiplier,
    is_peak: peak,
    credit_applied,
    promo_discount,
    promo_code: promo_code_applied,
    subtotal_before_credit,
  }
}

/** Try edge function first; fall back to local haversine + pricing_config. */
export async function calculateQuote(input: QuoteInput): Promise<PriceQuote> {
  const res = await supabase.functions.invoke('calculate-price', { body: input })
  if (!res.error && res.data && !res.data.error && typeof res.data.quoted_price === 'number') {
    return res.data as PriceQuote
  }

  const edgeMsg = res.data?.error ?? (res.error ? await getFunctionErrorMessage(res.error) : '')
  const fallbackUnavailable =
    edgeMsg.includes('Failed to send') ||
    edgeMsg.includes('Failed to fetch') ||
    edgeMsg.includes('Invalid or expired session') ||
    edgeMsg.includes('Pricing is not configured')

  if (!fallbackUnavailable) {
    throw new Error(String(edgeMsg || 'Could not calculate price'))
  }

  return localQuote(input)
}
