import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

/** Insert an in-app notification (notification inbox). */
export async function insertNotification(
  admin: SupabaseClient,
  userId: string,
  title: string,
  body: string,
  url?: string,
): Promise<void> {
  try {
    await admin.from('notifications').insert({ user_id: userId, title, body, url: url ?? null })
  } catch (err) {
    console.error('insertNotification failed', err)
  }
}
