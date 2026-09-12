// app/my-picks/page.tsx
// Purpose: your own picks, scored the same way the models are.
// Date: 2026-09-12
//
// CR AudioViz AI, LLC · EIN 39-3646201
import { MarketNav } from "@/components/MarketNav";
import { MarketDisclaimer } from "@/components/MarketDisclaimer";
import { MyPicksPanel } from "@/components/MyPicksPanel";

export const dynamic = "force-dynamic";

export default function MyPicks() {
  return (
    <>
      <MarketNav current="/my-picks" />
      <main id="main" className="mx-auto max-w-3xl px-3 py-5 sm:px-4">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">My picks</h1>
        <p className="mt-1 text-sm text-gray-300">
          Pick one symbol in each of the five markets. Your entry price is recorded from the same feeds the models use, and you are scored the same way they are:
          against your market&rsquo;s index over seven days. Free, and no money is involved.
        </p>
        <MyPicksPanel />
      </main>
      <MarketDisclaimer />
    </>
  );
}
