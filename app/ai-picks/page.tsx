'use client';

import type { SupabaseClient } from "@supabase/supabase-js";
import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { secretKey, supabaseUrl } from "@craudioviz/platform-sdk";

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


// Loading component
function LoadingDashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-400">Loading Market Oracle...</p>
      </div>
    </div>
  );
}

// Dynamically import the dashboard with no SSR
const AIDashboardContent = dynamic(
  () => import('./dashboard-content'),
  { 
    ssr: false,
    loading: () => <LoadingDashboard />
  }
);

export default function AIDashboardPage() {
  return (
    <Suspense fallback={<LoadingDashboard />}>
      <AIDashboardContent />
    </Suspense>
  );
}
