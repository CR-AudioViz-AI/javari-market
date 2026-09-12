// 2026-09-11: RETIRED. This route created and seeded `market_oracle_*`, the parallel
// pick system that was replaced by the Javari-run battle writing to `stock_picks`.
// Re-running it would recreate the dead tables, so it now refuses.
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ success: false, error: 'Retired: the market_oracle_* tables were removed on 2026-09-11.' }, { status: 410 });
}

export async function POST(): Promise<NextResponse> {
  return NextResponse.json({ success: false, error: 'Retired: the market_oracle_* tables were removed on 2026-09-11.' }, { status: 410 });
}
