import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { sendEmail } from '../_shared/email.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
  if (!token || token !== Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  let body: { to: string | string[]; subject: string; html: string }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400)
  }
  if (!body.to || !body.subject || !body.html) {
    return jsonResponse({ error: 'to, subject, and html are required' }, 400)
  }

  await sendEmail(body.to, body.subject, body.html)
  return jsonResponse({ success: true })
})
