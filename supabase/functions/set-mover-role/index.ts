import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { getCallerProfile } from '../_shared/auth.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const { profile, admin, error: authError } = await getCallerProfile(req)
  if (authError || !profile || !admin) return jsonResponse({ error: authError ?? 'Unauthorized' }, 401)

  // Role self-escalation is blocked by RLS on purpose (profiles_update_self
  // pins role) — this is the only trusted path from requester to mover, and
  // only a fresh requester (never an existing mover/admin) may take it.
  if (profile.role !== 'requester') return jsonResponse({ error: 'Role cannot be changed' }, 409)

  const { error: updateError } = await admin
    .from('profiles')
    .update({ role: 'mover' })
    .eq('id', profile.id)
    .eq('role', 'requester')

  if (updateError) return jsonResponse({ error: 'Could not update role' }, 500)

  return jsonResponse({ success: true })
})
