// app/legal/performance/page.tsx
// Purpose: the performance disclosure - exactly how every number on this site is
//   calculated, and every cost it leaves out.
// Date: 2026-09-12
//
// Why this page exists: the established research publishers (Zacks, Seeking Alpha,
// Danelfin) all carry a separate, specific performance disclosure rather than a single
// line of small print - because a percentage shown next to a stock reads as an
// achievable return unless you say plainly that it is not one.
//
// NOT REVIEWED BY COUNSEL. See the note in app/legal/page.tsx.
//
// CR AudioViz AI, LLC · EIN 39-3646201
import Link from "next/link";
import { MarketNav } from "@/components/MarketNav";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Performance disclosure — Javari Market Oracle",
  description: "How results on Javari Market Oracle are calculated, and what they exclude.",
};

export default function PerformanceDisclosure() {
  return (
    <>
      <MarketNav current="/legal" />
      <main id="main" className="mx-auto max-w-3xl px-3 py-5 sm:px-4">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Performance disclosure</h1>
        <p className="mt-2 text-sm text-gray-400">Last updated September 12, 2026.</p>

        <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
          <p className="text-sm font-semibold text-amber-100">Every performance figure on this site is hypothetical. No trade is ever placed, no account is ever used, and no investor could have obtained these results.</p>
        </div>

        <section className="mt-8">
          <h2 className="text-lg font-semibold text-white">How a result is calculated</h2>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-gray-300">
            <li>Each weekday, every active model names one symbol. The price at that moment is recorded as the entry price.</li>
            <li>Prices are refreshed after the close each weekday from public market data feeds.</li>
            <li>A prediction closes when the price reaches the model's target, reaches its stop level, or seven days pass — whichever happens first.</li>
            <li>The return is the difference between the recorded entry price and the recorded closing price, expressed as a percentage.</li>
            <li>A prediction counts as correct only if it closed above the entry price. Win rate counts closed predictions only.</li>
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-semibold text-white">What these figures leave out</h2>
          <p className="mt-2 text-sm text-gray-300">Because no trade is placed, none of the costs and frictions of real investing are reflected:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-300">
            <li>commissions and fees</li>
            <li>the bid-ask spread — a real buyer pays the ask, not the recorded price</li>
            <li>slippage and the price impact of the order itself</li>
            <li>the inability to transact at a recorded price, particularly at an open, a close, or in a fast market</li>
            <li>taxes of any kind</li>
            <li>dividends, financing and borrowing costs</li>
            <li>position sizing and risk management, which determine what a percentage is actually worth</li>
          </ul>
          <p className="mt-3 text-sm text-gray-300">A real portfolio built on these predictions would have returned less, and possibly much less.</p>
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-semibold text-white">What the numbers do and don't mean</h2>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-gray-300">
            <li><strong className="text-white">Win rate</strong> is the share of a model's closed predictions that finished above the entry price. It says nothing about the size of gains or losses.</li>
            <li><strong className="text-white">Total return</strong> is the sum of the percentages of closed predictions. It is not compounded, not weighted by position size, and not the return of any portfolio.</li>
            <li><strong className="text-white">Confidence</strong> is the model's own stated number. It is not a probability, not calibrated, and not verified by us.</li>
            <li><strong className="text-white">Target and stop levels</strong> are the model's stated levels, not price forecasts we endorse.</li>
            <li>Small sample sizes are easy to misread. A handful of predictions cannot distinguish skill from luck.</li>
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-semibold text-white">No backtesting</h2>
          <p className="mt-2 text-sm text-gray-300">Every result published here was recorded forward in time: the prediction was published before the outcome was known. We do not publish backtested or simulated histories, and no result here was produced by applying a model to past data after the fact.</p>
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-semibold text-white">Retired models and changes</h2>
          <p className="mt-2 text-sm text-gray-300">Models can be retired when a provider withdraws them or a free tier ends. Their past predictions stay in the record with their original attribution, and are excluded from the current standings. Changes to how results are measured will be noted here with the date.</p>
        </section>

        <p className="mt-10 text-sm text-gray-300">
          Nothing here is investment advice. See the <Link href="/legal" className="inline-flex min-h-[2.75rem] items-center text-sky-300 underline">full legal terms</Link>.
        </p>
      </main>
      <footer className="mx-auto max-w-3xl px-4 pb-10 text-xs text-gray-500">
        <p>© 2026 CR AudioViz AI, LLC · EIN 39-3646201 · Fort Myers, Florida</p>
      </footer>
    </>
  );
}
