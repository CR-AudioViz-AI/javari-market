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
  id: string; modelId: string; symbol: string; confidence: number; conviction: number | null;
  market: string; benchmarkSymbol: string | null; benchmarkReturn: number | null; alpha: number | null;
  entry: number; current: number | null; target: number; stop: number;
  thesis: string; keyFactors: string[]; risks: string[]; sources: { title: string; url: string; site: string }[];
  status: string; result: string | null; changePct: number | null; pickDate: string; seal: string | null;
};
export type Standing = {
  model: Model; picks: number; wins: number; losses: number; winRate: number | null;
  totalReturn: number; open: number; avgConfidence: number | null;
  /** Average alpha: how far its picks beat their benchmark. The number that matters. */
  avgAlpha: number | null; beatBenchmark: number; scored: number;
};

const Sources = z.array(z.object({ title: z.string(), url: z.string(), site: z.string().default("") })).catch([]);
const Strings = z.array(z.string()).catch([]);
const num = (v: unknown): number | null => (v === null || v === undefined ? null : Number(v));

function toPick(r: Record<string, unknown>): Pick {
  return {
    id: String(r.id), modelId: String(r.ai_model_id), symbol: String(r.symbol ?? r.ticker ?? ""),
    confidence: Number(r.confidence ?? 0), conviction: r.conviction === null || r.conviction === undefined ? null : Number(r.conviction),
    market: String(r.market_category ?? r.category ?? "sp500"),
    benchmarkSymbol: r.benchmark_symbol ? String(r.benchmark_symbol) : null,
    benchmarkReturn: num(r.benchmark_return), alpha: num(r.alpha), entry: Number(r.entry_price ?? 0), current: num(r.current_price),
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
  const { data, error } = await d.from("stock_picks").select("ai_model_id, status, result, profit_loss_percent, confidence, alpha, market_category").in("ai_model_id", ids);
  if (error) throw new Error(`standings: ${error.message}`);
  const rows = data ?? [];
  return models.map((model) => {
    const mine = rows.filter((r) => r.ai_model_id === model.id);
    const closed = mine.filter((r) => r.status === "closed");
    const wins = closed.filter((r) => r.result === "win").length;
    const losses = closed.filter((r) => r.result === "loss").length;
    const conf = mine.map((r) => Number(r.confidence)).filter((n) => Number.isFinite(n));
    const withAlpha = closed.filter((r) => r.alpha !== null && r.alpha !== undefined);
    return {
      model, picks: mine.length, wins, losses,
      winRate: wins + losses ? (wins / (wins + losses)) * 100 : null,
      totalReturn: closed.reduce((s, r) => s + (Number(r.profit_loss_percent) || 0), 0),
      open: mine.filter((r) => r.status === "active").length,
      avgConfidence: conf.length ? conf.reduce((a, b) => a + b, 0) / conf.length : null,
      avgAlpha: withAlpha.length ? withAlpha.reduce((s, r) => s + Number(r.alpha), 0) / withAlpha.length : null,
      beatBenchmark: withAlpha.filter((r) => Number(r.alpha) > 0).length,
      scored: withAlpha.length,
    };
  })
  // Winners first: beating the benchmark ranks above simply going up. 2026-09-12
  .sort((a, b) => (b.avgAlpha ?? -999) - (a.avgAlpha ?? -999) || (b.winRate ?? -1) - (a.winRate ?? -1) || b.totalReturn - a.totalReturn || a.model.display_name.localeCompare(b.model.display_name));
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

// ── The board: every market, every model's pick, ranked so the models with the best
//    record appear first. 2026-09-12 (Roy: "push the winners to the top").
export type BoardPick = Pick & { model: Model; rank: number; record: { winRate: number | null; avgAlpha: number | null; scored: number } };
export type MarketBoard = { market: string; label: string; benchmark: string | null; picks: BoardPick[]; agreement: { symbol: string; count: number } | null };

const MARKET_LABELS: Record<string, string> = {
  sp500: "S&P 500", nasdaq: "Nasdaq 100", dow: "Dow 30", penny: "Penny stocks", crypto: "Crypto",
};

export async function getBoards(): Promise<{ pickDate: string | null; boards: MarketBoard[] }> {
  const d = db();
  const [{ data: last, error: lErr }, standings, models] = await Promise.all([
    d.from("stock_picks").select("pick_date").not("javari_request_id", "is", null).order("pick_date", { ascending: false }).limit(1).maybeSingle(),
    getStandings(),
    getActiveModels(),
  ]);
  if (lErr) throw new Error(lErr.message);
  const pickDate = last?.pick_date ? String(last.pick_date) : null;
  if (!pickDate) return { pickDate: null, boards: [] };

  const { data: rows, error } = await d.from("stock_picks").select("*").eq("pick_date", pickDate).not("javari_request_id", "is", null);
  if (error) throw new Error(error.message);
  const byId = new Map(models.map((m) => [m.id, m]));
  const rankOf = new Map(standings.map((s, i) => [s.model.id, i + 1]));
  const recordOf = new Map(standings.map((s) => [s.model.id, { winRate: s.winRate, avgAlpha: s.avgAlpha, scored: s.scored }]));

  const boards: MarketBoard[] = [];
  for (const market of ["sp500", "nasdaq", "dow", "penny", "crypto"]) {
    const picks = (rows ?? [])
      .filter((r) => String(r.market_category ?? r.category) === market)
      .map((r) => {
        const p = toPick(r as Record<string, unknown>);
        const model = byId.get(p.modelId);
        return model ? { ...p, model, rank: rankOf.get(p.modelId) ?? 99, record: recordOf.get(p.modelId) ?? { winRate: null, avgAlpha: null, scored: 0 } } : null;
      })
      .filter((p): p is BoardPick => p !== null)
      .sort((a, b) => a.rank - b.rank || b.confidence - a.confidence);
    if (!picks.length) continue;
    const counts = new Map<string, number>();
    for (const p of picks) counts.set(p.symbol, (counts.get(p.symbol) ?? 0) + 1);
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
    boards.push({
      market, label: MARKET_LABELS[market] ?? market,
      benchmark: picks[0]?.benchmarkSymbol ?? null,
      picks,
      agreement: top && top[1] > 1 ? { symbol: top[0], count: top[1] } : null,
    });
  }
  return { pickDate, boards };
}

// ── One table, models and people together, scored identically. 2026-09-12 (Roy:
//    "everyone signed up must be in the competition; all comparisons complete and honest")
//
// Honesty rules, applied to every competitor alike:
//   * ranked on AVERAGE alpha per scored pick, so nobody gains by making more picks
//   * a minimum number of scored picks before anyone is ranked - a single lucky call is
//     not a record, and both models and people are held to the same bar
//   * everyone with a pick appears, ranked or not; nobody can be hidden or withdrawn
//   * open picks are counted and shown, so a competitor cannot look better by having
//     most of their positions still running
export const QUALIFYING_PICKS = 10;

export type Competitor = {
  kind: "model" | "person";
  id: string; name: string; sub: string; color: string | null;
  scored: number; open: number; totalPicks: number;
  wins: number; losses: number; winRate: number | null;
  avgAlpha: number | null; beatBenchmark: number; avgReturn: number | null;
  qualified: boolean; rank: number | null;
};

export async function getCompetition(opts: { weekStart?: string } = {}): Promise<{ competitors: Competitor[]; qualifying: number }> {
  const d = db();
  const models = await getActiveModels();
  const range = opts.weekStart
    ? { from: opts.weekStart, to: new Date(new Date(`${opts.weekStart}T00:00:00Z`).getTime() + 6 * 86_400_000).toISOString().slice(0, 10) }
    : null;

  let modelQ = d.from("stock_picks").select("ai_model_id, status, result, profit_loss_percent, alpha, pick_date").not("javari_request_id", "is", null);
  let playerQ = d.from("market_player_picks").select("user_id, status, result, return_percent, alpha, pick_date, market_players(handle, display_name)");
  if (range) {
    modelQ = modelQ.gte("pick_date", range.from).lte("pick_date", range.to);
    playerQ = playerQ.gte("pick_date", range.from).lte("pick_date", range.to);
  }
  const [{ data: mp, error: mErr }, { data: pp, error: pErr }] = await Promise.all([modelQ, playerQ]);
  if (mErr) throw new Error(mErr.message);
  if (pErr) throw new Error(pErr.message);

  const build = (
    kind: "model" | "person", id: string, name: string, sub: string, color: string | null,
    rows: { status: unknown; result: unknown; ret: number | null; alpha: number | null }[],
  ): Competitor => {
    const closed = rows.filter((r) => r.status === "closed");
    const scoredRows = closed.filter((r) => r.alpha !== null);
    const wins = closed.filter((r) => r.result === "win").length;
    const losses = closed.filter((r) => r.result === "loss").length;
    return {
      kind, id, name, sub, color,
      scored: scoredRows.length,
      open: rows.filter((r) => r.status === "active").length,
      totalPicks: rows.length,
      wins, losses,
      winRate: wins + losses ? (wins / (wins + losses)) * 100 : null,
      avgAlpha: scoredRows.length ? scoredRows.reduce((s2, r) => s2 + Number(r.alpha), 0) / scoredRows.length : null,
      beatBenchmark: scoredRows.filter((r) => Number(r.alpha) > 0).length,
      avgReturn: closed.length ? closed.reduce((s2, r) => s2 + (r.ret ?? 0), 0) / closed.length : null,
      qualified: scoredRows.length >= QUALIFYING_PICKS,
      rank: null,
    };
  };

  const competitors: Competitor[] = models.map((m) =>
    build("model", m.id, m.display_name, m.provider, m.color,
      (mp ?? []).filter((r) => r.ai_model_id === m.id)
        .map((r) => ({ status: r.status, result: r.result, ret: r.profit_loss_percent === null ? null : Number(r.profit_loss_percent), alpha: r.alpha === null ? null : Number(r.alpha) }))));

  const byUser = new Map<string, { handle: string; name: string; rows: { status: unknown; result: unknown; ret: number | null; alpha: number | null }[] }>();
  for (const r of pp ?? []) {
    const rel = (r as unknown as { market_players?: { handle: string; display_name: string } | { handle: string; display_name: string }[] }).market_players;
    const profile = Array.isArray(rel) ? rel[0] : rel;
    if (!profile) continue;
    const e = byUser.get(profile.handle) ?? { handle: profile.handle, name: profile.display_name, rows: [] };
    e.rows.push({ status: r.status, result: r.result, ret: r.return_percent === null ? null : Number(r.return_percent), alpha: r.alpha === null ? null : Number(r.alpha) });
    byUser.set(profile.handle, e);
  }
  for (const u of byUser.values()) competitors.push(build("person", u.handle, u.name, `@${u.handle}`, null, u.rows));

  const sorted = competitors.sort((a, b) => {
    if (a.qualified !== b.qualified) return a.qualified ? -1 : 1;
    return (b.avgAlpha ?? -999) - (a.avgAlpha ?? -999) || b.scored - a.scored || a.name.localeCompare(b.name);
  });
  let rank = 0;
  for (const c of sorted) if (c.qualified) c.rank = ++rank;
  return { competitors: sorted, qualifying: QUALIFYING_PICKS };
}
