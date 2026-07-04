import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { getCallerProfile } from '../_shared/auth.ts'
import { sendSmsBestEffort } from '../_shared/sms.ts'
import { insertNotification } from '../_shared/notifications.ts'
import { sendPushBestEffort } from '../_shared/push.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const { profile, admin, error: authError } = await getCallerProfile(req)
  if (authError || !profile || !admin) return jsonResponse({ error: authError ?? 'Unauthorized' }, 401)

  let body: { job_id: string; completion_photo_url: string; signature_url: string }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400)
  }
  if (!body.job_id || !body.completion_photo_url || !body.signature_url) {
    return jsonResponse({ error: 'job_id, completion_photo_url and signature_url are required' }, 400)
  }

  const { data: job, error: jobError } = await admin.from('jobs').select('*').eq('id', body.job_id).single()
  if (jobError || !job) return jsonResponse({ error: 'Job not found' }, 404)

  // NFR-407: only the assigned mover may complete their own job.
  if (job.mover_id !== profile.id) return jsonResponse({ error: 'You are not the assigned mover for this job' }, 403)
  if (job.status !== 'in_progress') return jsonResponse({ error: 'Job is not in progress' }, 409)

  const { data: updated, error: updateError } = await admin
    .from('jobs')
    .update({
      status: 'completed',
      completion_photo_url: body.completion_photo_url,
      signature_url: body.signature_url,
    })
    .eq('id', body.job_id)
    .eq('mover_id', profile.id)
    .select()
    .single()

  if (updateError || !updated) return jsonResponse({ error: 'Could not complete job' }, 500)

  await sendSmsBestEffort(admin, updated.requester_id, 'Your MoveThisOut job is complete! Please leave a review in the app.')
  await sendPushBestEffort(admin, updated.requester_id, {
    title: 'Move complete',
    body: 'Your job is done — leave a review!',
    url: `/app/jobs/${updated.id}`,
  })

  await insertNotification(admin, updated.requester_id, 'Move complete', 'Your job is done — leave a review!', `/app/jobs/${updated.id}`)
  if (updated.mover_id) {
    await insertNotification(admin, updated.mover_id, 'Job completed', `Payout of $${Number(updated.mover_payout).toFixed(2)} recorded.`, `/mover/dashboard`)
  }

  // Referral payout: if this is the requester's first ever completed job and
  // they were referred, credit both sides. Isolated in its own try/catch so
  // a referral bug never fails the job-completion response.
  try {
    const { data: referral } = await admin
      .from('referrals')
      .select('*')
      .eq('referred_id', updated.requester_id)
      .eq('status', 'pending')
      .maybeSingle()

    if (referral) {
      const { count } = await admin
        .from('jobs')
        .select('id', { count: 'exact', head: true })
        .eq('requester_id', updated.requester_id)
        .eq('status', 'completed')

      if (count === 1) {
        const { data: pricing } = await admin.from('pricing_config').select('referral_credit_amount').limit(1).single()
        const amount = Number(pricing?.referral_credit_amount ?? 0)

        if (amount > 0) {
          const { data: referrerProfile } = await admin.from('profiles').select('account_credit').eq('id', referral.referrer_id).single()
          await admin.from('profiles').update({ account_credit: Number(referrerProfile?.account_credit ?? 0) + amount }).eq('id', referral.referrer_id)

          const { data: referredProfile } = await admin.from('profiles').select('account_credit').eq('id', referral.referred_id).single()
          await admin.from('profiles').update({ account_credit: Number(referredProfile?.account_credit ?? 0) + amount }).eq('id', referral.referred_id)
        }

        await admin.from('referrals').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', referral.id)
      }
    }
  } catch (referralError) {
    console.error('Referral payout failed', referralError)
  }

  return jsonResponse({ job: updated })
})
