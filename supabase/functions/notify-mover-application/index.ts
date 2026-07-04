import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { getCallerProfile } from '../_shared/auth.ts'
import { sendEmail } from '../_shared/email.ts'

// FR-110: notify admin when a mover submits their application.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const { profile, admin, error: authError } = await getCallerProfile(req)
  if (authError || !profile || !admin) return jsonResponse({ error: authError ?? 'Unauthorized' }, 401)
  if (profile.role !== 'mover') return jsonResponse({ error: 'Movers only' }, 403)

  const adminEmails = (Deno.env.get('ADMIN_EMAILS') ?? '')
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean)

  if (adminEmails.length === 0) {
    const { data: admins } = await admin.from('profiles').select('email').eq('role', 'admin')
    adminEmails.push(...(admins?.map((a) => a.email) ?? []))
  }

  if (adminEmails.length > 0) {
    await sendEmail(
      adminEmails,
      'New mover application — MoveThisOut',
      `<p><strong>${profile.full_name}</strong> (${profile.email}) submitted a mover application.</p>
       <p>Review it in the <a href="${Deno.env.get('APP_URL') ?? 'https://movethisout.app'}/admin/approvals">approval queue</a>.</p>`,
    )
  }

  return jsonResponse({ success: true })
})
