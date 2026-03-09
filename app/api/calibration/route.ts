// app/api/calibration/route.ts
// Market Oracle Ultimate - AI Calibration API
// Created: December 13, 2025

import { NextRequest, NextResponse } from 'next/server';
import { 
  runWeeklyCalibration, 
  runAllCalibrations, 
  getLatestCalibration,
  getCalibrationReport 
} from '@/lib/learning/calibration-engine';
import type { AIModelName } from '@/lib/types/learning';

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const runtime = 'nodejs';
export const maxDuration = 120; // Allow up to 2 minutes for full calibration

// POST - Run calibration
export async function POST(request: NextRequest) {
  try {
    const { aiModel, runAll } = await request.json();

    // Run calibration for all models
    if (runAll) {
      await runAllCalibrations();
      return NextResponse.json({
        success: true,
        message: 'All calibrations complete',
        timestamp: new Date().toISOString(),
      });
    }

    // Run calibration for specific model
    if (aiModel && aiModel !== 'javari') {
      const calibration = await runWeeklyCalibration(aiModel as Exclude<AIModelName, 'javari'>);
      
      if (!calibration) {
        return NextResponse.json({
          success: false,
          message: `Insufficient data to calibrate ${aiModel}`,
          timestamp: new Date().toISOString(),
        });
      }

      return NextResponse.json({
        success: true,
        calibration,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json(
      { error: 'aiModel or runAll required' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error running calibration:', error);
    return NextResponse.json(
      { error: 'Failed to run calibration', details: String(error) },
      { status: 500 }
    );
  }
}

// GET - Get calibration data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const aiModel = searchParams.get('ai') as AIModelName | null;
    const format = searchParams.get('format'); // 'json' or 'report'

    // Return markdown report
    if (format === 'report') {
      const report = await getCalibrationReport();
      return new NextResponse(report, {
        headers: {
          'Content-Type': 'text/markdown',
        },
      });
    }

    // Get specific AI calibration
    if (aiModel && aiModel !== 'javari') {
      const calibration = await getLatestCalibration(aiModel);
      
      if (!calibration) {
        return NextResponse.json({
          success: false,
          message: `No calibration data for ${aiModel}`,
          timestamp: new Date().toISOString(),
        });
      }

      return NextResponse.json({
        success: true,
        calibration,
        timestamp: new Date().toISOString(),
      });
    }

    // Get all AI calibrations
    const aiModels: Exclude<AIModelName, 'javari'>[] = ['gpt4', 'claude', 'gemini', 'perplexity'];
    const calibrations: Record<string, unknown> = {};

    for (const model of aiModels) {
      calibrations[model] = await getLatestCalibration(model);
    }

    return NextResponse.json({
      success: true,
      calibrations,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error fetching calibration:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calibration', details: String(error) },
      { status: 500 }
    );
  }
}
