// components/ResearchList.tsx
// Purpose: a searchable, sortable list of a market's companies.
// Date: 2026-09-12
//
// CR AudioViz AI, LLC · EIN 39-3646201
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

export type ResearchRow = { symbol: string; name: string | null; price: number | null; volume: number | null; marketCap: number | null; sector: string | null };
type SortKey = "symbol" | "price" | "volume" | "marketCap";

const money = (n: number | null): string => (n === null ? "—" : n >= 1000 ? `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}` : n < 1 ? `$${n.toFixed(4)}` : `$${n.toFixed(2)}`);
const big = (n: number | null): string => {
  if (n === null) return "—";
  if (n >= 1e12) return `${(n / 1e12).toFixed(1)}T`;
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  return n.toLocaleString("en-US");
};

export function ResearchList({ market, symbols }: { market: string; symbols: ResearchRow[] }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("symbol");

  const rows = useMemo(() => {
    const term = q.trim().toUpperCase();
    const scored = term
      ? symbols.filter((s) => s.symbol.includes(term) || (s.name ?? "").toUpperCase().includes(term))
      : symbols;
    return [...scored].sort((a, b) => {
      if (sort === "symbol") return a.symbol.localeCompare(b.symbol);
      const av = (sort === "price" ? a.price : sort === "volume" ? a.volume : a.marketCap) ?? -1;
      const bv = (sort === "price" ? b.price : sort === "volume" ? b.volume : b.marketCap) ?? -1;
      return bv - av;
    });
  }, [symbols, q, sort]);

  return (
    <>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          type="search" value={q} onChange={(e) => setQ(e.target.value)}
          placeholder={`Search ${symbols.length} — ticker or company name`}
          aria-label="Search this market"
          className="min-h-[2.75rem] flex-1 rounded-lg bg-black/40 px-3 text-white ring-1 ring-white/15"
        />
        <label className="flex min-h-[2.75rem] items-center gap-2 text-sm text-gray-300">
          <span className="sr-only sm:not-sr-only">Sort</span>
          <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}
            className="min-h-[2.75rem] rounded-lg bg-black/40 px-3 text-white ring-1 ring-white/15">
            <option value="symbol">A–Z</option>
            <option value="marketCap">Largest first</option>
            <option value="price">Highest price</option>
            <option value="volume">Most traded</option>
          </select>
        </label>
      </div>

      <p className="mt-2 text-xs text-gray-400">{rows.length} of {symbols.length} shown</p>

      <ul className="mt-2 divide-y divide-white/5 rounded-xl border border-white/10 bg-[#111827]">
        {rows.slice(0, 250).map((r) => (
          <li key={r.symbol}>
            <Link href={`/research/${market}/${r.symbol}`} className="flex min-h-[3.25rem] items-center justify-between gap-3 px-4 py-2">
              <span className="min-w-0">
                <span className="block font-semibold text-white">{r.symbol}</span>
                <span className="block truncate text-xs text-gray-400">{r.name ?? r.sector ?? ""}</span>
              </span>
              <span className="shrink-0 text-right">
                <span className="block text-sm text-white">{money(r.price)}</span>
                <span className="block text-xs text-gray-400">{r.marketCap ? `${big(r.marketCap)} cap` : r.volume ? `${big(r.volume)} vol` : ""}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {rows.length > 250 && <p className="mt-2 text-xs text-gray-400">Showing the first 250. Search to narrow it.</p>}
    </>
  );
}
