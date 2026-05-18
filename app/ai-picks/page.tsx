'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';

function getSupabase() {
  var sb = require('@supabase/supabase-js')
  var url = process.env.NEXT_PUBLIC_SUPABASE_URL
  var key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return sb.createClient(url, key, { auth: { persistSession: false } })
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
}

// Dynamically import the dashboard with no SSR
const AIDashboardContent = dynamic(
  () => import('./dashboard-content'),
  { 
    ssr: false,
    loading: () => <LoadingDashboard />
  }

export default function AIDashboardPage() {
  return (
    <Suspense fallback={<LoadingDashboard />}>
      <AIDashboardContent />
    </Suspense>
  );
}
