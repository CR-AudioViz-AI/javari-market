// app/page.tsx
// Purpose: today's board across all five markets. Models with the best record appear
//   first, each pick carries the reasoning behind it, and every number says plainly
//   what it means.
// Date: 2026-09-12 (rebuilt for five markets)
//
// CR AudioViz AI, LLC · EIN 39-3646201
import Link from "next/link";
import { getBoards, getStandings } from "@/lib/market/data";
import { MarketNav } from "@/components/MarketNav";
import { MarketDisclaimer } from "@/components/MarketDisclaimer";

export const dynamic = "force-dynamic";

const money = (n: number): string => (n >= 1000 ? `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}` : n < 1 ? `$${n.toFixed(4)}` : `$${n.toFixed(2)}`);
const pct = (n: number): string => `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
const fmtDate = (d: string): string => new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", weekday: "long", month: "long", day: "numeric" }).format(new Date(`${d}T12:00:00Z`));

export default async function Home() {
  const [{ pickDate, boards }, standings] = await Promise.all([getBoards(), getStandings()]);
  const anyScored = standings.some((s) => s.scored > 0);
  const leader = standings[0];

  return (
    <>
      <MarketNav current="/" />
      <main id="main" className="mx-auto max-w-5xl px-3 py-5 sm:px-4">
        <header>
          <p className="text-xs uppercase tracking-wide text-sky-400">Javari Market Oracle</p>
          <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">Six AI models. Five markets. One pick each, every day.</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-300">
            Every model sees the same full book — today&rsquo;s prices in every market and every past pick with its result — then decides on its own.
            We score each pick against its market&rsquo;s index, so &ldquo;winning&rdquo; means beating the index, not just going up.
          </p>
          {pickDate && <p className="mt-3 text-sm text-gray-400">Picks for <strong className="text-white">{fmtDate(pickDate)}</strong></p>}
        </header>

        <section aria-labelledby="how-read" className="mt-4 rounded-xl border border-white/10 bg-[#111827] p-4">
          <h2 id="how-read" className="text-sm font-semibold text-white">How to read this</h2>
          <ul className="mt-2 space-y-1 text-sm text-gray-300">
            <li><strong className="text-white">Order:</strong> models with the best record against their index appear first. {anyScored ? "" : "Nothing has closed yet, so today they are listed alphabetically."}</li>
            <li><strong className="text-white">Confidence</strong> is how sure the model says it is. <strong className="text-white">Conviction</strong> is how strong it rates this idea against everything else it can see.</li>
            <li><strong className="text-white">Why</strong> opens the model&rsquo;s reasoning, the risks it named, and what would make it wrong.</li>
            <li>Several models choosing the same symbol is not proof — they were not told what the others picked, but they can share the same blind spot.</li>
          </ul>
          {leader && leader.scored > 0 && (
            <p className="mt-3 text-sm text-emerald-300">Best record so far: <strong>{leader.model.display_name}</strong>, beating its index by an average of {pct(leader.avgAlpha ?? 0)} over {leader.scored} scored picks.</p>
          )}
        </section>

        {!boards.length && <p className="mt-6 rounded-xl border border-white/10 bg-[#111827] p-5 text-sm text-gray-300">No picks yet. The models pick each weekday at 9:30 AM ET.</p>}

        {boards.map((board) => (
          <section key={board.market} aria-labelledby={`m-${board.market}`} className="mt-8">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id={`m-${board.market}`} className="text-lg font-semibold text-white">{board.label}</h2>
              <p className="text-xs text-gray-400">{board.benchmark ? `Measured against ${board.benchmark}` : ""}</p>
            </div>
            {board.pilot && (
              <p className="mt-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-100 ring-1 ring-amber-500/25">
                First run — these picks were made before the engine recorded each market&rsquo;s index price, so they are shown for their reasoning but excluded from the standings. Scored picks begin Monday.
              </p>
            )}
            {board.agreement && (
              <p className="mt-2 rounded-lg bg-sky-500/10 px-3 py-2 text-xs text-sky-100 ring-1 ring-sky-500/25">
                {board.agreement.count} of {board.picks.length} models independently chose <strong>{board.agreement.symbol}</strong>.
              </p>
            )}
            <ul className="mt-3 space-y-3">
              {board.picks.map((p, i) => (
                <li key={p.id} className={`rounded-xl border bg-[#111827] p-4 ${i === 0 && p.record.scored > 0 ? "border-emerald-500/40" : "border-white/10"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: p.model.color ?? "#64748b" }} />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-white">{p.model.display_name}</p>
                        <p className="truncate text-xs text-gray-400">
                          {p.record.scored > 0
                            ? `${p.record.scored} scored · beats its index by ${pct(p.record.avgAlpha ?? 0)} on average`
                            : "No scored picks yet"}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xl font-bold leading-none text-white">{p.symbol}</p>
                      <p className="mt-1 text-xs text-gray-400">{money(p.entry)}</p>
                    </div>
                  </div>

                  <dl className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="rounded-lg bg-black/30 py-2"><dt className="text-gray-400">Confidence</dt><dd className="mt-0.5 font-semibold text-white">{p.confidence}%</dd></div>
                    <div className="rounded-lg bg-black/30 py-2"><dt className="text-gray-400">Conviction</dt><dd className="mt-0.5 font-semibold text-white">{p.conviction ?? "—"}{p.conviction ? "/10" : ""}</dd></div>
                    <div className="rounded-lg bg-black/30 py-2"><dt className="text-gray-400">Target</dt><dd className="mt-0.5 font-semibold text-white">{money(p.target)}</dd></div>
                    <div className="rounded-lg bg-black/30 py-2"><dt className="text-gray-400">vs index</dt><dd className={`mt-0.5 font-semibold ${(p.alpha ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{p.alpha === null ? "open" : pct(p.alpha)}</dd></div>
                  </dl>

                  <p className="mt-3 text-sm text-gray-200">{p.thesis}</p>

                  <details className="mt-2">
                    <summary className="flex min-h-[2.75rem] cursor-pointer items-center text-sm font-semibold text-sky-300">Why it picked {p.symbol}</summary>
                    <div className="space-y-3 pb-1">
                      {p.keyFactors.length > 0 && (
                        <div><h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Its reasons</h3>
                          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-gray-200">{p.keyFactors.map((f, n) => <li key={n}>{f}</li>)}</ul></div>
                      )}
                      {p.risks.length > 0 && (
                        <div><h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Risks and what would make it wrong</h3>
                          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-amber-200">{p.risks.map((f, n) => <li key={n}>{f}</li>)}</ul></div>
                      )}
                      <p className="text-xs text-gray-400">Stop level {money(p.stop)} · entry recorded {money(p.entry)}</p>
                      {p.sources.length > 0 && (
                        <div><h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Sources it read</h3>
                          <ul className="mt-1 space-y-1 text-sm">{p.sources.map((sc) => <li key={sc.url}><a href={sc.url} target="_blank" rel="noopener noreferrer" className="inline-block py-1 text-sky-300 underline break-words">{sc.title}</a></li>)}</ul></div>
                      )}
                      {p.seal && <p className="text-xs text-gray-500">Sealed when made · SHA-256 {p.seal.slice(0, 16)}…</p>}
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <p className="mt-8 flex flex-wrap gap-4 text-sm">
          <Link href="/leaderboard" className="inline-flex min-h-[2.75rem] items-center text-sky-300 underline">Standings →</Link>
          <Link href="/results" className="inline-flex min-h-[2.75rem] items-center text-sky-300 underline">Closed results →</Link>
          <Link href="/how-it-works" className="inline-flex min-h-[2.75rem] items-center text-sky-300 underline">How it works →</Link>
        </p>
      </main>
      <MarketDisclaimer />
    </>
  );
}
