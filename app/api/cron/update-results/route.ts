// app/api/cron/update-results/route.ts
// PRODUCTION CRON JOB: Calculate Results & Update Leaderboard
// Runs daily at 4:15 PM EST (after market close)
// Created: December 12, 2025 - Roy Henderson / CR AudioViz AI

import { NextRequest, NextResponse } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { secretKey, supabaseUrl } from "@craudioviz/platform-sdk";
import { getStockPrice } from '@/lib/market/prices';
import { javariOutcome } from '@/lib/javari/door';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// Lazy Supabase client — initialized on first request (not at module load time)
// ⚠️ _supabase MUST be declared before getSupabase() — TDZ guard
// Typed as the plain client: without a Database generic, SupabaseClient
// resolved every row to `never`, so nothing in this file type-checked (the build hides
// this with ignoreBuildErrors).
let _supabase: SupabaseClient | null = null;
function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = supabaseUrl();
    const key = secretKey();
    // 2026-09-11: was `secretKey() || "<hard-coded anon JWT>"`. That key is now disabled,
    // so the fallback silently produced a client that 401s on every query. No fallback:
    // a missing credential is an error the caller can see.
    if (!url || !key) throw new Error("Supabase credentials unavailable");
    _supabase = createClient(url, key);
  }
  return _supabase;
}
const CRYPTO_MAP: Record<string, string> = {
  'BTC': 'bitcoin', 'ETH': 'ethereum', 'SOL': 'solana', 'XRP': 'ripple',
  'ADA': 'cardano', 'DOGE': 'dogecoin', 'AVAX': 'avalanche-2', 'LINK': 'chainlink',
  'DOT': 'polkadot', 'MATIC': 'matic-network'
};

interface PickResult {
  id: string;
  ticker: string;
  asset_type: string;
  direction: string;
  entry_price: number;
  current_price: number;
  target_price: number;
  stop_loss: number;
  pick_date: string;
  expiry_date: string;
  ai_model_id: string;
}

// ----- PRICE FETCHING -----

// 2026-09-11: shared batch price lookup (Yahoo -> Twelve Data -> Alpha Vantage); the old
// per-ticker Alpha Vantage call failed once the battle had used the free quota.
async function fetchCurrentStockPrice(ticker: string): Promise<number | null> {
  return getStockPrice(ticker);
}

async function fetchCryptoPrice(ticker: string): Promise<number | null> {
  const coinId = CRYPTO_MAP[ticker.toUpperCase()];
  if (!coinId) return null;
  
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`
    );
    const data = await response.json();
    return data[coinId]?.usd || null;
  } catch (error) {
    console.error(`Failed to fetch crypto price for ${ticker}:`, error);
    return null;
  }
}

// ----- RESULT CALCULATION -----

function calculatePickResult(pick: PickResult, currentPrice: number): {
  result: 'win' | 'loss' | 'pending';
  profit_loss_percent: number;
  profit_loss_dollars: number;
  points_earned: number;
} {
  const priceChange = currentPrice - pick.entry_price;
  const percentChange = (priceChange / pick.entry_price) * 100;
  
  // Check if position should be closed
  const hitTarget = pick.direction === 'UP' 
    ? currentPrice >= pick.target_price 
    : currentPrice <= pick.target_price;
    
  const hitStopLoss = pick.direction === 'UP'
    ? currentPrice <= pick.stop_loss
    : currentPrice >= pick.stop_loss;
    
  const isExpired = new Date(pick.expiry_date) <= new Date();
  
  // Determine win/loss
  let result: 'win' | 'loss' | 'pending' = 'pending';
  let points = 0;
  
  if (hitTarget) {
    result = 'win';
    points = Math.round(10 + (percentChange * 2)); // Base points + bonus for gains
  } else if (hitStopLoss) {
    result = 'loss';
    points = -5;
  } else if (isExpired) {
    // Expired - check if profitable
    const isProfit = pick.direction === 'UP' 
      ? currentPrice > pick.entry_price 
      : currentPrice < pick.entry_price;
    
    result = isProfit ? 'win' : 'loss';
    points = isProfit ? Math.round(5 + percentChange) : -3;
  }
  
  return {
    result,
    profit_loss_percent: pick.direction === 'UP' ? percentChange : -percentChange,
    profit_loss_dollars: pick.direction === 'UP' ? priceChange : -priceChange,
    points_earned: points
  };
}

// ----- LEADERBOARD UPDATE -----

async function updateAIModelStats(modelId: string): Promise<void> {
  const supabase = getSupabase();
  // Get all picks for this model
  const { data: picks } = await supabase
    .from('stock_picks')
    .select('result, profit_loss_percent, points_earned')
    .eq('ai_model_id', modelId)
    .not('result', 'is', null);
  
  if (!picks || picks.length === 0) return;
  
  const wins = picks.filter(p => p.result === 'win').length;
  const losses = picks.filter(p => p.result === 'loss').length;
  const totalPicks = wins + losses;
  const winRate = totalPicks > 0 ? (wins / totalPicks) * 100 : 0;
  const totalProfitLoss = picks.reduce((sum, p) => sum + (p.profit_loss_percent || 0), 0);
  
  // Calculate streaks
  let currentStreak = 0;
  let bestWinStreak = 0;
  let worstLossStreak = 0;
  let tempWinStreak = 0;
  let tempLossStreak = 0;
  
  for (const pick of picks.reverse()) {
    if (pick.result === 'win') {
      tempWinStreak++;
      tempLossStreak = 0;
      bestWinStreak = Math.max(bestWinStreak, tempWinStreak);
      currentStreak = tempWinStreak;
    } else if (pick.result === 'loss') {
      tempLossStreak++;
      tempWinStreak = 0;
      worstLossStreak = Math.max(worstLossStreak, tempLossStreak);
      currentStreak = -tempLossStreak;
    }
  }
  
  // Update AI model stats
  await supabase
    .from('ai_models')
    .update({
      total_picks: totalPicks,
      total_wins: wins,
      total_losses: losses,
      win_rate: parseFloat(winRate.toFixed(2)),
      total_profit_loss: parseFloat(totalProfitLoss.toFixed(2)),
      current_streak: currentStreak,
      best_win_streak: bestWinStreak,
      worst_loss_streak: worstLossStreak,
      updated_at: new Date().toISOString()
    })
    .eq('id', modelId);
}

// ----- MAIN HANDLER -----

export async function GET(request: NextRequest) {
  const supabase = getSupabase()!
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  // 2026-09-11: scheduler / CRON_SECRET only - "?test=true" let anyone rewrite results.
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  console.log(`[UPDATE RESULTS] Starting - ${new Date().toISOString()}`);
  
  const results = {
    timestamp: new Date().toISOString(),
    picks_processed: 0,
    picks_closed: 0,
    prices_updated: 0,
    models_updated: [] as string[],
    errors: [] as string[]
  };
  
  try {
    // Step 1: Get all active picks
    const { data: activePicks, error: fetchError } = await supabase
      .from('stock_picks')
      .select('*')
      .eq('status', 'active');
    
    if (fetchError) throw fetchError;
    if (!activePicks || activePicks.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active picks to process',
        ...results
      });
    }
    
    console.log(`[UPDATE RESULTS] Processing ${activePicks.length} active picks...`);
    
    // Step 2: Update prices and calculate results
    const processedModelIds = new Set<string>();
    
    for (const pick of activePicks) {
      try {
        // Fetch current price
        let currentPrice: number | null = null;
        
        if (pick.asset_type === 'crypto') {
          currentPrice = await fetchCryptoPrice(pick.ticker);
        } else {
          currentPrice = await fetchCurrentStockPrice(pick.ticker);
          await new Promise(r => setTimeout(r, 300)); // Rate limit
        }
        
        if (currentPrice === null) {
          results.errors.push(`Could not fetch price for ${pick.ticker}`);
          continue;
        }
        
        results.prices_updated++;
        
        // Calculate result
        const pickResult = calculatePickResult(pick, currentPrice);
        
        // Update pick in database
        const updateData: any = {
          current_price: currentPrice,
          price_change_percent: parseFloat(pickResult.profit_loss_percent.toFixed(2)),
          price_change_dollars: parseFloat(pickResult.profit_loss_dollars.toFixed(4)),
          price_updated_at: new Date().toISOString()
        };
        
        // 2026-09-12: score the pick against its market's benchmark over the same
        // window. Rising with a rising index is not skill; alpha is the difference.
        if (pick.benchmark_symbol && pick.benchmark_entry) {
          try {
            const benchNow = pick.benchmark_symbol === 'BTC'
              ? (await (await import('@/lib/market/battle')).pricesFor('crypto')).get('BTC') ?? null
              : await getStockPrice(pick.benchmark_symbol as string);
            if (benchNow) {
              const benchReturn = ((benchNow - Number(pick.benchmark_entry)) / Number(pick.benchmark_entry)) * 100;
              updateData.benchmark_current = benchNow;
              updateData.benchmark_return = Number(benchReturn.toFixed(4));
              updateData.alpha = Number((pickResult.profit_loss_percent - benchReturn).toFixed(4));
            }
          } catch (e) {
            results.errors.push(`Benchmark for ${pick.ticker}: ${e instanceof Error ? e.message : String(e)}`);
          }
        }

        if (pickResult.result !== 'pending') {
          updateData.status = 'closed';
          updateData.result = pickResult.result;
          updateData.profit_loss_percent = pickResult.profit_loss_percent;
          updateData.profit_loss_dollars = pickResult.profit_loss_dollars;
          updateData.points_earned = pickResult.points_earned;
          updateData.closed_at = new Date().toISOString();
          results.picks_closed++;
        }
        
        await supabase
          .from('stock_picks')
          .update(updateData)
          .eq('id', pick.id);

        // 2026-09-11: tell Javari how the pick turned out, so she learns which model
        // reads markets best. Only for picks made through her door, and only once a
        // pick actually closes.
        if (pickResult.result !== 'pending' && pick.javari_request_id) {
          const sent = await javariOutcome(
            pick.javari_request_id as string,
            pickResult.result === 'win' ? 'accepted' : 'corrected',
            `${pick.symbol} ${pick.direction} from $${pick.entry_price}: ${pickResult.profit_loss_percent.toFixed(2)}%`,
          );
          if (!sent) results.errors.push(`Outcome not reported for ${pick.ticker}`);
        }

        processedModelIds.add(pick.ai_model_id);
        results.picks_processed++;
        
      } catch (error: any) {
        results.errors.push(`Error processing ${pick.ticker}: ${error.message}`);
      }
    }
    
    // Step 2b: settle PLAYER picks on exactly the same terms as the models - same
    // prices, same benchmark, same seven-day window. 2026-09-12: without this humans
    // never scored at all, so the comparison could not have been honest.
    try {
      const { data: openPlayer, error: opErr } = await supabase
        .from('market_player_picks')
        .select('user_id, pick_date, category, symbol, entry_price')
        .eq('status', 'active');
      if (opErr) throw new Error(opErr.message);
      const battle = await import('@/lib/market/battle');
      const priceCache = new Map<string, Map<string, number>>();
      const benchCache = new Map<string, number | null>();

      for (const pk of openPlayer ?? []) {
        const market = String(pk.category) as keyof typeof battle.MARKETS;
        if (!priceCache.has(market)) {
          try { priceCache.set(market, await battle.pricesFor(market)); } catch { priceCache.set(market, new Map()); }
        }
        const now = priceCache.get(market)?.get(String(pk.symbol));
        const entry = Number(pk.entry_price);
        if (!now || !entry) continue;

        const held = (Date.now() - new Date(`${pk.pick_date}T14:30:00Z`).getTime()) / 86_400_000;
        const ret = ((now - entry) / entry) * 100;

        const benchSymbol = battle.BENCHMARKS[market];
        if (!benchCache.has(benchSymbol)) {
          try {
            const bp = benchSymbol === 'BTC'
              ? (await battle.pricesFor('crypto')).get('BTC') ?? null
              : await getStockPrice(benchSymbol);
            benchCache.set(benchSymbol, bp);
          } catch { benchCache.set(benchSymbol, null); }
        }
        const { data: benchRow } = await supabase
          .from('market_benchmark_prices').select('price').eq('pick_date', pk.pick_date).eq('symbol', benchSymbol).maybeSingle();
        const benchNow = benchCache.get(benchSymbol) ?? null;
        const benchEntry = benchRow ? Number(benchRow.price) : null;
        const benchReturn = benchNow && benchEntry ? ((benchNow - benchEntry) / benchEntry) * 100 : null;

        const closing = held >= 7;
        const update: Record<string, unknown> = {
          current_price: now,
          return_percent: Number(ret.toFixed(4)),
          benchmark_return: benchReturn === null ? null : Number(benchReturn.toFixed(4)),
          alpha: benchReturn === null ? null : Number((ret - benchReturn).toFixed(4)),
          updated_at: new Date().toISOString(),
        };
        if (closing) {
          update.status = 'closed';
          update.result = ret > 0 ? 'win' : ret < 0 ? 'loss' : 'flat';
        }
        const { error: upErr } = await supabase
          .from('market_player_picks').update(update)
          .eq('user_id', pk.user_id).eq('pick_date', pk.pick_date).eq('category', pk.category);
        if (upErr) results.errors.push(`Player pick ${pk.symbol}: ${upErr.message}`);
      }
    } catch (e) {
      results.errors.push(`Player settlement: ${e instanceof Error ? e.message : String(e)}`);
    }

    // Step 3: Update AI model leaderboard stats
    console.log(`[UPDATE RESULTS] Updating ${processedModelIds.size} AI model stats...`);
    
    for (const modelId of processedModelIds) {
      try {
        await updateAIModelStats(modelId);
        results.models_updated.push(modelId);
      } catch (error: any) {
        results.errors.push(`Model stats error ${modelId}: ${error.message}`);
      }
    }
    
    // Step 4: Log to Javari for learning
    await logResultsToJavari(results);
    
    console.log(`[UPDATE RESULTS] Complete - ${results.picks_closed} picks closed`);
    
    return NextResponse.json({
      success: true,
      message: 'Results updated successfully',
      ...results
    });
    
  } catch (error: any) {
    console.error('[UPDATE RESULTS] Critical error:', error);
    return NextResponse.json({
      success: false,
      error: 'The request could not be completed.', code: 'INTERNAL_ERROR',
      ...results
    }, { status: 500 });
  }
}

async function logResultsToJavari(results: any): Promise<void> {
  try {
    const supabase = getSupabase();
    await supabase.from('javari_learning_queue').insert({
      source: 'market_oracle',
      event_type: 'results_update',
      data: {
        picks_processed: results.picks_processed,
        picks_closed: results.picks_closed,
        timestamp: results.timestamp
      },
      status: 'pending'
    });
  } catch (error) {
    console.log('Javari notification skipped');
  }
}

export async function POST(request: NextRequest) {
  const supabase = getSupabase()!
  return GET(request);
}
