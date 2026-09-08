import { rateLimit } from '@/lib/api/rate-limit';
// app/api/sentiment/route.ts
// Twitter/X Sentiment Analysis API for Market Oracle
// Powered by xAI Grok-4 with real-time Twitter access
// Created: December 25, 2025

import { NextRequest, NextResponse } from 'next/server'
import {
  analyzeStockSentiment,
  analyzeMultipleStocks,
  getTrendingStockMentions,
  compareSentiment,
  getSentimentWithContext,
} from '@/lib/connectors/xai-sentiment'
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

export async function GET(request: NextRequest) {
  const limited = rateLimit(request);
  if (limited) return limited;

  const supabase = getSupabase()!
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get('symbol')
  const action = searchParams.get('action') || 'single'

  if (!symbol && action !== 'trending') {
    return NextResponse.json({ error: 'Symbol is required' }, { status: 400 })
  }

  try {
    switch (action) {
      case 'multiple': {
        const symbols = searchParams.get('symbols')?.split(',') || []
        const data = await analyzeMultipleStocks(symbols)
        return NextResponse.json({ success: true, data })
      }
      case 'trending': {
        const data = await getTrendingStockMentions()
        return NextResponse.json({ success: true, data })
      }
      case 'compare': {
        const symbols = searchParams.get('symbols')?.split(',') || []
        const data = await compareSentiment(symbols)
        return NextResponse.json({ success: true, data })
      }
      case 'context': {
        const data = await getSentimentWithContext(symbol!)
        return NextResponse.json({ success: true, data })
      }
      default: {
        const data = await analyzeStockSentiment(symbol!)
        return NextResponse.json({ success: true, data })
      }
    }
  } catch (error) {
    console.error('Sentiment API error:', error)
    return NextResponse.json({ error: 'Failed to analyze sentiment' }, { status: 500 })
  }
}
