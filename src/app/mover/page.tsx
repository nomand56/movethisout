import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { MoverBoard } from './mover-board'

export default async function MoverPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirectTo=/mover')

  // Ensure profile
  await (supabase.from('profiles') as any).upsert(
    { id: user.id, full_name: user.user_metadata?.full_name ?? null },
    { onConflict: 'id', ignoreDuplicates: true }
  )

  // Open requests (not mine)
  const { data: requestsData } = await (supabase.from('requests') as any)
    .select('*, profiles(full_name, rating_avg, rating_count)')
    .eq('status', 'open')
    .neq('requester_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  // My active jobs as mover
  const { data: activeJobsData } = await (supabase.from('jobs') as any)
    .select('*, requests(id, title, pickup_address, dropoff_address, status, effort_score, estimated_distance_km)')
    .eq('volunteer_id', user.id)
    .in('requests.status', ['accepted', 'in_progress'])
    .order('created_at', { ascending: false })

  // My pending offers
  const { data: offersData } = await (supabase.from('offers') as any)
    .select('*, requests(id, title, pickup_address, dropoff_address, status, effort_score)')
    .eq('mover_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  // My stats
  const { data: completedData } = await (supabase.from('jobs') as any)
    .select('id', { count: 'exact' })
    .eq('volunteer_id', user.id)
    .not('completed_at', 'is', null)

  const { data: profile } = await (supabase.from('profiles') as any)
    .select('full_name, rating_avg, rating_count')
    .eq('id', user.id)
    .single() as { data: any }

  return (
    <MoverBoard
      userId={user.id}
      profile={profile}
      requests={(requestsData ?? []) as any[]}
      activeJobs={(activeJobsData ?? []) as any[]}
      pendingOffers={(offersData ?? []) as any[]}
      completedCount={completedData?.length ?? 0}
    />
  )
}
