// app/leaderboard/page.tsx
// Purpose: one standings table - the six AI models and every signed-up person, scored
//   on identical terms.
// Date: 2026-09-12 (rebuilt as a single competition)
//
// CR AudioViz AI, LLC · EIN 39-3646201
import Link from "next/link";
import { getCompetition } from "@/lib/market/data";
import { MarketNav } from "@/components/MarketNav";
import { MarketDisclaimer } from "@/components/MarketDisclaimer";

export const dynamic = "force-dynamic";

const pct = (n: number | null, digits = 2): string => (n === null ? "—" : `${n >= 0 ? "+" : ""}${n.toFixed(digits)}%`);

// 2026-09-12: Next 16 passes searchParams as a Promise; reading .week synchronously gave
// undefined, so ?week=... silently showed the all-time table instead of that week.
export default async function Leaderboard({ searchParams }: { searchParams: Promise<{ week?: string }> }) {
  const { week } = await searchParams;
  const { competitors, qualifying } = await getCompetition(week ? { weekStart: week } : {});
  const ranked = competitors.filter((c) => c.qualified);
  const waiting = competitors.filter((c) => !c.qualified);
  const people = competitors.filter((c) => c.kind === "person").length;

  return (
    <>
      <MarketNav current="/leaderboard" />
      <main id="main" className="mx-auto max-w-4xl px-3 py-5 sm:px-4">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Standings</h1>
        <p className="mt-1 text-sm text-gray-300">
          Six AI models and {people === 0 ? "every player" : `${people} ${people === 1 ? "player" : "players"}`}, in one competition on identical terms.
        </p>

        <section aria-labelledby="rules" className="mt-4 rounded-xl border border-white/10 bg-[#111827] p-4">
          <h2 id="rules" className="text-sm font-semibold text-white">The rules, applied to everyone alike</h2>
          <ul className="mt-2 space-y-1 text-sm text-gray-300">
            <li><strong className="text-white">Ranked on average alpha</strong> — how far each pick beat its market&rsquo;s index over the same seven days. Beating the index is the only thing that counts as winning.</li>
            <li><strong className="text-white">Per pick, not per total</strong>, so making more picks earns no advantage.</li>
            <li><strong className="text-white">{qualifying} scored picks to be ranked.</strong> Fewer than that is luck, not a record — models and people wait the same.</li>
            <li><strong className="text-white">Open picks are shown</strong>, so nobody looks better by leaving losers running.</li>
            <li>Everyone signed up is entered. Picks are sealed at 9:30 AM ET and cannot be changed, deleted or withdrawn afterwards.</li>
          </ul>
        </section>

        {!competitors.some((c) => c.scored > 0) && (
          <p className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
            Nothing has been scored yet. The first picks close seven days after they were made, and the table fills in from there.
          </p>
        )}

        {ranked.length > 0 && (
          <div className="mt-5 overflow-x-auto rounded-xl border border-white/10 bg-[#111827]">
            <table className="w-full text-sm">
              <caption className="sr-only">Ranked competitors</caption>
              <thead><tr className="text-left text-xs text-gray-400">
                <th scope="col" className="px-3 py-2">#</th><th scope="col" className="px-2 py-2">Competitor</th>
                <th scope="col" className="whitespace-nowrap px-2 py-2 text-right">vs index</th>
                <th scope="col" className="whitespace-nowrap px-2 py-2 text-right">Beat it</th>
                <th scope="col" className="whitespace-nowrap px-2 py-2 text-right">W–L</th>
                <th scope="col" className="whitespace-nowrap px-2 py-2 text-right">Open</th>
              </tr></thead>
              <tbody>
                {ranked.map((c) => (
                  <tr key={`${c.kind}-${c.id}`} className="border-t border-white/10">
                    <td className="px-3 py-2 text-gray-400">{c.rank}</td>
                    <th scope="row" className="px-2 py-2 text-left font-normal">
                      <span className="flex items-center gap-2">
                        {c.color && <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />}
                        <span className="font-semibold text-white">{c.name}</span>
                        <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-gray-400">{c.kind === "model" ? "AI" : "player"}</span>
                      </span>
                    </th>
                    <td className={`whitespace-nowrap px-2 py-2 text-right font-semibold ${(c.avgAlpha ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{pct(c.avgAlpha)}</td>
                    <td className="whitespace-nowrap px-2 py-2 text-right text-gray-300">{c.beatBenchmark}/{c.scored}</td>
                    <td className="whitespace-nowrap px-2 py-2 text-right text-gray-300">{c.wins}–{c.losses}</td>
                    <td className="whitespace-nowrap px-2 py-2 text-right text-gray-400">{c.open}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {waiting.length > 0 && (
          <section aria-labelledby="waiting" className="mt-6">
            <h2 id="waiting" className="text-lg font-semibold text-white">Not yet ranked</h2>
            <p className="text-sm text-gray-400">In the competition, waiting on {qualifying} scored picks.</p>
            <ul className="mt-3 space-y-2">
              {waiting.map((c) => (
                <li key={`${c.kind}-${c.id}`} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    {c.color && <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: c.color }} />}
                    <span className="truncate text-white">{c.name}</span>
                    <span className="shrink-0 rounded bg-white/5 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-gray-400">{c.kind === "model" ? "AI" : "player"}</span>
                  </span>
                  <span className="shrink-0 text-xs text-gray-400">{c.scored} scored · {c.open} open · needs {Math.max(0, qualifying - c.scored)} more</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="mt-6 text-sm">
          <Link href="/my-picks" className="inline-flex min-h-[2.75rem] items-center text-sky-300 underline">Make your picks and join →</Link>
        </p>
      </main>
      <MarketDisclaimer />
    </>
  );
}
