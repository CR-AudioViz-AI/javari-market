// lib/market/benchmarks.ts
// Purpose: what each market has to beat, and how that number is obtained.
// Date: 2026-09-12
//
// Two of these were wrong, and both would have distorted the first real week:
//
//   crypto  was benchmarked against BTC. A model that picked BTC scored exactly zero
//           alpha by construction - it could neither win nor lose - and every other coin
//           was measured against one coin rather than the market. It is now the TOTAL
//           crypto market capitalisation, which is what "the crypto market did X this
//           week" actually means.
//
//   dow     was benchmarked against DIA, the 30 industrials, while the market itself is
//           now the Composite 65. Transport and utility picks were being judged against
//           an index they are not in. It is now a composite of the three averages,
//           weighted the way the index is: 30 industrials, 20 transports, 15 utilities.
//
// Everything here uses free sources and no API key.
//
// CR AudioViz AI, LLC · EIN 39-3646201
import "server-only";
import { getStockPrices } from "@/lib/market/prices";

export type BenchmarkId = "SPY" | "QQQ" | "DOWCOMP" | "IWM" | "CRYPTOMKT";

export const BENCHMARK_FOR: Record<string, BenchmarkId> = {
  sp500: "SPY",
  nasdaq: "QQQ",
  dow: "DOWCOMP",
  penny: "IWM",
  crypto: "CRYPTOMKT",
};

/** What each benchmark is, in plain words, for the site to show. */
export const BENCHMARK_LABEL: Record<BenchmarkId, string> = {
  SPY: "SPY (S&P 500)",
  QQQ: "QQQ (Nasdaq 100)",
  DOWCOMP: "The Dow Composite: DIA, IYT and IDU weighted 30/20/15",
  IWM: "IWM (Russell 2000 small caps)",
  CRYPTOMKT: "Total crypto market capitalisation",
};

const DOW_PARTS: { symbol: string; weight: number }[] = [
  { symbol: "DIA", weight: 30 },
  { symbol: "IYT", weight: 20 },
  { symbol: "IDU", weight: 15 },
];

async function dowComposite(): Promise<number | null> {
  const prices = await getStockPrices(DOW_PARTS.map((p) => p.symbol));
  let total = 0;
  let weight = 0;
  for (const part of DOW_PARTS) {
    const price = prices.get(part.symbol);
    if (price === undefined) continue;
    total += price * part.weight;
    weight += part.weight;
  }
  // A partial composite would silently change the yardstick between two measurements,
  // which is worse than having none: all three or nothing.
  return weight === 65 ? Number((total / weight).toFixed(6)) : null;
}

async function cryptoMarketCap(): Promise<number | null> {
  try {
    const res = await fetch("https://api.coingecko.com/api/v3/global", { cache: "no-store", signal: AbortSignal.timeout(20_000) });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: { total_market_cap?: { usd?: number } } };
    const cap = json.data?.total_market_cap?.usd;
    return typeof cap === "number" && cap > 0 ? cap : null;
  } catch {
    return null;
  }
}

/** The benchmark's current value. Used when a pick is made and again when it is scored. */
export async function benchmarkValue(benchmark: BenchmarkId): Promise<number | null> {
  if (benchmark === "DOWCOMP") return dowComposite();
  if (benchmark === "CRYPTOMKT") return cryptoMarketCap();
  const prices = await getStockPrices([benchmark]);
  return prices.get(benchmark) ?? null;
}
