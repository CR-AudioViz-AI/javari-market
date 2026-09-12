// lib/supabase.ts — CR AudioViz AI Platform Standard  May 16 2026
// Updated: 2026-08-14 — fix missing _supabase declaration (TDZ crash);
//                        add getPicks/getAIModels/getAIStatistics/getHotPicks/
//                        getOverallStats/getRecentWinners/AssetType exports
import { createClient as _create, SupabaseClient } from "@supabase/supabase-js"
import { secretKey, publishableKey, supabaseUrl } from "@craudioviz/platform-sdk";

function getUrl() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || supabaseUrl();
  if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set');
  return url;
}
// 2026-09-11: read the NEXT_PUBLIC_* names DIRECTLY here. Next inlines a public env
// var only where the literal `process.env.NEXT_PUBLIC_...` appears in compiled app code;
// reading it through the SDK helper left the browser bundle with an empty string, and
// eleven pages died with "supabaseKey is required" (watchlist, portfolio, battle,
// crypto, penny-stocks, charts, alerts, backtest, export, insights, paper-trading).
function getAnon() {
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    publishableKey();
  if (!key) throw new Error('Supabase publishable key is not set (NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)');
  return key;
}
function getSvc() { return secretKey() ?? getAnon() }

// ⚠️ _supabase MUST be declared before getSupabase() — TDZ guard
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
    await getSupabaseAdmin().from("javari_activity_log").insert({
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

// ============================================================================
// QUERY HELPERS — used by dashboard-data and other API routes
// ============================================================================

export type AssetType = 'stock' | 'penny_stock' | 'crypto'

export interface Pick {
  id: string
  ai_model_id: string
  ticker: string
  symbol: string
  company_name: string
  category: string
  asset_type: AssetType
  direction: 'UP' | 'DOWN'
  confidence: number
  entry_price: number
  current_price: number
  target_price: number
  stop_loss: number
  price_change_percent: number
  price_change_dollars: number
  reasoning: string
  reasoning_summary: string
  key_factors: string[]
  risk_factors: string[]
  status: 'active' | 'closed'
  result?: 'win' | 'loss'
  profit_loss_percent?: number
  points_earned?: number
  week_number: number
  pick_date: string
  expiry_date: string
  price_updated_at: string
  closed_at?: string
}

export interface AIModel {
  id: string
  name: string
  provider: string
  model: string
  total_picks: number
  total_wins: number
  total_losses: number
  win_rate: number
  total_profit_loss: number
  current_streak: number
  best_win_streak: number
  worst_loss_streak: number
  updated_at: string
}

export interface AIStatistics {
  totalPicks: number
  activePicks: number
  closedPicks: number
  wins: number
  losses: number
  winRate: number
  avgConfidence: number
  avgProfitLoss: number
}

export interface OverallStats {
  totalPicks: number
  totalWins: number
  totalLosses: number
  overallWinRate: number
  totalModels: number
  activeModels: number
}

export async function getPicks(opts: {
  assetType?: AssetType
  status?: 'active' | 'closed'
  limit?: number
} = {}): Promise<Pick[]> {
  // 2026-09-11: was getSupabaseAdmin(). These helpers run in CLIENT components, where
  // the secret key is deliberately empty - supabase-js then threw "supabaseKey is
  // required" and eleven pages showed nothing. Published contest data is readable with
  // the publishable key under RLS, which is what a browser should be using anyway.
  const sb = getSupabase()
  let q = sb.from('stock_picks').select('*').order('pick_date', { ascending: false })
  if (opts.assetType) q = q.eq('asset_type', opts.assetType)
  if (opts.status) q = q.eq('status', opts.status)
  if (opts.limit) q = q.limit(opts.limit)
  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as Pick[]
}

export async function getAIModels(): Promise<AIModel[]> {
  const sb = getSupabase()
  const { data, error } = await sb
    .from('ai_models')
    .select('*')
    .order('win_rate', { ascending: false })
  if (error) throw error
  return (data ?? []) as AIModel[]
}

export async function getAIStatistics(assetType?: AssetType): Promise<AIStatistics> {
  const picks = await getPicks({ assetType, limit: 2000 })
  const closed = picks.filter(p => p.status === 'closed')
  const wins = closed.filter(p => p.result === 'win')
  const losses = closed.filter(p => p.result === 'loss')
  const avgConf = picks.length
    ? picks.reduce((s, p) => s + p.confidence, 0) / picks.length
    : 0
  const avgPL = closed.length
    ? closed.reduce((s, p) => s + (p.profit_loss_percent ?? 0), 0) / closed.length
    : 0
  return {
    totalPicks: picks.length,
    activePicks: picks.filter(p => p.status === 'active').length,
    closedPicks: closed.length,
    wins: wins.length,
    losses: losses.length,
    winRate: closed.length ? (wins.length / closed.length) * 100 : 0,
    avgConfidence: parseFloat(avgConf.toFixed(1)),
    avgProfitLoss: parseFloat(avgPL.toFixed(2)),
  }
}

export async function getHotPicks(limit = 10, assetType?: AssetType): Promise<Pick[]> {
  const sb = getSupabase()
  let q = sb
    .from('stock_picks')
    .select('*')
    .eq('status', 'active')
    .order('confidence', { ascending: false })
    .limit(limit)
  if (assetType) q = q.eq('asset_type', assetType)
  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as Pick[]
}

export async function getOverallStats(): Promise<OverallStats> {
  const sb = getSupabase()
  const [{ data: picks }, { data: models }] = await Promise.all([
    sb.from('stock_picks').select('status, result'),
    sb.from('ai_models').select('id, total_picks'),
  ])
  const allPicks = picks ?? []
  const closed = allPicks.filter((p: { status: string }) => p.status === 'closed')
  const wins = closed.filter((p: { result: string }) => p.result === 'win')
  const allModels = models ?? []
  return {
    totalPicks: allPicks.length,
    totalWins: wins.length,
    totalLosses: closed.length - wins.length,
    overallWinRate: closed.length ? parseFloat(((wins.length / closed.length) * 100).toFixed(1)) : 0,
    totalModels: allModels.length,
    activeModels: allModels.filter((m: { total_picks: number }) => m.total_picks > 0).length,
  }
}

export async function getRecentWinners(limit = 5, assetType?: AssetType): Promise<Pick[]> {
  const sb = getSupabase()
  let q = sb
    .from('stock_picks')
    .select('*')
    .eq('status', 'closed')
    .eq('result', 'win')
    .order('closed_at', { ascending: false })
    .limit(limit)
  if (assetType) q = q.eq('asset_type', assetType)
  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as Pick[]
}

// ---------------------------------------------------------------------------
// 2026-09-05: the named picks helpers, and two re-exports.
//
// Five imports across the app named exports this module does not have:
// getAllStockPicks, getCryptoPicks, getPennyStockPicks, StockPick and AI_MODELS.
// The first three were never written anywhere; the last two live in
// lib/ai-prediction-engine.ts and lib/types/ai-models.ts.
//
// Webpack built the app regardless and the pages threw at runtime. Turbopack,
// the default builder from Next 16, refuses the imports outright - which is the
// only reason anybody noticed that /crypto and /backtesting have never worked.
//
// The three helpers are thin wrappers over getPicks, which already does the
// work. Written here rather than at the call sites so the asset-type strings
// live in one place: a page that filters on 'penny' instead of 'penny_stock'
// silently returns nothing, and nothing about an empty list says why.

/** Every pick, newest first. */
export async function getAllStockPicks(): Promise<Pick[]> {
  return getPicks({});
}

/** Crypto picks only. */
export async function getCryptoPicks(): Promise<Pick[]> {
  return getPicks({ assetType: 'crypto' });
}

/** Penny stocks only. Note the asset_type value is 'penny_stock', not 'penny'. */
export async function getPennyStockPicks(): Promise<Pick[]> {
  return getPicks({ assetType: 'penny_stock' });
}

// Re-exported so the pages can keep importing from one module. StockPick is the
// engine's name for the same shape this file calls Pick; both are kept because
// renaming a type across an app is a larger change than this fix warrants.
export type { StockPick } from './ai-prediction-engine';
export { AI_MODELS } from './types/ai-models';

