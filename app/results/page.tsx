// app/results/page.tsx
// Purpose: the closed picks - what each model called and how it actually went.
// Date: 2026-09-11
//
// CR AudioViz AI, LLC · EIN 39-3646201
import Link from "next/link";
import { getRecentClosed } from "@/lib/market/data";
import { MarketNav } from "@/components/MarketNav";
import { MarketDisclaimer } from "@/components/MarketDisclaimer";

export const dynamic = "force-dynamic";

export default async function Results() {
  const closed = await getRecentClosed(20);
  return (
    <>
      <MarketNav current="/results" />
      <main id="main" className="mx-auto max-w-5xl px-3 py-5 sm:px-4">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Results</h1>
        <p className="mt-1 text-sm text-gray-300">Every pick that has closed, newest first.</p>
        <p className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
          Hypothetical results — no trades are placed, and costs are excluded.{" "}
          <Link href="/legal/performance" className="underline">Performance disclosure</Link>.
        </p>
        {!closed.length ? (
          <p className="mt-5 rounded-xl border border-white/10 bg-[#111827] p-4 text-sm text-gray-300">
            Nothing has closed yet. Picks run for seven days — see <Link href="/" className="text-sky-300 underline">today's picks</Link>.
          </p>
        ) : (
          <ul className="mt-5 space-y-2">
            {closed.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#111827] px-4 py-3">
                <div className="flex min-w-0 items-center gap-2">
                  <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: p.color ?? "#64748b" }} />
                  <div className="min-w-0">
                    <p className="truncate text-sm text-white"><strong>{p.symbol}</strong> <span className="text-gray-400">· {p.modelName}</span></p>
                    <p className="truncate text-xs text-gray-400">{p.pickDate}</p>
                  </div>
                </div>
                <p className={`shrink-0 text-sm font-semibold ${(p.changePct ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {p.changePct === null ? "—" : `${p.changePct >= 0 ? "+" : ""}${p.changePct.toFixed(2)}%`}
                </p>
              </li>
            ))}
          </ul>
        )}
      </main>
      <MarketDisclaimer />
    </>
  );
}
