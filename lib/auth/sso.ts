'use client'
// lib/auth/sso.ts — cross-domain sign-in for a branded CR AudioViz AI site
//
// Sessions live in localStorage, which the browser scopes to ONE origin, so a
// session on craudiovizai.com is invisible here. This asks the identity origin
// once per tab and adopts the answer.
//
// SELF-CONTAINED ON PURPOSE. It builds its own Supabase client from env and
// imports nothing from the host repo, because the branded sites do not share a
// layout: some have lib/supabase/client.ts, some lib/supabase.ts, some none at
// all. A helper that assumes the host's shape is a helper that gets forked, and
// forks are how this platform ended up with four competing shared-service files.
//
// LOOPING IS THE FAILURE THAT MATTERS. A visitor signed out everywhere, asked on
// every page load, bounces between two domains forever. One attempt per tab,
// recorded in sessionStorage.
//
// CR AudioViz AI · EIN 39-3646201 · August 2026
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { publishableKey, supabaseUrl } from "@craudioviz/platform-sdk";

const CORE_ORIGIN = 'https://craudiovizai.com'
const ATTEMPTED = 'javari-sso-attempted'

let client: SupabaseClient | null = null
function db(): SupabaseClient {
  if (client) return client
  const url = supabaseUrl()
  const key = publishableKey()
  if (!url || !key) throw new Error('Supabase env not configured')
  client = createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' },
  })
  return client
}

function asked(): boolean {
  try { return window.sessionStorage.getItem(ATTEMPTED) === '1' } catch { return true }
}
function markAsked(): void {
  try { window.sessionStorage.setItem(ATTEMPTED, '1') } catch { /* private mode */ }
}
function cleanUrl(): void {
  const u = new URL(window.location.href)
  let touched = false
  for (const k of ['sso_code', 'sso']) if (u.searchParams.has(k)) { u.searchParams.delete(k); touched = true }
  if (touched) window.history.replaceState({}, '', u.toString())
}

/**
 * @returns 'signed-in' when a session now exists here, 'redirecting' when the
 *          browser is being sent to the identity origin, 'signed-out' otherwise.
 */
export async function attemptSso(): Promise<'signed-in' | 'redirecting' | 'signed-out'> {
  // factory: embedded on craudiovizai.com the platform supplies the session through the
  // embed bridge; bouncing from here would navigate the FRAME to craudiovizai.com.
  if (typeof window !== 'undefined' && window.self !== window.top) return 'signed-out'

  const params = new URLSearchParams(window.location.search)

  const code = params.get('sso_code')
  if (code) {
    markAsked()
    try {
      const res = await fetch('/api/auth/sso/consume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
        cache: 'no-store',
      })
      if (!res.ok) { cleanUrl(); return 'signed-out' }
      const { tokenHash } = (await res.json()) as { tokenHash: string }
      // Establishes a session owned by THIS origin. Copying the identity
      // origin's tokens instead would put two origins on one refresh token, and
      // Supabase rotates them - so the two would sign each other out at random.
      const { error } = await db().auth.verifyOtp({ token_hash: tokenHash, type: 'email' })
      cleanUrl()
      return error ? 'signed-out' : 'signed-in'
    } catch { cleanUrl(); return 'signed-out' }
  }

  if (params.get('sso') === 'none') { markAsked(); cleanUrl(); return 'signed-out' }

  try {
    const { data } = await db().auth.getSession()
    if (data.session) return 'signed-in'
  } catch { return 'signed-out' }

  if (asked()) return 'signed-out'
  markAsked()

  const back = new URL(window.location.href)
  back.searchParams.delete('sso_code')
  back.searchParams.delete('sso')
  window.location.assign(`${CORE_ORIGIN}/auth/handoff?redirect=${encodeURIComponent(back.toString())}`)
  return 'redirecting'
}
