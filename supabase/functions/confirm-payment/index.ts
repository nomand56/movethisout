import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { getCallerProfile } from '../_shared/auth.ts'
import { sendEmail } from '../_shared/email.ts'
import { insertNotification } from '../_shared/notifications.ts'

async function sendBookingConfirmation(
  job: Record<string, unknown>,
  requesterEmail: string,
) {
  const price = Number(job.quoted_price ?? 0).toFixed(2)
  const appUrl = Deno.env.get('PUBLIC_APP_URL') ?? 'https://movethisout.app'
  const html = `
    <h2>MoveThisOut — Booking confirmed</h2>
    <p>Your move is booked and movers can now see it.</p>
    <p><strong>Job ID:</strong> ${job.id}</p>
    <p><strong>Pickup:</strong> ${job.pickup_address}</p>
    <p><strong>Drop-off:</strong> ${job.dropoff_address}</p>
    <p><strong>Date:</strong> ${job.scheduled_date} (${job.time_window})</p>
    <p><strong>Quoted total:</strong> $${price}</p>
    <p><a href="${appUrl}/app/jobs/${job.id}">View your job</a></p>
  `
  await sendEmail(requesterEmail, `Booking confirmed — $${price}`, html)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const { profile, admin, error: authError } = await getCallerProfile(req)
  if (authError || !profile || !admin) return jsonResponse({ error: authError ?? 'Unauthorized' }, 401)

  let body: { job_id: string }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400)
  }
  if (!body.job_id) return jsonResponse({ error: 'job_id is required' }, 400)

  const { data: job } = await admin.from('jobs').select('*').eq('id', body.job_id).single()
  if (!job) return jsonResponse({ error: 'Job not found' }, 404)
  if (job.requester_id !== profile.id) return jsonResponse({ error: 'Not your job' }, 403)
  if (job.status !== 'draft') return jsonResponse({ error: 'Job is not awaiting confirmation' }, 409)

  const { data: updated, error } = await admin
    .from('jobs')
    .update({
      status: 'open',
      paid_at: new Date().toISOString(),
      payment_method: 'confirmed',
    })
    .eq('id', body.job_id)
    .eq('status', 'draft')
    .select()
    .single()

  if (error || !updated) return jsonResponse({ error: 'Could not confirm booking' }, 500)

  if (updated.promo_code) {
    const { data: promo } = await admin.from('promo_codes').select('uses_count').eq('code', updated.promo_code).maybeSingle()
    if (promo) {
      await admin.from('promo_codes').update({ uses_count: (promo.uses_count ?? 0) + 1 }).eq('code', updated.promo_code)
    }
  }

  const { data: requesterProfile } = await admin.from('profiles').select('email').eq('id', profile.id).single()
  if (requesterProfile?.email) {
    await sendBookingConfirmation(updated, requesterProfile.email)
  }

  await insertNotification(
    admin,
    profile.id,
    'Booking confirmed',
    `Your $${Number(updated.quoted_price).toFixed(0)} move is live — waiting for a mover.`,
    `/app/jobs/${updated.id}`,
  )

  return jsonResponse({ job: updated })
})
