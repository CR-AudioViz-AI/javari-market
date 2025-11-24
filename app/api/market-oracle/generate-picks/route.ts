/**
 * MARKET ORACLE - GENERATE PICKS API
 * November 24, 2025 - 5:24 AM ET
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  generateAllPredictions,
  savePredictionsToDatabase,
  getOrCreateActiveCompetition,
  calculateWeekNumber,
} from '@/lib/ai-prediction-engine';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60 seconds for AI calls

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret for automated calls
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🚀 Starting weekly picks generation...');

    // Get or create active competition
    const competition = await getOrCreateActiveCompetition();
    
    if (!competition) {
      return NextResponse.json(
        { success: false, error: 'Failed to get/create competition' },
        { status: 500 }
      );
    }

    // Calculate current week number
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
    console.error('Generate picks error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const trigger = searchParams.get('trigger');

    // Allow manual trigger for testing
    if (trigger === 'manual') {
      return POST(request);
    }

    return NextResponse.json({
      success: true,
      message: 'Weekly Picks Generator API',
      usage: {
        post: 'POST with Authorization: Bearer {CRON_SECRET}',
        manualTrigger: 'GET ?trigger=manual',
      },
      schedule: 'Every Monday at 6 AM ET',
    });

  } catch (error) {
    console.error('API info error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
