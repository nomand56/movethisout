import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { getCallerProfile } from '../_shared/auth.ts'
import { sendSmsBestEffort } from '../_shared/sms.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const { profile, admin, error: authError } = await getCallerProfile(req)
  if (authError || !profile || !admin) return jsonResponse({ error: authError ?? 'Unauthorized' }, 401)

  // NFR-406: only movers may claim jobs.
  if (profile.role !== 'mover') return jsonResponse({ error: 'Only movers can claim jobs' }, 403)

  const { data: moverProfile } = await admin.from('mover_profiles').select('status').eq('id', profile.id).single()
  if (!moverProfile || moverProfile.status !== 'active') {
    return jsonResponse({ error: 'Your mover account is not approved yet' }, 403)
  }

  let body: { job_id: string }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400)
  }
  if (!body.job_id) return jsonResponse({ error: 'job_id is required' }, 400)

  // FR-320: a mover may only have one active job at a time.
  const { data: existingActive } = await admin
    .from('jobs')
    .select('id')
    .eq('mover_id', profile.id)
    .in('status', ['claimed', 'in_progress'])
    .maybeSingle()
  if (existingActive) return jsonResponse({ error: 'You already have an active job' }, 409)

  // FR-317: atomic claim — only succeeds if status is still 'open'. This is
  // the race-condition guard: two simultaneous claims can only have one
  // UPDATE match the WHERE clause.
  const { data: claimed, error: claimError } = await admin
    .from('jobs')
    .update({ status: 'claimed', mover_id: profile.id })
    .eq('id', body.job_id)
    .eq('status', 'open')
    .select()
    .maybeSingle()

  if (claimError) return jsonResponse({ error: 'Could not claim job' }, 500)
  if (!claimed) return jsonResponse({ error: 'This job is no longer available' }, 409)

  await sendSmsBestEffort(admin, claimed.requester_id, 'A mover has claimed your MoveThisOut job! They will be in touch soon.')

  return jsonResponse({ job: claimed })
})
