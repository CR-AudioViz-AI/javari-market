// lib/learning/javari-consensus.ts
// Market Oracle Ultimate - Javari AI Consensus System
// Created: December 13, 2025
// Purpose: Meta-learning system that learns which AI combinations to trust

import { createClient } from '@supabase/supabase-js';
import type { 
  AIModelName, 
  PickDirection, 
  ConsensusAssessment,
  JavariConsensusStats,
  AIPick 
} from '../types/learning';
import { getLatestCalibration } from './calibration-engine';

// ============================================================================
// SUPABASE CLIENT
// ============================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ============================================================================
// BUILD JAVARI CONSENSUS
// ============================================================================

export async function buildJavariConsensus(
  symbol: string,
  aiPicks: { aiModel: AIModelName; direction: PickDirection; confidence: number; pickId: string }[]
): Promise<ConsensusAssessment> {
  try {
    // Get latest calibrations for weighting
    const calibrations: Record<AIModelName, { winRate: number; avgConfidence: number }> = {
      gpt4: { winRate: 0.5, avgConfidence: 70 },
      claude: { winRate: 0.5, avgConfidence: 70 },
      gemini: { winRate: 0.5, avgConfidence: 70 },
      perplexity: { winRate: 0.5, avgConfidence: 70 },
      javari: { winRate: 0.5, avgConfidence: 70 },
    };

    for (const model of ['gpt4', 'claude', 'gemini', 'perplexity'] as AIModelName[]) {
      const cal = await getLatestCalibration(model);
      if (cal) {
        calibrations[model] = {
          winRate: cal.winRate,
          avgConfidence: cal.avgConfidence,
        };
      }
    }

    // Count votes weighted by historical accuracy
    let upVotes = 0;
    let downVotes = 0;
    let holdVotes = 0;
    let totalWeight = 0;

    for (const pick of aiPicks) {
      const weight = calibrations[pick.aiModel].winRate;
      totalWeight += weight;

      if (pick.direction === 'UP') {
        upVotes += weight * (pick.confidence / 100);
      } else if (pick.direction === 'DOWN') {
        downVotes += weight * (pick.confidence / 100);
      } else {
        holdVotes += weight * (pick.confidence / 100);
      }
    }

    // Determine consensus direction
    const normalizedUp = totalWeight > 0 ? upVotes / totalWeight : 0;
    const normalizedDown = totalWeight > 0 ? downVotes / totalWeight : 0;
    const normalizedHold = totalWeight > 0 ? holdVotes / totalWeight : 0;

    let consensusDirection: PickDirection = 'HOLD';
    let consensusStrength = 0;

    if (normalizedUp > normalizedDown && normalizedUp > normalizedHold) {
      consensusDirection = 'UP';
      consensusStrength = normalizedUp;
    } else if (normalizedDown > normalizedUp && normalizedDown > normalizedHold) {
      consensusDirection = 'DOWN';
      consensusStrength = normalizedDown;
    } else {
      consensusDirection = 'HOLD';
      consensusStrength = normalizedHold;
    }

    // Calculate weighted confidence
    const weightedConfidence = aiPicks.reduce((sum, pick) => {
      const weight = calibrations[pick.aiModel].winRate;
      return sum + pick.confidence * weight;
    }, 0) / totalWeight;

    // Check historical performance of this AI combination
    const aiCombination = aiPicks
      .filter(p => p.direction === consensusDirection)
      .map(p => p.aiModel)
      .sort();

    const historicalPerformance = await getConsensusHistoricalPerformance(aiCombination);

    // Generate Javari's reasoning
    const agreementCount = aiPicks.filter(p => p.direction === consensusDirection).length;
    const disagreementCount = aiPicks.length - agreementCount;

    let javariReasoning = '';
    let javariConfidence = weightedConfidence;

    if (agreementCount >= 3) {
      javariReasoning = `Strong consensus: ${agreementCount}/${aiPicks.length} AIs agree on ${consensusDirection}. `;
      javariConfidence = Math.min(95, weightedConfidence + 10);
    } else if (agreementCount === 2) {
      javariReasoning = `Moderate consensus: ${agreementCount}/${aiPicks.length} AIs agree on ${consensusDirection}. `;
    } else {
      javariReasoning = `Weak consensus: Only ${agreementCount}/${aiPicks.length} AI supports ${consensusDirection}. `;
      javariConfidence = Math.max(30, weightedConfidence - 15);
    }

    // Adjust based on historical performance
    if (historicalPerformance && historicalPerformance.timesAgreed >= 10) {
      if (historicalPerformance.accuracyRate > 0.65) {
        javariReasoning += `This AI combination has ${(historicalPerformance.accuracyRate * 100).toFixed(0)}% historical accuracy. `;
        javariConfidence = Math.min(95, javariConfidence + 5);
      } else if (historicalPerformance.accuracyRate < 0.45) {
        javariReasoning += `Caution: This AI combination has underperformed historically (${(historicalPerformance.accuracyRate * 100).toFixed(0)}%). `;
        javariConfidence = Math.max(30, javariConfidence - 10);
      }
    }

    // Find similar past setups
    const similarSetups = await findSimilarPastSetups(symbol, aiCombination, consensusDirection);

    const assessment: ConsensusAssessment = {
      symbol,
      aiPicks,
      consensusDirection,
      consensusStrength,
      weightedConfidence,
      javariRecommendation: consensusDirection,
      javariConfidence,
      javariReasoning,
      similarPastSetups: similarSetups,
    };

    // Store this consensus for future learning
    await storeConsensusForLearning(assessment, aiCombination);

    return assessment;
  } catch (error) {
    console.error('Error building Javari consensus:', error);
    
    // Return a basic consensus on error
    return {
      symbol,
      aiPicks,
      consensusDirection: 'HOLD',
      consensusStrength: 0,
      weightedConfidence: 50,
      javariRecommendation: 'HOLD',
      javariConfidence: 50,
      javariReasoning: 'Unable to build consensus due to error',
      similarPastSetups: [],
    };
  }
}

// ============================================================================
// GET CONSENSUS HISTORICAL PERFORMANCE
// ============================================================================

async function getConsensusHistoricalPerformance(
  aiCombination: AIModelName[]
): Promise<JavariConsensusStats | null> {
  try {
    const comboKey = aiCombination.sort().join(',');
    
    const { data, error } = await supabase
      .from('market_oracle_consensus_stats')
      .select('*')
      .eq('ai_combination_key', comboKey)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      aiCombination: data.ai_combination,
      timesAgreed: data.times_agreed,
      accuracyRate: data.accuracy_rate,
      avgReturn: data.avg_return,
      bestSector: data.best_sector,
      worstSector: data.worst_sector,
      lastUpdated: new Date(data.last_updated),
    };
  } catch (error) {
    return null;
  }
}

// ============================================================================
// FIND SIMILAR PAST SETUPS
// ============================================================================

async function findSimilarPastSetups(
  symbol: string,
  aiCombination: AIModelName[],
  direction: PickDirection
): Promise<{ setupId: string; outcome: string; similarity: number }[]> {
  try {
    // Get past consensus picks with same symbol or sector
    const { data: pastPicks, error } = await supabase
      .from('market_oracle_consensus_picks')
      .select('*')
      .eq('direction', direction)
      .in('status', ['WIN', 'LOSS'])
      .order('created_at', { ascending: false })
      .limit(50);

    if (error || !pastPicks) {
      return [];
    }

    const similarSetups: { setupId: string; outcome: string; similarity: number }[] = [];

    for (const pick of pastPicks) {
      // Calculate similarity score
      let similarity = 0;

      // Same symbol = high similarity
      if (pick.symbol === symbol) {
        similarity += 0.5;
      }

      // Same AI combination = high similarity
      const pastCombo = (pick.ai_combination || []).sort();
      const currentCombo = aiCombination.sort();
      const comboOverlap = pastCombo.filter((ai: AIModelName) => currentCombo.includes(ai)).length;
      similarity += (comboOverlap / Math.max(pastCombo.length, currentCombo.length)) * 0.3;

      // Same direction already matched in query
      similarity += 0.2;

      if (similarity > 0.3) {
        similarSetups.push({
          setupId: pick.id,
          outcome: pick.status,
          similarity,
        });
      }
    }

    return similarSetups
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5);
  } catch (error) {
    return [];
  }
}

// ============================================================================
// STORE CONSENSUS FOR LEARNING
// ============================================================================

async function storeConsensusForLearning(
  assessment: ConsensusAssessment,
  aiCombination: AIModelName[]
): Promise<void> {
  try {
    const { error } = await supabase
      .from('market_oracle_consensus_picks')
      .insert({
        symbol: assessment.symbol,
        direction: assessment.consensusDirection,
        ai_combination: aiCombination,
        ai_combination_key: aiCombination.sort().join(','),
        consensus_strength: assessment.consensusStrength,
        weighted_confidence: assessment.weightedConfidence,
        javari_confidence: assessment.javariConfidence,
        javari_reasoning: assessment.javariReasoning,
        status: 'PENDING',
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error storing consensus:', error);
    }
  } catch (error) {
    console.error('Error in storeConsensusForLearning:', error);
  }
}

// ============================================================================
// UPDATE CONSENSUS PERFORMANCE
// ============================================================================

export async function updateConsensusPerformance(
  consensusPickId: string,
  outcome: 'WIN' | 'LOSS',
  actualReturn: number
): Promise<void> {
  try {
    // Get the consensus pick
    const { data: pick, error: pickError } = await supabase
      .from('market_oracle_consensus_picks')
      .select('*')
      .eq('id', consensusPickId)
      .single();

    if (pickError || !pick) {
      console.error('Consensus pick not found:', consensusPickId);
      return;
    }

    // Update the pick status
    await supabase
      .from('market_oracle_consensus_picks')
      .update({
        status: outcome,
        actual_return: actualReturn,
        closed_at: new Date().toISOString(),
      })
      .eq('id', consensusPickId);

    // Update consensus stats
    const comboKey = pick.ai_combination_key;
    
    // Get or create stats record
    const { data: stats, error: statsError } = await supabase
      .from('market_oracle_consensus_stats')
      .select('*')
      .eq('ai_combination_key', comboKey)
      .single();

    if (statsError && statsError.code !== 'PGRST116') {
      // Error other than "not found"
      console.error('Error fetching consensus stats:', statsError);
      return;
    }

    if (!stats) {
      // Create new stats record
      await supabase
        .from('market_oracle_consensus_stats')
        .insert({
          ai_combination: pick.ai_combination,
          ai_combination_key: comboKey,
          times_agreed: 1,
          wins: outcome === 'WIN' ? 1 : 0,
          losses: outcome === 'LOSS' ? 1 : 0,
          accuracy_rate: outcome === 'WIN' ? 1 : 0,
          avg_return: actualReturn,
          total_return: actualReturn,
          accuracy_by_sector: {},
          last_updated: new Date().toISOString(),
        });
    } else {
      // Update existing stats
      const newTimesAgreed = stats.times_agreed + 1;
      const newWins = stats.wins + (outcome === 'WIN' ? 1 : 0);
      const newLosses = stats.losses + (outcome === 'LOSS' ? 1 : 0);
      const newTotalReturn = stats.total_return + actualReturn;
      
      await supabase
        .from('market_oracle_consensus_stats')
        .update({
          times_agreed: newTimesAgreed,
          wins: newWins,
          losses: newLosses,
          accuracy_rate: newWins / newTimesAgreed,
          avg_return: newTotalReturn / newTimesAgreed,
          total_return: newTotalReturn,
          last_updated: new Date().toISOString(),
        })
        .eq('ai_combination_key', comboKey);
    }

    console.log(`✅ Updated consensus stats for ${comboKey}: ${outcome}`);
  } catch (error) {
    console.error('Error updating consensus performance:', error);
  }
}

// ============================================================================
// GET TOP AI COMBINATIONS
// ============================================================================

export async function getTopAICombinations(
  minSamples: number = 10
): Promise<JavariConsensusStats[]> {
  try {
    const { data, error } = await supabase
      .from('market_oracle_consensus_stats')
      .select('*')
      .gte('times_agreed', minSamples)
      .order('accuracy_rate', { ascending: false })
      .limit(10);

    if (error || !data) {
      return [];
    }

    return data.map(d => ({
      aiCombination: d.ai_combination,
      timesAgreed: d.times_agreed,
      accuracyRate: d.accuracy_rate,
      avgReturn: d.avg_return,
      bestSector: d.best_sector || 'N/A',
      worstSector: d.worst_sector || 'N/A',
      lastUpdated: new Date(d.last_updated),
    }));
  } catch (error) {
    console.error('Error getting top AI combinations:', error);
    return [];
  }
}

// ============================================================================
// GENERATE JAVARI WEEKLY REPORT
// ============================================================================

export async function generateJavariWeeklyReport(): Promise<{
  overall_accuracy: number;
  best_ai_combo: string;
  best_ai_combo_accuracy: number;
  key_learnings: string[];
  focus_for_next_week: string;
}> {
  try {
    // Get all consensus stats
    const { data: consensusData, error } = await supabase
      .from('market_oracle_consensus_stats')
      .select('*')
      .gte('times_agreed', 5)
      .order('accuracy_rate', { ascending: false });

    if (error || !consensusData || consensusData.length === 0) {
      return {
        overall_accuracy: 0.5,
        best_ai_combo: 'Insufficient data',
        best_ai_combo_accuracy: 0.5,
        key_learnings: ['Building initial data set'],
        focus_for_next_week: 'Continue gathering data on AI combinations',
      };
    }

    // Calculate overall weighted accuracy
    let totalWeightedAccuracy = 0;
    let totalWeight = 0;

    for (const combo of consensusData) {
      totalWeightedAccuracy += combo.accuracy_rate * combo.times_agreed;
      totalWeight += combo.times_agreed;
    }

    const overallAccuracy = totalWeight > 0 ? totalWeightedAccuracy / totalWeight : 0.5;

    // Find best combo with sufficient data
    const validCombos = consensusData.filter(c => c.times_agreed >= 10);
    const bestCombo = validCombos[0] || consensusData[0];

    // Generate learnings
    const learnings: string[] = [];

    if (bestCombo && bestCombo.accuracy_rate > 0.65) {
      learnings.push(`The ${bestCombo.ai_combination.join(' + ')} combination shows strong performance at ${(bestCombo.accuracy_rate * 100).toFixed(0)}% accuracy.`);
    }

    // Find improving combos
    for (const combo of consensusData.slice(0, 5)) {
      if (combo.times_agreed >= 5) {
        const sectorPerf = combo.accuracy_by_sector || {};
        const bestSector = Object.entries(sectorPerf)
          .sort((a, b) => (b[1] as number) - (a[1] as number))[0];

        if (bestSector && (bestSector[1] as number) > combo.accuracy_rate + 0.1) {
          learnings.push(`${combo.ai_combination.join(' + ')} performs especially well in ${bestSector[0]} (${((bestSector[1] as number) * 100).toFixed(0)}% accuracy).`);
        }
      }
    }

    if (learnings.length === 0) {
      learnings.push('Continuing to build data on AI combination performance.');
    }

    return {
      overall_accuracy: overallAccuracy,
      best_ai_combo: bestCombo?.ai_combination.join(' + ') || 'Insufficient data',
      best_ai_combo_accuracy: bestCombo?.accuracy_rate || 0.5,
      key_learnings: learnings.slice(0, 5),
      focus_for_next_week: overallAccuracy < 0.60
        ? 'Focus on higher-consensus picks (3+ AI agreement) to improve accuracy.'
        : 'Continue current approach while monitoring for market regime changes.',
    };
  } catch (error) {
    console.error('Error generating Javari weekly report:', error);
    return {
      overall_accuracy: 0.5,
      best_ai_combo: 'Error',
      best_ai_combo_accuracy: 0.5,
      key_learnings: ['Error generating report'],
      focus_for_next_week: 'Review system logs',
    };
  }
}

export default {
  buildJavariConsensus,
  updateConsensusPerformance,
  getTopAICombinations,
  generateJavariWeeklyReport,
};
