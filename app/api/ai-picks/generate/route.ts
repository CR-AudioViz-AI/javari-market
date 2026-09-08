import { rateLimit } from '@/lib/api/rate-limit';
// app/api/ai-picks/generate/route.ts
// Market Oracle Ultimate - Generate AI Picks API
// Updated: December 14, 2025 - Added AI status reporting

import { NextRequest, NextResponse } from 'next/server';
import { generateAllAIPicks, generatePickFromAI } from '@/lib/ai/pick-generator';
import { secretKey, supabaseUrl } from "@craudioviz/platform-sdk";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";


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

export const maxDuration = 120; // Allow up to 2 minutes for multiple AIs

export async function POST(request: NextRequest) {
  const limited = rateLimit(request);
  if (limited) return limited;

  try {
    const { symbol, aiModel } = await request.json();

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol is required' },
        { status: 400 }
      );
    }

    const upperSymbol = symbol.toUpperCase();

    // If specific AI model requested, generate just that one
    if (aiModel && aiModel !== 'all' && aiModel !== 'javari') {
      const pick = await generatePickFromAI(aiModel, upperSymbol);
      
      if (!pick) {
        return NextResponse.json(
          { error: `Failed to generate ${aiModel} pick for ${upperSymbol}. The AI may be unavailable.` },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        pick,
        timestamp: new Date().toISOString(),
      });
    }

    // Generate all AI picks + Javari consensus
    const result = await generateAllAIPicks(upperSymbol);

    return NextResponse.json({
      success: true,
      symbol: upperSymbol,
      picks: result.picks,
      consensus: result.consensus,
      dbErrors: result.dbErrors,
      aiStatus: result.aiStatus,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error generating picks:', error);
    return NextResponse.json(
      { error: 'Failed to generate picks', details: String(error) },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch recent picks
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const aiModel = searchParams.get('ai');
    const limit = parseInt(searchParams.get('limit') || '20');

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      supabaseUrl(),
      secretKey()
    );

    let query = supabase
      .from('market_oracle_picks')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (symbol) {
      query = query.eq('symbol', symbol.toUpperCase());
    }

    if (aiModel) {
      query = query.eq('ai_model', aiModel);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch picks', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      picks: data,
      count: data.length,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error fetching picks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch picks', details: String(error) },
      { status: 500 }
    );
  }
}
