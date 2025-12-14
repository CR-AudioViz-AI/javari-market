// app/api/ai-picks/generate/route.ts
// Market Oracle Ultimate - Generate AI Picks API
// Created: December 13, 2025
// Updated: December 14, 2025 - Added DB error reporting

import { NextRequest, NextResponse } from 'next/server';
import { generateAllAIPicks, generatePickFromAI } from '@/lib/ai/pick-generator';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const { symbol, aiModel } = await request.json();

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol is required' },
        { status: 400 }
      );
    }

    const upperSymbol = symbol.toUpperCase();

    // If specific AI model requested, generate just that one
    if (aiModel && aiModel !== 'all' && aiModel !== 'javari') {
      const pick = await generatePickFromAI(aiModel, upperSymbol);
      
      if (!pick) {
        return NextResponse.json(
          { error: `Failed to generate ${aiModel} pick for ${upperSymbol}` },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        pick,
        timestamp: new Date().toISOString(),
      });
    }

    // Generate all AI picks + Javari consensus
    const result = await generateAllAIPicks(upperSymbol);

    return NextResponse.json({
      success: true,
      symbol: upperSymbol,
      picks: result.picks,
      consensus: result.consensus,
      dbErrors: result.dbErrors,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error generating picks:', error);
    return NextResponse.json(
      { error: 'Failed to generate picks', details: String(error) },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch recent picks
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const aiModel = searchParams.get('ai');
    const limit = parseInt(searchParams.get('limit') || '20');

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let query = supabase
      .from('market_oracle_picks')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (symbol) {
      query = query.eq('symbol', symbol.toUpperCase());
    }

    if (aiModel) {
      query = query.eq('ai_model', aiModel);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch picks', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      picks: data,
      count: data.length,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error fetching picks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch picks', details: String(error) },
      { status: 500 }
    );
  }
}
