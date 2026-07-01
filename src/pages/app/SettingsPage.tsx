import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'

export default function SettingsPage() {
  const { profile, setProfile } = useAuthStore()
  const [phone, setPhone] = useState(profile?.phone ?? '')
  const [savingPhone, setSavingPhone] = useState(false)
  const [phoneStatus, setPhoneStatus] = useState<'idle' | 'saved' | 'error'>('idle')
  const [smsStatus, setSmsStatus] = useState<'idle' | 'saved' | 'error'>('idle')
  const [copied, setCopied] = useState(false)

  if (!profile) return null

  const inviteLink = `${window.location.origin}/register?role=requester&ref=${profile.referral_code}`

  const handleCopyInviteLink = async () => {
    await navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSavePhone = async () => {
    setSavingPhone(true)
    setPhoneStatus('idle')
    const { error } = await supabase.from('profiles').update({ phone }).eq('id', profile.id)
    setSavingPhone(false)
    if (error) {
      setPhoneStatus('error')
      return
    }
    setProfile({ ...profile, phone })
    setPhoneStatus('saved')
  }

  const handleToggleSms = async (checked: boolean) => {
    setSmsStatus('idle')
    const { error } = await supabase.from('profiles').update({ sms_notifications_enabled: checked }).eq('id', profile.id)
    if (error) {
      setSmsStatus('error')
      return
    }
    setProfile({ ...profile, sms_notifications_enabled: checked })
    setSmsStatus('saved')
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
        <p className="text-sm text-gray-500">Manage your contact info and notifications</p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Phone Number</h2>
        <Input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+1 555 0123"
        />
        <div className="flex items-center gap-3">
          <Button size="sm" loading={savingPhone} onClick={handleSavePhone}>Save</Button>
          {phoneStatus === 'saved' && <span className="text-sm text-green-600">Saved</span>}
          {phoneStatus === 'error' && <span className="text-sm text-red-600">Could not save</span>}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Notifications</h2>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={profile.sms_notifications_enabled}
            onChange={(e) => handleToggleSms(e.target.checked)}
            className="h-5 w-5 rounded border-gray-300 dark:border-gray-700 text-brand-500 focus:ring-brand-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            SMS notifications for job updates
          </span>
        </label>
        {smsStatus === 'saved' && <span className="text-sm text-green-600">Saved</span>}
        {smsStatus === 'error' && <span className="text-sm text-red-600">Could not save</span>}
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Referrals</h2>
        <p className="text-sm text-gray-500">
          Share your invite link. When someone you refer completes their first job, you both get account credit.
        </p>
        <div className="flex items-center gap-3">
          <Input type="text" value={inviteLink} readOnly />
          <Button size="sm" onClick={handleCopyInviteLink}>Copy</Button>
        </div>
        {copied && <span className="text-sm text-green-600">Copied</span>}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
          <span className="text-sm text-gray-700 dark:text-gray-300">Account credit</span>
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">${profile.account_credit.toFixed(2)}</span>
        </div>
      </div>
    </div>
  )
}
