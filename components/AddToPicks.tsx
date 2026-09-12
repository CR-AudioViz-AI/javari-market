// components/AddToPicks.tsx
// Purpose: add the symbol you are looking at to your picks, from the research page.
// Date: 2026-09-12
//
// Roy, 12 Sep 2026: if a pick already exists for that market, say so, show which one,
// and let the person replace it or keep what they have. Never overwrite silently - a
// pick is a decision, and quietly replacing one is how people lose trust in a scoreboard.
//
// CR AudioViz AI, LLC · EIN 39-3646201
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getAccessToken, signIn } from "@/lib/auth/access-token";

type Phase = "loading" | "signed-out" | "ready" | "saving" | "saved" | "locked";

export function AddToPicks({ market, marketLabel, symbol, name }: { market: string; marketLabel: string; symbol: string; name: string | null }) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [existing, setExisting] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState("");
  const [lockLabel, setLockLabel] = useState("");

  const load = useCallback(async () => {
    const token = await getAccessToken();
    if (!token) { setPhase("signed-out"); return; }
    try {
      const res = await fetch("/api/player", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
      if (res.status === 401) { setPhase("signed-out"); return; }
      const json = (await res.json()) as { ok: boolean; day: { lockAt: string; locked: boolean }; picks: Record<string, { symbol: string }> };
      if (!json.ok) { setMessage("Could not check your picks"); setPhase("ready"); return; }
      setExisting(json.picks?.[market]?.symbol ?? null);
      setLockLabel(new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", weekday: "short", hour: "numeric", minute: "2-digit", timeZoneName: "short" }).format(new Date(json.day.lockAt)));
      setPhase(json.day.locked ? "locked" : "ready");
    } catch {
      setMessage("Could not check your picks");
      setPhase("ready");
    }
  }, [market]);

  useEffect(() => { void load(); }, [load]);

  async function save(): Promise<void> {
    setPhase("saving"); setMessage("");
    try {
      const token = await getAccessToken();
      if (!token) { setPhase("signed-out"); return; }
      const res = await fetch("/api/player", {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ picks: [{ category: market, symbol }] }),
      });
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (!json.ok) { setMessage(json.error ?? "Could not save that pick"); setPhase("ready"); return; }
      setExisting(symbol); setConfirming(false); setPhase("saved");
    } catch {
      setMessage("Could not save that pick"); setPhase("ready");
    }
  }

  function request(): void {
    if (existing && existing !== symbol) { setConfirming(true); return; }
    void save();
  }

  if (phase === "loading") return <p className="mt-4 text-sm text-gray-400" role="status">Checking your picks…</p>;

  if (phase === "signed-out") {
    return (
      <div className="mt-4 rounded-xl border border-white/10 bg-[#111827] p-4">
        <p className="text-sm text-gray-200">Sign in with your free account to add {symbol} to your picks and be scored beside the models.</p>
        <button type="button" onClick={() => signIn(`/research/${market}/${symbol}`)} className="mt-3 min-h-[2.75rem] rounded-lg bg-sky-500 px-5 text-sm font-semibold text-[#04121c]">Sign in or create a free account</button>
      </div>
    );
  }

  if (phase === "locked") {
    return <p className="mt-4 rounded-lg border border-white/10 bg-[#111827] px-4 py-3 text-sm text-gray-300">Picks are locked for this session{existing ? ` — your ${marketLabel} pick is ${existing}.` : "."} The next session opens after the close.</p>;
  }

  return (
    <div className="mt-4 rounded-xl border border-sky-500/30 bg-sky-500/5 p-4">
      {!confirming ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 text-sm">
            <p className="text-gray-100">
              {existing === symbol
                ? <><strong>{symbol}</strong> is your {marketLabel} pick.</>
                : existing
                  ? <>Your {marketLabel} pick is currently <strong>{existing}</strong>.</>
                  : <>You have no {marketLabel} pick yet.</>}
            </p>
            <p className="text-xs text-gray-400">{phase === "saved" ? `Saved. Change it any time before ${lockLabel}.` : `Picks lock ${lockLabel}.`} {message}</p>
          </div>
          <button type="button" onClick={request} disabled={phase === "saving" || existing === symbol}
            className="min-h-[2.75rem] shrink-0 rounded-lg bg-sky-500 px-5 text-sm font-semibold text-[#04121c] disabled:opacity-40">
            {existing === symbol ? "Already picked" : phase === "saving" ? "Adding…" : `Add ${symbol} to my picks`}
          </button>
        </div>
      ) : (
        <div role="alertdialog" aria-labelledby="replace-h">
          <h2 id="replace-h" className="font-semibold text-white">You already have a {marketLabel} pick</h2>
          <p className="mt-1 text-sm text-gray-200">
            One pick per market per session. Your current pick is <strong className="text-white">{existing}</strong>.
            Replace it with <strong className="text-white">{symbol}</strong>{name ? ` (${name})` : ""}?
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={() => void save()} className="min-h-[2.75rem] rounded-lg bg-sky-500 px-4 text-sm font-semibold text-[#04121c]">
              Replace with {symbol}
            </button>
            <button type="button" onClick={() => setConfirming(false)} className="min-h-[2.75rem] rounded-lg px-4 text-sm text-gray-200 ring-1 ring-white/20">
              Keep {existing}
            </button>
            <Link href="/my-picks" className="inline-flex min-h-[2.75rem] items-center px-2 text-sm text-sky-300 underline">See all my picks</Link>
          </div>
        </div>
      )}
    </div>
  );
}
