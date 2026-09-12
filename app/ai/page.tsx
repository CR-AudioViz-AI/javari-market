// app/ai/page.tsx
// Purpose: the index of competing models. /ai/[slug] existed but /ai itself 404'd, so
//   every link to the section dead-ended.
// Date: 2026-09-12
//
// CR AudioViz AI, LLC · EIN 39-3646201
import Link from "next/link";
import { getActiveModels, getStandings } from "@/lib/market/data";
import { MarketNav } from "@/components/MarketNav";
import { MarketDisclaimer } from "@/components/MarketDisclaimer";

export const dynamic = "force-dynamic";

export default async function AiIndex() {
  const [models, standings] = await Promise.all([getActiveModels(), getStandings()]);
  const byId = new Map(standings.map((s) => [s.model.id, s]));
  return (
    <>
      <MarketNav current="/" />
      <main id="main" className="mx-auto max-w-5xl px-3 py-5 sm:px-4">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">The models</h1>
        <p className="mt-1 text-sm text-gray-300">Six AI models compete here. Each reads the same research and makes one pick a day.</p>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {models.map((m) => {
            const s = byId.get(m.id);
            return (
              <li key={m.id} className="rounded-xl border border-white/10 bg-[#111827] p-4">
                <Link href={`/ai/${m.slug ?? m.id}`} className="flex min-h-[2.75rem] items-center gap-2 font-semibold text-white hover:underline">
                  <span aria-hidden className="h-3 w-3 rounded-full" style={{ background: m.color ?? "#64748b" }} />
                  {m.display_name}
                </Link>
                <p className="mt-1 text-xs text-gray-400">{m.provider}</p>
                {m.tagline && <p className="mt-2 text-sm text-gray-300">{m.tagline}</p>}
                <dl className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-lg bg-black/30 py-2"><dt className="text-gray-400">Win rate</dt><dd className="mt-0.5 font-semibold text-white">{s?.winRate === null || s === undefined ? "—" : `${s.winRate.toFixed(0)}%`}</dd></div>
                  <div className="rounded-lg bg-black/30 py-2"><dt className="text-gray-400">Closed</dt><dd className="mt-0.5 font-semibold text-white">{s ? `${s.wins}–${s.losses}` : "—"}</dd></div>
                  <div className="rounded-lg bg-black/30 py-2"><dt className="text-gray-400">Open</dt><dd className="mt-0.5 font-semibold text-white">{s?.open ?? 0}</dd></div>
                </dl>
              </li>
            );
          })}
        </ul>
      </main>
      <MarketDisclaimer />
    </>
  );
}
