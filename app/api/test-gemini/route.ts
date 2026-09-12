import type { SupabaseClient } from "@supabase/supabase-js";
import { rateLimit } from '@/lib/api/rate-limit';
import { NextResponse } from 'next/server';
import { secretKey, supabaseUrl } from "@craudioviz/platform-sdk";

export const dynamic = 'force-dynamic';

// ⚠️ _supabase MUST be declared before getSupabase() — TDZ guard
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


export async function GET(request: Request) {
  const limited = rateLimit(request);
  if (limited) return limited;

  const apiKey = process.env.GEMINI_API_KEY;
  
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );
    const data = await response.json();
    
    if (data.models) {
      return NextResponse.json({
        count: data.models.length,
        models: data.models.map((m: any) => m.name).slice(0, 15)
      });
    }
    
    return NextResponse.json({ error: data.error?.message || 'Unknown', status: response.status });
  } catch (e) {
    return NextResponse.json({ error: String(e) });
  }
}
