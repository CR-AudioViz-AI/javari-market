// app/api/consensus/route.ts
// Get consensus picks for a symbol

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { secretKey, supabaseUrl } from "@craudioviz/platform-sdk";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Lazy Supabase client — initialized on first request (not at module load time)
// ⚠️ _supabase MUST be declared before getSupabase() — TDZ guard
let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    const url = supabaseUrl();
    const key = secretKey();
    // 2026-09-11: was `secretKey() || "<hard-coded anon JWT>"`. That key is now disabled,
    // so the fallback silently produced a client that 401s on every query. No fallback:
    // a missing credential is an error the caller can see.
    if (!url || !key) throw new Error("Supabase credentials unavailable");
    _supabase = createClient(url, key);
  }
  // 2026-09-11: the return sat INSIDE the if - a warm server got undefined ->
  // "Cannot read properties of undefined (reading 'from')" on every request after the first.
  return _supabase;
}
export async function GET(request: NextRequest) {
  const supabase = getSupabase()!
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol')?.toUpperCase();
    const limit = parseInt(searchParams.get('limit') || '1');

    let query = supabase
      .from('market_oracle_consensus_picks')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (symbol) {
      query = query.eq('symbol', symbol);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ success: false, error: 'The request could not be completed.', code: 'INTERNAL_ERROR' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      consensus: data?.[0] || null,
      all: data
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
