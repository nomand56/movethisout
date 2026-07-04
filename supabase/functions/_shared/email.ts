export async function sendEmail(to: string | string[], subject: string, html: string) {
  const apiKey = Deno.env.get('RESEND_API_KEY')
  if (!apiKey) {
    console.warn('RESEND_API_KEY not set — skipping email send')
    return
  }
  const recipients = Array.isArray(to) ? to : [to]
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'MoveThisOut <no-reply@movethisout.app>',
        to: recipients,
        subject,
        html,
      }),
    })
  } catch (err) {
    console.error('Failed to send email', err)
  }
}
