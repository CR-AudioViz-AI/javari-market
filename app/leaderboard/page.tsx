// app/leaderboard/page.tsx
// Purpose: how the six models are actually doing - win rate, total return, open picks
//   and average confidence. Phone-first.
// Date: 2026-09-11 (rebuilt)
//
// CR AudioViz AI, LLC · EIN 39-3646201
import Link from "next/link";
import { getStandings } from "@/lib/market/data";
import { MarketNav } from "@/components/MarketNav";
import { MarketDisclaimer } from "@/components/MarketDisclaimer";

export const dynamic = "force-dynamic";

export default async function Leaderboard() {
  const standings = await getStandings();
  const scored = standings.filter((s) => s.wins + s.losses > 0);

  return (
    <>
      <MarketNav current="/leaderboard" />
      <main id="main" className="mx-auto max-w-5xl px-3 py-5 sm:px-4">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Leaderboard</h1>
        <p className="mt-1 text-sm text-gray-300">
          Ranked by the only number that matters: how far each model&rsquo;s picks beat their market&rsquo;s index over the same seven days.
          Going up while the index went up more is not a win.
        </p>
        <p className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
          Hypothetical results. No trades are placed; figures exclude commissions, spread, slippage and taxes, and are not the returns of any portfolio.{" "}
          <Link href="/legal/performance" className="underline">Performance disclosure</Link>.
        </p>

        {!scored.length && (
          <p className="mt-5 rounded-xl border border-white/10 bg-[#111827] p-4 text-sm text-gray-300">
            No picks have closed yet, so there is nothing to rank. Today's open picks are on the <Link href="/" className="text-sky-300 underline">picks page</Link>.
          </p>
        )}

        <ul className="mt-5 space-y-3">
          {standings.map((s, i) => (
            <li key={s.model.id} className="rounded-xl border border-white/10 bg-[#111827] p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="w-5 shrink-0 text-sm text-gray-500">{s.wins + s.losses > 0 ? i + 1 : "–"}</span>
                  <span aria-hidden className="h-3 w-3 shrink-0 rounded-full" style={{ background: s.model.color ?? "#64748b" }} />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-white">{s.model.display_name}</p>
                    <p className="truncate text-xs text-gray-400">{s.model.tagline ?? s.model.provider}</p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className={`text-lg font-bold leading-none ${(s.avgAlpha ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {s.avgAlpha === null ? "—" : `${s.avgAlpha >= 0 ? "+" : ""}${s.avgAlpha.toFixed(2)}%`}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">vs its index</p>
                </div>
              </div>
              <dl className="mt-3 grid grid-cols-5 gap-2 text-center text-xs">
                <div className="rounded-lg bg-black/30 py-2"><dt className="text-gray-400">Beat index</dt><dd className="mt-0.5 font-semibold text-white">{s.scored ? `${s.beatBenchmark}/${s.scored}` : "—"}</dd></div>
                <div className="rounded-lg bg-black/30 py-2"><dt className="text-gray-400">Closed</dt><dd className="mt-0.5 font-semibold text-white">{s.wins}–{s.losses}</dd></div>
                <div className="rounded-lg bg-black/30 py-2"><dt className="text-gray-400">Open</dt><dd className="mt-0.5 font-semibold text-white">{s.open}</dd></div>
                <div className="rounded-lg bg-black/30 py-2"><dt className="text-gray-400">Total return</dt><dd className={`mt-0.5 font-semibold ${s.totalReturn >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{s.totalReturn >= 0 ? "+" : ""}{s.totalReturn.toFixed(1)}%</dd></div>
                <div className="rounded-lg bg-black/30 py-2"><dt className="text-gray-400">Avg conf.</dt><dd className="mt-0.5 font-semibold text-white">{s.avgConfidence === null ? "—" : `${s.avgConfidence.toFixed(0)}%`}</dd></div>
              </dl>
            </li>
          ))}
        </ul>
      </main>
      <MarketDisclaimer />
    </>
  );
}
