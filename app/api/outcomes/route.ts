// app/api/outcomes/route.ts
// Market Oracle Ultimate - Outcome Tracking API
// Created: December 14, 2025
// Purpose: Process expired picks and track outcomes for learning

import { NextRequest, NextResponse } from 'next/server';
import { 
  processExpiredPicks, 
  getPendingPicksStatus,
  forceResolvePick 
} from '@/lib/learning/outcome-tracker';

function getSupabase() {
  var sb = require('@supabase/supabase-js')
  var url = process.env.NEXT_PUBLIC_SUPABASE_URL
  var key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return sb.createClient(url, key, { auth: { persistSession: false } })
}


export const maxDuration = 120; // Allow up to 2 minutes for batch processing

// POST: Process expired picks (for cron job)
export async function POST(request: NextRequest) {
  try {
    const { action, pickId } = await request.json().catch(() => ({}));
    
    // Force resolve a specific pick (for testing)
    if (action === 'force-resolve' && pickId) {
      const result = await forceResolvePick(pickId);
      return NextResponse.json({
        success: result.success,
        outcome: result.outcome,
        error: result.error,
        timestamp: new Date().toISOString(),
      });
    }
    
    // Process all expired picks
    const results = await processExpiredPicks();
    
    return NextResponse.json({
      success: true,
      results,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('Error processing outcomes:', error);
    return NextResponse.json(
      { error: 'Failed to process outcomes', details: String(error) },
      { status: 500 }
    );
  }
}

// GET: Get pending picks status
export async function GET() {
  try {
    const status = await getPendingPicksStatus();
    
    return NextResponse.json({
      success: true,
      ...status,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('Error getting pending status:', error);
    return NextResponse.json(
      { error: 'Failed to get pending status', details: String(error) },
      { status: 500 }
    );
  }
}
