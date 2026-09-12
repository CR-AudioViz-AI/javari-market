// lib/market/universe.ts
// Purpose: the real investable universe for each market, built from free public sources
//   and stored as a daily snapshot.
// Date: 2026-09-12
//
// Roy, 12 Sep 2026: "we need them to be able to research and select any of them." Until
// today each market was a pool of 10-22 symbols I had chosen, which put my stock
// selection inside every result. The universes are now:
//
//   sp500   the S&P 500 constituents (Wikipedia's maintained list)
//   nasdaq  the Nasdaq-100 (nasdaq.com's own index listing)
//   dow     the Dow Jones Composite Average: industrials (30) + transports (20) +
//           utilities (15) = 65 companies
//   penny   every US listing under $5 with 300k+ volume and a market value over $50M
//   crypto  the top 100 coins by market value, stablecoins excluded
//
// Prices for all US listings come from one Nasdaq screener call, so a universe of 500
// costs the same as a universe of 20. No API key is used anywhere in this file.
//
// CR AudioViz AI, LLC · EIN 39-3646201
import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getStockNames, getStockPrices } from "@/lib/market/prices";

export type UniverseRow = { symbol: string; name: string | null; price: number | null; volume: number | null; marketCap: number | null };
export type UniverseCategory = "sp500" | "nasdaq" | "dow" | "penny" | "crypto";

const UA = { "User-Agent": "Mozilla/5.0 (compatible; JavariMarketOracle/1.0; +https://javarimarket.com)" };

/**
 * The Dow Jones Composite Average - the 65-stock index, not just the famous 30.
 * Roy, 12 Sep 2026: "I wanted the larger Dow Jones index."
 *
 * It is the Industrial Average (30) plus the Transportation Average (20) plus the
 * Utility Average (15). Verified 2026-09-12; membership changes rarely and always as
 * public news, so it is a checked constant rather than a scrape that can break.
 */
const DOW_INDUSTRIALS = [
  "MMM", "AXP", "AMGN", "AMZN", "AAPL", "BA", "CAT", "CVX", "CSCO", "KO",
  "DIS", "GS", "HD", "HON", "IBM", "JNJ", "JPM", "MCD", "MRK", "MSFT",
  "NKE", "NVDA", "PG", "CRM", "SHW", "TRV", "UNH", "VZ", "V", "WMT",
];
const DOW_TRANSPORTS = [
  "ALK", "AAL", "CAR", "CHRW", "CSX", "DAL", "EXPD", "FDX", "JBHT", "JBLU",
  "KEX", "LSTR", "MATX", "NSC", "ODFL", "R", "UAL", "UNP", "UPS", "XPO",
];
const DOW_UTILITIES = [
  "AES", "LNT", "AEE", "AEP", "ATO", "ED", "D", "DUK", "EIX", "EXC",
  "FE", "NEE", "PEG", "SRE", "XEL",
];
const DOW_65 = [...new Set([...DOW_INDUSTRIALS, ...DOW_TRANSPORTS, ...DOW_UTILITIES])];

const PENNY_MAX_PRICE = 5;
const PENNY_MIN_PRICE = 0.5;
const PENNY_MIN_VOLUME = 300_000;
const PENNY_MIN_MARKET_CAP = 50_000_000;

const STABLECOINS = new Set(["USDT", "USDC", "DAI", "FDUSD", "USDE", "PYUSD", "TUSD", "USDS", "BUSD", "USD1"]);

function money(v: unknown): number | null {
  const n = Number(String(v ?? "").replace(/[$,%\s]/g, "").replace(/,/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

type ScreenerRow = { symbol?: string; name?: string; lastsale?: string; volume?: string; marketCap?: string; sector?: string };

// 2026-09-12: memoised for the life of the process. Without this, building four stock
// universes meant four downloads of all 7,000 US listings and the run timed out.
let screenerCache: { at: number; rows: Map<string, UniverseRow> } | null = null;
const SCREENER_TTL_MS = 30 * 60_000;

/** Every US listing with a price, from one free call. */
async function screener(): Promise<Map<string, UniverseRow>> {
  if (screenerCache && Date.now() - screenerCache.at < SCREENER_TTL_MS) return screenerCache.rows;
  const res = await fetch("https://api.nasdaq.com/api/screener/stocks?tableonly=true&limit=10000&download=true", {
    headers: UA, cache: "no-store", signal: AbortSignal.timeout(120_000),
  });
  if (!res.ok) throw new Error(`Nasdaq screener HTTP ${res.status}`);
  const json = (await res.json()) as { data?: { rows?: ScreenerRow[] } };
  const rows = json.data?.rows ?? [];
  if (rows.length < 1000) throw new Error(`Nasdaq screener returned only ${rows.length} listings`);
  const out = new Map<string, UniverseRow>();
  for (const r of rows) {
    const symbol = (r.symbol ?? "").trim().toUpperCase();
    if (!symbol || symbol.includes("/") || symbol.includes("^")) continue; // warrants, units, preferreds
    out.set(symbol, {
      symbol,
      name: r.name?.trim() ?? null,
      price: money(r.lastsale),
      volume: money(r.volume),
      marketCap: money(r.marketCap),
    });
  }
  screenerCache = { at: Date.now(), rows: out };
  return out;
}

async function sp500Symbols(): Promise<string[]> {
  const res = await fetch("https://en.wikipedia.org/wiki/List_of_S%26P_500_companies", { headers: UA, cache: "no-store", signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`S&P 500 list HTTP ${res.status}`);
  const html = await res.text();
  const table = html.split('id="constituents"')[1]?.split("</table>")[0] ?? "";
  const symbols = [...table.matchAll(/<td[^>]*>\s*<a[^>]*>([A-Z][A-Z.\-]{0,5})<\/a>/g)].map((m) => (m[1] ?? "").replace(".", "-"));
  if (symbols.length < 400) throw new Error(`S&P 500 list parsed only ${symbols.length} symbols`);
  return [...new Set(symbols)];
}

/**
 * The Nasdaq-100. Fetched from nasdaq.com when it answers; that endpoint replies from a
 * desktop but times out from Vercel's network, so this dated copy (12 Sep 2026, 102
 * constituents) is the fallback. The index is reconstituted annually, and changes are
 * public news, so a stale copy is visible rather than silent.
 */
const NASDAQ_100: string[] = [
  "AAPL",
  "ABNB",
  "ADBE",
  "ADI",
  "ADP",
  "ADSK",
  "AEP",
  "ALAB",
  "ALNY",
  "AMAT",
  "AMD",
  "AMGN",
  "AMZN",
  "APP",
  "ARM",
  "ASML",
  "AVGO",
  "AXON",
  "BKNG",
  "BKR",
  "CCEP",
  "CDNS",
  "CEG",
  "CMCSA",
  "COST",
  "CPRT",
  "CRWD",
  "CRWV",
  "CSCO",
  "CSX",
  "CTAS",
  "DASH",
  "DDOG",
  "DXCM",
  "EXC",
  "FANG",
  "FAST",
  "FER",
  "FTNT",
  "GEHC",
  "GILD",
  "GOOG",
  "GOOGL",
  "HON",
  "HONA",
  "IDXX",
  "INTC",
  "INTU",
  "ISRG",
  "KDP",
  "KHC",
  "KLAC",
  "LIN",
  "LITE",
  "LRCX",
  "MAR",
  "MCHP",
  "MDLZ",
  "MELI",
  "META",
  "MNST",
  "MPWR",
  "MRVL",
  "MSFT",
  "MSTR",
  "MU",
  "NBIS",
  "NFLX",
  "NVDA",
  "NXPI",
  "ODFL",
  "ORLY",
  "PANW",
  "PAYX",
  "PCAR",
  "PDD",
  "PEP",
  "PLTR",
  "PYPL",
  "QCOM",
  "REGN",
  "RKLB",
  "ROP",
  "ROST",
  "SBUX",
  "SHOP",
  "SNDK",
  "SNPS",
  "SPCX",
  "STX",
  "TER",
  "TMUS",
  "TRI",
  "TSLA",
  "TTWO",
  "TXN",
  "VRTX",
  "WBD",
  "WDAY",
  "WDC",
  "WMT",
  "XEL",
];

async function nasdaq100Symbols(): Promise<string[]> {
  try {
    const res = await fetch("https://api.nasdaq.com/api/quote/list-type/nasdaq100", { headers: UA, cache: "no-store", signal: AbortSignal.timeout(12_000) });
    if (res.ok) {
      const json = (await res.json()) as { data?: { data?: { rows?: { symbol?: string }[] } } };
      const live = (json.data?.data?.rows ?? []).map((r) => (r.symbol ?? "").trim().toUpperCase()).filter(Boolean);
      if (live.length >= 90) return [...new Set(live)];
    }
  } catch { /* fall through to the dated copy */ }
  return NASDAQ_100;
}


async function cryptoTop100(): Promise<UniverseRow[]> {
  const res = await fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1", {
    cache: "no-store", signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`CoinGecko HTTP ${res.status}`);
  const coins = (await res.json()) as { symbol?: string; name?: string; current_price?: number; total_volume?: number; market_cap?: number }[];
  return coins
    .map((c) => ({
      symbol: (c.symbol ?? "").toUpperCase(),
      name: c.name ?? null,
      price: typeof c.current_price === "number" ? c.current_price : null,
      volume: typeof c.total_volume === "number" ? Math.round(c.total_volume) : null,
      marketCap: typeof c.market_cap === "number" ? c.market_cap : null,
    }))
    .filter((c) => c.symbol && c.price !== null && !STABLECOINS.has(c.symbol));
}

export async function buildUniverse(category: UniverseCategory): Promise<UniverseRow[]> {
  if (category === "crypto") return cryptoTop100();

  // 2026-09-12: the index universes are priced with the same Yahoo batch feed the rest
  // of the app uses. The Nasdaq screener works from a desktop but times out from
  // Vercel's network, and an index universe must not depend on it - only the penny
  // screen, which genuinely needs to scan every listing, still does.
  if (category !== "penny") {
    const members = category === "dow" ? DOW_65 : category === "nasdaq" ? await nasdaq100Symbols() : await sp500Symbols();
    const [prices, names] = await Promise.all([getStockPrices(members), getStockNames(members)]);
    return members
      .map((symbol) => ({ symbol, name: names.get(symbol) ?? null, price: prices.get(symbol) ?? null, volume: null, marketCap: null }))
      .filter((r) => r.price !== null);
  }

  const all = await screener();
  {
    return [...all.values()]
      .filter((r) => r.price !== null && r.price >= PENNY_MIN_PRICE && r.price <= PENNY_MAX_PRICE
        && (r.volume ?? 0) >= PENNY_MIN_VOLUME && (r.marketCap ?? 0) >= PENNY_MIN_MARKET_CAP)
      .sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0));
  }
}

/** Today's snapshot, built on first use and reused all day. */
/** The most recent stored snapshot for a market. A read, never a build. 2026-09-12 */
async function previousSnapshot(db: SupabaseClient, category: UniverseCategory): Promise<UniverseRow[]> {
  const { data, error } = await db.from("market_universe").select("symbol, name, price, volume, market_cap, snapshot_date")
    .eq("category", category).order("snapshot_date", { ascending: false }).limit(1200);
  if (error) throw new Error(`universe fallback: ${error.message}`);
  const newest = (data ?? [])[0]?.snapshot_date;
  return (data ?? []).filter((r) => r.snapshot_date === newest).map((r) => ({
    symbol: String(r.symbol), name: r.name === null ? null : String(r.name),
    price: r.price === null ? null : Number(r.price),
    volume: r.volume === null ? null : Number(r.volume),
    marketCap: r.market_cap === null ? null : Number(r.market_cap),
  }));
}

export async function getUniverse(db: SupabaseClient, category: UniverseCategory, snapshotDate: string, allowBuild = false): Promise<UniverseRow[]> {
  const { data, error } = await db.from("market_universe").select("symbol, name, price, volume, market_cap")
    .eq("snapshot_date", snapshotDate).eq("category", category);
  if (error) throw new Error(`universe read: ${error.message}`);
  if ((data ?? []).length) {
    return (data ?? []).map((r) => ({
      symbol: String(r.symbol), name: r.name === null ? null : String(r.name),
      price: r.price === null ? null : Number(r.price),
      volume: r.volume === null ? null : Number(r.volume),
      marketCap: r.market_cap === null ? null : Number(r.market_cap),
    }));
  }
  // 2026-09-12: this used to BUILD the universe when a snapshot was missing - inside
  // whatever request happened to ask first. A missing penny snapshot meant every visit
  // to /my-picks scraped 7,163 listings live: the API took 72 SECONDS and the page sat
  // on "Loading...". Building belongs to the scheduled job, never to a page load.
  // Missing snapshot now falls straight back to the most recent one, which is a real
  // universe a day or two old, and the job fills the gap on its next run.
  if (!allowBuild) return await previousSnapshot(db, category);

  let rows: UniverseRow[];
  try {
    rows = await buildUniverse(category);
    if (!rows.length) throw new Error("came back empty");
  } catch (e) {
    // A source being slow or down must not stop a day's picks: fall back to the most
    // recent snapshot, which is a real universe, just a day or two old.
    const { data: prev, error: pErr } = await db.from("market_universe").select("symbol, name, price, volume, market_cap, snapshot_date")
      .eq("category", category).order("snapshot_date", { ascending: false }).limit(1200);
    if (pErr) throw new Error(`universe fallback read: ${pErr.message}`);
    if (!(prev ?? []).length) throw new Error(`universe for ${category} unavailable: ${e instanceof Error ? e.message : String(e)}`);
    const newest = String(prev![0]!.snapshot_date);
    return (prev ?? []).filter((r) => String(r.snapshot_date) === newest).map((r) => ({
      symbol: String(r.symbol), name: r.name === null ? null : String(r.name),
      price: r.price === null ? null : Number(r.price),
      volume: r.volume === null ? null : Number(r.volume),
      marketCap: r.market_cap === null ? null : Number(r.market_cap),
    }));
  }
  const { error: insErr } = await db.from("market_universe").upsert(
    rows.map((r) => ({
      snapshot_date: snapshotDate, category, symbol: r.symbol, name: r.name,
      price: r.price, volume: r.volume, market_cap: r.marketCap,
    })),
    { onConflict: "snapshot_date,category,symbol" },
  );
  if (insErr) throw new Error(`universe write: ${insErr.message}`);
  return rows;
}

/** A compact price table the models read - every constituent, so any of them can be chosen. */
export function universeTable(rows: UniverseRow[]): string {
  return rows
    .filter((r) => r.price !== null)
    .map((r) => `${r.symbol} ${(r.price as number) < 10 ? (r.price as number).toFixed(4) : (r.price as number).toFixed(2)}`)
    .join(" · ");
}
