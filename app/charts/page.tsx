// app/charts/page.tsx
// Purpose: the contest in charts -each model's accuracy, confidence and returns, drawn
//   from real picks. Was a permanent spinner because it grouped by a field the rows
//   never carried.
// Date: 2026-09-12 (rebuilt)
//
// CR AudioViz AI, LLC · EIN 39-3646201
import Link from "next/link";
import { getStandings, getRecentClosed } from "@/lib/market/data";
import { MarketNav } from "@/components/MarketNav";
import { MarketDisclaimer } from "@/components/MarketDisclaimer";

export const dynamic = "force-dynamic";

function Bar({ label, value, max, colour, suffix }: { label: string; value: number; max: number; colour: string; suffix: string }) {
  const width = max > 0 ? Math.max(2, Math.round((Math.abs(value) / max) * 100)) : 2;
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 shrink-0 truncate text-xs text-gray-300">{label}</span>
      <span className="h-3 flex-1 overflow-hidden rounded-full bg-black/40">
        <span className="block h-full rounded-full" style={{ width: `${width}%`, background: colour }} />
      </span>
      <span className="w-16 shrink-0 text-right text-xs font-semibold text-white">{value.toFixed(value >= 100 ? 0 : 1)}{suffix}</span>
    </div>
  );
}

export default async function Charts() {
  const [standings, closed] = await Promise.all([getStandings(), getRecentClosed(40)]);
  const maxConf = Math.max(...standings.map((s) => s.avgConfidence ?? 0), 1);
  const maxWin = Math.max(...standings.map((s) => s.winRate ?? 0), 1);
  const maxRet = Math.max(...standings.map((s) => Math.abs(s.totalReturn)), 1);
  const scored = standings.filter((s) => s.wins + s.losses > 0);

  return (
    <>
      <MarketNav current="/" />
      <main id="main" className="mx-auto max-w-4xl px-3 py-5 sm:px-4">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Charts</h1>
        <p className="mt-1 text-sm text-gray-300">Every figure comes from real predictions recorded before the outcome was known.</p>
        <p className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
          Hypothetical results, costs excluded. <Link href="/legal/performance" className="inline-block py-2 underline">Performance disclosure</Link>.
        </p>

        <section className="mt-6 rounded-xl border border-white/10 bg-[#111827] p-4">
          <h2 className="font-semibold text-white">Average confidence</h2>
          <p className="text-xs text-gray-400">How sure each model says it is. A model whose confidence is far above its win rate is overconfident.</p>
          <div className="mt-3 space-y-2">
            {standings.map((s) => <Bar key={s.model.id} label={s.model.display_name} value={s.avgConfidence ?? 0} max={maxConf} colour={s.model.color ?? "#38bdf8"} suffix="%" />)}
          </div>
        </section>

        <section className="mt-4 rounded-xl border border-white/10 bg-[#111827] p-4">
          <h2 className="font-semibold text-white">Win rate</h2>
          {!scored.length ? <p className="mt-2 text-sm text-gray-300">No predictions have closed yet.</p> : (
            <div className="mt-3 space-y-2">
              {scored.map((s) => <Bar key={s.model.id} label={s.model.display_name} value={s.winRate ?? 0} max={maxWin} colour={s.model.color ?? "#38bdf8"} suffix="%" />)}
            </div>
          )}
        </section>

        <section className="mt-4 rounded-xl border border-white/10 bg-[#111827] p-4">
          <h2 className="font-semibold text-white">Total return of closed predictions</h2>
          {!scored.length ? <p className="mt-2 text-sm text-gray-300">Nothing closed yet.</p> : (
            <div className="mt-3 space-y-2">
              {scored.map((s) => <Bar key={s.model.id} label={s.model.display_name} value={s.totalReturn} max={maxRet} colour={s.totalReturn >= 0 ? "#34d399" : "#fb7185"} suffix="%" />)}
            </div>
          )}
        </section>

        <section className="mt-4 rounded-xl border border-white/10 bg-[#111827] p-4">
          <h2 className="font-semibold text-white">Recent closed predictions</h2>
          {!closed.length ? <p className="mt-2 text-sm text-gray-300">Nothing has closed yet.</p> : (
            <ul className="mt-3 space-y-1 text-sm">
              {closed.slice(0, 12).map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3">
                  <span className="min-w-0 truncate text-gray-300"><strong className="text-white">{p.symbol}</strong> · {p.modelName}</span>
                  <span className={`shrink-0 font-semibold ${(p.changePct ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{p.changePct === null ? "—" : `${p.changePct >= 0 ? "+" : ""}${p.changePct.toFixed(2)}%`}</span>
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
