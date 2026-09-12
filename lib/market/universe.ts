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
//   dow     the Dow 30 (a constant - the index changes perhaps once a year, as news)
//   penny   every US listing under $5 with 300k+ volume and a market value over $50M
//   crypto  the top 100 coins by market value, stablecoins excluded
//
// Prices for all US listings come from one Nasdaq screener call, so a universe of 500
// costs the same as a universe of 20. No API key is used anywhere in this file.
//
// CR AudioViz AI, LLC · EIN 39-3646201
import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export type UniverseRow = { symbol: string; name: string | null; price: number | null; volume: number | null; marketCap: number | null };
export type UniverseCategory = "sp500" | "nasdaq" | "dow" | "penny" | "crypto";

const UA = { "User-Agent": "Mozilla/5.0 (compatible; JavariMarketOracle/1.0; +https://javarimarket.com)" };

/** The Dow 30. Verified 2026-09-12; the index changes rarely and always as public news. */
const DOW_30 = [
  "MMM", "AXP", "AMGN", "AMZN", "AAPL", "BA", "CAT", "CVX", "CSCO", "KO",
  "DIS", "GS", "HD", "HON", "IBM", "JNJ", "JPM", "MCD", "MRK", "MSFT",
  "NKE", "NVDA", "PG", "CRM", "SHW", "TRV", "UNH", "VZ", "V", "WMT",
];

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

/** Every US listing with a price, from one free call. */
async function screener(): Promise<Map<string, UniverseRow>> {
  const res = await fetch("https://api.nasdaq.com/api/screener/stocks?tableonly=true&limit=10000&download=true", {
    headers: UA, cache: "no-store", signal: AbortSignal.timeout(45_000),
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

async function nasdaq100Symbols(): Promise<string[]> {
  const res = await fetch("https://api.nasdaq.com/api/quote/list-type/nasdaq100", { headers: UA, cache: "no-store", signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`Nasdaq-100 HTTP ${res.status}`);
  const json = (await res.json()) as { data?: { data?: { rows?: { symbol?: string }[] } } };
  const symbols = (json.data?.data?.rows ?? []).map((r) => (r.symbol ?? "").trim().toUpperCase()).filter(Boolean);
  if (symbols.length < 90) throw new Error(`Nasdaq-100 returned only ${symbols.length} symbols`);
  return [...new Set(symbols)];
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
  const all = await screener();
  if (category === "penny") {
    return [...all.values()]
      .filter((r) => r.price !== null && r.price >= PENNY_MIN_PRICE && r.price <= PENNY_MAX_PRICE
        && (r.volume ?? 0) >= PENNY_MIN_VOLUME && (r.marketCap ?? 0) >= PENNY_MIN_MARKET_CAP)
      .sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0));
  }
  const members = category === "dow" ? DOW_30 : category === "nasdaq" ? await nasdaq100Symbols() : await sp500Symbols();
  return members
    .map((symbol) => all.get(symbol) ?? { symbol, name: null, price: null, volume: null, marketCap: null })
    .filter((r) => r.price !== null);
}

/** Today's snapshot, built on first use and reused all day. */
export async function getUniverse(db: SupabaseClient, category: UniverseCategory, snapshotDate: string): Promise<UniverseRow[]> {
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
  const rows = await buildUniverse(category);
  if (!rows.length) throw new Error(`universe for ${category} came back empty`);
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
