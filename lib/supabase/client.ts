// lib/supabase/client.ts — the browser Supabase client
//
// 2026-08-20: seven components imported createClientComponentClient from the
// DEPRECATED @supabase/auth-helpers-nextjs, which keeps the session in cookies.
// This platform stores sessions in localStorage (architecture locked
// 2026-07-15), so that client finds nothing - and a Discord session carrying
// provider tokens exceeds 4KB, gets chunked across three cookies, and racing
// instances clobber the pieces. That is what killed the javari-spirits shelf.
//
// Module-level singleton so it is stable across renders and safe as a hook
// dependency; returning a new client per call is what made onAuthStateChange
// re-subscribe on every render.
//
// CR AudioViz AI · EIN 39-3646201 · August 2026
import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'
import { publishableKey, supabaseUrl } from "@craudioviz/platform-sdk";

let browserClient: SupabaseClient | null = null

export function createClient(): SupabaseClient {
  if (browserClient) return browserClient
  // 2026-09-11: same inlining rule as lib/supabase.ts - the literal names must appear here.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || supabaseUrl()
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    publishableKey()
  if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set')
  if (!key) throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set')
  browserClient = createSupabaseClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' },
  })
  return browserClient
}

/** Historical alias. Same singleton - NOT the auth-helpers cookie client. */
export const createClientComponentClient = createClient
export default createClient
