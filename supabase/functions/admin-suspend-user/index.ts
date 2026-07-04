import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { getCallerProfile } from '../_shared/auth.ts'

// FR-415/416: admin suspend/reinstate with session invalidation.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const { profile, admin, error: authError } = await getCallerProfile(req)
  if (authError || !profile || !admin) return jsonResponse({ error: authError ?? 'Unauthorized' }, 401)
  if (profile.role !== 'admin') return jsonResponse({ error: 'Admin access required' }, 403)

  let body: { user_id: string; suspend: boolean }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400)
  }
  if (!body.user_id || typeof body.suspend !== 'boolean') {
    return jsonResponse({ error: 'user_id and suspend are required' }, 400)
  }

  const { error: updateError } = await admin
    .from('profiles')
    .update({ is_suspended: body.suspend })
    .eq('id', body.user_id)
  if (updateError) return jsonResponse({ error: 'Could not update user' }, 500)

  if (body.suspend) {
    await admin.auth.admin.signOut(body.user_id, 'global')
  }

  return jsonResponse({ success: true })
})
