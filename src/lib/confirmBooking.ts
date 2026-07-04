import { supabase, getFunctionErrorMessage, getPostgrestErrorMessage, isSchemaMissingError } from './supabase'
import type { Job } from '../types'

function isEdgeFunctionUnavailable(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const msg = 'message' in error ? String((error as { message?: string }).message) : ''
  return msg.includes('Failed to send a request to the Edge Function') || msg.includes('Failed to fetch')
}

/** Publish an existing draft job (edge function when deployed, otherwise direct DB update). */
export async function publishDraftJob(jobId: string): Promise<{ ok: true; job: Job } | { ok: false; error: string }> {
  const res = await supabase.functions.invoke('confirm-payment', { body: { job_id: jobId } })
  if (!res.error && !res.data?.error && res.data?.job) {
    return { ok: true, job: res.data.job as Job }
  }

  if (res.data?.error) return { ok: false, error: res.data.error as string }
  if (res.error && !isEdgeFunctionUnavailable(res.error)) {
    return { ok: false, error: await getFunctionErrorMessage(res.error) }
  }

  const now = new Date().toISOString()
  let { data: job, error } = await supabase
    .from('jobs')
    .update({ status: 'open', paid_at: now, payment_method: 'confirmed' })
    .eq('id', jobId)
    .eq('status', 'draft')
    .select()
    .single()

  if (error?.code === 'PGRST204') {
    ;({ data: job, error } = await supabase
      .from('jobs')
      .update({ status: 'open' })
      .eq('id', jobId)
      .eq('status', 'draft')
      .select()
      .single())
  }

  if (error || !job) {
    const msg = getPostgrestErrorMessage(error)
    if (error?.code === '42501' || msg.toLowerCase().includes('permission')) {
      return {
        ok: false,
        error: 'Could not publish this draft. Run migration 0009_requester_confirm_booking.sql on Supabase, or deploy the confirm-payment function.',
      }
    }
    return { ok: false, error: msg }
  }

  await insertBookingNotification(job as Job)
  return { ok: true, job: job as Job }
}

export async function notifyBookingConfirmed(job: Job) {
  await insertBookingNotification(job)
}

async function insertBookingNotification(job: Job) {
  const price = Number(job.quoted_price ?? 0).toFixed(0)
  const { error } = await supabase.from('notifications').insert({
    user_id: job.requester_id,
    title: 'Booking confirmed',
    body: `Your $${price} move is live — waiting for a mover.`,
    url: `/app/jobs/${job.id}`,
  })
  if (error && !isSchemaMissingError(error)) console.warn('Could not create notification:', error.message)
}
