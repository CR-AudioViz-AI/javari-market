// app/backtesting/page.tsx
// Purpose: an honest answer to "how would following a model have gone?" - computed from
//   the contest's own recorded predictions.
// Date: 2026-09-12 (rebuilt)
//
// This page previously claimed to "run a backtest". It did not: it grouped picks by a
// field that was never present, over an asset type nothing writes. We do not publish
// backtests at all - only forward-recorded results - so the page now says what it is.
//
// CR AudioViz AI, LLC · EIN 39-3646201
import Link from "next/link";
import { getStandings, getRecentClosed } from "@/lib/market/data";
import { MarketNav } from "@/components/MarketNav";
import { MarketDisclaimer } from "@/components/MarketDisclaimer";

export const dynamic = "force-dynamic";

export default async function Backtesting() {
  const [standings, closed] = await Promise.all([getStandings(), getRecentClosed(100)]);
  const scored = standings.filter((s) => s.wins + s.losses > 0);
  const best = closed.reduce<(typeof closed)[number] | null>((b, p) => (b === null || (p.changePct ?? -999) > (b.changePct ?? -999) ? p : b), null);
  const worst = closed.reduce<(typeof closed)[number] | null>((w, p) => (w === null || (p.changePct ?? 999) < (w.changePct ?? 999) ? p : w), null);

  return (
    <>
      <MarketNav current="/" />
      <main id="main" className="mx-auto max-w-4xl px-3 py-5 sm:px-4">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Track record</h1>
        <p className="mt-1 text-sm text-gray-300">
          Every prediction here was published before its outcome was known. We do not publish backtests, because a model tested on the past it was trained on proves nothing.
        </p>
        <p className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
          Hypothetical results — no trades are placed and costs are excluded.{" "}
          <Link href="/legal/performance" className="underline">Performance disclosure</Link>.
        </p>

        {!scored.length ? (
          <p className="mt-5 rounded-xl border border-white/10 bg-[#111827] p-5 text-sm text-gray-300">
            No prediction has closed yet, so there is no record to show. Predictions run for seven days — see <Link href="/" className="text-sky-300 underline">today&rsquo;s picks</Link>.
          </p>
        ) : (
          <>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {scored.map((s) => (
                <section key={s.model.id} className="rounded-xl border border-white/10 bg-[#111827] p-4">
                  <h2 className="flex items-center gap-2 font-semibold text-white">
                    <span aria-hidden className="h-3 w-3 rounded-full" style={{ background: s.model.color ?? "#64748b" }} />{s.model.display_name}
                  </h2>
                  <dl className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="rounded-lg bg-black/30 py-2"><dt className="text-gray-400">Closed</dt><dd className="mt-0.5 font-semibold text-white">{s.wins}–{s.losses}</dd></div>
                    <div className="rounded-lg bg-black/30 py-2"><dt className="text-gray-400">Win rate</dt><dd className="mt-0.5 font-semibold text-white">{s.winRate === null ? "—" : `${s.winRate.toFixed(0)}%`}</dd></div>
                    <div className="rounded-lg bg-black/30 py-2"><dt className="text-gray-400">Sum of returns</dt><dd className={`mt-0.5 font-semibold ${s.totalReturn >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{s.totalReturn >= 0 ? "+" : ""}{s.totalReturn.toFixed(1)}%</dd></div>
                  </dl>
                  <p className="mt-2 text-xs text-gray-400">Average stated confidence {s.avgConfidence === null ? "—" : `${s.avgConfidence.toFixed(0)}%`}{s.winRate !== null && s.avgConfidence !== null ? s.avgConfidence > s.winRate + 10 ? " — higher than its win rate" : s.avgConfidence < s.winRate - 10 ? " — lower than its win rate" : " — close to its win rate" : ""}</p>
                </section>
              ))}
            </div>
            <section className="mt-4 grid gap-3 sm:grid-cols-2">
              {best && <div className="rounded-xl border border-white/10 bg-[#111827] p-4"><h2 className="text-sm font-semibold text-white">Best closed prediction</h2><p className="mt-1 text-sm text-gray-300">{best.symbol} · {best.modelName} · <span className="text-emerald-400">{best.changePct === null ? "—" : `+${best.changePct.toFixed(2)}%`}</span></p></div>}
              {worst && <div className="rounded-xl border border-white/10 bg-[#111827] p-4"><h2 className="text-sm font-semibold text-white">Worst closed prediction</h2><p className="mt-1 text-sm text-gray-300">{worst.symbol} · {worst.modelName} · <span className="text-rose-400">{worst.changePct === null ? "—" : `${worst.changePct.toFixed(2)}%`}</span></p></div>}
            </section>
          </>
        )}
      </main>
      <MarketDisclaimer />
    </>
  );
}
