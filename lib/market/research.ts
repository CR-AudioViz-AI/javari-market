// lib/market/research.ts
// Purpose: the data a person needs to judge a symbol before picking it - a year of
//   prices, the indicators that follow from them, and recent news.
// Date: 2026-09-12
//
// Roy, 12 Sep 2026: "I can't pick correctly if I can't do research."
//
// Everything here is free and keyless: a year of daily bars from the same Yahoo chart
// endpoint the prices come from, indicators computed here rather than bought, and news
// through Javari's research door, cached per symbol per day so browsing does not burn
// the monthly search allowance.
//
// CR AudioViz AI, LLC · EIN 39-3646201
import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { javariResearch } from "@/lib/javari/door";

const UA = { "User-Agent": "Mozilla/5.0 (compatible; JavariMarketOracle/1.0; +https://javarimarket.com)" };

export type Bar = { t: number; close: number; volume: number | null };

export type Indicators = {
  price: number | null;
  changeDay: number | null;
  changeWeek: number | null;
  changeMonth: number | null;
  changeQuarter: number | null;
  changeYear: number | null;
  sma20: number | null;
  sma50: number | null;
  sma200: number | null;
  rsi14: number | null;
  high52: number | null;
  low52: number | null;
  fromHigh: number | null;
  avgVolume: number | null;
  volumeVsAverage: number | null;
  volatility: number | null;
};

export type SymbolResearch = {
  symbol: string;
  name: string | null;
  market: string;
  bars: Bar[];
  indicators: Indicators;
  news: { title: string; url: string; content: string; site: string }[];
};

/** Yahoo's symbol for a coin differs from the ticker the contest uses. */
function yahooSymbol(symbol: string, market: string): string {
  return market === "crypto" ? `${symbol}-USD` : symbol;
}

function sma(values: number[], period: number): number | null {
  if (values.length < period) return null;
  const slice = values.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

/** Relative strength index - the standard 14-period Wilder calculation. */
function rsi(values: number[], period = 14): number | null {
  if (values.length <= period) return null;
  let gain = 0;
  let loss = 0;
  for (let i = values.length - period; i < values.length; i++) {
    const diff = (values[i] as number) - (values[i - 1] as number);
    if (diff >= 0) gain += diff; else loss -= diff;
  }
  if (gain + loss === 0) return 50;
  const rs = (gain / period) / (loss / period || 1e-9);
  return Number((100 - 100 / (1 + rs)).toFixed(1));
}

function changeOver(closes: number[], days: number): number | null {
  if (closes.length <= days) return null;
  const then = closes[closes.length - 1 - days] as number;
  const now = closes[closes.length - 1] as number;
  if (!then) return null;
  return Number((((now - then) / then) * 100).toFixed(2));
}

export function computeIndicators(bars: Bar[], meta: { high52?: number | null; low52?: number | null }): Indicators {
  const closes = bars.map((b) => b.close).filter((n) => Number.isFinite(n));
  const volumes = bars.map((b) => b.volume ?? 0).filter((n) => n > 0);
  const price = closes.length ? (closes[closes.length - 1] as number) : null;
  const avgVolume = volumes.length ? volumes.slice(-30).reduce((a, b) => a + b, 0) / Math.min(30, volumes.length) : null;
  const lastVolume = volumes.length ? (volumes[volumes.length - 1] as number) : null;

  // Annualised standard deviation of daily returns over the last 30 sessions.
  let volatility: number | null = null;
  if (closes.length > 31) {
    const rets: number[] = [];
    for (let i = closes.length - 30; i < closes.length; i++) {
      const prev = closes[i - 1] as number;
      if (prev) rets.push(((closes[i] as number) - prev) / prev);
    }
    const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
    const variance = rets.reduce((a, b) => a + (b - mean) ** 2, 0) / rets.length;
    volatility = Number((Math.sqrt(variance) * Math.sqrt(252) * 100).toFixed(1));
  }

  const high52 = meta.high52 ?? (closes.length ? Math.max(...closes) : null);
  return {
    price,
    changeDay: changeOver(closes, 1),
    changeWeek: changeOver(closes, 5),
    changeMonth: changeOver(closes, 21),
    changeQuarter: changeOver(closes, 63),
    changeYear: changeOver(closes, 251),
    sma20: sma(closes, 20),
    sma50: sma(closes, 50),
    sma200: sma(closes, 200),
    rsi14: rsi(closes),
    high52,
    low52: meta.low52 ?? (closes.length ? Math.min(...closes) : null),
    fromHigh: price && high52 ? Number((((price - high52) / high52) * 100).toFixed(2)) : null,
    avgVolume,
    volumeVsAverage: lastVolume && avgVolume ? Number((lastVolume / avgVolume).toFixed(2)) : null,
    volatility,
  };
}

export async function getHistory(symbol: string, market: string): Promise<{ bars: Bar[]; name: string | null; high52: number | null; low52: number | null }> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol(symbol, market))}?range=1y&interval=1d`;
  const res = await fetch(url, { headers: UA, cache: "no-store", signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`price history unavailable (HTTP ${res.status})`);
  const json = (await res.json()) as {
    chart?: { result?: { timestamp?: number[]; meta?: { longName?: string; shortName?: string; fiftyTwoWeekHigh?: number; fiftyTwoWeekLow?: number };
      indicators?: { quote?: { close?: (number | null)[]; volume?: (number | null)[] }[] } }[] };
  };
  const result = json.chart?.result?.[0];
  const stamps = result?.timestamp ?? [];
  const quote = result?.indicators?.quote?.[0];
  const bars: Bar[] = [];
  for (let i = 0; i < stamps.length; i++) {
    const close = quote?.close?.[i];
    if (typeof close !== "number" || !Number.isFinite(close)) continue;
    bars.push({ t: (stamps[i] as number) * 1000, close, volume: quote?.volume?.[i] ?? null });
  }
  return {
    bars,
    name: result?.meta?.longName ?? result?.meta?.shortName ?? null,
    high52: result?.meta?.fiftyTwoWeekHigh ?? null,
    low52: result?.meta?.fiftyTwoWeekLow ?? null,
  };
}

/** Recent news, cached per symbol per day so browsing costs one search, not one per view. */
export async function getNews(db: SupabaseClient, symbol: string, name: string | null, market: string): Promise<{ title: string; url: string; content: string; site: string }[]> {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date());
  const { data: cached } = await db.from("market_symbol_news").select("items").eq("symbol", symbol).eq("as_of", today).maybeSingle();
  if (cached?.items) return cached.items as { title: string; url: string; content: string; site: string }[];

  let items: { title: string; url: string; content: string; site: string }[] = [];
  try {
    const query = market === "crypto" ? `${name ?? symbol} crypto news outlook` : `${name ?? symbol} ${symbol} stock news outlook`;
    items = (await javariResearch(query, 5, 14)).map((r) => {
      let site = "";
      try { site = new URL(r.url).hostname.replace(/^www\./, ""); } catch { site = ""; }
      return { title: r.title, url: r.url, content: r.content.slice(0, 400), site };
    });
  } catch {
    return [];
  }
  await db.from("market_symbol_news").upsert({ symbol, as_of: today, items }, { onConflict: "symbol,as_of" });
  return items;
}
