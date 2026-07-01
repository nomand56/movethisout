const KEY = 'movethisout-referral-code'

export function setReferralCode(code: string): void {
  localStorage.setItem(KEY, code)
}
