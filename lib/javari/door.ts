// lib/javari/door.ts
// Purpose: this app's ONLY path to an AI or to web research - Javari's server door on
//   craudiovizai.com. Each contestant is pinned to its own model; Javari applies her
//   guards, rate limits and budget, logs every call, and learns from the outcome this
//   app reports back when a pick is scored.
// Date: 2026-09-11
//
// This app holds no AI provider key and no search key. Replaces the direct OpenAI,
// Anthropic and Google calls that lived in ten files.
//
// CR AudioViz AI, LLC · EIN 39-3646201
import "server-only";
import { z } from "zod";

const APP_ID = "javari-market";

const GenerateOk = z.object({
  ok: z.literal(true),
  requestId: z.string().uuid(),
  text: z.string(),
  citations: z.array(z.object({ url: z.string(), title: z.string().nullable() })),
  costUsd: z.number().nullable(),
});
const Err = z.object({ ok: z.literal(false), requestId: z.string().optional(), code: z.string().optional(), error: z.string().optional(), retryAfterSeconds: z.number().optional() });
const ResearchOk = z.object({ ok: z.literal(true), results: z.array(z.object({ title: z.string(), url: z.string(), content: z.string(), publishedAt: z.string().nullable() })) });

export type GenerateResult =
  | { ok: true; requestId: string; text: string; citations: { url: string; title: string | null }[] }
  | { ok: false; requestId: string | null; code: string; error: string; retryable: boolean; retryAfterSeconds: number | null };

function doorUrl(): string {
  return (process.env.JAVARI_DOOR_URL?.trim() || "https://craudiovizai.com").replace(/\/$/, "");
}

function headers(): Record<string, string> {
  const key = process.env.JAVARI_MARKET_CALLER_KEY?.trim();
  if (!key) throw new Error("Missing JAVARI_MARKET_CALLER_KEY");
  return { "Content-Type": "application/json", "x-javari-app": APP_ID, Authorization: `Bearer ${key}` };
}

const NOT_RETRYABLE = new Set(["budget_exceeded", "model_not_allowed", "purpose_not_allowed", "blocked", "unsupported"]);

export async function javariGenerate(input: {
  purpose: string;
  model: string;
  system: string;
  user: string;
  maxOutputTokens: number;
  reasoningEffort?: "low" | "medium" | "high" | null;
  timeoutMs: number;
}): Promise<GenerateResult> {
  try {
    const res = await fetch(`${doorUrl()}/api/javari/v1/generate`, {
      method: "POST",
      headers: headers(),
      cache: "no-store",
      signal: AbortSignal.timeout(input.timeoutMs),
      body: JSON.stringify({
        purpose: input.purpose,
        model: input.model,
        maxOutputTokens: input.maxOutputTokens,
        ...(input.reasoningEffort ? { reasoningEffort: input.reasoningEffort } : {}),
        messages: [
          { role: "system", content: input.system },
          { role: "user", content: input.user },
        ],
      }),
    });
    const json: unknown = await res.json().catch(() => null);
    const ok = GenerateOk.safeParse(json);
    if (res.ok && ok.success) return { ok: true, requestId: ok.data.requestId, text: ok.data.text, citations: ok.data.citations };
    const err = Err.safeParse(json);
    const code = err.success ? (err.data.code ?? `http_${res.status}`) : `http_${res.status}`;
    return {
      ok: false,
      requestId: err.success ? (err.data.requestId ?? null) : null,
      code,
      error: err.success ? (err.data.error ?? `HTTP ${res.status}`) : `HTTP ${res.status}`,
      retryable: !NOT_RETRYABLE.has(code) && res.status !== 401,
      retryAfterSeconds: err.success ? (err.data.retryAfterSeconds ?? null) : null,
    };
  } catch (e) {
    const timeout = e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError");
    return { ok: false, requestId: null, code: timeout ? "client_timeout" : "network", error: e instanceof Error ? e.message : String(e), retryable: true, retryAfterSeconds: null };
  }
}

export async function javariResearch(query: string, maxResults: number, days: number): Promise<{ title: string; url: string; content: string }[]> {
  const res = await fetch(`${doorUrl()}/api/javari/v1/research`, {
    method: "POST",
    headers: headers(),
    cache: "no-store",
    signal: AbortSignal.timeout(40_000),
    body: JSON.stringify({ purpose: "market_research", query, maxResults, days, topic: "news" }),
  });
  const json: unknown = await res.json().catch(() => null);
  const ok = ResearchOk.safeParse(json);
  if (!res.ok || !ok.success) throw new Error(`Javari research failed (${res.status})`);
  return ok.data.results.map((r) => ({ title: r.title, url: r.url, content: r.content }));
}

/** Tell Javari how a pick turned out, so she learns which model reads markets best. */
export async function javariOutcome(requestId: string, outcome: "accepted" | "corrected" | "failed", notes: string): Promise<boolean> {
  try {
    const res = await fetch(`${doorUrl()}/api/javari/v1/outcome`, {
      method: "POST", headers: headers(), cache: "no-store", signal: AbortSignal.timeout(15_000),
      body: JSON.stringify({ requestId, outcome, notes: notes.slice(0, 2000) }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
