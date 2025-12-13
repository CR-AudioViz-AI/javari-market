// lib/learning/factor-tracker.ts
// Market Oracle Ultimate - Factor Performance Tracker
// Created: December 13, 2025
// Purpose: Track which factors actually predict stock movements

import { createClient } from '@supabase/supabase-js';
import type { 
  AIModelName, 
  FactorAssessment, 
  PickOutcome,
  FactorCategory,
  MarketFactor,
  MARKET_FACTORS 
} from '../types/learning';

// ============================================================================
// SUPABASE CLIENT
// ============================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ============================================================================
// TYPES
// ============================================================================

interface FactorOutcome {
  factorId: string;
  factorName: string;
  interpretation: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  confidence: number;
  outcome: PickOutcome;
  actualReturn: number;
  aiModel: AIModelName;
  sector: string;
  timestamp: Date;
}

interface FactorStats {
  factorId: string;
  factorName: string;
  category: FactorCategory;
  
  // Overall performance
  totalUsed: number;
  correctPredictions: number;
  accuracy: number;
  avgReturnWhenUsed: number;
  
  // By interpretation
  bullishAccuracy: number;
  bearishAccuracy: number;
  neutralAccuracy: number;
  
  // By AI model
  accuracyByAI: Record<AIModelName, number>;
  
  // By sector
  accuracyBySector: Record<string, number>;
  
  // Confidence correlation
  highConfidenceAccuracy: number; // When confidence > 70
  lowConfidenceAccuracy: number;  // When confidence < 50
  
  // Trend
  recentAccuracy: number; // Last 30 days
  improvingTrend: boolean;
  
  // Recommendation
  recommendedWeight: number; // 0-1
  notes: string[];
}

// ============================================================================
// RECORD FACTOR OUTCOME
// ============================================================================

export async function recordFactorOutcome(
  pickId: string,
  factorAssessments: FactorAssessment[],
  outcome: PickOutcome,
  actualReturn: number,
  aiModel: AIModelName,
  sector: string
): Promise<void> {
  try {
    const outcomes: FactorOutcome[] = factorAssessments.map(fa => ({
      factorId: fa.factorId,
      factorName: fa.factorName,
      interpretation: fa.interpretation,
      confidence: fa.confidence,
      outcome,
      actualReturn,
      aiModel,
      sector,
      timestamp: new Date(),
    }));

    // Store in database
    const { error } = await supabase
      .from('market_oracle_factor_outcomes')
      .insert(outcomes.map(o => ({
        pick_id: pickId,
        factor_id: o.factorId,
        factor_name: o.factorName,
        interpretation: o.interpretation,
        confidence: o.confidence,
        outcome: o.outcome,
        actual_return: o.actualReturn,
        ai_model: o.aiModel,
        sector: o.sector,
        created_at: o.timestamp.toISOString(),
      })));

    if (error) {
      console.error('Error recording factor outcomes:', error);
    } else {
      console.log(`✅ Recorded ${outcomes.length} factor outcomes for pick ${pickId}`);
    }
  } catch (error) {
    console.error('Error in recordFactorOutcome:', error);
  }
}

// ============================================================================
// CALCULATE FACTOR STATS
// ============================================================================

export async function calculateFactorStats(factorId: string): Promise<FactorStats | null> {
  try {
    // Get all outcomes for this factor
    const { data: outcomes, error } = await supabase
      .from('market_oracle_factor_outcomes')
      .select('*')
      .eq('factor_id', factorId)
      .order('created_at', { ascending: false });

    if (error || !outcomes || outcomes.length === 0) {
      return null;
    }

    // Calculate stats
    const totalUsed = outcomes.length;
    const correctPredictions = outcomes.filter(o => {
      if (o.outcome === 'WIN') {
        return (o.interpretation === 'BULLISH') || 
               (o.interpretation === 'BEARISH' && o.actual_return < 0);
      }
      return false;
    }).length;

    const accuracy = totalUsed > 0 ? correctPredictions / totalUsed : 0;
    const avgReturn = outcomes.reduce((sum, o) => sum + (o.actual_return || 0), 0) / totalUsed;

    // By interpretation
    const bullishOutcomes = outcomes.filter(o => o.interpretation === 'BULLISH');
    const bearishOutcomes = outcomes.filter(o => o.interpretation === 'BEARISH');
    const neutralOutcomes = outcomes.filter(o => o.interpretation === 'NEUTRAL');

    const bullishAccuracy = bullishOutcomes.length > 0
      ? bullishOutcomes.filter(o => o.outcome === 'WIN').length / bullishOutcomes.length
      : 0;
    const bearishAccuracy = bearishOutcomes.length > 0
      ? bearishOutcomes.filter(o => o.outcome === 'WIN').length / bearishOutcomes.length
      : 0;
    const neutralAccuracy = neutralOutcomes.length > 0
      ? neutralOutcomes.filter(o => o.outcome === 'WIN').length / neutralOutcomes.length
      : 0;

    // By AI model
    const aiModels: AIModelName[] = ['gpt4', 'claude', 'gemini', 'perplexity'];
    const accuracyByAI: Record<AIModelName, number> = {} as Record<AIModelName, number>;
    
    for (const ai of aiModels) {
      const aiOutcomes = outcomes.filter(o => o.ai_model === ai);
      accuracyByAI[ai] = aiOutcomes.length > 0
        ? aiOutcomes.filter(o => o.outcome === 'WIN').length / aiOutcomes.length
        : 0;
    }
    accuracyByAI.javari = 0; // Javari doesn't use factors directly

    // By sector
    const sectors = [...new Set(outcomes.map(o => o.sector))];
    const accuracyBySector: Record<string, number> = {};
    
    for (const sector of sectors) {
      const sectorOutcomes = outcomes.filter(o => o.sector === sector);
      accuracyBySector[sector] = sectorOutcomes.length > 0
        ? sectorOutcomes.filter(o => o.outcome === 'WIN').length / sectorOutcomes.length
        : 0;
    }

    // Confidence correlation
    const highConfOutcomes = outcomes.filter(o => o.confidence > 70);
    const lowConfOutcomes = outcomes.filter(o => o.confidence < 50);
    
    const highConfidenceAccuracy = highConfOutcomes.length > 0
      ? highConfOutcomes.filter(o => o.outcome === 'WIN').length / highConfOutcomes.length
      : 0;
    const lowConfidenceAccuracy = lowConfOutcomes.length > 0
      ? lowConfOutcomes.filter(o => o.outcome === 'WIN').length / lowConfOutcomes.length
      : 0;

    // Recent trend (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentOutcomes = outcomes.filter(o => new Date(o.created_at) > thirtyDaysAgo);
    const recentAccuracy = recentOutcomes.length > 0
      ? recentOutcomes.filter(o => o.outcome === 'WIN').length / recentOutcomes.length
      : accuracy;

    const improvingTrend = recentAccuracy > accuracy;

    // Calculate recommended weight
    let recommendedWeight = 0.5; // Default
    if (accuracy > 0.7) recommendedWeight = 0.9;
    else if (accuracy > 0.6) recommendedWeight = 0.7;
    else if (accuracy > 0.5) recommendedWeight = 0.5;
    else if (accuracy > 0.4) recommendedWeight = 0.3;
    else recommendedWeight = 0.1;

    // Adjust for confidence correlation
    if (highConfidenceAccuracy > lowConfidenceAccuracy + 0.1) {
      recommendedWeight += 0.1;
    }

    // Generate notes
    const notes: string[] = [];
    if (accuracy > 0.65) {
      notes.push(`Strong predictor with ${(accuracy * 100).toFixed(0)}% accuracy`);
    }
    if (improvingTrend) {
      notes.push('Accuracy improving over recent 30 days');
    }
    if (highConfidenceAccuracy > lowConfidenceAccuracy + 0.15) {
      notes.push('High confidence assessments are significantly more accurate');
    }
    
    const bestSector = Object.entries(accuracyBySector)
      .sort((a, b) => b[1] - a[1])[0];
    if (bestSector && bestSector[1] > accuracy + 0.1) {
      notes.push(`Particularly effective in ${bestSector[0]} sector`);
    }

    // Get factor category from MARKET_FACTORS
    const factorDef = await getFactorDefinition(factorId);

    return {
      factorId,
      factorName: outcomes[0]?.factor_name || factorId,
      category: factorDef?.category || 'technical',
      totalUsed,
      correctPredictions,
      accuracy,
      avgReturnWhenUsed: avgReturn,
      bullishAccuracy,
      bearishAccuracy,
      neutralAccuracy,
      accuracyByAI,
      accuracyBySector,
      highConfidenceAccuracy,
      lowConfidenceAccuracy,
      recentAccuracy,
      improvingTrend,
      recommendedWeight: Math.min(1, Math.max(0, recommendedWeight)),
      notes,
    };
  } catch (error) {
    console.error('Error calculating factor stats:', error);
    return null;
  }
}

// ============================================================================
// GET ALL FACTOR STATS
// ============================================================================

export async function getAllFactorStats(): Promise<FactorStats[]> {
  try {
    // Get distinct factor IDs
    const { data: factors, error } = await supabase
      .from('market_oracle_factor_outcomes')
      .select('factor_id')
      .limit(100);

    if (error || !factors) {
      return [];
    }

    const uniqueFactorIds = [...new Set(factors.map(f => f.factor_id))];
    const stats: FactorStats[] = [];

    for (const factorId of uniqueFactorIds) {
      const factorStats = await calculateFactorStats(factorId);
      if (factorStats) {
        stats.push(factorStats);
      }
    }

    return stats.sort((a, b) => b.accuracy - a.accuracy);
  } catch (error) {
    console.error('Error getting all factor stats:', error);
    return [];
  }
}

// ============================================================================
// GET TOP PERFORMING FACTORS
// ============================================================================

export async function getTopPerformingFactors(
  limit: number = 10,
  minUsage: number = 10
): Promise<FactorStats[]> {
  const allStats = await getAllFactorStats();
  return allStats
    .filter(s => s.totalUsed >= minUsage)
    .sort((a, b) => b.accuracy - a.accuracy)
    .slice(0, limit);
}

// ============================================================================
// GET WORST PERFORMING FACTORS
// ============================================================================

export async function getWorstPerformingFactors(
  limit: number = 10,
  minUsage: number = 10
): Promise<FactorStats[]> {
  const allStats = await getAllFactorStats();
  return allStats
    .filter(s => s.totalUsed >= minUsage)
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, limit);
}

// ============================================================================
// GET FACTOR RECOMMENDATIONS FOR AI
// ============================================================================

export async function getFactorRecommendationsForAI(
  aiModel: AIModelName
): Promise<{
  priorityFactors: string[];
  avoidFactors: string[];
  adjustments: string[];
}> {
  const allStats = await getAllFactorStats();
  
  const priorityFactors: string[] = [];
  const avoidFactors: string[] = [];
  const adjustments: string[] = [];

  for (const stat of allStats) {
    const aiAccuracy = stat.accuracyByAI[aiModel] || 0;
    
    // Factors this AI is good at
    if (aiAccuracy > 0.65 && stat.totalUsed >= 5) {
      priorityFactors.push(stat.factorId);
    }
    
    // Factors this AI should avoid
    if (aiAccuracy < 0.4 && stat.totalUsed >= 5) {
      avoidFactors.push(stat.factorId);
      adjustments.push(`Reduce reliance on ${stat.factorName} (${(aiAccuracy * 100).toFixed(0)}% accuracy)`);
    }
    
    // Specific adjustments
    if (stat.highConfidenceAccuracy < stat.lowConfidenceAccuracy && stat.totalUsed >= 10) {
      adjustments.push(`Recalibrate confidence for ${stat.factorName} - high confidence is less accurate`);
    }
  }

  return {
    priorityFactors,
    avoidFactors,
    adjustments,
  };
}

// ============================================================================
// HELPER: Get factor definition
// ============================================================================

async function getFactorDefinition(factorId: string): Promise<MarketFactor | undefined> {
  // Import dynamically to avoid circular dependency
  const { MARKET_FACTORS } = await import('../types/learning');
  return MARKET_FACTORS.find(f => f.id === factorId);
}

// ============================================================================
// GENERATE FACTOR REPORT
// ============================================================================

export async function generateFactorReport(): Promise<string> {
  const topFactors = await getTopPerformingFactors(5);
  const worstFactors = await getWorstPerformingFactors(5);
  
  let report = `# Market Oracle Factor Performance Report\n`;
  report += `Generated: ${new Date().toISOString()}\n\n`;
  
  report += `## Top Performing Factors\n`;
  for (const factor of topFactors) {
    report += `- **${factor.factorName}**: ${(factor.accuracy * 100).toFixed(1)}% accuracy (${factor.totalUsed} uses)\n`;
    for (const note of factor.notes) {
      report += `  - ${note}\n`;
    }
  }
  
  report += `\n## Factors Needing Attention\n`;
  for (const factor of worstFactors) {
    report += `- **${factor.factorName}**: ${(factor.accuracy * 100).toFixed(1)}% accuracy (${factor.totalUsed} uses)\n`;
    report += `  - Recommended weight: ${factor.recommendedWeight.toFixed(2)}\n`;
  }
  
  return report;
}

export default {
  recordFactorOutcome,
  calculateFactorStats,
  getAllFactorStats,
  getTopPerformingFactors,
  getWorstPerformingFactors,
  getFactorRecommendationsForAI,
  generateFactorReport,
};
