/**
 * MARKET ORACLE - PERFORMANCE TRACKING API
 * Updates stock picks with current prices and calculates wins/losses
 * Runs daily at 4 PM after market close
 * November 24, 2025 - 4:52 AM ET
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic';

interface StockPick {
  id: string;
  ticker: string;
  direction: 'UP' | 'DOWN' | 'HOLD';
  confidence: number;
  entry_price: number;
  target_price: number;
  stop_loss: number;
  current_price: number | null;
  status: string;
  expiry_date: string;
  ai_model_id: string;
  competition_id: string;
  week_number: number;
}

/**
 * POST /api/market-oracle/update-performance
 * Update all active picks with current prices
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('📊 Starting performance update...');

    // Get all active picks
    const { data: activePicks, error } = await supabase
      .from('stock_picks')
      .select('*')
      .eq('status', 'active');

    if (error || !activePicks || activePicks.length === 0) {
      console.log('No active picks to update');
      return NextResponse.json({
        success: true,
        message: 'No active picks',
        updated: 0,
      });
    }

    console.log(`Found ${activePicks.length} active picks`);

    // Group by ticker to batch fetch prices
    const uniqueTickers = [...new Set(activePicks.map((p: any) => p.ticker))];
    
    // Fetch current prices for all tickers
    const priceMap = await fetchBatchPrices(uniqueTickers);

    let updated = 0;
    let won = 0;
    let lost = 0;
    let expired = 0;

    // Update each pick
    for (const pick of activePicks) {
      const currentPrice = priceMap[pick.ticker];
      
      if (!currentPrice) {
        console.log(`⚠️  No price data for ${pick.ticker}`);
        continue;
      }

      // Calculate price change
      const priceChange = currentPrice - pick.entry_price;
      const priceChangePercent = (priceChange / pick.entry_price) * 100;

      // Determine status and result
      const today = new Date().toISOString().split('T')[0];
      const expiryDate = pick.expiry_date;
      
      let status = 'active';
      let result = 'in_progress';
      let points = 0;
      let profitLoss = 0;

      // Check if target hit
      if (pick.direction === 'UP' && currentPrice >= pick.target_price) {
        status = 'won';
        result = 'target_hit';
        points = 10 + 5 + Math.floor(pick.confidence * 0.1); // Base + bonus + confidence
        profitLoss = currentPrice - pick.entry_price;
        won++;
      } else if (pick.direction === 'DOWN' && currentPrice <= pick.target_price) {
        status = 'won';
        result = 'target_hit';
        points = 10 + 5 + Math.floor(pick.confidence * 0.1);
        profitLoss = pick.entry_price - currentPrice;
        won++;
      }
      
      // Check if stop loss hit
      else if (pick.direction === 'UP' && currentPrice <= pick.stop_loss) {
        status = 'lost';
        result = 'stop_hit';
        points = -5 - 3; // Penalty
        profitLoss = currentPrice - pick.entry_price;
        lost++;
      } else if (pick.direction === 'DOWN' && currentPrice >= pick.stop_loss) {
        status = 'lost';
        result = 'stop_hit';
        points = -5 - 3;
        profitLoss = pick.entry_price - currentPrice;
        lost++;
      }
      
      // Check if expired
      else if (today > expiryDate) {
        status = 'expired';
        result = 'expired';
        
        // Check direction at expiry
        if (
          (pick.direction === 'UP' && currentPrice > pick.entry_price) ||
          (pick.direction === 'DOWN' && currentPrice < pick.entry_price)
        ) {
          points = 5; // Partial credit
          profitLoss = Math.abs(currentPrice - pick.entry_price);
        } else {
          points = -2; // Small penalty for wrong direction
          profitLoss = -(Math.abs(currentPrice - pick.entry_price));
        }
        expired++;
      }
      
      // Still active - update current price only
      else {
        profitLoss = (pick.direction === 'UP') 
          ? currentPrice - pick.entry_price 
          : pick.entry_price - currentPrice;
      }

      // Update pick in database
      await supabase
        .from('stock_picks')
        .update({
          current_price: currentPrice,
          price_change_percent: priceChangePercent,
          status,
          result,
          points_earned: points,
          profit_loss: profitLoss,
          updated_at: new Date().toISOString(),
          ...(status !== 'active' && { closed_at: new Date().toISOString() }),
        })
        .eq('id', pick.id);

      updated++;
    }

    // Update AI model statistics
    await updateAIModelStats();

    // Update weekly performance
    await updateWeeklyPerformance();

    console.log('✅ Performance update complete!');

    return NextResponse.json({
      success: true,
      summary: {
        totalPicks: activePicks.length,
        updated,
        won,
        lost,
        expired,
        stillActive: activePicks.length - updated - won - lost - expired,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Performance update error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

async function fetchBatchPrices(tickers: string[]): Promise<Record<string, number>> {
  const priceMap: Record<string, number> = {};

  // Fetch prices in parallel (batch of 10)
  const batches = [];
  for (let i = 0; i < tickers.length; i += 10) {
    batches.push(tickers.slice(i, i + 10));
  }

  for (const batch of batches) {
    await Promise.all(
      batch.map(async (ticker) => {
        try {
          const response = await fetch(
            `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`,
            {
              headers: { 'User-Agent': 'Mozilla/5.0' },
            }
          );

          if (response.ok) {
            const data = await response.json();
            const price = data.chart?.result?.[0]?.meta?.regularMarketPrice;
            if (price) {
              priceMap[ticker] = price;
            }
          }
        } catch (error) {
          console.error(`Error fetching ${ticker}:`, error);
        }
      })
    );
  }

  return priceMap;
}

async function updateAIModelStats() {
  const { data: aiModels } = await supabase.from('ai_models').select('*');

  if (!aiModels) return;

  for (const model of aiModels) {
    // Get all completed picks for this AI
    const { data: picks } = await supabase
      .from('stock_picks')
      .select('*')
      .eq('ai_model_id', model.id)
      .in('status', ['won', 'lost', 'expired']);

    if (!picks || picks.length === 0) continue;

    const totalWins = picks.filter(p => p.status === 'won').length;
    const totalLosses = picks.filter(p => p.status === 'lost').length;
    const winRate = picks.length > 0 ? (totalWins / picks.length) * 100 : 0;
    const totalProfitLoss = picks.reduce((sum, p) => sum + (p.profit_loss || 0), 0);

    await supabase
      .from('ai_models')
      .update({
        total_wins: totalWins,
        total_losses: totalLosses,
        win_rate: winRate,
        total_profit_loss: totalProfitLoss,
        updated_at: new Date().toISOString(),
      })
      .eq('id', model.id);
  }
}

async function updateWeeklyPerformance() {
  // Get active competition
  const { data: competition } = await supabase
    .from('competitions')
    .select('*')
    .eq('status', 'active')
    .single();

  if (!competition) return;

  const { data: aiModels } = await supabase.from('ai_models').select('*');
  if (!aiModels) return;

  // Calculate current week
  const weekNumber = Math.ceil(
    (new Date().getTime() - new Date(competition.start_date).getTime()) / 
    (7 * 24 * 60 * 60 * 1000)
  );

  for (const model of aiModels) {
    // Get picks for this week
    const { data: weekPicks } = await supabase
      .from('stock_picks')
      .select('*')
      .eq('competition_id', competition.id)
      .eq('ai_model_id', model.id)
      .eq('week_number', weekNumber);

    if (!weekPicks || weekPicks.length === 0) continue;

    const won = weekPicks.filter(p => p.status === 'won').length;
    const lost = weekPicks.filter(p => p.status === 'lost').length;
    const active = weekPicks.filter(p => p.status === 'active').length;
    const winRate = (won + lost) > 0 ? (won / (won + lost)) * 100 : 0;
    const totalPoints = weekPicks.reduce((sum, p) => sum + (p.points_earned || 0), 0);
    const profitLoss = weekPicks.reduce((sum, p) => sum + (p.profit_loss || 0), 0);

    // Upsert weekly performance
    await supabase
      .from('weekly_performance')
      .upsert({
        competition_id: competition.id,
        ai_model_id: model.id,
        week_number: weekNumber,
        week_start_date: getWeekStartDate(competition.start_date, weekNumber),
        week_end_date: getWeekEndDate(competition.start_date, weekNumber),
        picks_made: weekPicks.length,
        picks_won: won,
        picks_lost: lost,
        picks_active: active,
        win_rate: winRate,
        total_points: totalPoints,
        profit_loss: profitLoss,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'competition_id,ai_model_id,week_number',
      });
  }

  // Calculate rankings for this week
  const { data: weekPerformances } = await supabase
    .from('weekly_performance')
    .select('*')
    .eq('competition_id', competition.id)
    .eq('week_number', weekNumber)
    .order('total_points', { ascending: false });

  if (weekPerformances) {
    for (let i = 0; i < weekPerformances.length; i++) {
      await supabase
        .from('weekly_performance')
        .update({ rank: i + 1 })
        .eq('id', weekPerformances[i].id);
    }
  }
}

function getWeekStartDate(competitionStart: string, weekNumber: number): string {
  const start = new Date(competitionStart);
  start.setDate(start.getDate() + ((weekNumber - 1) * 7));
  return start.toISOString().split('T')[0];
}

function getWeekEndDate(competitionStart: string, weekNumber: number): string {
  const start = new Date(competitionStart);
  start.setDate(start.getDate() + ((weekNumber - 1) * 7) + 6);
  return start.toISOString().split('T')[0];
}
