// app/penny-stocks/page.tsx
// Purpose: lower-priced names among the contest's picks. Previously queried an
//   asset_type nothing writes and showed an unexplained blank.
// Date: 2026-09-12 (rebuilt)
//
// CR AudioViz AI, LLC · EIN 39-3646201
import Link from "next/link";
import { getRecentClosed, getLatestBattle, getActiveModels } from "@/lib/market/data";
import { MarketNav } from "@/components/MarketNav";
import { MarketDisclaimer } from "@/components/MarketDisclaimer";

export const dynamic = "force-dynamic";
const THRESHOLD = 25;

export default async function PennyStocks() {
  const [battle, closed, models] = await Promise.all([getLatestBattle(), getRecentClosed(50), getActiveModels()]);
  const byId = new Map(models.map((m) => [m.id, m]));
  const low = [
    ...battle.picks.filter((p) => p.entry <= THRESHOLD).map((p) => ({ ...p, modelName: byId.get(p.modelId)?.display_name ?? "Model" })),
    ...closed.filter((p) => p.entry <= THRESHOLD),
  ];
  return (
    <>
      <MarketNav current="/" />
      <main id="main" className="mx-auto max-w-5xl px-3 py-5 sm:px-4">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Lower-priced picks</h1>
        <p className="mt-1 text-sm text-gray-300">Contest picks trading under ${THRESHOLD} a share. Lower-priced shares move more sharply in both directions.</p>
        {!low.length ? (
          <div className="mt-5 rounded-xl border border-white/10 bg-[#111827] p-5">
            <p className="text-sm text-gray-300">No pick under ${THRESHOLD} yet. <Link href="/" className="inline-block py-2 text-sky-300 underline">Today&rsquo;s picks</Link>.</p>
          </div>
        ) : (
          <ul className="mt-5 space-y-2">
            {low.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-sm">
                <span className="min-w-0"><strong className="text-white">{p.symbol}</strong> <span className="text-gray-400">· {p.modelName}</span></span>
                <span className="shrink-0 text-gray-300">${p.entry.toFixed(2)} → target ${p.target.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        )}
      </main>
      <MarketDisclaimer />
    </>
  );
}
