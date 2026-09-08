// app/api/admin/init-db/route.ts
// Market Oracle - Database Initialization Endpoint
// Created: December 13, 2025
// ADMIN ONLY - Initialize database tables

import { NextRequest, NextResponse } from 'next/server';
import { secretKey, supabaseUrl } from "@craudioviz/platform-sdk";

export const dynamic = "force-dynamic";

// ⚠️ _supabase MUST be declared before getSupabase() — TDZ guard
let _supabase: ReturnType<typeof createClient> | null = null;
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

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'market-oracle-init-2025';


function requireAdmin(request: Request): Response | null {
  const secret = process.env.ADMIN_API_SECRET ?? process.env.CRON_SECRET ?? '';
  if (!secret) {
    return new Response(JSON.stringify({ error: 'Not configured.', code: 'NOT_CONFIGURED' }),
      { status: 503, headers: { 'content-type': 'application/json' } });
  }
  const given = request.headers.get('x-admin-secret')
    ?? (request.headers.get('authorization') ?? '').replace(/^Bearer /, '');
  const a = Buffer.from(given);
  const b = Buffer.from(secret);
  const ok = a.length === b.length && require('node:crypto').timingSafeEqual(a, b);
  if (!ok) {
    return new Response(JSON.stringify({ error: 'Forbidden', code: 'ADMIN_ONLY' }),
      { status: 403, headers: { 'content-type': 'application/json' } });
  }
  return null;
}

export async function POST(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  try {
    // Check authorization
    const authHeader = request.headers.get('authorization');
    const providedSecret = authHeader?.replace('Bearer ', '');
    
    if (providedSecret !== ADMIN_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const SUPABASE_URL = supabaseUrl();
    const supabaseServiceKey = secretKey();

    if (!SUPABASE_URL || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Missing Supabase configuration' }, { status: 500 });
    }

    // 2026-08-24: called createClient() with NO IMPORT - a plain ReferenceError,
    // so this route crashed on the first line touching the database. Same class as
    // the 15 undefined calls found across the core expenses module. The file
    // already obtains the SDK via require inside getSupabase(); this call site was
    // missed. Now uses the same runtime import.
    const { createClient: _mk } = require('@supabase/supabase-js');
    const supabase = _mk(SUPABASE_URL, supabaseServiceKey);

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
