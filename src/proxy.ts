import { type NextRequest } from 'next/server'
import { updateSession, updateSessionWithRewrite } from '@/lib/supabase/middleware'

const MOVER_HOSTS = ['mover.movethisout.ca', 'mover.movethisout.com']

function isMoverSubdomain(host: string): boolean {
  return MOVER_HOSTS.includes(host) || host.startsWith('mover.localhost')
}

export async function proxy(request: NextRequest) {
  const host = request.headers.get('host') ?? ''

  if (isMoverSubdomain(host)) {
    const url = request.nextUrl.clone()
    const pathname = url.pathname

    if (!pathname.startsWith('/mover-app')) {
      url.pathname = pathname === '/' ? '/mover-app' : `/mover-app${pathname}`
    }

    return await updateSessionWithRewrite(request, url)
  }

  return await updateSession(request)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
