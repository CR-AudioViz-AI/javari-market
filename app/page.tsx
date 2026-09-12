// app/page.tsx
// Purpose: today's battle - six named AI models, the same research, one pick each.
//   Server-rendered so the page is right the moment it loads. Phone-first.
// Date: 2026-09-11 (rebuilt)
//
// CR AudioViz AI, LLC · EIN 39-3646201
import Link from "next/link";
import { getActiveModels, getLatestBattle, getStandings } from "@/lib/market/data";
import { MarketNav } from "@/components/MarketNav";
import { MarketDisclaimer } from "@/components/MarketDisclaimer";

export const dynamic = "force-dynamic";

function fmtDate(d: string): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", weekday: "short", month: "short", day: "numeric" }).format(new Date(`${d}T12:00:00Z`));
}
function money(n: number): string {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function pct(n: number): string {
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

export default async function Home() {
  const [models, battle, standings] = await Promise.all([getActiveModels(), getLatestBattle(), getStandings()]);
  const byId = new Map(models.map((m) => [m.id, m]));
  const leader = standings.find((s) => s.winRate !== null) ?? null;

  return (
    <>
      <MarketNav current="/" />
      <main id="main" className="mx-auto max-w-5xl px-3 py-5 sm:px-4">
        <header>
          <p className="text-xs uppercase tracking-wide text-sky-400">Javari Market Oracle</p>
          <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">Six AI models. One pick each. Scored on what really happens.</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-300">
            Every weekday morning each model reads the same research and picks one stock to rise over the next seven days. We track how they do.
            Research only — nothing here is investment advice.
          </p>
        </header>

        {battle.pickDate && (
          <p className="mt-4 text-sm text-gray-400">Picks for <strong className="text-white">{fmtDate(battle.pickDate)}</strong>{leader?.winRate !== null && leader ? <> · leading: <strong className="text-white">{leader.model.display_name}</strong> at {leader.winRate?.toFixed(0)}% </> : null}</p>
        )}

        {!battle.picks.length ? (
          <p className="mt-6 rounded-xl border border-white/10 bg-[#111827] p-5 text-sm text-gray-300">No picks yet. The models pick each weekday at 9:30 AM ET.</p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {battle.picks.map((p) => {
              const m = byId.get(p.modelId);
              const change = p.current !== null && p.entry ? ((p.current - p.entry) / p.entry) * 100 : null;
              const upside = ((p.target - p.entry) / p.entry) * 100;
              return (
                <li key={p.id} className="rounded-xl border border-white/10 bg-[#111827] p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-2 text-sm text-gray-300">
                      <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: m?.color ?? "#64748b" }} />
                      <span className="truncate font-semibold text-white">{m?.display_name ?? "Model"}</span>
                    </span>
                    <span className="shrink-0 text-xs text-gray-400">{m?.provider}</span>
                  </div>

                  <div className="mt-3 flex items-end justify-between gap-2">
                    <div>
                      <p className="text-2xl font-bold leading-none text-white">{p.symbol}</p>
                      <p className="mt-1 text-xs text-gray-400">Entry {money(p.entry)}</p>
                    </div>
                    <div className="text-right">
                      {change !== null && <p className={`text-lg font-semibold leading-none ${change >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{pct(change)}</p>}
                      <p className="mt-1 text-xs text-gray-400">{p.current !== null ? `now ${money(p.current)}` : "awaiting price"}</p>
                    </div>
                  </div>

                  <dl className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="rounded-lg bg-black/30 py-2"><dt className="text-gray-400">Confidence</dt><dd className="mt-0.5 font-semibold text-white">{p.confidence}%</dd></div>
                    <div className="rounded-lg bg-black/30 py-2"><dt className="text-gray-400">Target</dt><dd className="mt-0.5 font-semibold text-white">{money(p.target)}</dd></div>
                    <div className="rounded-lg bg-black/30 py-2"><dt className="text-gray-400">Upside</dt><dd className="mt-0.5 font-semibold text-white">{upside.toFixed(1)}%</dd></div>
                  </dl>

                  <p className="mt-3 text-sm text-gray-200">{p.thesis}</p>

                  <details className="mt-3">
                    <summary className="flex min-h-[2.75rem] cursor-pointer items-center text-sm font-semibold text-sky-300">Why, and what could go wrong</summary>
                    <div className="space-y-3 pb-1">
                      {p.keyFactors.length > 0 && (
                        <div><h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Reasons</h3>
                          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-gray-200">{p.keyFactors.map((f, i) => <li key={i}>{f}</li>)}</ul></div>
                      )}
                      {p.risks.length > 0 && (
                        <div><h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Risks it named</h3>
                          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-amber-200">{p.risks.map((f, i) => <li key={i}>{f}</li>)}</ul></div>
                      )}
                      <p className="text-xs text-gray-400">Stop loss {money(p.stop)}</p>
                      {p.sources.length > 0 && (
                        <div><h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Sources it used</h3>
                          <ul className="mt-1 space-y-1 text-sm">{p.sources.map((s) => <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-block py-1 text-sky-300 underline break-words">{s.title}</a></li>)}</ul></div>
                      )}
                      {p.seal && <p className="text-xs text-gray-500">Sealed · SHA-256 {p.seal.slice(0, 16)}…</p>}
                    </div>
                  </details>
                </li>
              );
            })}
          </ul>
        )}

        {battle.research && (
          <section aria-labelledby="research-h" className="mt-8">
            <h2 id="research-h" className="text-lg font-semibold text-white">What every model read</h2>
            <p className="mt-1 text-sm text-gray-400">All six received exactly this, so the contest measures judgment, not access.</p>
            <details className="mt-3 rounded-xl border border-white/10 bg-[#111827] p-4">
              <summary className="flex min-h-[2.75rem] cursor-pointer items-center text-sm font-semibold text-sky-300">Open today's research pack</summary>
              <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words text-xs leading-relaxed text-gray-300">{battle.research.body}</pre>
            </details>
          </section>
        )}

        <p className="mt-8 text-sm text-gray-300">
          <Link href="/leaderboard" className="inline-flex min-h-[2.75rem] items-center text-sky-300 underline">See the standings →</Link>
        </p>
      </main>
      <MarketDisclaimer />
    </>
  );
}
