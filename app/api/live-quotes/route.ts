// app/api/live-quotes/route.ts — javari-market
// Real-time stock quotes via Yahoo Finance (free, no API key)
// Falls back to Finnhub if Yahoo is rate-limited
// CR AudioViz AI · May 2026
import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const FINNHUB = process.env.FINNHUB_API_KEY || ''

async function yahooQuotes(symbols: string[]): Promise<Record<string, any>> {
  const joined = symbols.join(',')
  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${joined}&fields=symbol,shortName,regularMarketPrice,regularMarketChange,regularMarketChangePercent,regularMarketVolume,marketCap,regularMarketDayHigh,regularMarketDayLow,fiftyTwoWeekHigh,fiftyTwoWeekLow`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; JavariMarket/2.0)' },
    next: { revalidate: 30 }
  })
  if (!res.ok) throw new Error(`Yahoo ${res.status}`)
  const data = await res.json() as any
  const quotes = data?.quoteResponse?.result || []
  const out: Record<string, any> = {}
  for (const q of quotes) {
    out[q.symbol] = {
      symbol: q.symbol,
      name: q.shortName || q.symbol,
      price: q.regularMarketPrice,
      change: q.regularMarketChange,
      changePercent: q.regularMarketChangePercent,
      volume: q.regularMarketVolume,
      marketCap: q.marketCap,
      dayHigh: q.regularMarketDayHigh,
      dayLow: q.regularMarketDayLow,
      week52High: q.fiftyTwoWeekHigh,
      week52Low: q.fiftyTwoWeekLow,
      source: 'yahoo',
      fetchedAt: new Date().toISOString(),
    }
  }
  return out
}

async function finnhubQuote(symbol: string): Promise<any> {
  if (!FINNHUB) return null
  const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB}`)
  if (!res.ok) return null
  const d = await res.json() as any
  return {
    symbol,
    price: d.c,
    change: d.d,
    changePercent: d.dp,
    dayHigh: d.h,
    dayLow: d.l,
    prevClose: d.pc,
    source: 'finnhub',
    fetchedAt: new Date().toISOString(),
  }
}

export async function GET(req: NextRequest) {
  const symbols = (req.nextUrl.searchParams.get('symbols') || 'AAPL,MSFT,NVDA,TSLA,GOOGL,AMZN,META,SPY,QQQ,BRK-B').split(',').slice(0, 20)
  try {
    const quotes = await yahooQuotes(symbols)
    return NextResponse.json({ quotes, count: Object.keys(quotes).length, source: 'yahoo', ts: Date.now() })
  } catch (yahooErr) {
    // Fallback: try finnhub for first 5 symbols if we have the key
    if (FINNHUB) {
      const quotes: Record<string, any> = {}
      await Promise.all(symbols.slice(0, 5).map(async s => {
        const q = await finnhubQuote(s)
        if (q) quotes[s] = q
      }))
      if (Object.keys(quotes).length > 0) {
        return NextResponse.json({ quotes, source: 'finnhub', fallback: true, ts: Date.now() })
      }
    }
    return NextResponse.json({ error: 'Market data temporarily unavailable', ts: Date.now() }, { status: 503 })
  }
}
