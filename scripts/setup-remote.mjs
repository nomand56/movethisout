/**
 * Remote setup helper — confirms admin email + promotes role when service role key is set.
 *
 * Usage:
 *   1. Add SUPABASE_SERVICE_ROLE_KEY to .env (Dashboard → Settings → API → service_role)
 *   2. node scripts/setup-remote.mjs
 *
 * Without service role, run scripts/full-setup.sql in Supabase SQL Editor instead.
 */
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

function loadEnv() {
  const path = resolve(root, '.env')
  if (!existsSync(path)) return {}
  const out = {}
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i === -1) continue
    out[t.slice(0, i).trim()] = t.slice(i + 1).trim()
  }
  return out
}

const env = loadEnv()
const url = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL
const anonKey = env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

const ADMIN_EMAIL = 'admin@movethisout.com'
const ADMIN_PASSWORD = 'Admin@Kamloops2026!'

if (!url || !anonKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env')
  process.exit(1)
}

async function ensureAdminAccount() {
  const anon = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } })

  const { data: signIn, error: signInError } = await anon.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  })

  if (!signInError && signIn.user) {
    console.log('Admin can already sign in:', ADMIN_EMAIL)
    return signIn.user.id
  }

  if (signInError?.message?.includes('Email not confirmed')) {
    console.log('Admin account exists but email is not confirmed yet.')
  } else if (signInError?.message?.includes('Invalid login credentials')) {
    const { error: signUpError } = await anon.auth.signUp({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
    if (signUpError && !signUpError.message.includes('already registered')) {
      console.error('Signup failed:', signUpError.message)
      process.exit(1)
    }
    console.log('Created admin auth user:', ADMIN_EMAIL)
  } else if (signInError) {
    console.log('Sign-in check:', signInError.message)
  }

  if (!serviceKey) return null

  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data: list, error: listError } = await admin.auth.admin.listUsers({ perPage: 200 })
  if (listError) {
    console.error('Could not list users:', listError.message)
    return null
  }

  const user = list.users.find((u) => u.email?.toLowerCase() === ADMIN_EMAIL)
  if (!user) {
    console.error('Admin user not found after signup. Run full-setup.sql in SQL Editor.')
    return null
  }

  const { error: updateError } = await admin.auth.admin.updateUserById(user.id, {
    email_confirm: true,
    user_metadata: { full_name: 'MoveThisOut Admin' },
  })
  if (updateError) console.error('Could not confirm email:', updateError.message)
  else console.log('Confirmed admin email.')

  const { error: profileError } = await admin.from('profiles').update({
    role: 'admin',
    full_name: 'MoveThisOut Admin',
  }).eq('id', user.id)

  if (profileError) console.error('Could not promote profile:', profileError.message)
  else console.log('Promoted profile to admin role.')

  return user.id
}

console.log('MoveThisOut remote setup')
console.log('—'.repeat(40))

if (!serviceKey) {
  console.log('\nNo SUPABASE_SERVICE_ROLE_KEY in .env.')
  console.log('Paste scripts/full-setup.sql into Supabase SQL Editor and run it:')
  console.log('https://supabase.com/dashboard/project/idrjqczlvfvatgdwfxei/sql/new')
  console.log('\nDefault admin credentials (after SQL runs):')
  console.log('  Email:   ', ADMIN_EMAIL)
  console.log('  Password:', ADMIN_PASSWORD)
  console.log('  Login:   ', url.replace('.supabase.co', '') + ' → /admin/login')
  process.exit(0)
}

await ensureAdminAccount()

console.log('\nAdmin login:')
console.log('  Email:   ', ADMIN_EMAIL)
console.log('  Password:', ADMIN_PASSWORD)
console.log('\nAlso run scripts/full-setup.sql once if migrations 0006–0009 are not applied yet.')
