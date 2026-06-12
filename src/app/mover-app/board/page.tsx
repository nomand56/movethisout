import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BoardClient } from './board-client'

export default async function BoardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/mover-app/login?redirectTo=/mover-app/board')

  // Check mover profile
  const { data: profile } = await (supabase.from('profiles') as any)
    .select('full_name, phone, rating_avg, rating_count, is_mover, mover_status, vehicle_type, vehicle_capacity, service_city')
    .eq('id', user.id)
    .single() as { data: any }

  if (!profile?.is_mover || profile?.mover_status !== 'active') {
    redirect('/mover-app/onboarding')
  }

  // Open requests (not posted by this user — movers don't request, but safety check)
  const { data: requestsData } = await (supabase.from('requests') as any)
    .select('*, profiles(full_name, rating_avg, rating_count)')
    .eq('status', 'open')
    .neq('requester_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100)

  // Offer counts per request
  const { data: offerCountsData } = await (supabase.from('offers') as any)
    .select('request_id')
    .eq('status', 'pending')
    .in('request_id', (requestsData ?? []).map((r: any) => r.id))

  const offerCounts: Record<string, number> = {}
  for (const row of (offerCountsData ?? [])) {
    offerCounts[row.request_id] = (offerCounts[row.request_id] ?? 0) + 1
  }

  // My existing offers on these requests
  const { data: myOffersData } = await (supabase.from('offers') as any)
    .select('id, request_id, status, proposed_value, eta_minutes, message')
    .eq('mover_id', user.id)

  const myOffers: Record<string, any> = {}
  for (const o of (myOffersData ?? [])) {
    myOffers[o.request_id] = o
  }

  return (
    <BoardClient
      userId={user.id}
      profile={profile}
      initialRequests={requestsData ?? []}
      initialOfferCounts={offerCounts}
      initialMyOffers={myOffers}
    />
  )
}
