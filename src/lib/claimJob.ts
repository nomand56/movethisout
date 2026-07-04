import { supabase, getFunctionErrorMessage, getPostgrestErrorMessage } from './supabase'
import type { Job } from '../types'

function isEdgeFunctionUnavailable(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const msg = 'message' in error ? String((error as { message?: string }).message) : ''
  return msg.includes('Failed to send a request to the Edge Function') || msg.includes('Failed to fetch')
}

/** Claim an open job — edge function first, direct update fallback (migration 0010). */
export async function claimJob(jobId: string, moverId: string): Promise<{ ok: true; job: Job } | { ok: false; error: string }> {
  const res = await supabase.functions.invoke('claim-job', { body: { job_id: jobId } })
  if (!res.error && !res.data?.error && res.data?.job) {
    return { ok: true, job: res.data.job as Job }
  }
  if (res.data?.error) return { ok: false, error: res.data.error as string }
  if (res.error && !isEdgeFunctionUnavailable(res.error)) {
    return { ok: false, error: await getFunctionErrorMessage(res.error) }
  }

  const { data: existing } = await supabase
    .from('jobs')
    .select('id')
    .eq('mover_id', moverId)
    .in('status', ['claimed', 'in_progress'])
    .maybeSingle()
  if (existing) return { ok: false, error: 'You already have an active job' }

  const { data: job, error } = await supabase
    .from('jobs')
    .update({ status: 'claimed', mover_id: moverId })
    .eq('id', jobId)
    .eq('status', 'open')
    .select()
    .maybeSingle()

  if (error) return { ok: false, error: getPostgrestErrorMessage(error) }
  if (!job) return { ok: false, error: 'This job is no longer available' }

  await supabase.from('notifications').insert({
    user_id: job.requester_id,
    title: 'Mover assigned',
    body: 'A mover claimed your job and will be in touch soon.',
    url: `/app/jobs/${job.id}`,
  }).then(() => {})

  return { ok: true, job: job as Job }
}
