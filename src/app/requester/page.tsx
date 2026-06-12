import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { RequesterBoard } from './requester-board'

export default async function RequesterPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirectTo=/requester')

  // Ensure profile exists
  await (supabase.from('profiles') as any).upsert(
    { id: user.id, full_name: user.user_metadata?.full_name ?? null },
    { onConflict: 'id', ignoreDuplicates: true }
  )

  // My requests with offer counts
  const { data: requestsData } = await (supabase.from('requests') as any)
    .select('*, offers(id, status)')
    .eq('requester_id', user.id)
    .order('created_at', { ascending: false })

  // Incoming pending offers on my requests (with mover profile)
  const { data: offersData } = await (supabase.from('offers') as any)
    .select('*, profiles(full_name, rating_avg, rating_count, phone), requests(id, title, status)')
    .eq('status', 'pending')
    .in('request_id',
      (requestsData ?? [])
        .filter((r: any) => r.status === 'open')
        .map((r: any) => r.id)
    )
    .order('created_at', { ascending: false })

  const { data: profile } = await (supabase.from('profiles') as any)
    .select('full_name, rating_avg, rating_count')
    .eq('id', user.id)
    .single() as { data: any }

  return (
    <RequesterBoard
      userId={user.id}
      profile={profile}
      requests={(requestsData ?? []) as any[]}
      incomingOffers={(offersData ?? []) as any[]}
    />
  )
}
