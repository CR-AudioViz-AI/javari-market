import { readBody } from '@/lib/api/body';
import { rateLimit } from '@/lib/api/rate-limit';
// app/api/outcomes/route.ts
// Market Oracle Ultimate - Outcome Tracking API
// Created: December 14, 2025
// Purpose: Process expired picks and track outcomes for learning

import { NextRequest, NextResponse } from 'next/server';
import { 
  processExpiredPicks, 
  getPendingPicksStatus,
  forceResolvePick 
} from '@/lib/learning/outcome-tracker';
import { secretKey, supabaseUrl } from "@craudioviz/platform-sdk";

// ⚠️ _supabase MUST be declared before getSupabase() — TDZ guard
let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  // 2026-08-19: this function was CORRUPTED in 27 files, byte-identically.
  // `return _supabase;` had been spliced into the middle of the options object:
  //
  //   return sb.createClient(url, key, { auth: { persistSession: false   return _supabase;
  //   } })
  //
  // The repo did not compile - 102 type errors across 29 files - and every route
  // using it threw "supabase is not defined". javarimarket.com kept serving only
  // because Vercel holds the last successful build; the next push would have
  // failed and stayed failed.
  //
  // Now caches properly, which is what _supabase was always for, and pins
  // no-store: Next 14 caches PostgREST GETs by URL and serves stale rows.
  if (_supabase) return _supabase;
  const sb = require('@supabase/supabase-js');
  const url = supabaseUrl();
  const key = secretKey();
  if (!url || !key) return null;
  _supabase = sb.createClient(url, key, {
    auth: { persistSession: false },
    global: { fetch: (u: RequestInfo | URL, o?: RequestInit) => fetch(u, { ...o, cache: 'no-store' }) },
  });
  return _supabase;
}


export const maxDuration = 120; // Allow up to 2 minutes for batch processing

// POST: Process expired picks (for cron job)
export async function POST(request: NextRequest) {
  const limited = rateLimit(request);
  if (limited) return limited;

  try {
    const parsed = await readBody<Record<string, unknown>>(request);
    if (!parsed.ok) return parsed.response;
    const { action, pickId } = parsed.body as any;
    
    // Force resolve a specific pick (for testing)
    if (action === 'force-resolve' && pickId) {
      const result = await forceResolvePick(pickId);
      return NextResponse.json({
        success: result.success,
        outcome: result.outcome,
        error: result.error,
        timestamp: new Date().toISOString(),
      });
    }
    
    // Process all expired picks
    const results = await processExpiredPicks();
    
    return NextResponse.json({
      success: true,
      results,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('Error processing outcomes:', error);
    return NextResponse.json(
      { error: 'Failed to process outcomes', details: String(error) },
      { status: 500 }
    );
  }
}

// GET: Get pending picks status
export async function GET() {
  try {
    const status = await getPendingPicksStatus();
    
    return NextResponse.json({
      success: true,
      ...status,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('Error getting pending status:', error);
    return NextResponse.json(
      { error: 'Failed to get pending status', details: String(error) },
      { status: 500 }
    );
  }
}
