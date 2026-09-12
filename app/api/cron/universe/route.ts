// app/api/cron/universe/route.ts
// Purpose: build the day's investable universes before the models pick, so the battle
//   never pays that cost and never starts without them.
// Date: 2026-09-12
//
// Runs at 9:15 AM ET, fifteen minutes ahead of the battle.
//
// CR AudioViz AI, LLC · EIN 39-3646201
import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { secretKey, supabaseUrl } from "@craudioviz/platform-sdk";
import { getUniverse, type UniverseCategory } from "@/lib/market/universe";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

const CATEGORIES: UniverseCategory[] = ["sp500", "nasdaq", "dow", "penny", "crypto"];

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET ?? "";
  const got = Buffer.from((req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, ""));
  const want = Buffer.from(secret);
  if (!secret || got.length !== want.length) return false;
  return timingSafeEqual(new Uint8Array(got), new Uint8Array(want));
}

export async function GET(req: Request): Promise<NextResponse> {
  if (!authorized(req)) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  const url = supabaseUrl();
  const key = secretKey();
  if (!url || !key) return NextResponse.json({ ok: false, error: "Database unavailable" }, { status: 503 });
  const db = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  const snapshotDate = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date());

  const built: Record<string, number> = {};
  const errors: string[] = [];
  for (const category of CATEGORIES) {
    try {
      const rows = await getUniverse(db, category, snapshotDate);
      built[category] = rows.length;
    } catch (e) {
      errors.push(`${category}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  console.info(JSON.stringify({ level: "info", msg: "market.universe_built", snapshotDate, built, errors }));
  return NextResponse.json({ ok: errors.length === 0, snapshotDate, built, errors });
}
