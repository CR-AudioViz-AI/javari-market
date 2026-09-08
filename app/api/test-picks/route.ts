import { rateLimit } from '@/lib/api/rate-limit';
// app/api/test-picks/route.ts
// Simple test endpoint for V3
import { NextResponse } from 'next/server';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const limited = rateLimit(request);
  if (limited) return limited;

  // Redirect to the new V3 endpoint
  return NextResponse.json({
    message: 'Test picks endpoint - use /api/market-oracle/generate-picks?trigger=manual for V3',
    redirect: '/api/market-oracle/generate-picks?trigger=manual',
    version: '3.0',
  });
}
