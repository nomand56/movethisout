import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { JobCard } from './job-card'

export default async function JobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?redirectTo=/job/${id}`)

  const { data: jobData } = await (supabase.from('jobs') as any)
    .select(`
      *,
      requests(*, profiles(full_name, phone, rating_avg, rating_count)),
      profiles(full_name, phone, rating_avg, rating_count)
    `)
    .eq('id', id)
    .single()
  const job = jobData as any

  if (!job) notFound()

  const req = job.requests
  const isVolunteer = user.id === job.volunteer_id
  const isRequester = user.id === req.requester_id

  if (!isVolunteer && !isRequester) notFound()

  const { data: messagesData } = await (supabase.from('messages') as any)
    .select('*, profiles(full_name)')
    .eq('job_id', id)
    .order('created_at', { ascending: true })
  const messages = (messagesData ?? []) as any[]

  const volunteerProfile = (job as any).profiles
  const requesterProfile = req.profiles

  return (
    <JobCard
      job={job as any}
      request={req}
      currentUserId={user.id}
      isVolunteer={isVolunteer}
      initialMessages={(messages ?? []) as any[]}
      volunteerProfile={volunteerProfile}
      requesterProfile={requesterProfile}
    />
  )
}
