// lib/supabase.ts — CR AudioViz AI Platform Standard  May 16 2026
import { createClient as _create, SupabaseClient } from "@supabase/supabase-js"

function getUrl() { return process.env.NEXT_PUBLIC_SUPABASE_URL! }
function getAnon() { return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! }
function getSvc() { return process.env.SUPABASE_SERVICE_ROLE_KEY ?? getAnon() }

let _supabase: SupabaseClient | null = null
let _supabaseAdmin: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (!_supabase) _supabase = _create(getUrl(), getAnon())
  return _supabase
}
export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) _supabaseAdmin = _create(getUrl(), getSvc(), { auth: { persistSession: false } })
  return _supabaseAdmin
}

// Named exports for backward compat — these are now lazy proxies
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_t, prop) { return (getSupabase() as unknown as Record<string, unknown>)[prop as string] }
})
export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_t, prop) { return (getSupabaseAdmin() as unknown as Record<string, unknown>)[prop as string] }
})
export const createClient = () => _create(getUrl(), getAnon())

export async function getUser(c?: SupabaseClient) {
  const { data: { user } } = await (c ?? getSupabase()).auth.getUser()
  return user
}
export async function getSession(c?: SupabaseClient) {
  const { data: { session } } = await (c ?? getSupabase()).auth.getSession()
  return session
}
export async function logActivity(p: { userId?: string; action: string; details?: Record<string, unknown>; appId?: string }) {
  try {
    await getSupabaseAdmin().from("activity_log").insert({
      user_id: p.userId ?? "anon", action: p.action,
      details: p.details ?? {}, app_id: p.appId ?? "javari",
      created_at: new Date().toISOString()
    })
  } catch {}
}
export async function getPartnerByUserId(userId: string) {
  const { data } = await getSupabaseAdmin().from("partners").select("*").eq("user_id", userId).single()
  return data
}
export function shouldChargeCredits(email?: string | null) {
  return !["royhenderson@craudiovizai.com", "cindyhenderson@craudiovizai.com"].includes(email ?? "")
}
export function isAdmin(email?: string | null) { return !shouldChargeCredits(email) }

// Browser client for auth (SSR-safe singleton)
let _browserClient: SupabaseClient | null = null
export function createSupabaseBrowserClient(): SupabaseClient {
  if (typeof window === "undefined") return _create(getUrl(), getAnon())
  if (!_browserClient) _browserClient = _create(getUrl(), getAnon(), { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } })
  return _browserClient
}
export function createSupabaseServerClient(): SupabaseClient {
  return _create(getUrl(), getSvc(), { auth: { persistSession: false } })
}
export { getUrl as SUPABASE_URL_FN }
