const KEY = 'movethisout-post-auth-redirect'

export function setPostAuthRedirect(path: string): void {
  localStorage.setItem(KEY, path)
}

export function consumePostAuthRedirect(): string | null {
  const path = localStorage.getItem(KEY)
  if (path !== null) localStorage.removeItem(KEY)
  return path
}
