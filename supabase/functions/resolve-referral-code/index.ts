import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'

// Public endpoint (no getCallerProfile) — must work for not-yet-registered
// visitors resolving a ?ref=CODE link before they've signed up.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  let body: { code: string }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400)
  }
  if (!body.code || typeof body.code !== 'string') {
    return jsonResponse({ error: 'code is required' }, 400)
  }

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  const { data, error } = await admin.from('profiles').select('id').eq('referral_code', body.code).single()
  if (error || !data) return jsonResponse({ error: 'Invalid referral code' }, 404)

  return jsonResponse({ referrer_id: data.id })
})
