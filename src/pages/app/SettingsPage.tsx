import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, isSchemaMissingError } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import type { SavedAddress, AppNotification } from '../../types'
import { useJobCreationStore } from '../../store/jobCreationStore'
import { Link } from 'react-router-dom'

export default function SettingsPage() {
  const { profile, setProfile, session } = useAuthStore()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [phone, setPhone] = useState(profile?.phone ?? '')
  const [phoneStatus, setPhoneStatus] = useState<'idle' | 'saved' | 'error'>('idle')
  const [smsStatus, setSmsStatus] = useState<'idle' | 'saved' | 'error'>('idle')
  const [copied, setCopied] = useState(false)
  const draft = useJobCreationStore()
  const [newLabel, setNewLabel] = useState('Home')
  const [addressSaveError, setAddressSaveError] = useState('')

  const { data: support } = useQuery({
    queryKey: ['support-config'],
    queryFn: async () => {
      const { data, error } = await supabase.from('pricing_config').select('support_email, support_phone').limit(1).single()
      if (error && isSchemaMissingError(error)) return null
      return data as { support_email: string; support_phone: string | null } | null
    },
  })

  const { data: savedAddressesResult, refetch: refetchAddresses } = useQuery({
    queryKey: ['saved-addresses', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('saved_addresses').select('*').eq('user_id', profile!.id).order('created_at', { ascending: false })
      if (error && isSchemaMissingError(error)) return { items: [] as SavedAddress[], missing: true }
      if (error) throw error
      return { items: (data ?? []) as SavedAddress[], missing: false }
    },
    enabled: !!profile,
    retry: false,
  })
  const savedAddresses = savedAddressesResult?.items
  const savedAddressesMissing = savedAddressesResult?.missing ?? false

  const { data: notifications } = useQuery({
    queryKey: ['notifications', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('notifications').select('*').eq('user_id', profile!.id).order('created_at', { ascending: false }).limit(30)
      if (error && isSchemaMissingError(error)) return []
      if (error) throw error
      return (data ?? []) as AppNotification[]
    },
    enabled: !!profile,
    retry: false,
  })

  if (!profile) return null

  const inviteLink = `${window.location.origin}/register?role=requester&ref=${profile.referral_code ?? profile.id.slice(0, 8)}`
  const accountCredit = profile.account_credit ?? 0

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const handleSavePhone = async () => {
    setPhoneStatus('idle')
    const { error } = await supabase.from('profiles').update({ phone }).eq('id', profile.id)
    if (error) { setPhoneStatus('error'); return }
    setProfile({ ...profile, phone })
    setPhoneStatus('saved')
  }

  const handleToggleSms = async (checked: boolean) => {
    setSmsStatus('idle')
    const { error } = await supabase.from('profiles').update({ sms_notifications_enabled: checked }).eq('id', profile.id)
    if (error) { setSmsStatus('error'); return }
    setProfile({ ...profile, sms_notifications_enabled: checked })
    setSmsStatus('saved')
  }

  const saveCurrentPickup = useMutation({
    mutationFn: async () => {
      if (!draft.pickup_address || !draft.pickup_lat) {
        throw new Error('Open Book and set a pickup address first')
      }
      const { error } = await supabase.from('saved_addresses').insert({
        user_id: profile!.id,
        label: newLabel.trim() || 'Saved',
        address: draft.pickup_address,
        lat: draft.pickup_lat,
        lng: draft.pickup_lng,
      })
      if (error) throw error
    },
    onSuccess: () => {
      setAddressSaveError('')
      refetchAddresses()
      qc.invalidateQueries({ queryKey: ['saved-addresses'] })
    },
    onError: (err: Error) => setAddressSaveError(err.message),
  })

  const deleteAddress = async (id: string) => {
    await supabase.from('saved_addresses').delete().eq('id', id)
    refetchAddresses()
  }

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id)
    qc.invalidateQueries({ queryKey: ['notifications'] })
  }

  const resendVerify = async () => {
    if (!session?.user.email) return
    await supabase.auth.resend({ type: 'signup', email: session.user.email })
  }

  const unread = notifications?.filter((n) => !n.read_at).length ?? 0

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl uppercase">Account</h1>
          <p className="text-sm text-gray-600">{profile.full_name} · {profile.email}</p>
        </div>
        <Button variant="secondary" size="sm" onClick={handleLogout}>Sign out</Button>
      </div>

      {session && !session.user.email_confirmed_at && (
        <div className="card-yard p-4 bg-caution">
          <p className="font-bold text-sm text-jet mb-2">Verify your email to book moves</p>
          <Button size="sm" onClick={resendVerify}>Resend verification email</Button>
        </div>
      )}

      <div className="card-yard p-5 flex flex-col gap-3">
        <h2 className="font-condensed font-bold uppercase tracking-wider text-sm">Phone</h2>
        <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 0123" />
        <div className="flex items-center gap-3">
          <Button size="sm" onClick={handleSavePhone}>Save</Button>
          {phoneStatus === 'saved' && <span className="text-sm text-green-600 font-medium">Saved</span>}
          {phoneStatus === 'error' && <span className="text-sm text-red-600 font-medium">Could not save</span>}
        </div>
      </div>

      <div className="card-yard p-5 flex flex-col gap-3">
        <h2 className="font-condensed font-bold uppercase tracking-wider text-sm">Notifications</h2>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={profile.sms_notifications_enabled} onChange={(e) => handleToggleSms(e.target.checked)} className="h-5 w-5 border-3 border-jet text-haul" />
          <span className="text-sm text-jet">SMS for job updates</span>
        </label>
        {smsStatus === 'saved' && <span className="text-sm text-green-600 font-medium">Saved</span>}
        <div className="border-t-3 border-jet pt-3">
          <p className="font-condensed font-bold uppercase tracking-wider text-xs text-gray-500 mb-2">Inbox {unread > 0 && `(${unread} new)`}</p>
          {!notifications?.length && <p className="text-sm text-gray-500">No notifications yet.</p>}
          <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
            {notifications?.map((n) => (
              <div key={n.id} className={`p-3 border-3 text-sm ${n.read_at ? 'border-gray-200 bg-white' : 'border-haul bg-caution/30'}`}>
                <p className="font-bold text-jet">{n.title}</p>
                <p className="text-gray-600 text-xs">{n.body}</p>
                <div className="flex gap-2 mt-2">
                  {n.url && <Link to={n.url} className="text-haul font-bold text-xs" onClick={() => markRead(n.id)}>Open ▸</Link>}
                  {!n.read_at && <button type="button" className="text-xs text-gray-500" onClick={() => markRead(n.id)}>Mark read</button>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {profile.role === 'requester' && (
        <div className="card-yard p-5 flex flex-col gap-3">
          <h2 className="font-condensed font-bold uppercase tracking-wider text-sm">Saved addresses</h2>
          {savedAddressesMissing && (
            <p className="text-xs text-amber-700 font-medium">Run migration 0008 to enable saved addresses (see MIGRATION.md).</p>
          )}
          {savedAddresses?.map((a) => (
            <div key={a.id} className="flex justify-between items-start gap-2 text-sm border-b border-gray-200 pb-2">
              <div>
                <p className="font-bold text-jet">{a.label}</p>
                <p className="text-gray-600">{a.address}</p>
              </div>
              <button type="button" className="text-red-600 text-xs font-bold" onClick={() => deleteAddress(a.id)}>Delete</button>
            </div>
          ))}
          <div className="flex gap-2">
            <Input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Label (e.g. Home)" />
            <Button size="sm" variant="secondary" loading={saveCurrentPickup.isPending} onClick={() => saveCurrentPickup.mutate()}>Save pickup</Button>
          </div>
          {addressSaveError && <p className="text-sm text-red-600 font-medium">{addressSaveError}</p>}
          {saveCurrentPickup.isSuccess && <p className="text-sm text-green-600 font-medium">Address saved</p>}
          <p className="text-xs text-gray-500">Uses the pickup from your current booking draft.</p>
        </div>
      )}

      {profile.role === 'requester' && (
        <div className="card-yard p-5 flex flex-col gap-3">
          <h2 className="font-condensed font-bold uppercase tracking-wider text-sm">Referrals</h2>
          <p className="text-sm text-gray-600">Share your link — you both get credit after their first completed move.</p>
          <div className="flex gap-2">
            <Input type="text" value={inviteLink} readOnly />
            <Button size="sm" onClick={async () => { await navigator.clipboard.writeText(inviteLink); setCopied(true); setTimeout(() => setCopied(false), 2000) }}>Copy</Button>
          </div>
          {copied && <span className="text-sm text-green-600 font-medium">Copied</span>}
          <div className="flex justify-between pt-2 border-t-3 border-jet">
            <span className="text-sm text-jet">Account credit</span>
            <span className="price-hero text-2xl">${accountCredit.toFixed(2)}</span>
          </div>
        </div>
      )}

      <div className="card-yard p-5 flex flex-col gap-2">
        <h2 className="font-condensed font-bold uppercase tracking-wider text-sm">Help &amp; support</h2>
        <p className="text-sm text-gray-600">Questions about a move, payment, or your account?</p>
        {support?.support_email && (
          <a href={`mailto:${support.support_email}`} className="text-haul font-bold text-sm hover:underline">{support.support_email}</a>
        )}
        {support?.support_phone && (
          <a href={`tel:${support.support_phone}`} className="text-jet font-bold text-sm">{support.support_phone}</a>
        )}
      </div>
    </div>
  )
}
