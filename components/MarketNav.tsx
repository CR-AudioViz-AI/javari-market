// components/MarketNav.tsx - Market Oracle navigation. Phone-first: one scrollable row
// of 44px tabs, sticky at the top. 2026-09-11
import Link from "next/link";

const LINKS = [
  { href: "/", label: "Today's picks" },
  { href: "/research/sp500", label: "Research" },
  { href: "/my-picks", label: "My picks" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/results", label: "Results" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/legal", label: "Legal" },
];

export function MarketNav({ current }: { current: string }) {
  return (
    // 2026-09-12: sticky works when the app is opened directly. Embedded, the frame is
    // sized to the whole page so nothing scrolls inside it and sticky does nothing - the
    // bar just scrolled away. --embed-scroll-top is how far the site page has scrolled
    // past the frame (set by the platform SDK); translating by it keeps the bar in view.
    <nav aria-label="Javari Market Oracle" className="market-nav sticky top-0 z-30 border-b border-white/10 bg-[#0a0f17]/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-2 sm:px-4">
        <Link href="/" className="hidden shrink-0 py-3 text-lg font-bold tracking-tight text-white sm:block">
          Javari <span className="text-sky-400">Market Oracle</span>
        </Link>
        <ul className="flex flex-1 gap-1 overflow-x-auto py-1.5 text-sm [scrollbar-width:none]">
          {LINKS.map((l) => (
            <li key={l.href} className="shrink-0">
              <Link href={l.href} aria-current={current === l.href || (l.href.startsWith("/research") && current === "/research") ? "page" : undefined}
                className={`inline-flex min-h-[2.75rem] items-center whitespace-nowrap rounded-md px-3 ${current === l.href ? "bg-white/10 font-semibold text-white" : "text-gray-300 hover:bg-white/5 hover:text-white"}`}>
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
        <p className="hidden shrink-0 text-xs text-gray-400 lg:block">Research only · not investment advice</p>
      </div>
    </nav>
  );
}
