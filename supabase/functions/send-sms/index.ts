import { corsHeaders, jsonResponse } from '../_shared/cors.ts'

// Server-to-server only (invoked from other Edge Functions via
// sendSmsBestEffort), never from the browser — so instead of validating a
// user JWT via getCallerProfile, we check the bearer token against the
// service role key directly.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const authHeader = req.headers.get('Authorization')
  const token = authHeader?.replace(/^Bearer\s+/i, '')
  if (!token || token !== Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  let body: { to: string; body: string }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Invalid request' }, 400)
  }
  if (!body.to || typeof body.to !== 'string' || !body.body || typeof body.body !== 'string') {
    return jsonResponse({ error: 'Invalid request' }, 400)
  }

  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN')
  const fromNumber = Deno.env.get('TWILIO_FROM_NUMBER')

  if (!accountSid || !authToken || !fromNumber) {
    console.warn('Twilio credentials not set — skipping SMS send')
    return jsonResponse({ skipped: true })
  }

  try {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + btoa(`${accountSid}:${authToken}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ To: body.to, From: fromNumber, Body: body.body }).toString(),
    })
    if (!res.ok) {
      console.error('Failed to send SMS', await res.text())
      return jsonResponse({ error: 'Failed to send SMS' }, 500)
    }
    return jsonResponse({ success: true })
  } catch (err) {
    console.error('Failed to send SMS', err)
    return jsonResponse({ error: 'Failed to send SMS' }, 500)
  }
})
