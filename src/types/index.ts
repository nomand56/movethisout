export type UserRole = 'requester' | 'mover' | 'admin'
export type MoverStatus = 'pending' | 'active' | 'suspended'
export type JobStatus = 'draft' | 'open' | 'claimed' | 'in_progress' | 'completed' | 'cancelled'
export type ItemSize = 'small' | 'medium' | 'large' | 'extra_large'
export type VehicleType = 'cargo_van' | 'small_truck' | 'large_truck'
export type TimeWindow = 'morning' | 'afternoon' | 'evening'

export interface Profile {
  id: string
  email: string
  full_name: string
  phone: string
  role: UserRole
  is_suspended: boolean
  sms_notifications_enabled: boolean
  referral_code: string
  account_credit: number
  created_at: string
}

export interface MoverProfile {
  id: string
  vehicle_type: VehicleType
  vehicle_capacity: number
  service_radius: number
  home_base_address: string
  status: MoverStatus
  is_online: boolean
  avg_rating: number
  total_jobs: number
  licence_url: string | null
  registration_url: string | null
  created_at: string
}

export interface Job {
  id: string
  requester_id: string
  mover_id: string | null
  pickup_address: string
  pickup_lat: number
  pickup_lng: number
  dropoff_address: string
  dropoff_lat: number
  dropoff_lng: number
  scheduled_date: string
  time_window: TimeWindow
  status: JobStatus
  quoted_price: number | null
  platform_fee: number | null
  mover_payout: number | null
  distance_km: number | null
  notes: string | null
  completion_photo_url: string | null
  signature_url: string | null
  cancel_reason: string | null
  credit_applied?: number | null
  promo_code?: string | null
  promo_discount?: number | null
  paid_at?: string | null
  payment_method?: string | null
  created_at: string
  updated_at: string
  requester?: Profile
  mover?: Profile
  mover_profile?: MoverProfile
  items?: JobItem[]
  status_history?: JobStatusHistory[]
}

export interface JobItem {
  id: string
  job_id: string
  name: string
  size: ItemSize
  quantity: number
  photo_url: string | null
}

export interface LocationEvent {
  id: string
  job_id: string
  lat: number
  lng: number
  created_at: string
}

export interface Review {
  id: string
  job_id: string
  requester_id: string
  mover_id: string
  rating: number
  comment: string | null
  created_at: string
}

export interface PushSubscriptionRecord {
  id: string
  user_id: string
  endpoint: string
  p256dh: string
  auth: string
}

export interface PricingConfig {
  id: string
  rate_per_km: number
  rate_small: number
  rate_medium: number
  rate_large: number
  rate_extra_large: number
  peak_multiplier: number
  commission_rate: number
  referral_credit_amount: number
  cancel_fee_open?: number
  support_email?: string
  support_phone?: string
  peak_weekend_morning?: boolean
  peak_evening?: boolean
}

export interface ThemeConfig {
  id: string
  brand_name: string
  accent_color: string
  accent_hover_color: string
  accent_soft_color: string
  ink_color: string
  ink_muted_color: string
  surface_muted_color: string
  mover_color: string
  header_color: string
  updated_at: string
}

export interface SavedAddress {
  id: string
  user_id: string
  label: string
  address: string
  lat: number
  lng: number
  is_default: boolean
  created_at: string
}

export interface AppNotification {
  id: string
  user_id: string
  title: string
  body: string
  url: string | null
  read_at: string | null
  created_at: string
}

export interface MoverPayout {
  id: string
  mover_id: string
  job_id: string
  amount: number
  status: 'pending' | 'paid' | 'cancelled'
  paid_at: string | null
  created_at: string
}

export interface JobStatusHistory {
  id: string
  job_id: string
  status: JobStatus
  created_at: string
}

export interface Message {
  id: string
  job_id: string
  sender_id: string
  content: string
  created_at: string
  read_at: string | null
}

export interface Referral {
  id: string
  referrer_id: string
  referred_id: string
  referral_code: string
  status: 'pending' | 'completed'
  created_at: string
  completed_at: string | null
}

export interface PriceQuote {
  quoted_price: number
  platform_fee: number
  mover_payout: number
  distance_km: number
  base_price: number
  item_cost: number
  time_multiplier: number
  is_peak: boolean
  credit_applied: number
  promo_discount: number
  promo_code: string | null
  subtotal_before_credit: number
}

export interface JobCreationState {
  pickup_address: string
  pickup_lat: number
  pickup_lng: number
  dropoff_address: string
  dropoff_lat: number
  dropoff_lng: number
  scheduled_date: string
  time_window: TimeWindow | ''
  notes: string
  items: DraftJobItem[]
  quote: PriceQuote | null
  promo_code: string
}

export interface DraftJobItem {
  id: string
  name: string
  size: ItemSize
  quantity: number
  photo?: File | null
  photo_url?: string | null
}
