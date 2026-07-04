import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { getOptionalCallerProfile } from '../_shared/auth.ts'

interface ItemInput { size: 'small' | 'medium' | 'large' | 'extra_large'; quantity: number }

function isValidLat(v: unknown) { return typeof v === 'number' && v >= -90 && v <= 90 }
function isValidLng(v: unknown) { return typeof v === 'number' && v >= -180 && v <= 180 }

// FR-504: peak rules configurable via pricing_config.
function isPeak(
  scheduledDate: string,
  timeWindow: string,
  pricing: { peak_weekend_morning?: boolean; peak_evening?: boolean },
) {
  const day = new Date(`${scheduledDate}T00:00:00Z`).getUTCDay()
  const isWeekend = day === 0 || day === 6
  const weekendMorning = pricing.peak_weekend_morning !== false && timeWindow === 'morning' && isWeekend
  const evening = pricing.peak_evening !== false && timeWindow === 'evening'
  return weekendMorning || evening
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const { profile, admin } = await getOptionalCallerProfile(req)

  let body: {
    pickup_lat: number; pickup_lng: number
    dropoff_lat: number; dropoff_lng: number
    items: ItemInput[]
    scheduled_date: string
    time_window: 'morning' | 'afternoon' | 'evening'
    apply_credit?: boolean
    promo_code?: string
  }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400)
  }

  const { pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, items, scheduled_date, time_window, apply_credit, promo_code } = body

  // SEC-402: validate coordinates before calling out to Google.
  if (!isValidLat(pickup_lat) || !isValidLng(pickup_lng) || !isValidLat(dropoff_lat) || !isValidLng(dropoff_lng)) {
    return jsonResponse({ error: 'Invalid coordinates' }, 400)
  }
  if (!Array.isArray(items) || !scheduled_date || !['morning', 'afternoon', 'evening'].includes(time_window)) {
    return jsonResponse({ error: 'Invalid request body' }, 400)
  }

  // FR-502: server-side Distance Matrix call only, never exposed to the browser.
  const googleKey = Deno.env.get('GOOGLE_MAPS_KEY')
  const params = new URLSearchParams({
    origins: `${pickup_lat},${pickup_lng}`,
    destinations: `${dropoff_lat},${dropoff_lng}`,
    key: googleKey ?? '',
  })
  const distRes = await fetch(`https://maps.googleapis.com/maps/api/distancematrix/json?${params}`)
  const distJson = await distRes.json()
  const element = distJson?.rows?.[0]?.elements?.[0]
  if (!distRes.ok || element?.status !== 'OK') {
    return jsonResponse({ error: 'Could not calculate distance for the given addresses' }, 400)
  }
  const distance_km = Math.round((element.distance.value / 1000) * 100) / 100

  // FR-507: rates come from the DB, never hardcoded.
  const { data: pricing, error: pricingError } = await admin.from('pricing_config').select('*').limit(1).single()
  if (pricingError || !pricing) return jsonResponse({ error: 'Pricing is not configured' }, 500)

  const sizeRate: Record<string, number> = {
    small: pricing.rate_small,
    medium: pricing.rate_medium,
    large: pricing.rate_large,
    extra_large: pricing.rate_extra_large,
  }

  const base_price = Math.round(distance_km * pricing.rate_per_km * 100) / 100
  const item_cost = Math.round(
    items.reduce((sum, item) => sum + (sizeRate[item.size] ?? 0) * item.quantity, 0) * 100
  ) / 100
  const subtotal = base_price + item_cost
  const peak = isPeak(scheduled_date, time_window, pricing)
  const time_multiplier = peak ? Number(pricing.peak_multiplier) : 1.0
  const subtotal_before_credit = Math.round(subtotal * time_multiplier * 100) / 100

  // Platform fee / mover payout are derived from the full job value, not the
  // discounted price the requester ends up paying: the referral credit is a
  // platform-funded marketing cost, so it must not shrink the mover's payout.
  const platform_fee = Math.round(subtotal_before_credit * Number(pricing.commission_rate) * 100) / 100
  const mover_payout = Math.round((subtotal_before_credit - platform_fee) * 100) / 100

  let credit_applied = 0
  if (apply_credit && profile) {
    const { data: freshProfile } = await admin.from('profiles').select('account_credit').eq('id', profile.id).single()
    credit_applied = Math.min(Number(freshProfile?.account_credit ?? 0), subtotal_before_credit)
  }

  let promo_discount = 0
  let promo_code_applied: string | null = null
  if (promo_code && typeof promo_code === 'string' && promo_code.trim()) {
    const code = promo_code.trim().toUpperCase()
    const { data: promo } = await admin
      .from('promo_codes')
      .select('*')
      .eq('code', code)
      .eq('active', true)
      .maybeSingle()
    if (promo) {
      const expired = promo.valid_until && new Date(promo.valid_until) < new Date()
      const maxed = promo.max_uses != null && promo.uses_count >= promo.max_uses
      if (!expired && !maxed) {
        if (promo.discount_type === 'percent') {
          promo_discount = Math.round(subtotal_before_credit * (Number(promo.discount_value) / 100) * 100) / 100
        } else {
          promo_discount = Number(promo.discount_value)
        }
        promo_discount = Math.min(promo_discount, subtotal_before_credit - credit_applied)
        promo_code_applied = code
      }
    }
  }

  const quoted_price = Math.round((subtotal_before_credit - credit_applied - promo_discount) * 100) / 100

  return jsonResponse({
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
  })
})
