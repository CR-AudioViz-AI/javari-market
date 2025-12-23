// app/api/scanners/penny-stocks/route.ts
// Market Oracle - Penny Stock Scanner API
// Created: December 22, 2025
// Scans for penny stocks with momentum and volume signals

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 300; // 5 minute cache

// ============================================================================
// FINNHUB API
// ============================================================================

const FINNHUB_BASE = 'https://finnhub.io/api/v1';

async function finnhub<T>(endpoint: string, params: Record<string, string> = {}): Promise<T | null> {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) return null;

  const url = new URL(`${FINNHUB_BASE}${endpoint}`);
  url.searchParams.set('token', apiKey);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  try {
    const res = await fetch(url.toString(), { next: { revalidate: 300 } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

interface StockSymbol {
  symbol: string;
  description: string;
  type: string;
  currency: string;
  displaySymbol: string;
}

interface Quote {
  c: number; d: number; dp: number; h: number; l: number; o: number; pc: number;
}

interface PennyStock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  signals: string[];
  score: number;
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME';
}

// Pre-defined list of active penny stocks to scan
// In production, this would come from a database or screener API
const PENNY_STOCK_CANDIDATES = [
  'SNDL', 'AAOI', 'CLOV', 'SOFI', 'PLTR', 'BB', 'NOK', 'GEVO', 'FCEL',
  'PLUG', 'IDEX', 'ZOM', 'NAKD', 'SENS', 'BNGO', 'OCGN', 'TLRY', 'ACB',
  'APHA', 'CTRM', 'SIRI', 'F', 'GE', 'AAL', 'CCL', 'NCLH', 'UAL',
  'MGM', 'WKHS', 'RIDE', 'GOEV', 'HYLN', 'BLNK', 'CHPT', 'QS', 'LCID',
  'RIVN', 'FSR', 'FFIE', 'MULN', 'NKLA', 'SOLO', 'AYRO', 'ARVL', 'REE',
  'PTRA', 'XL', 'CLNE', 'AMTX', 'GRNQ', 'TELL', 'ET', 'ETRN', 'KMI',
];

async function getQuote(symbol: string): Promise<{ symbol: string; quote: Quote } | null> {
  const quote = await finnhub<Quote>('/quote', { symbol });
  if (!quote || quote.c === 0) return null;
  return { symbol, quote };
}

async function scanPennyStocks(): Promise<PennyStock[]> {
  // Fetch quotes for all candidates in batches
  const batchSize = 10;
  const results: PennyStock[] = [];

  for (let i = 0; i < PENNY_STOCK_CANDIDATES.length; i += batchSize) {
    const batch = PENNY_STOCK_CANDIDATES.slice(i, i + batchSize);
    const quotes = await Promise.all(batch.map(getQuote));

    for (const result of quotes) {
      if (!result) continue;
      const { symbol, quote } = result;

      // Filter for penny stocks (under $5)
      if (quote.c > 5) continue;

      // Calculate signals
      const signals: string[] = [];
      let score = 50;

      // Volume signal
      const volumeChange = ((quote.h - quote.l) / quote.l) * 100;
      if (volumeChange > 5) {
        signals.push('High volatility');
        score += 10;
      }

      // Momentum signals
      if (quote.dp > 5) {
        signals.push('Strong upward momentum');
        score += 15;
      } else if (quote.dp > 2) {
        signals.push('Positive momentum');
        score += 8;
      } else if (quote.dp < -5) {
        signals.push('Strong downward pressure');
        score -= 10;
      }

      // Price action signals
      if (quote.c > quote.o && quote.c > quote.pc) {
        signals.push('Bullish price action');
        score += 10;
      }
      if (quote.c === quote.h) {
        signals.push('Closing at high');
        score += 5;
      }

      // Gap signals
      const gapPercent = ((quote.o - quote.pc) / quote.pc) * 100;
      if (gapPercent > 3) {
        signals.push('Gap up opening');
        score += 10;
      } else if (gapPercent < -3) {
        signals.push('Gap down opening');
        score -= 5;
      }

      // Range signals
      const range = ((quote.h - quote.l) / quote.l) * 100;
      if (range > 10) {
        signals.push('Wide trading range');
        score += 5;
      }

      // Risk level based on price
      let riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME' = 'MODERATE';
      if (quote.c < 0.5) riskLevel = 'EXTREME';
      else if (quote.c < 1) riskLevel = 'HIGH';
      else if (quote.c < 3) riskLevel = 'MODERATE';
      else riskLevel = 'LOW';

      // Add to results if has any signals
      if (signals.length > 0 || Math.abs(quote.dp) > 2) {
        results.push({
          symbol,
          name: symbol, // Would need profile lookup for real name
          price: quote.c,
          change: quote.d,
          changePercent: quote.dp,
          volume: 0, // Would need separate volume API
          high: quote.h,
          low: quote.l,
          signals,
          score: Math.min(100, Math.max(0, score)),
          riskLevel,
        });
      }
    }

    // Small delay between batches to avoid rate limits
    if (i + batchSize < PENNY_STOCK_CANDIDATES.length) {
      await new Promise(r => setTimeout(r, 100));
    }
  }

  // Sort by score descending
  return results.sort((a, b) => b.score - a.score);
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const minPrice = parseFloat(searchParams.get('minPrice') || '0');
  const maxPrice = parseFloat(searchParams.get('maxPrice') || '5');
  const minChange = parseFloat(searchParams.get('minChange') || '-100');
  const riskFilter = searchParams.get('risk') || '';

  try {
    let stocks = await scanPennyStocks();

    // Apply filters
    stocks = stocks.filter(s => {
      if (s.price < minPrice || s.price > maxPrice) return false;
      if (s.changePercent < minChange) return false;
      if (riskFilter && s.riskLevel !== riskFilter) return false;
      return true;
    });

    const response = {
      timestamp: new Date().toISOString(),
      count: stocks.length,
      filters: {
        minPrice,
        maxPrice,
        minChange,
        risk: riskFilter || 'ALL',
      },
      topGainers: stocks.filter(s => s.changePercent > 0).slice(0, 10),
      topLosers: stocks.filter(s => s.changePercent < 0).sort((a, b) => a.changePercent - b.changePercent).slice(0, 10),
      highestScores: stocks.slice(0, 10),
      allStocks: stocks,
      disclaimer: 'Penny stocks are highly speculative and carry extreme risk. Past performance does not guarantee future results. This is not financial advice.',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Penny stock scanner error:', error);
    return NextResponse.json(
      { error: 'Failed to scan penny stocks' },
      { status: 500 }
    );
  }
}
