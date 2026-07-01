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
