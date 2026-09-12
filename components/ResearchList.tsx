// components/ResearchList.tsx
// Purpose: find anything in a market - by name or ticker, sorted and filtered any way -
//   with the ten best and worst performers shown first.
// Date: 2026-09-12 (rebuilt)
//
// Roy, 12 Sep 2026: "top 10 performers at the top ... full sort, search and filter."
// Leaders are shown for the period you are sorting by, so the list and the leaders
// always agree - a top ten by one measure above a list ranked by another is how people
// get misled.
//
// CR AudioViz AI, LLC · EIN 39-3646201
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

export type ResearchRow = {
  symbol: string; name: string | null; price: number | null; volume: number | null; marketCap: number | null; sector: string | null;
  changeDay: number | null; changeWeek: number | null; changeMonth: number | null; changeYear: number | null;
};

type Period = "day" | "week" | "month" | "year";
type SortKey = Period | "symbol" | "name" | "price" | "volume" | "marketCap";

const PERIOD_LABEL: Record<Period, string> = { day: "today", week: "1 week", month: "1 month", year: "1 year" };

const money = (n: number | null): string => (n === null ? "—" : n >= 1000 ? `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}` : n < 1 ? `$${n.toFixed(4)}` : `$${n.toFixed(2)}`);
const pct = (n: number | null): string => (n === null ? "—" : `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`);
const tone = (n: number | null): string => (n === null ? "text-gray-400" : n >= 0 ? "text-emerald-400" : "text-rose-400");
const big = (n: number | null): string => {
  if (n === null) return "—";
  if (n >= 1e12) return `${(n / 1e12).toFixed(1)}T`;
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  return n.toLocaleString("en-US");
};
const perf = (r: ResearchRow, p: Period): number | null =>
  p === "day" ? r.changeDay : p === "week" ? r.changeWeek : p === "month" ? r.changeMonth : r.changeYear;

export function ResearchList({ market, symbols }: { market: string; symbols: ResearchRow[] }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("week");
  const [period, setPeriod] = useState<Period>("week");
  const [sector, setSector] = useState("all");
  const [direction, setDirection] = useState<"all" | "up" | "down">("all");
  const [band, setBand] = useState("all");

  const sectors = useMemo(() => [...new Set(symbols.map((s) => s.sector).filter((x): x is string => Boolean(x)))].sort(), [symbols]);

  const filtered = useMemo(() => {
    const term = q.trim().toUpperCase();
    return symbols.filter((s) => {
      if (term && !s.symbol.includes(term) && !(s.name ?? "").toUpperCase().includes(term)) return false;
      if (sector !== "all" && s.sector !== sector) return false;
      const p = perf(s, period);
      if (direction === "up" && !(p !== null && p > 0)) return false;
      if (direction === "down" && !(p !== null && p < 0)) return false;
      if (band !== "all" && s.price !== null) {
        if (band === "under5" && s.price >= 5) return false;
        if (band === "5to50" && (s.price < 5 || s.price > 50)) return false;
        if (band === "50to250" && (s.price < 50 || s.price > 250)) return false;
        if (band === "over250" && s.price <= 250) return false;
      }
      return true;
    });
  }, [symbols, q, sector, direction, band, period]);

  const sorted = useMemo(() => {
    const rows = [...filtered];
    if (sort === "symbol") return rows.sort((a, b) => a.symbol.localeCompare(b.symbol));
    if (sort === "name") return rows.sort((a, b) => (a.name ?? a.symbol).localeCompare(b.name ?? b.symbol));
    if (sort === "price" || sort === "volume" || sort === "marketCap") {
      return rows.sort((a, b) => ((sort === "price" ? b.price : sort === "volume" ? b.volume : b.marketCap) ?? -Infinity)
        - ((sort === "price" ? a.price : sort === "volume" ? a.volume : a.marketCap) ?? -Infinity));
    }
    return rows.sort((a, b) => (perf(b, sort) ?? -Infinity) - (perf(a, sort) ?? -Infinity));
  }, [filtered, sort]);

  const ranked = useMemo(() => filtered.filter((s) => perf(s, period) !== null).sort((a, b) => (perf(b, period) as number) - (perf(a, period) as number)), [filtered, period]);
  const leaders = ranked.slice(0, 10);
  const laggards = ranked.slice(-10).reverse();

  const Card = ({ r }: { r: ResearchRow }) => (
    <Link href={`/research/${market}/${r.symbol}`} className="flex min-h-[3rem] items-center justify-between gap-2 rounded-lg bg-black/30 px-3 py-2 ring-1 ring-white/10">
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-white">{r.symbol}</span>
        <span className="block truncate text-[11px] text-gray-400">{r.name ?? ""}</span>
      </span>
      <span className={`shrink-0 text-sm font-semibold ${tone(perf(r, period))}`}>{pct(perf(r, period))}</span>
    </Link>
  );

  return (
    <>
      <section aria-labelledby="leaders-h" className="mt-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="leaders-h" className="text-lg font-semibold text-white">Top 10 over {PERIOD_LABEL[period]}</h2>
          <div className="flex flex-wrap gap-1">
            {(Object.keys(PERIOD_LABEL) as Period[]).map((p) => (
              <button key={p} type="button" onClick={() => { setPeriod(p); setSort(p); }} aria-pressed={period === p}
                className={`inline-flex min-h-[2.75rem] items-center rounded-lg px-3 text-sm ring-1 ${period === p ? "bg-white/10 font-semibold text-white ring-white/25" : "text-gray-300 ring-white/15"}`}>
                {PERIOD_LABEL[p]}
              </button>
            ))}
          </div>
        </div>
        {!leaders.length ? (
          <p className="mt-2 text-sm text-gray-400">No performance figures for this market yet — they arrive with the next daily build.</p>
        ) : (
          <>
            <ol className="mt-2 grid gap-2 sm:grid-cols-2">
              {leaders.map((r, i) => (
                <li key={r.symbol} className="flex items-center gap-2">
                  <span aria-hidden className="w-5 shrink-0 text-xs text-gray-500">{i + 1}</span>
                  <span className="min-w-0 flex-1"><Card r={r} /></span>
                </li>
              ))}
            </ol>
            <details className="mt-3">
              <summary className="flex min-h-[2.75rem] cursor-pointer items-center text-sm font-semibold text-sky-300">Bottom 10 over {PERIOD_LABEL[period]}</summary>
              <ol className="mt-2 grid gap-2 sm:grid-cols-2">
                {laggards.map((r) => <li key={r.symbol}><Card r={r} /></li>)}
              </ol>
            </details>
          </>
        )}
      </section>

      <section aria-labelledby="all-h" className="mt-8">
        <h2 id="all-h" className="text-lg font-semibold text-white">All {symbols.length}</h2>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Search ticker or company name" aria-label="Search this market"
            className="min-h-[2.75rem] rounded-lg bg-black/40 px-3 text-white ring-1 ring-white/15 sm:col-span-2" />
          <label className="flex items-center gap-2 text-sm text-gray-300">
            <span className="w-16 shrink-0">Sort</span>
            <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="min-h-[2.75rem] flex-1 rounded-lg bg-black/40 px-3 text-white ring-1 ring-white/15">
              <optgroup label="Performance">
                <option value="day">Best today</option><option value="week">Best 1 week</option>
                <option value="month">Best 1 month</option><option value="year">Best 1 year</option>
              </optgroup>
              <optgroup label="Other">
                <option value="symbol">Ticker A–Z</option><option value="name">Company A–Z</option>
                <option value="marketCap">Largest</option><option value="price">Highest price</option><option value="volume">Most traded</option>
              </optgroup>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-300">
            <span className="w-16 shrink-0">Moving</span>
            <select value={direction} onChange={(e) => setDirection(e.target.value as "all" | "up" | "down")} className="min-h-[2.75rem] flex-1 rounded-lg bg-black/40 px-3 text-white ring-1 ring-white/15">
              <option value="all">Any direction</option><option value="up">Up over {PERIOD_LABEL[period]}</option><option value="down">Down over {PERIOD_LABEL[period]}</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-300">
            <span className="w-16 shrink-0">Price</span>
            <select value={band} onChange={(e) => setBand(e.target.value)} className="min-h-[2.75rem] flex-1 rounded-lg bg-black/40 px-3 text-white ring-1 ring-white/15">
              <option value="all">Any price</option><option value="under5">Under $5</option><option value="5to50">$5 – $50</option>
              <option value="50to250">$50 – $250</option><option value="over250">Over $250</option>
            </select>
          </label>
          {sectors.length > 1 && (
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <span className="w-16 shrink-0">Sector</span>
              <select value={sector} onChange={(e) => setSector(e.target.value)} className="min-h-[2.75rem] flex-1 rounded-lg bg-black/40 px-3 text-white ring-1 ring-white/15">
                <option value="all">All sectors</option>
                {sectors.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
          )}
        </div>

        <p className="mt-2 text-xs text-gray-400">
          {sorted.length} of {symbols.length} shown
          {(q || sector !== "all" || direction !== "all" || band !== "all") && (
            <button type="button" onClick={() => { setQ(""); setSector("all"); setDirection("all"); setBand("all"); }}
              className="ml-2 inline-flex min-h-[2.75rem] items-center text-sky-300 underline">Clear filters</button>
          )}
        </p>

        <ul className="mt-1 divide-y divide-white/5 rounded-xl border border-white/10 bg-[#111827]">
          {sorted.slice(0, 200).map((r) => (
            <li key={r.symbol}>
              <Link href={`/research/${market}/${r.symbol}`} className="flex min-h-[3.25rem] items-center justify-between gap-3 px-4 py-2">
                <span className="min-w-0">
                  <span className="block font-semibold text-white">{r.symbol}</span>
                  <span className="block truncate text-xs text-gray-400">{r.name ?? r.sector ?? ""}</span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-sm text-white">{money(r.price)}</span>
                  <span className={`block text-xs ${tone(perf(r, period))}`}>{pct(perf(r, period))} · {PERIOD_LABEL[period]}</span>
                </span>
                <span className="hidden w-20 shrink-0 text-right text-xs text-gray-400 sm:block">{r.marketCap ? `${big(r.marketCap)} cap` : r.volume ? `${big(r.volume)} vol` : ""}</span>
              </Link>
            </li>
          ))}
        </ul>
        {sorted.length > 200 && <p className="mt-2 text-xs text-gray-400">Showing the first 200 of {sorted.length}. Search or filter to narrow it.</p>}
      </section>
    </>
  );
}
