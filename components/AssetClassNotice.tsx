// components/AssetClassNotice.tsx
// Purpose: honest empty state for an asset class the contest does not currently cover.
// Date: 2026-09-12
//
// These pages used to query asset types nothing writes (the contest covers US stocks),
// so they rendered a permanent spinner or an unexplained blank.
//
// CR AudioViz AI, LLC · EIN 39-3646201
import Link from "next/link";

export function AssetClassNotice({ assetClass }: { assetClass: string }) {
  return (
    <div className="mt-5 rounded-xl border border-white/10 bg-[#111827] p-5">
      <h2 className="font-semibold text-white">No {assetClass} predictions yet</h2>
      <p className="mt-2 text-sm text-gray-300">
        The contest currently covers US stocks only: each weekday every model picks one stock from the same research pack.
        {" "}{assetClass[0]?.toUpperCase()}{assetClass.slice(1)} predictions will appear here if that is added to the daily battle.
      </p>
      <p className="mt-3 text-sm">
        <Link href="/" className="inline-flex min-h-[2.75rem] items-center text-sky-300 underline">See today\u2019s picks</Link>
      </p>
    </div>
  );
}
