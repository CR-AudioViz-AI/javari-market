/**
 * MARKET ORACLE - UPDATE PERFORMANCE API
 * Daily price updates and scoring
 * November 24, 2025 - 5:27 AM ET
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from 'next/server';
import { secretKey, supabaseUrl } from "@craudioviz/platform-sdk";

// ⚠️ _supabase MUST be declared before getSupabase() — TDZ guard
let _supabase: SupabaseClient | null = null;
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


export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const SUPABASE_URL = supabaseUrl();
const supabaseServiceKey = secretKey() || process.env.SUPABASE_SERVICE_KEY || '';

// Fetch stock price from Yahoo Finance
async function fetchPrice(ticker: string): Promise<number | null> {
  try {
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    );
    if (!response.ok) return null;
    const data = await response.json();
    return data.chart?.result?.[0]?.meta?.regularMarketPrice || null;
  } catch {
    return null;
  }
}

// Calculate points based on pick result
function calculatePoints(
  direction: string,
  confidence: number,
  entryPrice: number,
  currentPrice: number,
  targetPrice: number,
  stopLoss: number
): { status: string; result: string; points: number; profitLoss: number } {
  const priceUp = currentPrice > entryPrice;
  const targetHit = direction === 'UP' ? currentPrice >= targetPrice : currentPrice <= targetPrice;
  const stopHit = direction === 'UP' ? currentPrice <= stopLoss : currentPrice >= stopLoss;
  const correctDirection = (direction === 'UP' && priceUp) || (direction === 'DOWN' && !priceUp);

  let status = 'active';
  let result = 'in_progress';
  let points = 0;
  let profitLoss = direction === 'UP' ? currentPrice - entryPrice : entryPrice - currentPrice;

  if (targetHit) {
    status = 'won';
    result = 'target_hit';
    points = 10 + 5 + Math.floor(confidence * 0.1); // Base + bonus + confidence
  } else if (stopHit) {
    status = 'lost';
    result = 'stop_hit';
    points = -8;
  } else if (correctDirection) {
    points = 2; // Partial credit for correct direction
  }

  return { status, result, points, profitLoss };
}

export async function POST(request: NextRequest) {
  // 2026-08-19: this function used `supabase` without declaring it. The
  // corruption that hit this repo left only some functions with a client, so
  // the rest threw "supabase is not defined" at runtime while compiling fine.
  const supabase = getSupabase()!;
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    console.log('📊 Starting performance update...');

    // Get active picks
    const { data: activePicks, error } = await supabase
      .from('stock_picks')
      .select('*')
      .eq('status', 'active');

    if (error || !activePicks || activePicks.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active picks to update',
        updated: 0,
      });
    }

    console.log(`Found ${activePicks.length} active picks`);

    // Get unique tickers
    const tickers = [...new Set(activePicks.map(p => p.ticker))];
    
    // Fetch prices
    const priceMap: Record<string, number> = {};
    for (const ticker of tickers) {
      const price = await fetchPrice(ticker);
      if (price) priceMap[ticker] = price;
    }

    let updated = 0;
    let won = 0;
    let lost = 0;

    // Update each pick
    for (const pick of activePicks) {
      const currentPrice = priceMap[pick.ticker];
      if (!currentPrice) continue;

      const { status, result, points, profitLoss } = calculatePoints(
        pick.direction,
        pick.confidence,
        parseFloat(pick.entry_price),
        currentPrice,
        parseFloat(pick.target_price),
        parseFloat(pick.stop_loss)
      );

      // Check expiry
      const today = new Date().toISOString().split('T')[0];
      const expired = pick.expiry_date && today > pick.expiry_date;
      
      const finalStatus = expired && status === 'active' ? 'expired' : status;
      const finalResult = expired && result === 'in_progress' ? 'expired' : result;

      await supabase
        .from('stock_picks')
        .update({
          current_price: currentPrice,
          price_change_percent: ((currentPrice - parseFloat(pick.entry_price)) / parseFloat(pick.entry_price)) * 100,
          status: finalStatus,
          result: finalResult,
          points_earned: points,
          profit_loss: profitLoss,
          updated_at: new Date().toISOString(),
          ...(finalStatus !== 'active' && { closed_at: new Date().toISOString() }),
        })
        .eq('id', pick.id);

      updated++;
      if (finalStatus === 'won') won++;
      if (finalStatus === 'lost') lost++;
    }

    console.log(`✅ Updated ${updated} picks: ${won} won, ${lost} lost`);

    return NextResponse.json({
      success: true,
      summary: {
        totalPicks: activePicks.length,
        updated,
        won,
        lost,
        expired: updated - won - lost,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Performance update error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const trigger = searchParams.get('trigger');

  if (trigger === 'manual') {
    return POST(request);
  }

  return NextResponse.json({
    success: true,
    message: 'Performance Update API',
    usage: {
      post: 'POST with Authorization: Bearer {CRON_SECRET}',
      manualTrigger: 'GET ?trigger=manual',
    },
    schedule: 'Every day at 4 PM ET',
  });
}
