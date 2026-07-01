import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'

const KEY = 'movethisout-referral-code'

// One-shot: when a session appears, consume any referral code captured at
// registration (see src/lib/referralCapture.ts / RegisterPage.tsx) and link
// it to a `referrals` row. Always clears the localStorage key so this only
// ever runs once per captured code, mirroring postAuthRedirect's idiom.
export function useReferralCapture() {
  const { session } = useAuthStore()

  useEffect(() => {
    if (!session) return

    const code = localStorage.getItem(KEY)
    if (!code) return

    const run = async () => {
      try {
        const { data } = await supabase.functions.invoke('resolve-referral-code', { body: { code } })
        if (data?.referrer_id) {
          await supabase.from('referrals').insert({
            referrer_id: data.referrer_id,
            referred_id: session.user.id,
            referral_code: code,
            status: 'pending',
          })
        }
      } catch (err) {
        console.error('Referral capture failed', err)
      } finally {
        localStorage.removeItem(KEY)
      }
    }
    run()
  }, [session])
}
