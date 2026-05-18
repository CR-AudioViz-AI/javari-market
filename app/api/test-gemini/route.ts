import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function getSupabase() {
  var sb = require('@supabase/supabase-js')
  var url = process.env.NEXT_PUBLIC_SUPABASE_URL
  var key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return sb.createClient(url, key, { auth: { persistSession: false } })
}


export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    
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
