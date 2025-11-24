/**
 * MARKET ORACLE - TEST PICKS API
 * Bypasses auth for testing
 * November 24, 2025 - 5:35 AM ET
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  generateAllPredictions,
  savePredictionsToDatabase,
  getOrCreateActiveCompetition,
  calculateWeekNumber,
} from '@/lib/ai-prediction-engine';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET() {
  try {
    console.log('🚀 TEST: Starting picks generation...');

    // Get or create active competition
    const competition = await getOrCreateActiveCompetition();
    
    if (!competition) {
      return NextResponse.json(
        { success: false, error: 'Failed to get/create competition' },
        { status: 500 }
      );
    }

    const weekNumber = calculateWeekNumber(competition.start_date);

    console.log(`📅 Competition: ${competition.name}, Week: ${weekNumber}`);

    // Generate predictions from all 5 AIs
    const predictions = await generateAllPredictions();

    // Save to database
    await savePredictionsToDatabase(predictions, competition.id, weekNumber);

    // Build summary
    const summary = predictions.map(p => ({
      aiModel: p.aiModel,
      success: p.success,
      picksCount: p.picks.length,
      error: p.error,
    }));

    const successCount = predictions.filter(p => p.success).length;
    const totalPicks = predictions.reduce((sum, p) => sum + p.picks.length, 0);

    console.log(`✅ Generated ${totalPicks} picks from ${successCount}/5 AIs`);

    return NextResponse.json({
      success: true,
      competition: {
        id: competition.id,
        name: competition.name,
        week: weekNumber,
      },
      summary: {
        totalPicks,
        successfulAIs: successCount,
        failedAIs: 5 - successCount,
      },
      predictions: summary,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Test picks error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
