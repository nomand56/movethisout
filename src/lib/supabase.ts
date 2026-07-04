import { createClient, FunctionsHttpError } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// supabase-js's FunctionsHttpError.message is always the generic
// "Edge Function returned a non-2xx status code" — the actual reason our
// functions send back (e.g. "This job is no longer available") lives in the
// response body, which we have to read out of error.context ourselves.
export async function getFunctionErrorMessage(error: unknown): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.json()
      if (body?.error) return body.error as string
    } catch {
      // response wasn't JSON — fall through to the generic message
    }
  }
  return error instanceof Error ? error.message : 'Something went wrong'
}

/** Human-readable message from a Supabase PostgREST / DB error. */
export function getPostgrestErrorMessage(error: { message?: string; code?: string; details?: string } | null): string {
  if (!error) return 'Something went wrong'
  if (error.code === 'PGRST204') return 'Database schema is out of date. Run Supabase migrations (see MIGRATION.md).'
  if (error.code === 'PGRST205' || error.code === '42P01') return 'Database table missing. Run Supabase migrations (see MIGRATION.md).'
  if (error.code === '23503') return 'Your account profile is missing. Sign out and sign in again, or contact support.'
  if (error.code === '42501') return 'You do not have permission to create this booking. Sign in as a requester.'
  if (error.message?.includes('Insufficient account credit')) return 'Insufficient referral credit on your account.'
  return error.message || 'Could not save your booking. Please try again.'
}

/** True when a table/column from a newer migration has not been applied yet. */
export function isSchemaMissingError(error: { code?: string; message?: string; status?: number } | null): boolean {
  if (!error) return false
  if (error.status === 404) return true
  return error.code === 'PGRST204' || error.code === 'PGRST205' || error.code === '42P01'
    || (error.message?.includes('does not exist') ?? false)
    || (error.message?.includes('schema cache') ?? false)
}
