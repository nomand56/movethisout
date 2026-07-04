import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Verifies the caller's JWT (CI-03: browser always sends Authorization header)
// and returns their profile row, so each function can check role/status
// itself (SEC-202: re-validate identity and role server-side).
export async function getCallerProfile(req: Request) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return { error: 'Missing Authorization header' }
  const token = authHeader.replace(/^Bearer\s+/i, '')

  const anon = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!)

  const { data: { user }, error: authError } = await anon.auth.getUser(token)
  if (authError || !user) return { error: 'Invalid or expired session' }

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) return { error: 'Profile not found' }
  if (profile.is_suspended) return { error: 'Account is suspended' }

  return { profile, admin }
}

// Optional auth — guest quotes (e.g. /book) work without a logged-in user.
export async function getOptionalCallerProfile(req: Request) {
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return { profile: null, admin }

  const token = authHeader.replace(/^Bearer\s+/i, '')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  if (anonKey && token === anonKey) return { profile: null, admin }

  const anon = createClient(Deno.env.get('SUPABASE_URL')!, anonKey!)
  const { data: { user }, error: authError } = await anon.auth.getUser(token)
  if (authError || !user) return { profile: null, admin }

  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !profile || profile.is_suspended) return { profile: null, admin }
  return { profile, admin }
}
