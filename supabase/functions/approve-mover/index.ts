import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { getCallerProfile } from '../_shared/auth.ts'

async function sendEmail(to: string, subject: string, html: string) {
  const apiKey = Deno.env.get('RESEND_API_KEY')
  if (!apiKey) {
    console.warn('RESEND_API_KEY not set — skipping email send')
    return
  }
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'MoveThisOut <no-reply@movethisout.app>', to, subject, html }),
    })
  } catch (err) {
    console.error('Failed to send email', err)
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const { profile, admin, error: authError } = await getCallerProfile(req)
  if (authError || !profile || !admin) return jsonResponse({ error: authError ?? 'Unauthorized' }, 401)

  // SEC-202 / FR-403-407: only admins can approve or reject mover applications.
  if (profile.role !== 'admin') return jsonResponse({ error: 'Admin access required' }, 403)

  let body: { mover_id: string; action: 'approve' | 'reject'; reason?: string }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400)
  }
  if (!body.mover_id || (body.action !== 'approve' && body.action !== 'reject')) {
    return jsonResponse({ error: 'mover_id and a valid action are required' }, 400)
  }
  // FR-406: rejection requires a reason.
  if (body.action === 'reject' && !body.reason?.trim()) {
    return jsonResponse({ error: 'A rejection reason is required' }, 400)
  }

  const { data: moverProfileRow } = await admin
    .from('profiles')
    .select('email, full_name')
    .eq('id', body.mover_id)
    .single()
  if (!moverProfileRow) return jsonResponse({ error: 'Mover not found' }, 404)

  const newStatus = body.action === 'approve' ? 'active' : 'suspended'
  const { error: updateError } = await admin
    .from('mover_profiles')
    .update({ status: newStatus })
    .eq('id', body.mover_id)
  if (updateError) return jsonResponse({ error: 'Could not update mover status' }, 500)

  if (body.action === 'approve') {
    await sendEmail(
      moverProfileRow.email,
      'Your MoveThisOut mover application was approved',
      `<p>Hi ${moverProfileRow.full_name},</p><p>You're approved! You can now log in and start accepting jobs.</p>`
    )
  } else {
    await sendEmail(
      moverProfileRow.email,
      'Your MoveThisOut mover application was not approved',
      `<p>Hi ${moverProfileRow.full_name},</p><p>Unfortunately your application was not approved.</p><p>Reason: ${body.reason}</p>`
    )
  }

  return jsonResponse({ success: true })
})
