import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

interface PushPayload {
  title: string
  body: string
  url: string
}

export async function sendPushBestEffort(
  admin: ReturnType<typeof createClient>,
  userId: string,
  payload: PushPayload,
): Promise<void> {
  const publicKey = Deno.env.get('VAPID_PUBLIC_KEY')
  const privateKey = Deno.env.get('VAPID_PRIVATE_KEY')
  if (!publicKey || !privateKey) return

  try {
    const { data: subs } = await admin.from('push_subscriptions').select('*').eq('user_id', userId)
    if (!subs?.length) return

    webpush.setVapidDetails('mailto:admin@movethisout.app', publicKey, privateKey)

    await Promise.allSettled(
      subs.map((sub) =>
        webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify(payload),
        ).catch((err) => {
          if (err?.statusCode === 404 || err?.statusCode === 410) {
            admin.from('push_subscriptions').delete().eq('id', sub.id)
          }
        })
      ),
    )
  } catch (err) {
    console.error('Failed to send push', err)
  }
}
