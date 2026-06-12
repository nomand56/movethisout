export type ItemSize = 'small' | 'medium' | 'large' | 'extra_large'
export type RequestStatus = 'open' | 'accepted' | 'in_progress' | 'completed' | 'cancelled'
export type OfferStatus = 'pending' | 'accepted' | 'declined'
export type MoverStatus = 'pending' | 'active' | 'suspended'
export type VehicleType = 'sedan' | 'suv' | 'pickup' | 'van' | 'truck' | 'other'
export type VehicleCapacity = 'light' | 'medium' | 'heavy'

export interface Offer {
  id: string
  request_id: string
  mover_id: string
  message: string | null
  proposed_value: number | null
  eta_minutes: number | null
  status: OfferStatus
  created_at: string
}

export interface Profile {
  id: string
  full_name: string | null
  phone: string | null
  avatar_url: string | null
  rating_avg: number
  rating_count: number
  is_mover: boolean
  mover_status: MoverStatus | null
  vehicle_type: VehicleType | null
  vehicle_capacity: VehicleCapacity | null
  service_city: string | null
  bio: string | null
  created_at: string
}

export interface Request {
  id: string
  requester_id: string
  pickup_address: string
  pickup_lat: number
  pickup_lng: number
  dropoff_address: string
  dropoff_lat: number
  dropoff_lng: number
  title: string
  description: string | null
  item_size: ItemSize
  photo_urls: string[]
  preferred_time: string | null
  estimated_distance_km: number | null
  estimated_duration_min: number | null
  effort_score: number | null
  status: RequestStatus
  created_at: string
  updated_at: string
}

export interface Job {
  id: string
  request_id: string
  volunteer_id: string
  accepted_at: string
  started_at: string | null
  completed_at: string | null
  requester_rating: number | null
  requester_review: string | null
  volunteer_rating: number | null
  volunteer_review: string | null
  created_at: string
}

export interface Message {
  id: string
  job_id: string
  sender_id: string
  content: string
  created_at: string
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Relationships: []
        Insert: {
          id: string
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          rating_avg?: number
          rating_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          rating_avg?: number
          rating_count?: number
          created_at?: string
        }
      }
      requests: {
        Row: Request
        Relationships: []
        Insert: {
          id?: string
          requester_id: string
          pickup_address: string
          pickup_lat: number
          pickup_lng: number
          dropoff_address: string
          dropoff_lat: number
          dropoff_lng: number
          title: string
          description?: string | null
          item_size?: ItemSize
          photo_urls?: string[]
          preferred_time?: string | null
          estimated_distance_km?: number | null
          estimated_duration_min?: number | null
          effort_score?: number | null
          status?: RequestStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          requester_id?: string
          pickup_address?: string
          pickup_lat?: number
          pickup_lng?: number
          dropoff_address?: string
          dropoff_lat?: number
          dropoff_lng?: number
          title?: string
          description?: string | null
          item_size?: ItemSize
          photo_urls?: string[]
          preferred_time?: string | null
          estimated_distance_km?: number | null
          estimated_duration_min?: number | null
          effort_score?: number | null
          status?: RequestStatus
          created_at?: string
          updated_at?: string
        }
      }
      jobs: {
        Row: Job
        Relationships: []
        Insert: {
          id?: string
          request_id: string
          volunteer_id: string
          accepted_at?: string
          started_at?: string | null
          completed_at?: string | null
          requester_rating?: number | null
          requester_review?: string | null
          volunteer_rating?: number | null
          volunteer_review?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          request_id?: string
          volunteer_id?: string
          accepted_at?: string
          started_at?: string | null
          completed_at?: string | null
          requester_rating?: number | null
          requester_review?: string | null
          volunteer_rating?: number | null
          volunteer_review?: string | null
          created_at?: string
        }
      }
      messages: {
        Row: Message
        Relationships: []
        Insert: {
          id?: string
          job_id: string
          sender_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          job_id?: string
          sender_id?: string
          content?: string
          created_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
