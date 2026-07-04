import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { getCallerProfile } from '../_shared/auth.ts'
import { sendPushBestEffort } from '../_shared/push.ts'
import { sendSmsBestEffort } from '../_shared/sms.ts'

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

  const { data: job } = await admin.from('jobs').select('*').eq('id', body.job_id).single()
  if (!job || job.mover_id !== profile.id) return jsonResponse({ error: 'Not your job' }, 403)
  if (job.status !== 'in_progress') return jsonResponse({ error: 'Job not in progress' }, 409)

  await sendPushBestEffort(admin, job.requester_id, {
    title: 'Move in progress',
    body: 'Your mover has arrived and started the move.',
    url: `/app/jobs/${job.id}`,
  })
  await sendSmsBestEffort(admin, job.requester_id, 'Your MoveThisOut move is now in progress!')

  return jsonResponse({ success: true })
})
