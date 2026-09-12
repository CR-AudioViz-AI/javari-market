// lib/market/prices.ts
// Purpose: one place that turns a list of tickers into current prices, for the daily
//          AI battle (entry prices) and for settlement (current prices).
// Date: 2026-09-11
//
// Why this exists: both jobs called Alpha Vantage once PER TICKER. Its free tier allows
// 25 requests a day and 5 a minute, and the battle's pool is 35 stocks - so the battle
// used up the day's allowance and settlement then failed with "Could not fetch price".
// Picks were never scored reliably.
//
// Order of sources, each filling only what the previous one missed:
//   1. Yahoo Finance spark  - batch, no key, ~0.1s for 20 symbols. Unofficial endpoint,
//                             so it is never the only source.
//   2. Twelve Data          - batch with TWELVE_DATA_API_KEY (free: 8 credits/minute).
//   3. Alpha Vantage        - one symbol per call with ALPHA_VANTAGE_API_KEY (last resort).
// Every miss is logged with the source that failed, so a dead source is visible.
//
// CR AudioViz AI, LLC · EIN 39-3646201

const UA = "Mozilla/5.0 (compatible; JavariMarket/1.0; +https://javarimarket.com)";
const TIMEOUT_MS = 10_000;

async function getJson(url: string): Promise<unknown> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA }, signal: ctrl.signal, cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

function isPrice(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n) && n > 0;
}

interface SparkResult { symbol: string; response?: Array<{ meta?: { regularMarketPrice?: number } }> }

async function fromYahoo(tickers: string[], out: Map<string, number>): Promise<void> {
  for (const group of chunk(tickers, 20)) {
    try {
      const url = `https://query1.finance.yahoo.com/v7/finance/spark?symbols=${encodeURIComponent(group.join(","))}&range=1d&interval=1d`;
      const data = (await getJson(url)) as { spark?: { result?: SparkResult[] } };
      for (const r of data.spark?.result ?? []) {
        const p = r.response?.[0]?.meta?.regularMarketPrice;
        if (isPrice(p)) out.set(r.symbol.toUpperCase(), p);
      }
    } catch (error) {
      console.error(`[prices] Yahoo batch failed for ${group.length} symbols: ${(error as Error).message}`);
    }
  }
}

async function fromTwelveData(tickers: string[], out: Map<string, number>): Promise<void> {
  const key = process.env.TWELVE_DATA_API_KEY;
  if (!key || tickers.length === 0) return;
  for (const group of chunk(tickers, 8)) {
    try {
      const url = `https://api.twelvedata.com/price?symbol=${encodeURIComponent(group.join(","))}&apikey=${key}`;
      const data = (await getJson(url)) as Record<string, { price?: string }> & { price?: string };
      if (group.length === 1) {
        const p = Number(data.price);
        if (isPrice(p)) out.set(group[0].toUpperCase(), p);
      } else {
        for (const sym of group) {
          const p = Number(data[sym]?.price);
          if (isPrice(p)) out.set(sym.toUpperCase(), p);
        }
      }
    } catch (error) {
      console.error(`[prices] Twelve Data failed for ${group.join(",")}: ${(error as Error).message}`);
    }
  }
}

async function fromAlphaVantage(tickers: string[], out: Map<string, number>): Promise<void> {
  const key = process.env.ALPHA_VANTAGE_API_KEY;
  if (!key) return;
  for (const sym of tickers.slice(0, 5)) {            // free tier: 5 per minute
    try {
      const data = (await getJson(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(sym)}&apikey=${key}`)) as
        { "Global Quote"?: { "05. price"?: string } };
      const p = Number(data["Global Quote"]?.["05. price"]);
      if (isPrice(p)) out.set(sym.toUpperCase(), p);
    } catch (error) {
      console.error(`[prices] Alpha Vantage failed for ${sym}: ${(error as Error).message}`);
    }
  }
}

/** Current prices for US stock tickers. Missing tickers are absent from the map (and logged). */
export async function getStockPrices(tickers: string[]): Promise<Map<string, number>> {
  const wanted = [...new Set(tickers.map((t) => t.trim().toUpperCase()).filter(Boolean))];
  const out = new Map<string, number>();
  await fromYahoo(wanted, out);
  await fromTwelveData(wanted.filter((t) => !out.has(t)), out);
  await fromAlphaVantage(wanted.filter((t) => !out.has(t)), out);
  const missing = wanted.filter((t) => !out.has(t));
  if (missing.length) console.error(`[prices] no price from any source for: ${missing.join(", ")}`);
  return out;
}

/** Convenience for a single ticker. */
export async function getStockPrice(ticker: string): Promise<number | null> {
  return (await getStockPrices([ticker])).get(ticker.trim().toUpperCase()) ?? null;
}


/**
 * Company names for a set of tickers, from the same Yahoo chart endpoint the prices come
 * from (its metadata carries longName). 2026-09-12: the index universes stored no names,
 * so searching "Apple" or "Chevron" on the pick page found nothing - only tickers worked.
 * Failures are silent by design: a missing name must never cost a universe its symbol.
 */
export async function getStockNames(tickers: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const groups = chunk(tickers, 12);
  for (const group of groups) {
    await Promise.all(group.map(async (sym) => {
      try {
        const data = (await getJson(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?range=1d&interval=1d`)) as {
          chart?: { result?: { meta?: { longName?: string; shortName?: string } }[] };
        };
        const meta = data.chart?.result?.[0]?.meta;
        const name = meta?.longName ?? meta?.shortName;
        if (name) out.set(sym.toUpperCase(), name);
      } catch { /* a name is a convenience, never a blocker */ }
    }));
  }
  return out;
}
