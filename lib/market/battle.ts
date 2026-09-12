// lib/market/battle.ts
// Purpose: the daily AI battle - six NAMED AI models each pick one stock (or coin) to
//   rise over the next 7 days, all through Javari, all on free models.
// Date: 2026-09-11
//
// Every model reads the SAME research pack for its category, so the contest measures
// judgment rather than who was handed better information. The pack is built once a day
// from free sources: live prices (Yahoo, Twelve Data, Alpha Vantage via lib/market/prices)
// and market news found through Javari's research endpoint.
//
// A pick is validated before it is stored (the symbol must be in the pool, the target
// must sit above the entry, the stop below it) and then SEALED with a SHA-256 over the
// pick, the model's raw reply and the research it read. One pick per model per day.
//
// CR AudioViz AI, LLC · EIN 39-3646201
import "server-only";
import { createHash } from "crypto";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getStockPrices } from "@/lib/market/prices";
import { javariGenerate, javariResearch } from "@/lib/javari/door";

export const STOCK_POOL = [
  "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA", "JPM", "V", "UNH",
  "HD", "MA", "PG", "JNJ", "XOM", "DIS", "NFLX", "CRM", "AMD", "INTC",
  "SOFI", "PLTR", "HOOD", "RIVN", "IONQ", "RKLB",
];

const PICK_PURPOSE = "market_pick";
const HOLD_DAYS = 7;

type Db = SupabaseClient;

export type BattleModel = {
  id: string;
  display_name: string;
  provider: string;
  javari_model: string;
  max_output_tokens: number;
  timeout_ms: number;
  reasoning_effort: "low" | "medium" | "high" | null;
};

export type BattleReport = {
  pickDate: string;
  prices: number;
  research: { chars: number; sources: number } | null;
  attempted: number;
  saved: number;
  failed: number;
  skipped: string[];
  errors: string[];
};

// ── The model's reply ────────────────────────────────────────────────────────
const Reply = z.object({
  symbol: z.string().trim().toUpperCase(),
  confidence: z.coerce.number().int().min(50).max(100),
  target_price: z.coerce.number().positive(),
  stop_loss: z.coerce.number().positive(),
  thesis: z.string().trim().min(10).max(1200),
  key_factors: z.array(z.string().trim().max(300)).min(1).max(8),
  risks: z.array(z.string().trim().max(300)).max(8).default([]),
  sources_used: z.array(z.coerce.number().int().min(1).max(40)).max(12).default([]),
});
export type ParsedPick = z.infer<typeof Reply>;

export function parsePick(text: string, prices: Map<string, number>): { ok: true; pick: ParsedPick; entry: number } | { ok: false; error: string } {
  const t = text.replace(/```(?:json)?/gi, "").trim();
  const a = t.indexOf("{");
  const b = t.lastIndexOf("}");
  if (a < 0 || b <= a) return { ok: false, error: "reply contained no JSON object" };
  let json: unknown;
  try { json = JSON.parse(t.slice(a, b + 1)); } catch (e) { return { ok: false, error: `invalid JSON: ${e instanceof Error ? e.message : "parse error"}` }; }
  const r = Reply.safeParse(json);
  if (!r.success) {
    const i = r.error.issues[0];
    return { ok: false, error: `schema: ${i ? `${i.path.join(".")} ${i.message}` : "invalid"}` };
  }
  const entry = prices.get(r.data.symbol);
  if (entry === undefined) return { ok: false, error: `'${r.data.symbol}' is not one of today's listed symbols` };
  if (r.data.target_price <= entry) return { ok: false, error: "target price must be above the current price" };
  if (r.data.stop_loss >= entry) return { ok: false, error: "stop loss must be below the current price" };
  if (r.data.target_price > entry * 3) return { ok: false, error: "target price is more than 3x the current price" };
  return { ok: true, pick: r.data, entry };
}

// ── Research pack, shared by every model ─────────────────────────────────────
export type Source = { n: number; title: string; url: string; site: string };

function clip(s: string, n: number): string {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
}

export async function buildResearchPack(db: Db, pickDate: string, prices: Map<string, number>): Promise<{ body: string; sources: Source[]; sha: string }> {
  const { data: have, error } = await db.from("market_research_packs").select("*").eq("pick_date", pickDate).eq("category", "stocks").maybeSingle();
  if (error) throw new Error(`research pack read: ${error.message}`);
  if (have) {
    const src = z.array(z.object({ n: z.number(), title: z.string(), url: z.string(), site: z.string() })).safeParse(have.sources);
    return { body: have.body as string, sources: src.success ? src.data : [], sha: have.sha256 as string };
  }

  const lines: string[] = ["## Today's prices"];
  for (const sym of STOCK_POOL) {
    const p = prices.get(sym);
    if (p !== undefined) lines.push(`- ${sym}: $${p.toFixed(2)}`);
  }

  // Recent closed picks tell every model how this contest has actually gone.
  const { data: recent, error: rErr } = await db.from("stock_picks")
    .select("symbol, direction, entry_price, current_price, profit_loss_percent, status, pick_date")
    .eq("status", "closed").order("closed_at", { ascending: false }).limit(8);
  if (rErr) throw new Error(`recent picks: ${rErr.message}`);
  if ((recent ?? []).length) {
    lines.push("", "## How recent contest picks turned out");
    for (const p of recent ?? []) {
      const pct = p.profit_loss_percent === null ? "?" : `${Number(p.profit_loss_percent) >= 0 ? "+" : ""}${Number(p.profit_loss_percent).toFixed(1)}%`;
      lines.push(`- ${p.symbol} picked ${p.direction} on ${p.pick_date}: ${pct}`);
    }
  }

  const sources: Source[] = [];
  lines.push("", "## Market news");
  const queries = ["stock market today major movers", "earnings results guidance this week", "Federal Reserve rates inflation market outlook"];
  for (const q of queries) {
    try {
      const items = await javariResearch(q, 4, 3);
      for (const it of items) {
        if (sources.length >= 12 || sources.some((s) => s.url === it.url)) continue;
        let site = "";
        try { site = new URL(it.url).hostname.replace(/^www\./, ""); } catch { site = ""; }
        const n = sources.length + 1;
        sources.push({ n, title: clip(it.title, 200), url: it.url, site });
        lines.push(`- [S${n}] ${clip(it.title, 160)} (${site}): ${clip(it.content, 320)}`);
      }
    } catch {
      lines.push(`- (news search unavailable for "${q}")`);
    }
  }

  const body = lines.join("\n");
  const sha = createHash("sha256").update(body).digest("hex");
  const { error: insErr } = await db.from("market_research_packs").insert({ pick_date: pickDate, category: "stocks", body, sources, sha256: sha });
  if (insErr && insErr.code !== "23505") throw new Error(`research pack write: ${insErr.message}`);
  if (insErr) return buildResearchPack(db, pickDate, prices);
  return { body, sources, sha };
}

// ── Prompt ───────────────────────────────────────────────────────────────────
export const SYSTEM_PROMPT = `You are competing in Javari Market Oracle, a contest in which several AI models each pick one stock per day and are ranked publicly on how those picks actually perform. Entertainment and research only - no investment advice, no real money.

Pick the ONE symbol from today's list you believe will rise most over the next ${HOLD_DAYS} days. Judge it on the research pack and your own market knowledge: company fundamentals, momentum, sector conditions, news and risk.

Rules:
- Choose only from the symbols listed with a price today.
- Your target price must be ABOVE today's price and your stop loss BELOW it.
- Confidence must reflect how sure you really are, not how interesting the story is.
- Reply with ONE JSON object and nothing else - no markdown, no code fences.`;

export function buildUserPrompt(model: BattleModel, pack: string, record: { picks: number; wins: number; losses: number }): string {
  const rec = record.picks > 0
    ? `Your record in this contest so far: ${record.wins} winning picks, ${record.losses} losing picks over ${record.picks} closed picks.`
    : "This is your first pick in the contest.";
  return `Javari Market Oracle - daily pick. You are ${model.display_name} (${model.provider}).
${rec}

RESEARCH PACK (every model receives exactly this)
${pack}

Reply with exactly this JSON:
{
  "symbol": "one symbol from the price list",
  "confidence": integer 50-100,
  "target_price": number above today's price,
  "stop_loss": number below today's price,
  "thesis": "two or three sentences: why this one rises over the next ${HOLD_DAYS} days",
  "key_factors": ["the specific reasons behind the pick"],
  "risks": ["what could go wrong"],
  "sources_used": [numbers of the [S#] news items you relied on]
}`;
}

// ── Runner ───────────────────────────────────────────────────────────────────
async function modelRecord(db: Db, modelId: string): Promise<{ picks: number; wins: number; losses: number }> {
  const { data, error } = await db.from("stock_picks").select("profit_loss_percent, status").eq("ai_model_id", modelId).eq("status", "closed");
  if (error) throw new Error(`record: ${error.message}`);
  const rows = data ?? [];
  return {
    picks: rows.length,
    wins: rows.filter((r) => Number(r.profit_loss_percent) > 0).length,
    losses: rows.filter((r) => Number(r.profit_loss_percent) <= 0).length,
  };
}

export async function runDailyBattle(db: Db, now: Date): Promise<BattleReport> {
  const pickDate = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(now);
  const report: BattleReport = { pickDate, prices: 0, research: null, attempted: 0, saved: 0, failed: 0, skipped: [], errors: [] };

  const { data: models, error: mErr } = await db.from("ai_models").select("*").eq("is_active", true).not("javari_model", "is", null).order("display_name");
  if (mErr) throw new Error(`models: ${mErr.message}`);
  const active = (models ?? []) as unknown as BattleModel[];
  if (!active.length) { report.errors.push("no active models configured"); return report; }

  const prices = await getStockPrices(STOCK_POOL);
  report.prices = prices.size;
  if (prices.size < 5) { report.errors.push(`only ${prices.size} prices available - not enough to run a fair battle`); return report; }

  const pack = await buildResearchPack(db, pickDate, prices);
  report.research = { chars: pack.body.length, sources: pack.sources.length };

  const { data: already, error: aErr } = await db.from("stock_picks").select("ai_model_id").eq("pick_date", pickDate);
  if (aErr) throw new Error(`today's picks: ${aErr.message}`);
  const done = new Set((already ?? []).map((r) => r.ai_model_id as string));

  const expiry = new Date(now.getTime() + HOLD_DAYS * 86_400_000);
  const expiryDate = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(expiry);

  for (const model of active) {
    if (done.has(model.id)) { report.skipped.push(`${model.display_name} (already picked today)`); continue; }
    report.attempted++;
    const record = await modelRecord(db, model.id);
    const r = await javariGenerate({
      purpose: PICK_PURPOSE, model: model.javari_model, system: SYSTEM_PROMPT,
      user: buildUserPrompt(model, pack.body, record),
      maxOutputTokens: model.max_output_tokens, reasoningEffort: model.reasoning_effort, timeoutMs: model.timeout_ms,
    });
    if (!r.ok) {
      report.failed++;
      report.errors.push(`${model.display_name}: ${r.code}`);
      const { error } = await db.from("market_pick_attempts").insert({ pick_date: pickDate, ai_model_id: model.id, ok: false, error: `${r.code}: ${r.error}`.slice(0, 500), javari_request_id: r.requestId });
      if (error) report.errors.push(`attempt log: ${error.message}`);
      continue;
    }
    const parsed = parsePick(r.text, prices);
    if (!parsed.ok) {
      report.failed++;
      report.errors.push(`${model.display_name}: ${parsed.error}`);
      const { error } = await db.from("market_pick_attempts").insert({ pick_date: pickDate, ai_model_id: model.id, ok: false, error: `unusable reply: ${parsed.error}`.slice(0, 500), javari_request_id: r.requestId });
      if (error) report.errors.push(`attempt log: ${error.message}`);
      continue;
    }

    const p = parsed.pick;
    const used = p.sources_used.map((n) => pack.sources.find((s) => s.n === n)).filter((s): s is Source => Boolean(s));
    const seal = createHash("sha256").update(JSON.stringify({
      model: model.javari_model, modelId: model.id, pickDate, symbol: p.symbol, entry: parsed.entry,
      target: p.target_price, stop: p.stop_loss, confidence: p.confidence, raw: r.text, research: pack.sha,
    })).digest("hex");

    const { error } = await db.from("stock_picks").insert({
      ai_model_id: model.id, ticker: p.symbol, symbol: p.symbol, category: "stocks", asset_type: "stock",
      direction: "UP", confidence: p.confidence, entry_price: parsed.entry, current_price: parsed.entry,
      target_price: p.target_price, stop_loss: p.stop_loss,
      reasoning: p.thesis, reasoning_summary: clip(p.thesis, 220),
      key_factors: p.key_factors, risk_factors: p.risks,
      status: "active", pick_date: pickDate, expiry_date: expiryDate,
      javari_request_id: r.requestId, research_sha256: pack.sha, seal_sha256: seal,
      sources: used.map((s) => ({ title: s.title, url: s.url, site: s.site })),
      price_updated_at: now.toISOString(),
    });
    if (error) {
      report.failed++;
      report.errors.push(`${model.display_name}: insert ${error.message}`);
      continue;
    }
    report.saved++;
    const { error: logErr } = await db.from("market_pick_attempts").insert({ pick_date: pickDate, ai_model_id: model.id, ok: true, javari_request_id: r.requestId });
    if (logErr) report.errors.push(`attempt log: ${logErr.message}`);
  }
  return report;
}
