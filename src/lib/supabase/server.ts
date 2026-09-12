import { createClient as _createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { SESSION_COOKIE, verifySignedToken } from '@/lib/session'

/** Service-role client — bypasses RLS. Use only in server-side code. */
export function createAdminClient() {
  return _createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

export type Profile = {
  id: string
  group_id: string
  prenom: string
  avatar_url: string | null
  session_token: string
  created_at: string
  last_feed_view_at: string | null
}

/**
 * Reads the session cookie, verifies its signature, and returns the
 * matching profile from the DB. Returns null if unauthenticated.
 * Only call in Server Components or Route Handlers.
 */
export async function getProfile(): Promise<Profile | null> {
  const cookieStore = await cookies()
  const signed = cookieStore.get(SESSION_COOKIE)?.value ?? ''
  const token = verifySignedToken(signed)
  if (!token) return null

  const supabase = createAdminClient()
  const { data } = await supabase
    .from('profiles')
    .select('id, group_id, prenom, avatar_url, session_token, created_at, last_feed_view_at')
    .eq('session_token', token)
    .maybeSingle()

  return data ?? null
}
