// app/api/cron/daily-battle/route.ts
// Purpose: the daily AI battle - six named free AI models each pick one stock through
//   Javari. Runs weekdays at 9:30 AM ET (market open + 30 minutes) via Vercel Cron.
// Date: 2026-09-11 (rewritten)
//
// What changed on 2026-09-11 (Roy): the six invented personas ran on only three models,
// two of them the same, and this route called OpenAI, Anthropic and Google directly with
// its own keys. It now holds no provider key: every call goes through Javari's door, so
// she logs each one and learns from the outcome. The engine lives in lib/market/battle.ts.
//
// Only the scheduler (or an operator holding CRON_SECRET) may run it.
//
// CR AudioViz AI, LLC · EIN 39-3646201
import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { secretKey, supabaseUrl } from "@craudioviz/platform-sdk";
import { runDailyBattle } from "@/lib/market/battle";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET ?? "";
  const got = Buffer.from((req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, ""));
  const want = Buffer.from(secret);
  if (!secret || got.length !== want.length) return false;
  return timingSafeEqual(new Uint8Array(got), new Uint8Array(want));
}

export async function GET(req: Request): Promise<NextResponse> {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = supabaseUrl();
  const key = secretKey();
  if (!url || !key) {
    console.error(JSON.stringify({ level: "error", msg: "market.battle.no_db_credentials" }));
    return NextResponse.json({ ok: false, error: "Database credentials unavailable" }, { status: 503 });
  }
  const db = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  try {
    const report = await runDailyBattle(db, new Date());
    console.info(JSON.stringify({ level: "info", msg: "market.battle.done", report }));
    return NextResponse.json({ ok: report.errors.length === 0, report });
  } catch (e) {
    console.error(JSON.stringify({ level: "error", msg: "market.battle.failed", error: e instanceof Error ? e.message : String(e) }));
    return NextResponse.json({ ok: false, error: "Battle failed" }, { status: 500 });
  }
}
