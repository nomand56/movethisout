import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Best-effort SMS send: looks up the user's opt-in + phone, then invokes the
// send-sms Edge Function. Never throws — a notification failure must never
// break the caller's main operation (claim/complete/approve-mover).
export async function sendSmsBestEffort(admin: ReturnType<typeof createClient>, userId: string, body: string): Promise<void> {
  try {
    const { data, error } = await admin
      .from('profiles')
      .select('phone, sms_notifications_enabled')
      .eq('id', userId)
      .single()

    if (error || !data?.sms_notifications_enabled || !data?.phone) return

    await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-sms`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to: data.phone, body }),
    })
  } catch (err) {
    console.error('Failed to send SMS', err)
  }
}
