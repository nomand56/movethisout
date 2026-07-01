import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { getCallerProfile } from '../_shared/auth.ts'

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

  return jsonResponse({ job: updated })
})
