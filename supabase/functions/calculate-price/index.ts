import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { getCallerProfile } from '../_shared/auth.ts'

interface ItemInput { size: 'small' | 'medium' | 'large' | 'extra_large'; quantity: number }

function isValidLat(v: unknown) { return typeof v === 'number' && v >= -90 && v <= 90 }
function isValidLng(v: unknown) { return typeof v === 'number' && v >= -180 && v <= 180 }

// FR-504: peak = morning slots on weekends, evening slots on any day.
function isPeak(scheduledDate: string, timeWindow: string) {
  const day = new Date(`${scheduledDate}T00:00:00Z`).getUTCDay() // 0 = Sunday, 6 = Saturday
  const isWeekend = day === 0 || day === 6
  return (timeWindow === 'morning' && isWeekend) || timeWindow === 'evening'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const { profile, admin, error: authError } = await getCallerProfile(req)
  if (authError || !profile || !admin) return jsonResponse({ error: authError ?? 'Unauthorized' }, 401)

  let body: {
    pickup_lat: number; pickup_lng: number
    dropoff_lat: number; dropoff_lng: number
    items: ItemInput[]
    scheduled_date: string
    time_window: 'morning' | 'afternoon' | 'evening'
    apply_credit?: boolean
  }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400)
  }

  const { pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, items, scheduled_date, time_window, apply_credit } = body

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
  const peak = isPeak(scheduled_date, time_window)
  const time_multiplier = peak ? Number(pricing.peak_multiplier) : 1.0
  const subtotal_before_credit = Math.round(subtotal * time_multiplier * 100) / 100

  // Platform fee / mover payout are derived from the full job value, not the
  // discounted price the requester ends up paying: the referral credit is a
  // platform-funded marketing cost, so it must not shrink the mover's payout.
  const platform_fee = Math.round(subtotal_before_credit * Number(pricing.commission_rate) * 100) / 100
  const mover_payout = Math.round((subtotal_before_credit - platform_fee) * 100) / 100

  let credit_applied = 0
  if (apply_credit) {
    const { data: freshProfile } = await admin.from('profiles').select('account_credit').eq('id', profile.id).single()
    credit_applied = Math.min(Number(freshProfile?.account_credit ?? 0), subtotal_before_credit)
  }
  const quoted_price = Math.round((subtotal_before_credit - credit_applied) * 100) / 100

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
    subtotal_before_credit,
  })
})
