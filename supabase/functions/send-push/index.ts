import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendPushBestEffort } from '../_shared/push.ts'

// FR-604: internal push delivery — called server-to-server with service role key.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
  if (!token || token !== Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  let body: { user_id: string; title: string; body: string; url?: string }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400)
  }
  if (!body.user_id || !body.title || !body.body) {
    return jsonResponse({ error: 'user_id, title, and body are required' }, 400)
  }

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  await sendPushBestEffort(admin, body.user_id, {
    title: body.title,
    body: body.body,
    url: body.url ?? '/',
  })

  return jsonResponse({ success: true })
})
