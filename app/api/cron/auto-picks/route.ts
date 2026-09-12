// app/api/cron/auto-picks/route.ts
// Purpose: RETIRED. Picks are made by the daily battle through Javari.
// Date: 2026-09-12
//
// What this was: a second scheduled pick generator, running at 9:35 AM ET - five minutes
// after the real battle - that called Groq and OpenRouter DIRECTLY with its own keys and
// wrote to `ai_picks`, a table nothing reads (0 rows). It would have produced a parallel
// set of picks every weekday alongside the real ones, with no research pack, no
// benchmark, no seal, and no record in Javari's log.
//
// The contest has one pick path: lib/market/battle.ts via /api/cron/daily-battle.
//
// CR AudioViz AI, LLC · EIN 39-3646201
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const RETIRED = {
  success: false,
  error: "Retired on 2026-09-12. Picks are made by /api/cron/daily-battle through Javari.",
};

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(RETIRED, { status: 410 });
}

export async function POST(): Promise<NextResponse> {
  return NextResponse.json(RETIRED, { status: 410 });
}
