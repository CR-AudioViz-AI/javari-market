// lib/market/data.ts
// Purpose: every read the Market Oracle pages make, in one place.
// Date: 2026-09-11
//
// CR AudioViz AI, LLC · EIN 39-3646201
import "server-only";
import { z } from "zod";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { secretKey, supabaseUrl } from "@craudioviz/platform-sdk";

function db(): SupabaseClient {
  const url = supabaseUrl();
  const key = secretKey();
  if (!url || !key) throw new Error("Supabase credentials unavailable");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false }, global: { fetch: (i, init) => fetch(i, { ...init, cache: "no-store" }) } });
}

export type Model = { id: string; display_name: string; slug: string | null; provider: string; color: string | null; tagline: string | null; specialty: string | null; javari_model: string };
export type Pick = {
  id: string; modelId: string; symbol: string; confidence: number;
  entry: number; current: number | null; target: number; stop: number;
  thesis: string; keyFactors: string[]; risks: string[]; sources: { title: string; url: string; site: string }[];
  status: string; result: string | null; changePct: number | null; pickDate: string; seal: string | null;
};
export type Standing = { model: Model; picks: number; wins: number; losses: number; winRate: number | null; totalReturn: number; open: number; avgConfidence: number | null };

const Sources = z.array(z.object({ title: z.string(), url: z.string(), site: z.string().default("") })).catch([]);
const Strings = z.array(z.string()).catch([]);
const num = (v: unknown): number | null => (v === null || v === undefined ? null : Number(v));

function toPick(r: Record<string, unknown>): Pick {
  return {
    id: String(r.id), modelId: String(r.ai_model_id), symbol: String(r.symbol ?? r.ticker ?? ""),
    confidence: Number(r.confidence ?? 0), entry: Number(r.entry_price ?? 0), current: num(r.current_price),
    target: Number(r.target_price ?? 0), stop: Number(r.stop_loss ?? 0),
    thesis: String(r.reasoning ?? r.reasoning_summary ?? ""),
    keyFactors: Strings.parse(r.key_factors), risks: Strings.parse(r.risk_factors), sources: Sources.parse(r.sources),
    status: String(r.status ?? ""), result: r.result ? String(r.result) : null,
    changePct: num(r.price_change_percent ?? r.profit_loss_percent), pickDate: String(r.pick_date ?? ""),
    seal: r.seal_sha256 ? String(r.seal_sha256) : null,
  };
}

export async function getActiveModels(): Promise<Model[]> {
  const { data, error } = await db().from("ai_models").select("id, display_name, slug, provider, color, tagline, specialty, javari_model")
    .eq("is_active", true).not("javari_model", "is", null).order("display_name");
  if (error) throw new Error(`models: ${error.message}`);
  return (data ?? []) as unknown as Model[];
}

/** The most recent day that has picks, and those picks. */
export async function getLatestBattle(): Promise<{ pickDate: string | null; picks: Pick[]; research: { body: string; sources: { n: number; title: string; url: string; site: string }[]; builtAt: string } | null }> {
  const d = db();
  const { data: last, error: lErr } = await d.from("stock_picks").select("pick_date").not("javari_request_id", "is", null).order("pick_date", { ascending: false }).limit(1).maybeSingle();
  if (lErr) throw new Error(`latest: ${lErr.message}`);
  const pickDate = last?.pick_date ? String(last.pick_date) : null;
  if (!pickDate) return { pickDate: null, picks: [], research: null };
  const [{ data: picks, error: pErr }, { data: pack, error: rErr }] = await Promise.all([
    d.from("stock_picks").select("*").eq("pick_date", pickDate).not("javari_request_id", "is", null).order("confidence", { ascending: false }),
    d.from("market_research_packs").select("*").eq("pick_date", pickDate).eq("category", "stocks").maybeSingle(),
  ]);
  if (pErr) throw new Error(`picks: ${pErr.message}`);
  if (rErr) throw new Error(`research: ${rErr.message}`);
  const packSources = z.array(z.object({ n: z.number(), title: z.string(), url: z.string(), site: z.string().default("") })).catch([]).parse(pack?.sources);
  return {
    pickDate,
    picks: (picks ?? []).map((r) => toPick(r as Record<string, unknown>)),
    research: pack ? { body: String(pack.body), sources: packSources, builtAt: String(pack.built_at) } : null,
  };
}

export async function getStandings(): Promise<Standing[]> {
  const d = db();
  const models = await getActiveModels();
  const ids = models.map((m) => m.id);
  if (!ids.length) return [];
  const { data, error } = await d.from("stock_picks").select("ai_model_id, status, result, profit_loss_percent, confidence").in("ai_model_id", ids);
  if (error) throw new Error(`standings: ${error.message}`);
  const rows = data ?? [];
  return models.map((model) => {
    const mine = rows.filter((r) => r.ai_model_id === model.id);
    const closed = mine.filter((r) => r.status === "closed");
    const wins = closed.filter((r) => r.result === "win").length;
    const losses = closed.filter((r) => r.result === "loss").length;
    const conf = mine.map((r) => Number(r.confidence)).filter((n) => Number.isFinite(n));
    return {
      model, picks: mine.length, wins, losses,
      winRate: wins + losses ? (wins / (wins + losses)) * 100 : null,
      totalReturn: closed.reduce((s, r) => s + (Number(r.profit_loss_percent) || 0), 0),
      open: mine.filter((r) => r.status === "active").length,
      avgConfidence: conf.length ? conf.reduce((a, b) => a + b, 0) / conf.length : null,
    };
  }).sort((a, b) => (b.winRate ?? -1) - (a.winRate ?? -1) || b.totalReturn - a.totalReturn || a.model.display_name.localeCompare(b.model.display_name));
}

export async function getRecentClosed(limit = 12): Promise<(Pick & { modelName: string; color: string | null })[]> {
  const d = db();
  const models = await getActiveModels();
  const byId = new Map(models.map((m) => [m.id, m]));
  const { data, error } = await d.from("stock_picks").select("*").eq("status", "closed").not("javari_request_id", "is", null).order("closed_at", { ascending: false }).limit(limit);
  if (error) throw new Error(`recent: ${error.message}`);
  return (data ?? []).map((r) => {
    const p = toPick(r as Record<string, unknown>);
    const m = byId.get(p.modelId);
    return { ...p, modelName: m?.display_name ?? "Retired model", color: m?.color ?? null };
  });
}
