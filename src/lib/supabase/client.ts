import { createClient as _createClient } from '@supabase/supabase-js'

/** Anon-key browser client — subject to RLS. */
export function createClient() {
  return _createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
