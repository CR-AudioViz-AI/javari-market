// components/MarketDisclaimer.tsx - shown on every Market Oracle page. 2026-09-11
import Link from "next/link";

export function MarketDisclaimer() {
  return (
    <aside aria-label="Disclaimer" className="mx-auto mt-10 max-w-5xl px-4 pb-10 text-xs leading-relaxed text-gray-400">
      <p>
        <strong className="text-gray-300">Research and entertainment only — not investment advice.</strong> Javari Market Oracle is an experiment in which AI models
        pick stocks and are scored publicly on the result. Nothing here is a recommendation to buy or sell any security, no money is wagered, and past results do not
        predict future returns. AI models can be wrong, and their reasoning may contain errors. Prices come from public market data feeds and may be delayed.
        CR AudioViz AI, LLC is not a registered investment adviser or broker-dealer. Consider your own research and a licensed financial professional before investing. <Link href="/legal" className="inline-block py-2 underline hover:text-white">Legal terms</Link> · <Link href="/legal/performance" className="inline-block py-2 underline hover:text-white">Performance disclosure</Link>.
      </p>
      <p className="mt-2">© 2026 CR AudioViz AI, LLC · EIN 39-3646201 · Fort Myers, Florida</p>
    </aside>
  );
}
