import type { Profile } from '../types'

/** Fill in defaults when older DB schemas omit referral / credit columns. */
export function normalizeProfile(raw: Record<string, unknown> | null): Profile | null {
  if (!raw || typeof raw.id !== 'string') return null
  return {
    id: raw.id as string,
    email: String(raw.email ?? ''),
    full_name: String(raw.full_name ?? ''),
    phone: String(raw.phone ?? ''),
    role: (raw.role as Profile['role']) ?? 'requester',
    is_suspended: Boolean(raw.is_suspended ?? false),
    sms_notifications_enabled: Boolean(raw.sms_notifications_enabled ?? false),
    referral_code: String(raw.referral_code ?? (raw.id as string).slice(0, 8).toUpperCase()),
    account_credit: Number(raw.account_credit ?? 0),
    created_at: String(raw.created_at ?? new Date().toISOString()),
  }
}
