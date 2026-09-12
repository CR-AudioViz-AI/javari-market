// app/research/[market]/[symbol]/page.tsx
// Purpose: everything needed to judge one symbol - a year of prices, trend and momentum
//   indicators, what the contest's models have said about it, recent news - and a button
//   to add it to your picks without leaving the page.
// Date: 2026-09-12
//
// CR AudioViz AI, LLC · EIN 39-3646201
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { secretKey, supabaseUrl } from "@craudioviz/platform-sdk";
import { MarketNav } from "@/components/MarketNav";
import { MarketDisclaimer } from "@/components/MarketDisclaimer";
import { AddToPicks } from "@/components/AddToPicks";
import { PriceChart } from "@/components/PriceChart";
import { computeIndicators, getHistory, getNews } from "@/lib/market/research";

export const dynamic = "force-dynamic";

const LABELS: Record<string, string> = {
  sp500: "S&P 500", nasdaq: "Nasdaq 100", dow: "Dow Composite 65", penny: "Penny stocks", crypto: "Crypto",
};

const pct = (n: number | null): string => (n === null ? "—" : `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`);
const money = (n: number | null): string => (n === null ? "—" : n >= 1000 ? `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}` : n < 1 ? `$${n.toFixed(4)}` : `$${n.toFixed(2)}`);
const tone = (n: number | null): string => (n === null ? "text-gray-300" : n >= 0 ? "text-emerald-400" : "text-rose-400");

// 2026-09-12: Next 16 hands route params (and searchParams) to a page as a PROMISE.
// Reading params.market synchronously gave undefined, so every research URL 404'd even
// though the route matched. This app is on Next 16; the NFL app is on 14, where the old
// synchronous form is correct - which is why the same code worked there.
export default async function SymbolResearch({ params }: { params: Promise<{ market: string; symbol: string }> }) {
  const { market, symbol: rawSymbol } = await params;
  const symbol = decodeURIComponent(rawSymbol).toUpperCase();
  if (!LABELS[market] || !/^[A-Z0-9.\-]{1,10}$/.test(symbol)) notFound();

  const url = supabaseUrl();
  const key = secretKey();
  if (!url || !key) throw new Error("Database unavailable");
  const db = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

  const { data: latest } = await db.from("market_universe").select("snapshot_date").eq("category", market)
    .order("snapshot_date", { ascending: false }).limit(1).maybeSingle();
  const { data: row } = await db.from("market_universe").select("symbol, name, price, volume, market_cap, sector")
    .eq("category", market).eq("symbol", symbol).eq("snapshot_date", latest?.snapshot_date ?? "1970-01-01").maybeSingle();
  if (!row) notFound();

  let history: Awaited<ReturnType<typeof getHistory>> | null = null;
  let historyError: string | null = null;
  try {
    history = await getHistory(symbol, market);
  } catch (e) {
    historyError = e instanceof Error ? e.message : "price history unavailable";
  }
  const indicators = history ? computeIndicators(history.bars, { high52: history.high52, low52: history.low52 }) : null;
  const name = history?.name ?? (row.name ? String(row.name) : null);
  const news = await getNews(db, symbol, name, market);

  // What the contest's own models have said about this symbol.
  const { data: picks } = await db.from("stock_picks")
    .select("confidence, conviction, reasoning, pick_date, profit_loss_percent, status, ai_models(display_name, color)")
    .eq("symbol", symbol).not("javari_request_id", "is", null).order("pick_date", { ascending: false }).limit(4);

  return (
    <>
      <MarketNav current="/research" />
      <main id="main" className="mx-auto max-w-4xl px-3 py-5 sm:px-4">
        <p className="text-sm"><Link href={`/research/${market}`} className="inline-flex min-h-[2.75rem] items-center text-sky-300 underline">← {LABELS[market]}</Link></p>
        <header className="mt-1 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white sm:text-3xl">{symbol}</h1>
            <p className="text-sm text-gray-300">{name ?? row.sector ?? LABELS[market]}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-white">{money(indicators?.price ?? (row.price === null ? null : Number(row.price)))}</p>
            <p className={`text-sm ${tone(indicators?.changeDay ?? null)}`}>{pct(indicators?.changeDay ?? null)} today</p>
          </div>
        </header>

        <AddToPicks market={market} marketLabel={LABELS[market] as string} symbol={symbol} name={name} />

        {historyError && <p className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">Price history is unavailable right now ({historyError}). The figures below will be incomplete.</p>}

        {history && history.bars.length > 0 && (
          <section aria-labelledby="chart-h" className="mt-5 rounded-xl border border-white/10 bg-[#111827] p-4">
            <h2 id="chart-h" className="text-sm font-semibold text-white">Twelve months</h2>
            <PriceChart bars={history.bars.map((b) => ({ t: b.t, c: b.close }))} />
          </section>
        )}

        {indicators && (
          <>
            <section aria-labelledby="perf-h" className="mt-4">
              <h2 id="perf-h" className="text-lg font-semibold text-white">Past performance</h2>
              <dl className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
                {([["1 week", indicators.changeWeek], ["1 month", indicators.changeMonth], ["3 months", indicators.changeQuarter], ["1 year", indicators.changeYear], ["From 52w high", indicators.fromHigh]] as const).map(([label, value]) => (
                  <div key={label} className="rounded-lg bg-[#111827] px-3 py-2 text-center ring-1 ring-white/10">
                    <dt className="text-xs text-gray-400">{label}</dt>
                    <dd className={`mt-0.5 font-semibold ${tone(value)}`}>{pct(value)}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section aria-labelledby="ind-h" className="mt-4">
              <h2 id="ind-h" className="text-lg font-semibold text-white">Indicators</h2>
              <p className="text-xs text-gray-400">Calculated from the twelve months above. They describe what has happened, not what will.</p>
              <dl className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                <div className="rounded-lg bg-[#111827] px-3 py-2 ring-1 ring-white/10"><dt className="text-xs text-gray-400">Trend (20 vs 50 day average)</dt>
                  <dd className="mt-0.5 text-sm font-semibold text-white">
                    {indicators.sma20 && indicators.sma50 ? (indicators.sma20 > indicators.sma50 ? "Above — rising" : "Below — falling") : "—"}
                  </dd></div>
                <div className="rounded-lg bg-[#111827] px-3 py-2 ring-1 ring-white/10"><dt className="text-xs text-gray-400">RSI (14 day)</dt>
                  <dd className="mt-0.5 text-sm font-semibold text-white">
                    {indicators.rsi14 ?? "—"}{indicators.rsi14 !== null ? indicators.rsi14 >= 70 ? " · overbought" : indicators.rsi14 <= 30 ? " · oversold" : " · neutral" : ""}
                  </dd></div>
                <div className="rounded-lg bg-[#111827] px-3 py-2 ring-1 ring-white/10"><dt className="text-xs text-gray-400">52-week range</dt>
                  <dd className="mt-0.5 text-sm font-semibold text-white">{money(indicators.low52)} – {money(indicators.high52)}</dd></div>
                <div className="rounded-lg bg-[#111827] px-3 py-2 ring-1 ring-white/10"><dt className="text-xs text-gray-400">200-day average</dt>
                  <dd className="mt-0.5 text-sm font-semibold text-white">{money(indicators.sma200)}</dd></div>
                <div className="rounded-lg bg-[#111827] px-3 py-2 ring-1 ring-white/10"><dt className="text-xs text-gray-400">Volume vs 30-day average</dt>
                  <dd className="mt-0.5 text-sm font-semibold text-white">{indicators.volumeVsAverage ? `${indicators.volumeVsAverage}×` : "—"}</dd></div>
                <div className="rounded-lg bg-[#111827] px-3 py-2 ring-1 ring-white/10"><dt className="text-xs text-gray-400">Volatility (annualised)</dt>
                  <dd className="mt-0.5 text-sm font-semibold text-white">{indicators.volatility ? `${indicators.volatility}%` : "—"}</dd></div>
              </dl>
            </section>
          </>
        )}

        {(picks ?? []).length > 0 && (
          <section aria-labelledby="ai-h" className="mt-6">
            <h2 id="ai-h" className="text-lg font-semibold text-white">What the models said about {symbol}</h2>
            <ul className="mt-2 space-y-2">
              {(picks ?? []).map((p, i) => {
                const m = p.ai_models as unknown as { display_name?: string; color?: string } | null;
                return (
                  <li key={i} className="rounded-xl border border-white/10 bg-[#111827] p-3">
                    <p className="flex items-center gap-2 text-sm font-semibold text-white">
                      <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ background: m?.color ?? "#64748b" }} />
                      {m?.display_name ?? "A model"}
                      <span className="text-xs font-normal text-gray-400">{p.pick_date} · {p.confidence}% confidence{p.conviction ? ` · conviction ${p.conviction}/10` : ""}</span>
                    </p>
                    <p className="mt-1 text-sm text-gray-200">{String(p.reasoning ?? "").slice(0, 400)}</p>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <section aria-labelledby="news-h" className="mt-6">
          <h2 id="news-h" className="text-lg font-semibold text-white">Recent news</h2>
          {!news.length ? <p className="mt-2 text-sm text-gray-300">No recent coverage found.</p> : (
            <ul className="mt-2 space-y-2">
              {news.map((n) => (
                <li key={n.url} className="rounded-xl border border-white/10 bg-[#111827] p-3">
                  <a href={n.url} target="_blank" rel="noopener noreferrer" className="inline-block py-1 font-semibold text-sky-300 underline">{n.title}</a>
                  <p className="text-xs text-gray-400">{n.site}</p>
                  <p className="mt-1 text-sm text-gray-300">{n.content}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
      <MarketDisclaimer />
    </>
  );
}
