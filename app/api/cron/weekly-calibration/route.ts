// app/api/cron/weekly-calibration/route.ts
// Market Oracle Ultimate - Weekly AI Calibration Cron
// Created: December 13, 2025
// Runs: Every Sunday at 8 PM EST

import { NextRequest, NextResponse } from 'next/server';
import { runAllCalibrations, getCalibrationReport } from '@/lib/learning/calibration-engine';
import { generateJavariWeeklyReport } from '@/lib/learning/javari-consensus';

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes for full calibration

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (Vercel sends this)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      // Also allow manual triggers in development
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('🗓️ WEEKLY CALIBRATION CRON - ' + new Date().toISOString());
    console.log('='.repeat(60) + '\n');

    // Run all AI calibrations
    await runAllCalibrations();

    // Generate reports
    const calibrationReport = await getCalibrationReport();
    const javariReport = await generateJavariWeeklyReport();

    console.log('\n📊 JAVARI WEEKLY REPORT');
    console.log('Overall Accuracy:', (javariReport.overall_accuracy * 100).toFixed(1) + '%');
    console.log('Best AI Combo:', javariReport.best_ai_combo);
    console.log('Key Learnings:', javariReport.key_learnings.join('; '));
    console.log('Focus:', javariReport.focus_for_next_week);

    // Store weekly report in database
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    await supabase
      .from('market_oracle_learning_queue')
      .insert({
        task_type: 'GENERATE_REPORT',
        status: 'COMPLETE',
        result: {
          calibration_report: calibrationReport,
          javari_report: javariReport,
          generated_at: new Date().toISOString(),
        },
        processed_at: new Date().toISOString(),
      });

    return NextResponse.json({
      success: true,
      message: 'Weekly calibration complete',
      javariReport,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error in weekly calibration cron:', error);
    return NextResponse.json(
      { error: 'Calibration failed', details: String(error) },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}
