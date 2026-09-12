// components/MyPicksPanel.tsx
// Purpose: make your own picks - one symbol in each of the five markets, saved the
//   moment you tap, changeable until 9:30 AM ET and frozen after.
// Date: 2026-09-12
//
// Built the way the NFL app works, because it works: tap to pick, the save happens
// immediately with its own confirmation, and nothing depends on finding a save button.
//
// CR AudioViz AI, LLC · EIN 39-3646201
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getAccessToken, signIn } from "@/lib/auth/access-token";

type Sym = { symbol: string; name: string | null; price: number | null };
type Universe = Record<string, { label: string; symbols: Sym[] }>;
type Day = { pickDate: string; lockAt: string; locked: boolean };
type Phase =
  | { kind: "loading" }
  | { kind: "signed-out" }
  | { kind: "no-handle" }
  | { kind: "ready"; handle: string };

const ORDER = ["sp500", "nasdaq", "dow", "penny", "crypto"];

export function MyPicksPanel() {
  const [phase, setPhase] = useState<Phase>({ kind: "loading" });
  const [day, setDay] = useState<Day | null>(null);
  const [universe, setUniverse] = useState<Universe>({});
  const [picks, setPicks] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Record<string, "saving" | "saved" | "error">>({});
  const [message, setMessage] = useState("");
  // 2026-09-12: the universes are now the real indices (500+ symbols), so each market
  // gets a search box instead of a row of buttons.
  const [query, setQuery] = useState<Record<string, string>>({});
  const [handle, setHandle] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const token = await getAccessToken();
    if (!token) { setPhase({ kind: "signed-out" }); return; }
    try {
      const res = await fetch("/api/player", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
      if (res.status === 401) { setPhase({ kind: "signed-out" }); return; }
      const json = (await res.json()) as { ok: boolean; day: Day; profile: { handle: string; displayName: string } | null; picks: Record<string, { symbol: string }>; universe: Universe };
      if (!json.ok) { setMessage("Could not load your picks"); return; }
      setDay(json.day);
      setUniverse(json.universe);
      setPicks(Object.fromEntries(Object.entries(json.picks).map(([k, v]) => [k, v.symbol])));
      setPhase(json.profile ? { kind: "ready", handle: json.profile.handle } : { kind: "no-handle" });
    } catch {
      setMessage("Could not load your picks");
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function createAccount(): Promise<void> {
    setBusy(true); setMessage("Creating your account…");
    try {
      const token = await getAccessToken();
      if (!token) { setPhase({ kind: "signed-out" }); return; }
      const res = await fetch("/api/player", {
        method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ handle: handle.trim().toLowerCase(), displayName: displayName.trim() || handle.trim() }),
      });
      const json = (await res.json()) as { ok: boolean; error?: string; profile?: { handle: string } };
      if (json.ok && json.profile) { setPhase({ kind: "ready", handle: json.profile.handle }); setMessage("You're in. Now make your picks."); }
      else setMessage(json.error ?? "Could not create your account");
    } catch {
      setMessage("Could not create your account");
    } finally {
      setBusy(false);
    }
  }

  async function choose(market: string, symbol: string): Promise<void> {
    if (day?.locked) return;
    if (phase.kind === "signed-out") { setMessage("Sign in free to make picks."); return; }
    if (phase.kind === "no-handle") { setMessage("Create your account first — it takes one tap."); return; }
    if (phase.kind !== "ready" || picks[market] === symbol) return;
    const before = picks[market];
    setPicks((p) => ({ ...p, [market]: symbol }));
    setStatus((s) => ({ ...s, [market]: "saving" }));
    setMessage("");
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("Your session ended — sign in again.");
      const res = await fetch("/api/player", {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ picks: [{ category: market, symbol }] }),
      });
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (!json.ok) throw new Error(json.error ?? "Could not save that pick");
      setStatus((s) => ({ ...s, [market]: "saved" }));
    } catch (e) {
      setPicks((p) => { const n = { ...p }; if (before) n[market] = before; else delete n[market]; return n; });
      setStatus((s) => ({ ...s, [market]: "error" }));
      setMessage(e instanceof Error ? e.message : "Could not save that pick");
    }
  }

  const lockLabel = day ? new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", weekday: "short", hour: "numeric", minute: "2-digit", timeZoneName: "short" }).format(new Date(day.lockAt)) : "";
  const made = ORDER.filter((m) => picks[m]).length;

  if (phase.kind === "loading") return <p className="mt-4 text-sm text-gray-300" role="status">Loading…</p>;

  if (phase.kind === "signed-out") {
    return (
      <div className="mt-5 rounded-xl border border-white/10 bg-[#111827] p-5">
        <h2 className="font-semibold text-white">Play free against the six AI models</h2>
        <p className="mt-2 text-sm text-gray-300">Sign in with your free CR AudioViz AI account, pick one symbol in each market, and get scored exactly the way the models are — against the index, with your entry price recorded.</p>
        <button type="button" onClick={() => signIn("/my-picks")} className="mt-4 min-h-[2.75rem] rounded-lg bg-sky-500 px-5 text-sm font-semibold text-[#04121c]">Sign in or create a free account</button>
      </div>
    );
  }

  return (
    <>
      {phase.kind === "no-handle" && (
        <div className="mt-5 rounded-xl border border-sky-500/30 bg-sky-500/5 p-5">
          <h2 className="font-semibold text-white">Choose your handle</h2>
          <p className="mt-1 text-sm text-gray-300">This is how you appear on the leaderboard. One step, then you can pick.</p>
          <form onSubmit={(e) => { e.preventDefault(); void createAccount(); }} className="mt-3 space-y-3">
            <div>
              <label htmlFor="handle" className="block text-sm font-medium text-white">Handle</label>
              <input id="handle" required minLength={3} maxLength={20} pattern="[a-zA-Z0-9_]{3,20}" value={handle}
                onChange={(e) => setHandle(e.target.value)} placeholder="e.g. royh"
                className="mt-1 w-full rounded-md bg-black/40 px-3 py-3 text-white ring-1 ring-white/15" autoComplete="username" />
            </div>
            <div>
              <label htmlFor="dname" className="block text-sm font-medium text-white">Display name (optional)</label>
              <input id="dname" maxLength={40} value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                className="mt-1 w-full rounded-md bg-black/40 px-3 py-3 text-white ring-1 ring-white/15" autoComplete="nickname" />
            </div>
            <button type="submit" disabled={busy || handle.trim().length < 3} className="min-h-[2.75rem] rounded-lg bg-sky-500 px-5 text-sm font-semibold text-[#04121c] disabled:opacity-50">
              {busy ? "Creating…" : "Create my account"}
            </button>
            <p className="text-sm text-gray-200" role="status" aria-live="polite">{message}</p>
          </form>
        </div>
      )}

      <div className="mt-5 flex items-center gap-3 rounded-xl border border-sky-500/30 bg-sky-500/5 px-4 py-3">
        <div className="min-w-0 flex-1 text-sm">
          <p className="text-gray-100">
            {day?.locked ? `Locked ${lockLabel}` : <><strong>{made}</strong> of 5 markets picked · each tap saves</>}
          </p>
          <p className="truncate text-xs text-gray-400" role="status" aria-live="polite">
            {message || (day?.locked ? "Picks reopen tomorrow morning." : `Change any pick until ${lockLabel}`)}
          </p>
        </div>
        {phase.kind === "ready" && <span className="shrink-0 text-xs text-gray-300">@{phase.handle}</span>}
      </div>

      <div className="mt-4 space-y-4">
        {ORDER.filter((m) => universe[m]).map((market) => {
          const u = universe[market];
          if (!u) return null;
          return (
            <fieldset key={market} disabled={day?.locked} className="rounded-xl border border-white/10 bg-[#111827] p-4">
              <legend className="px-1 text-sm font-semibold text-white">{u.label}</legend>
              <p className="min-h-[1.25rem] text-xs" aria-live="polite">
                {status[market] === "saving" && <span className="text-gray-400">Saving…</span>}
                {status[market] === "saved" && <span className="text-emerald-300">Saved ✓ {picks[market]}</span>}
                {status[market] === "error" && <span className="text-rose-300">Not saved — try again</span>}
                {!status[market] && picks[market] && <span className="text-gray-400">Your pick: {picks[market]}</span>}
              </p>
              <label className="sr-only" htmlFor={`q-${market}`}>Search {u.label}</label>
              <input
                id={`q-${market}`}
                type="search"
                inputMode="search"
                value={query[market] ?? ""}
                onChange={(e) => setQuery((q) => ({ ...q, [market]: e.target.value }))}
                placeholder={`Search ${u.symbols.length} — ticker or company name`}
                className="mt-2 w-full rounded-md bg-black/40 px-3 py-3 text-white ring-1 ring-white/15"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {(() => {
                  const q = (query[market] ?? "").trim().toUpperCase();
                  // 2026-09-12: ticker OR company name, with the closest matches first -
                  // typing "apple" should put AAPL at the front, not bury it behind every
                  // company whose name happens to contain the word.
                  const score = (x: Sym): number => {
                    const name = (x.name ?? "").toUpperCase();
                    if (x.symbol === q) return 0;
                    if (x.symbol.startsWith(q)) return 1;
                    if (name.startsWith(q)) return 2;
                    if (name.split(/[^A-Z0-9]+/).some((w) => w.startsWith(q))) return 3;
                    if (x.symbol.includes(q)) return 4;
                    if (name.includes(q)) return 5;
                    return 99;
                  };
                  const matches = q
                    ? u.symbols
                        .map((x) => ({ x, s: score(x) }))
                        .filter((m) => m.s < 99)
                        .sort((a, b) => a.s - b.s || a.x.symbol.localeCompare(b.x.symbol))
                        .slice(0, 24)
                        .map((m) => m.x)
                    : u.symbols.slice(0, 12);
                  if (!matches.length) return <p className="text-sm text-gray-400">Nothing in {u.label} matches “{query[market]}”.</p>;
                  return matches.map((x) => (
                    <button key={x.symbol} type="button" onClick={() => void choose(market, x.symbol)} aria-pressed={picks[market] === x.symbol}
                      title={x.name ?? x.symbol}
                      className={`flex min-h-[2.75rem] flex-col justify-center rounded-lg px-3 py-1 text-left text-sm ring-1 ${picks[market] === x.symbol ? "bg-sky-500/20 font-semibold text-white ring-2 ring-sky-400" : "text-gray-200 ring-white/15 active:bg-white/10"}`}>
                      <span className="flex items-baseline gap-1">
                        <span className="font-semibold">{x.symbol}</span>
                        {x.price !== null && <span className="text-xs text-gray-400">{x.price < 10 ? x.price.toFixed(2) : Math.round(x.price)}</span>}
                      </span>
                      {x.name && <span className="max-w-[11rem] truncate text-[11px] text-gray-400">{x.name}</span>}
                    </button>
                  ));
                })()}
              </div>
              {!(query[market] ?? "").trim() && u.symbols.length > 12 && (
                <p className="mt-1 text-xs text-gray-400">Showing 12 of {u.symbols.length}. Search to reach any of them.</p>
              )}
            </fieldset>
          );
        })}
      </div>

      <p className="mt-5 text-sm">
        <Link href="/leaderboard" className="inline-flex min-h-[2.75rem] items-center text-sky-300 underline">See how you rank against the models →</Link>
      </p>
    </>
  );
}
