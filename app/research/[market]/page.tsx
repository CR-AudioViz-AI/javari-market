// app/research/[market]/page.tsx
// Purpose: every company in a market, with the numbers that matter at a glance, so a
//   symbol can be found and opened for a proper look.
// Date: 2026-09-12
//
// CR AudioViz AI, LLC · EIN 39-3646201
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { secretKey, supabaseUrl } from "@craudioviz/platform-sdk";
import { MarketNav } from "@/components/MarketNav";
import { MarketDisclaimer } from "@/components/MarketDisclaimer";
import { ResearchList } from "@/components/ResearchList";

export const dynamic = "force-dynamic";

const LABELS: Record<string, string> = {
  sp500: "S&P 500", nasdaq: "Nasdaq 100", dow: "Dow Composite 65", penny: "Penny stocks", crypto: "Crypto",
};

// 2026-09-12: Next 16 hands route params (and searchParams) to a page as a PROMISE.
// Reading params.market synchronously gave undefined, so every research URL 404'd even
// though the route matched. This app is on Next 16; the NFL app is on 14, where the old
// synchronous form is correct - which is why the same code worked there.
export default async function MarketResearch({ params }: { params: Promise<{ market: string }> }) {
  const { market } = await params;
  if (!LABELS[market]) notFound();
  const url = supabaseUrl();
  const key = secretKey();
  if (!url || !key) throw new Error("Database unavailable");
  const db = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

  const { data: latest } = await db.from("market_universe").select("snapshot_date").eq("category", market)
    .order("snapshot_date", { ascending: false }).limit(1).maybeSingle();
  const snapshot = latest?.snapshot_date as string | undefined;
  const { data: rows } = snapshot
    ? await db.from("market_universe").select("symbol, name, price, volume, market_cap, sector")
        .eq("category", market).eq("snapshot_date", snapshot).order("symbol")
    : { data: [] };

  const symbols = (rows ?? []).map((r) => ({
    symbol: String(r.symbol),
    name: r.name ? String(r.name) : null,
    price: r.price === null ? null : Number(r.price),
    volume: r.volume === null ? null : Number(r.volume),
    marketCap: r.market_cap === null ? null : Number(r.market_cap),
    sector: r.sector ? String(r.sector) : null,
  }));

  return (
    <>
      <MarketNav current="/research" />
      <main id="main" className="mx-auto max-w-5xl px-3 py-5 sm:px-4">
        <p className="text-xs uppercase tracking-wide text-sky-400">Research</p>
        <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">{LABELS[market]}</h1>
        <p className="mt-1 text-sm text-gray-300">
          All {symbols.length} names the models choose from. Tap any one for a year of prices, its trend and momentum
          indicators, and recent news — then add it to your picks from there.
        </p>
        <nav aria-label="Other markets" className="mt-3 flex flex-wrap gap-2">
          {Object.entries(LABELS).map(([id, label]) => (
            <Link key={id} href={`/research/${id}`} aria-current={id === market ? "page" : undefined}
              className={`inline-flex min-h-[2.75rem] items-center rounded-lg px-3 text-sm ring-1 ${id === market ? "bg-white/10 font-semibold text-white ring-white/25" : "text-gray-300 ring-white/15"}`}>
              {label}
            </Link>
          ))}
        </nav>
        <ResearchList market={market} symbols={symbols} />
      </main>
      <MarketDisclaimer />
    </>
  );
}
