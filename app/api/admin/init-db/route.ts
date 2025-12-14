// app/api/admin/init-db/route.ts
// Market Oracle - Database Initialization Endpoint
// Created: December 13, 2025
// ADMIN ONLY - Initialize database tables

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'market-oracle-init-2025';

export async function POST(request: NextRequest) {
  try {
    // Check authorization
    const authHeader = request.headers.get('authorization');
    const providedSecret = authHeader?.replace('Bearer ', '');
    
    if (providedSecret !== ADMIN_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Missing Supabase configuration' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const results: { table: string; status: string; error?: string }[] = [];

    // Table 1: market_oracle_picks
    const { error: error1 } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS market_oracle_picks (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          ai_model TEXT NOT NULL,
          symbol TEXT NOT NULL,
          company_name TEXT,
          sector TEXT,
          direction TEXT NOT NULL CHECK (direction IN ('UP', 'DOWN', 'HOLD')),
          confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
          timeframe TEXT DEFAULT '1W',
          entry_price DECIMAL(12,4) NOT NULL DEFAULT 0,
          target_price DECIMAL(12,4) NOT NULL DEFAULT 0,
          stop_loss DECIMAL(12,4) NOT NULL DEFAULT 0,
          thesis TEXT,
          full_reasoning TEXT,
          factor_assessments JSONB DEFAULT '[]'::jsonb,
          key_bullish_factors TEXT[] DEFAULT '{}',
          key_bearish_factors TEXT[] DEFAULT '{}',
          risks TEXT[] DEFAULT '{}',
          catalysts TEXT[] DEFAULT '{}',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          expires_at TIMESTAMPTZ,
          status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'WIN', 'LOSS', 'EXPIRED')),
          closed_at TIMESTAMPTZ,
          closed_price DECIMAL(12,4),
          actual_return DECIMAL(8,4),
          hit_target BOOLEAN,
          hit_stop_loss BOOLEAN,
          days_held INTEGER
        );
      `
    });
    
    results.push({
      table: 'market_oracle_picks',
      status: error1 ? 'error' : 'success',
      error: error1?.message
    });

    // Since RPC might not work, try direct insert to check if tables exist
    // and create them via alternative method if needed

    // Check if tables exist by trying to select from them
    const { error: checkError } = await supabase
      .from('market_oracle_picks')
      .select('id')
      .limit(1);

    if (checkError && checkError.code === '42P01') {
      // Table doesn't exist - provide SQL for manual execution
      return NextResponse.json({
        status: 'tables_need_creation',
        message: 'Tables do not exist. Please run the SQL schema in Supabase SQL Editor.',
        sqlUrl: 'https://supabase.com/dashboard/project/kteobfyferrukqeolofj/sql',
        schemaFile: '/supabase/learning-schema.sql',
        instructions: [
          '1. Go to Supabase Dashboard > SQL Editor',
          '2. Open the learning-schema.sql file from the repo',
          '3. Copy and paste the SQL',
          '4. Click "Run" to create all tables',
          '5. Call this endpoint again to verify'
        ]
      });
    }

    // Tables exist - verify them
    const tableChecks = [
      'market_oracle_picks',
      'market_oracle_factor_outcomes', 
      'market_oracle_calibrations',
      'market_oracle_consensus_picks',
      'market_oracle_consensus_stats'
    ];

    const verifiedTables: string[] = [];
    const missingTables: string[] = [];

    for (const table of tableChecks) {
      const { error } = await supabase.from(table).select('id').limit(1);
      if (error && error.code === '42P01') {
        missingTables.push(table);
      } else {
        verifiedTables.push(table);
      }
    }

    return NextResponse.json({
      status: missingTables.length === 0 ? 'success' : 'partial',
      verified_tables: verifiedTables,
      missing_tables: missingTables,
      message: missingTables.length === 0 
        ? 'All tables are ready!' 
        : `Missing tables: ${missingTables.join(', ')}. Run the schema SQL.`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Init DB error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/admin/init-db',
    method: 'POST',
    headers: {
      'Authorization': 'Bearer {ADMIN_SECRET}'
    },
    description: 'Initialize or verify Market Oracle database tables'
  });
}
