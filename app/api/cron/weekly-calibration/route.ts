// app/api/cron/weekly-calibration/route.ts
// Market Oracle Ultimate - Weekly AI Calibration Cron
// Created: December 13, 2025
// Runs: Every Sunday at 8 PM EST

import { NextRequest, NextResponse } from 'next/server';
import { runAllCalibrations, getCalibrationReport } from '@/lib/learning/calibration-engine';
import { generateJavariWeeklyReport } from '@/lib/learning/javari-consensus';
import type { SupabaseClient } from "@supabase/supabase-js";
import { secretKey, supabaseUrl } from "@craudioviz/platform-sdk";

export const dynamic = "force-dynamic";

// ⚠️ _supabase MUST be declared before getSupabase() — TDZ guard
// 2026-09-11: was ReturnType<typeof createClient> with no createClient imported (it is
// require()d at runtime), so this file never type-checked.
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

export const runtime = "nodejs";

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
      supabaseUrl(),
      secretKey()
    );

    // 2026-09-11: was written to market_oracle_learning_queue, a table of the retired
    // pick system that nothing ever read back. Weekly reports now live in their own
    // table so they can actually be shown on the site.
    const { error: reportError } = await supabase
      .from('market_weekly_reports')
      .insert({
        week_ending: new Date().toISOString().slice(0, 10),
        calibration_report: calibrationReport,
        summary: javariReport,
      });
    if (reportError) console.error(JSON.stringify({ level: 'error', msg: 'market.weekly_report_write_failed', error: reportError.message }));

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
