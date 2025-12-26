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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const action = searchParams.get('action') || 'analyze'
  const symbol = searchParams.get('symbol')
  const symbols = searchParams.get('symbols')?.split(',')
  const timeframe = (searchParams.get('timeframe') as '1h' | '24h' | '7d') || '24h'
  const compare = searchParams.get('compare')

  try {
    switch (action) {
      case 'analyze': {
        if (!symbol) {
          return NextResponse.json(
            { success: false, error: 'Symbol parameter required' },
            { status: 400 }
          )
        }
        const result = await analyzeStockSentiment(symbol.toUpperCase(), { timeframe })
        return NextResponse.json(result)
      }

      case 'batch': {
        if (!symbols || symbols.length === 0) {
          return NextResponse.json(
            { success: false, error: 'Symbols parameter required (comma-separated)' },
            { status: 400 }
          )
        }
        const result = await analyzeMultipleStocks(
          symbols.map((s) => s.toUpperCase().trim()),
          { timeframe }
        )
        return NextResponse.json(result)
      }

      case 'trending': {
        const result = await getTrendingStockMentions()
        return NextResponse.json(result)
      }

      case 'compare': {
        if (!symbol || !compare) {
          return NextResponse.json(
            { success: false, error: 'Both symbol and compare parameters required' },
            { status: 400 }
          )
        }
        const result = await compareSentiment(symbol.toUpperCase(), compare.toUpperCase())
        return NextResponse.json(result)
      }

      case 'context': {
        if (!symbol) {
          return NextResponse.json(
            { success: false, error: 'Symbol parameter required' },
            { status: 400 }
          )
        }
        const result = await getSentimentWithContext(symbol.toUpperCase())
        return NextResponse.json(result)
      }

      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid action. Use: analyze, batch, trending, compare, context',
          },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Sentiment API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, symbol, symbols, timeframe = '24h', compare } = body

    switch (action) {
      case 'analyze': {
        if (!symbol) {
          return NextResponse.json(
            { success: false, error: 'Symbol required in body' },
            { status: 400 }
          )
        }
        const result = await analyzeStockSentiment(symbol.toUpperCase(), {
          timeframe,
          includeInfluencers: body.includeInfluencers ?? true,
        })
        return NextResponse.json(result)
      }

      case 'batch': {
        if (!symbols || !Array.isArray(symbols)) {
          return NextResponse.json(
            { success: false, error: 'Symbols array required' },
            { status: 400 }
          )
        }
        const result = await analyzeMultipleStocks(
          symbols.map((s: string) => s.toUpperCase()),
          { timeframe }
        )
        return NextResponse.json(result)
      }

      case 'compare': {
        if (!symbol || !compare) {
          return NextResponse.json(
            { success: false, error: 'Both symbol and compare required' },
            { status: 400 }
          )
        }
        const result = await compareSentiment(symbol.toUpperCase(), compare.toUpperCase())
        return NextResponse.json(result)
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Invalid request',
      },
      { status: 400 }
    )
  }
}
