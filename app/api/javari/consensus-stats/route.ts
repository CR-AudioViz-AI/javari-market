// app/api/javari/consensus-stats/route.ts
// Market Oracle Ultimate - Javari Consensus Stats API
// Created: December 13, 2025

import { NextRequest, NextResponse } from 'next/server';
import { getTopAICombinations, generateJavariWeeklyReport } from '@/lib/learning/javari-consensus';

export const runtime = 'nodejs';

// GET - Get consensus stats
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Get weekly report
    if (format === 'report') {
      const report = await generateJavariWeeklyReport();
      return NextResponse.json({
        success: true,
        report,
        timestamp: new Date().toISOString(),
      });
    }

    // Get top AI combinations
    const stats = await getTopAICombinations(limit);

    return NextResponse.json({
      success: true,
      stats,
      count: stats.length,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error fetching Javari stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Javari stats', details: String(error) },
      { status: 500 }
    );
  }
}
