// app/api/sentiment/route.ts
// Twitter/X Sentiment Analysis API for Market Oracle
// Powered by xAI Grok-4 with real-time Twitter access
// Created: December 25, 2025

import { NextRequest, NextResponse } from 'next/server'
import {
  analyzeStockSentiment,
  analyzeMultipleStocks,
  getTrendingStockMentions,
  compareSentiment,
  getSentimentWithContext,
} from '@/lib/connectors/xai-sentiment'

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getSupabase() {
  var sb = require('@supabase/supabase-js')
  var url = process.env.NEXT_PUBLIC_SUPABASE_URL
  var key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return sb.createClient(url, key, { auth: { persistSession: false } })
}

export async function GET(request: NextRequest) {
  const supabase = getSupabase()!
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get('symbol')
  const action = searchParams.get('action') || 'single'

  if (!symbol && action !== 'trending') {
    return NextResponse.json({ error: 'Symbol is required' }, { status: 400 })
  }

  try {
    switch (action) {
      case 'multiple': {
        const symbols = searchParams.get('symbols')?.split(',') || []
        const data = await analyzeMultipleStocks(symbols)
        return NextResponse.json({ success: true, data })
      }
      case 'trending': {
        const data = await getTrendingStockMentions()
        return NextResponse.json({ success: true, data })
      }
      case 'compare': {
        const symbols = searchParams.get('symbols')?.split(',') || []
        const data = await compareSentiment(symbols)
        return NextResponse.json({ success: true, data })
      }
      case 'context': {
        const data = await getSentimentWithContext(symbol!)
        return NextResponse.json({ success: true, data })
      }
      default: {
        const data = await analyzeStockSentiment(symbol!)
        return NextResponse.json({ success: true, data })
      }
    }
  } catch (error) {
    console.error('Sentiment API error:', error)
    return NextResponse.json({ error: 'Failed to analyze sentiment' }, { status: 500 })
  }
}
