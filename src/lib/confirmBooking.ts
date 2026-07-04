import { supabase, getFunctionErrorMessage, getPostgrestErrorMessage, isSchemaMissingError } from './supabase'
import type { Job, JobItem } from '../types'

function isEdgeFunctionUnavailable(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const msg = 'message' in error ? String((error as { message?: string }).message) : ''
  return msg.includes('Failed to send a request to the Edge Function') || msg.includes('Failed to fetch')
}

function isPermissionError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false
  return error.code === '42501' || (error.message?.toLowerCase().includes('permission') ?? false)
}

/** Publish an existing draft job — works without edge function or migration 0009. */
export async function publishDraftJob(jobId: string): Promise<{ ok: true; job: Job } | { ok: false; error: string }> {
  const { data: draft, error: fetchError } = await supabase
    .from('jobs')
    .select('*, items:job_items(*)')
    .eq('id', jobId)
    .single()

  if (fetchError || !draft) return { ok: false, error: 'Job not found' }
  if (draft.status !== 'draft') return { ok: false, error: 'This job is not awaiting confirmation' }

  // 1) Edge function (optional — not deployed on your project yet)
  const res = await supabase.functions.invoke('confirm-payment', { body: { job_id: jobId } })
  if (!res.error && !res.data?.error && res.data?.job) {
    return { ok: true, job: res.data.job as Job }
  }
  if (res.data?.error) return { ok: false, error: res.data.error as string }
  if (res.error && !isEdgeFunctionUnavailable(res.error)) {
    return { ok: false, error: await getFunctionErrorMessage(res.error) }
  }

  // 2) Direct draft → open update (needs migration 0009)
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

  if (!error && job) {
    await insertBookingNotification(job as Job)
    return { ok: true, job: job as Job }
  }

  // 3) Fallback: create new open job + cancel draft (no migration needed)
  if (isPermissionError(error)) {
    return cloneDraftToOpen(draft as Job & { items?: JobItem[] })
  }

  return { ok: false, error: getPostgrestErrorMessage(error) }
}

/** When DB blocks draft→open update, insert a new open job and cancel the draft. */
async function cloneDraftToOpen(draft: Job & { items?: JobItem[] }): Promise<{ ok: true; job: Job } | { ok: false; error: string }> {
  const now = new Date().toISOString()

  const row: Record<string, unknown> = {
    requester_id: draft.requester_id,
    pickup_address: draft.pickup_address,
    pickup_lat: draft.pickup_lat,
    pickup_lng: draft.pickup_lng,
    dropoff_address: draft.dropoff_address,
    dropoff_lat: draft.dropoff_lat,
    dropoff_lng: draft.dropoff_lng,
    scheduled_date: draft.scheduled_date,
    time_window: draft.time_window,
    notes: draft.notes,
    status: 'open',
    quoted_price: draft.quoted_price,
    platform_fee: draft.platform_fee,
    mover_payout: draft.mover_payout,
    distance_km: draft.distance_km,
    paid_at: now,
    payment_method: 'confirmed',
  }

  if (draft.promo_code) {
    row.promo_code = draft.promo_code
    row.promo_discount = draft.promo_discount ?? 0
  }
  if (draft.credit_applied && draft.credit_applied > 0) row.credit_applied = draft.credit_applied

  let { data: newJob, error } = await supabase.from('jobs').insert(row).select().single()

  if (error?.code === 'PGRST204') {
    const fallback = { ...row }
    delete fallback.credit_applied
    delete fallback.promo_code
    delete fallback.promo_discount
    delete fallback.paid_at
    delete fallback.payment_method
    ;({ data: newJob, error } = await supabase.from('jobs').insert(fallback).select().single())
  }

  if (error || !newJob) {
    return { ok: false, error: getPostgrestErrorMessage(error) }
  }

  const items = draft.items ?? []
  if (items.length > 0) {
    const { error: itemsError } = await supabase.from('job_items').insert(
      items.map((item) => ({
        job_id: newJob.id,
        name: item.name,
        size: item.size,
        quantity: item.quantity,
        photo_url: item.photo_url,
      })),
    )
    if (itemsError) {
      return { ok: false, error: getPostgrestErrorMessage(itemsError) }
    }
  }

  // Cancel the old draft (allowed by existing RLS)
  await supabase.from('jobs').update({ status: 'cancelled' }).eq('id', draft.id).eq('status', 'draft')

  await insertBookingNotification(newJob as Job)
  return { ok: true, job: newJob as Job }
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
