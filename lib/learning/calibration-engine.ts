// lib/learning/calibration-engine.ts
// 2026-09-12: this module queried the market_oracle_* tables, which were dropped with
// the retired pick system. It now reads the live contest data in stock_picks / ai_models.
// Column names differ: a pick's model is ai_model_id (not ai_model), its result is
// status/result with profit_loss_percent (not PENDING/WIN/LOSS with actual_return).
// Market Oracle Ultimate - AI Calibration Engine
// Created: December 13, 2025
// Purpose: Analyze AI performance and adjust behavior for improved accuracy

import type { SupabaseClient } from "@supabase/supabase-js";
import type { 
  AIModelName, 
  AICalibration, 
  PickOutcome,
  DBPick,
  DBCalibration 
} from '../types/learning';
import { secretKey, supabaseUrl } from "@craudioviz/platform-sdk";

// ⚠️ _supabase MUST be declared before getSupabase() — TDZ guard
let _supabase: SupabaseClient | null = null;
function getSupabase(): SupabaseClient {
  // 2026-08-19: this function was CORRUPTED in 27 files, byte-identically.
  // `return _supabase;` had been spliced into the middle of the options object:
  //
  //   return sb.createClient(url, key, { auth: { persistSession: false   return _supabase;
  //   } })
  //
  // The repo did not compile - 102 type errors across 29 files - and every route
  // using it threw "getSupabase() is not defined". javarimarket.com kept serving only
  // because Vercel holds the last successful build; the next push would have
  // failed and stayed failed.
  //
  // Now caches properly, which is what _supabase was always for, and pins
  // no-store: Next 14 caches PostgREST GETs by URL and serves stale rows.
  if (_supabase) return _supabase;
  const sb = require('@supabase/supabase-js');
  const url = supabaseUrl();
  const key = secretKey();
  if (!url || !key) throw new Error('Supabase credentials unavailable');
  _supabase = sb.createClient(url, key, {
    auth: { persistSession: false },
    global: { fetch: (u: RequestInfo | URL, o?: RequestInit) => fetch(u, { ...o, cache: 'no-store' }) },
  });
  if (!_supabase) throw new Error('Supabase client unavailable');
  return _supabase;
}

// ============================================================================
// SUPABASE CLIENT
// ============================================================================

const SUPABASE_URL = supabaseUrl();
const supabaseServiceKey = secretKey();


// ============================================================================
// PROCESS PICK OUTCOME
// ============================================================================

export async function processPickOutcome(
  pickId: string,
  outcome: PickOutcome,
  closedPrice: number
): Promise<void> {
  try {
    // Get the pick
    const { data: pick, error: pickError } = await getSupabase()
      .from('stock_picks')
      .select('*')
      .eq('id', pickId)
      .single();

    if (pickError || !pick) {
      console.error('Pick not found:', pickId);
      return;
    }

    // Calculate actual return
    const actualReturn = pick.direction === 'UP'
      ? ((closedPrice - pick.entry_price) / pick.entry_price) * 100
      : ((pick.entry_price - closedPrice) / pick.entry_price) * 100;

    // Determine if target/stop was hit
    const hitTarget = pick.direction === 'UP'
      ? closedPrice >= pick.target_price
      : closedPrice <= pick.target_price;
    
    const hitStopLoss = pick.direction === 'UP'
      ? closedPrice <= pick.stop_loss
      : closedPrice >= pick.stop_loss;

    // Calculate days held
    const daysHeld = Math.ceil(
      (new Date().getTime() - new Date(pick.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );

    // Update the pick with outcome
    const { error: updateError } = await getSupabase()
      .from('stock_picks')
      .update({
        status: outcome,
        closed_at: new Date().toISOString(),
        closed_price: closedPrice,
        actual_return: actualReturn,
        hit_target: hitTarget,
        hit_stop_loss: hitStopLoss,
        days_held: daysHeld,
      })
      .eq('id', pickId);

    if (updateError) {
      console.error('Error updating pick:', updateError);
      return;
    }

    // Record factor outcomes for learning
    if (pick.factor_assessments && Array.isArray(pick.factor_assessments)) {
    }

    // Queue calibration task if we have enough new data
    await queueCalibrationIfNeeded(pick.ai_model);

    console.log(`✅ Processed outcome for pick ${pickId}: ${outcome}, ${actualReturn.toFixed(2)}%`);
  } catch (error) {
    console.error('Error processing pick outcome:', error);
  }
}

// ============================================================================
// QUEUE CALIBRATION IF NEEDED
// ============================================================================

async function queueCalibrationIfNeeded(aiModel: AIModelName): Promise<void> {
  try {
    // Check how many unprocessed outcomes we have
    const { count, error } = await getSupabase()
      .from('stock_picks')
      .select('*', { count: 'exact', head: true })
      .eq('ai_model_id', aiModel)
      .in('status', ['WIN', 'LOSS'])
      .gte('closed_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()); // Last 7 days

    if (error) {
      console.error('Error checking calibration queue:', error);
      return;
    }

    // If we have 10+ outcomes this week, queue calibration
    if (count && count >= 10) {
      const { error: queueError } = await getSupabase()
        .from('market_weekly_reports')
        .upsert({
          task_type: 'CALIBRATE_AI',
          target_ai: aiModel,
          priority: 5,
          status: 'PENDING',
          created_at: new Date().toISOString(),
        }, {
          onConflict: 'task_type,target_ai',
        });

      if (queueError) {
        console.error('Error queueing calibration:', queueError);
      } else {
        console.log(`📊 Queued calibration for ${aiModel} (${count} outcomes this week)`);
      }
    }
  } catch (error) {
    console.error('Error in queueCalibrationIfNeeded:', error);
  }
}

// ============================================================================
// RUN WEEKLY CALIBRATION
// ============================================================================

export async function runWeeklyCalibration(
  aiModel: AIModelName
): Promise<AICalibration | null> {
  try {
    console.log(`\n🔧 Starting weekly calibration for ${aiModel}...`);

    // Get all completed picks for this AI in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: picks, error } = await getSupabase()
      .from('stock_picks')
      .select('*')
      .eq('ai_model_id', aiModel)
      .in('status', ['WIN', 'LOSS'])
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false });

    if (error || !picks || picks.length < 5) {
      console.log(`⏭️ Skipping ${aiModel} calibration - insufficient data (${picks?.length || 0} picks)`);
      return null;
    }

    // Calculate performance metrics
    const totalPicks = picks.length;
    const wins = picks.filter(p => p.status === 'WIN').length;
    const losses = picks.filter(p => p.status === 'LOSS').length;
    const winRate = wins / totalPicks;
    
    const avgReturn = picks.reduce((sum, p) => sum + (p.actual_return || 0), 0) / totalPicks;
    const avgConfidence = picks.reduce((sum, p) => sum + p.confidence, 0) / totalPicks;

    // Calculate confidence-accuracy correlation
    const confidenceAccuracyCorrelation = calculateCorrelation(
      picks.map(p => p.confidence),
      picks.map(p => p.status === 'WIN' ? 1 : 0)
    );

    // Calculate overconfidence score
    // If avg confidence is 70% but win rate is 50%, overconfidence = 20
    const overconfidenceScore = avgConfidence - (winRate * 100);

    // Get factor performance
    const factorPerformance: Record<string, {
      timesUsed: number;
      accuracy: number;
      avgContribution: number;
    }> = {};

    for (const pick of picks) {
      if (pick.factor_assessments && Array.isArray(pick.factor_assessments)) {
        for (const fa of pick.factor_assessments) {
          if (!factorPerformance[fa.factorId]) {
            factorPerformance[fa.factorId] = {
              timesUsed: 0,
              accuracy: 0,
              avgContribution: 0,
            };
          }
          factorPerformance[fa.factorId].timesUsed++;
          if (pick.status === 'WIN') {
            factorPerformance[fa.factorId].accuracy++;
          }
        }
      }
    }

    // Normalize accuracy
    for (const factorId of Object.keys(factorPerformance)) {
      const fp = factorPerformance[factorId];
      fp.accuracy = fp.timesUsed > 0 ? fp.accuracy / fp.timesUsed : 0;
    }

    // Analyze sectors
    const sectorPerformance: Record<string, { wins: number; total: number }> = {};
    for (const pick of picks) {
      if (!sectorPerformance[pick.sector]) {
        sectorPerformance[pick.sector] = { wins: 0, total: 0 };
      }
      sectorPerformance[pick.sector].total++;
      if (pick.status === 'WIN') {
        sectorPerformance[pick.sector].wins++;
      }
    }

    const sectorAccuracy = Object.entries(sectorPerformance)
      .map(([sector, data]) => ({
        sector,
        accuracy: data.total > 0 ? data.wins / data.total : 0,
        total: data.total,
      }))
      .filter(s => s.total >= 3) // At least 3 picks
      .sort((a, b) => b.accuracy - a.accuracy);

    const bestSectors = sectorAccuracy.slice(0, 3).map(s => s.sector);
    const worstSectors = sectorAccuracy.slice(-3).map(s => s.sector);

    // Generate key learnings and adjustments
    const keyLearnings: string[] = [];
    const adjustments: string[] = [];

    // Learning 1: Win rate assessment
    if (winRate > 0.65) {
      keyLearnings.push(`Strong performance with ${(winRate * 100).toFixed(0)}% win rate`);
    } else if (winRate < 0.45) {
      keyLearnings.push(`Win rate needs improvement at ${(winRate * 100).toFixed(0)}%`);
      adjustments.push('Increase confidence threshold for picks to 75%+');
    }

    // Learning 2: Confidence calibration
    if (overconfidenceScore > 15) {
      keyLearnings.push(`Overconfident by ${overconfidenceScore.toFixed(0)} points`);
      adjustments.push('Reduce confidence scores by 10-15% across the board');
    } else if (overconfidenceScore < -10) {
      keyLearnings.push(`Underconfident - accuracy exceeds confidence`);
      adjustments.push('Can increase confidence on picks');
    }

    // Learning 3: Sector specialization
    if (bestSectors.length > 0 && sectorAccuracy[0]?.accuracy > 0.7) {
      keyLearnings.push(`Strong in ${bestSectors[0]} sector (${(sectorAccuracy[0].accuracy * 100).toFixed(0)}%)`);
      adjustments.push(`Prioritize ${bestSectors[0]} picks`);
    }
    if (worstSectors.length > 0 && sectorAccuracy[sectorAccuracy.length - 1]?.accuracy < 0.4) {
      keyLearnings.push(`Weak in ${worstSectors[0]} sector`);
      adjustments.push(`Avoid or reduce confidence in ${worstSectors[0]} picks`);
    }

    // Learning 4: Factor recommendations

    // Create calibration record
    const calibration: AICalibration = {
      id: `cal_${aiModel}_${Date.now()}`,
      aiModel,
      calibrationDate: new Date(),
      totalPicks,
      wins,
      losses,
      winRate,
      avgReturn,
      avgConfidence,
      confidenceAccuracyCorrelation,
      overconfidenceScore,
      factorPerformance,
      bestSectors,
      worstSectors,
      bestMarketConditions: [], // TODO: Add market condition analysis
      worstMarketConditions: [],
      keyLearnings,
      adjustments,
    };

    // Store calibration in database
    const { error: insertError } = await getSupabase()
      .from('market_weekly_reports')
      .insert({
        id: calibration.id,
        ai_model: calibration.aiModel,
        calibration_date: calibration.calibrationDate.toISOString(),
        total_picks: calibration.totalPicks,
        wins: calibration.wins,
        losses: calibration.losses,
        win_rate: calibration.winRate,
        avg_return: calibration.avgReturn,
        avg_confidence: calibration.avgConfidence,
        confidence_accuracy_correlation: calibration.confidenceAccuracyCorrelation,
        overconfidence_score: calibration.overconfidenceScore,
        factor_performance: calibration.factorPerformance,
        best_sectors: calibration.bestSectors,
        worst_sectors: calibration.worstSectors,
        best_market_conditions: calibration.bestMarketConditions,
        worst_market_conditions: calibration.worstMarketConditions,
        key_learnings: calibration.keyLearnings,
        adjustments: calibration.adjustments,
      });

    if (insertError) {
      console.error('Error storing calibration:', insertError);
    }

    console.log(`✅ ${aiModel} calibration complete: ${wins}W/${losses}L (${(winRate * 100).toFixed(0)}%)`);
    console.log(`   Learnings: ${keyLearnings.join('; ')}`);

    return calibration;
  } catch (error) {
    console.error(`Error calibrating ${aiModel}:`, error);
    return null;
  }
}

// ============================================================================
// CORRELATION HELPER
// ============================================================================

function calculateCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length < 2) return 0;

  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
  const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  return denominator !== 0 ? numerator / denominator : 0;
}

// ============================================================================
// GET LATEST CALIBRATION
// ============================================================================

export async function getLatestCalibration(
  aiModel: AIModelName
): Promise<AICalibration | null> {
  try {
    const { data, error } = await getSupabase()
      .from('market_weekly_reports')
      .select('*')
      .eq('ai_model_id', aiModel)
      .order('calibration_date', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      aiModel: data.ai_model,
      calibrationDate: new Date(data.calibration_date),
      totalPicks: data.total_picks,
      wins: data.wins,
      losses: data.losses,
      winRate: data.win_rate,
      avgReturn: data.avg_return,
      avgConfidence: data.avg_confidence,
      confidenceAccuracyCorrelation: data.confidence_accuracy_correlation,
      overconfidenceScore: data.overconfidence_score,
      factorPerformance: data.factor_performance,
      bestSectors: data.best_sectors,
      worstSectors: data.worst_sectors,
      bestMarketConditions: data.best_market_conditions,
      worstMarketConditions: data.worst_market_conditions,
      keyLearnings: data.key_learnings,
      adjustments: data.adjustments,
    };
  } catch (error) {
    console.error('Error getting latest calibration:', error);
    return null;
  }
}

// ============================================================================
// RUN ALL CALIBRATIONS
// ============================================================================

export async function runAllCalibrations(): Promise<void> {
  const aiModels: Exclude<AIModelName, 'javari'>[] = ['gpt4', 'claude', 'gemini', 'perplexity'];

  console.log('\n' + '='.repeat(60));
  console.log('🔧 STARTING WEEKLY CALIBRATIONS');
  console.log('='.repeat(60));

  for (const model of aiModels) {
    try {
      const calibration = await runWeeklyCalibration(model);
      if (calibration) {
        console.log(`✅ ${model} calibrated: ${calibration.wins}W/${calibration.losses}L`);
      } else {
        console.log(`⏭️ ${model} skipped (insufficient data)`);
      }
    } catch (error) {
      console.error(`❌ ${model} calibration failed:`, error);
    }

    // Small delay between models
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log('='.repeat(60));
  console.log('✅ ALL CALIBRATIONS COMPLETE');
  console.log('='.repeat(60) + '\n');
}

// ============================================================================
// GET CALIBRATION REPORT
// ============================================================================

export async function getCalibrationReport(): Promise<string> {
  const aiModels: AIModelName[] = ['gpt4', 'claude', 'gemini', 'perplexity'];
  
  let report = `# Market Oracle AI Calibration Report\n`;
  report += `Generated: ${new Date().toISOString()}\n\n`;
  
  for (const model of aiModels) {
    const cal = await getLatestCalibration(model);
    if (cal) {
      report += `## ${model.toUpperCase()}\n`;
      report += `- Win Rate: ${(cal.winRate * 100).toFixed(1)}%\n`;
      report += `- Total Picks: ${cal.totalPicks}\n`;
      report += `- Avg Return: ${cal.avgReturn.toFixed(2)}%\n`;
      report += `- Overconfidence: ${cal.overconfidenceScore.toFixed(1)}\n`;
      report += `- Best Sectors: ${cal.bestSectors.join(', ') || 'N/A'}\n`;
      report += `\n### Key Learnings\n`;
      for (const learning of cal.keyLearnings) {
        report += `- ${learning}\n`;
      }
      report += `\n### Adjustments\n`;
      for (const adj of cal.adjustments) {
        report += `- ${adj}\n`;
      }
      report += `\n`;
    }
  }
  
  return report;
}

export default {
  processPickOutcome,
  runWeeklyCalibration,
  runAllCalibrations,
  getLatestCalibration,
  getCalibrationReport,
};
