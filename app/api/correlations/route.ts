// Market Oracle - Stock Correlations API
import { NextResponse } from 'next/server';

const TWELVE_DATA_KEY = process.env.TWELVE_DATA_API_KEY;
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

interface CorrelationResult {
  symbol: string;
  name?: string;
  correlation: number;
  relationship: 'strong_positive' | 'positive' | 'neutral' | 'negative' | 'strong_negative';
  tradingImplication: string;
  sector?: string;
}

const MAJOR_STOCKS = [
  { symbol: 'AAPL', name: 'Apple', sector: 'Technology' },
  { symbol: 'MSFT', name: 'Microsoft', sector: 'Technology' },
  { symbol: 'GOOGL', name: 'Alphabet', sector: 'Technology' },
  { symbol: 'AMZN', name: 'Amazon', sector: 'Consumer' },
  { symbol: 'META', name: 'Meta', sector: 'Technology' },
  { symbol: 'NVDA', name: 'NVIDIA', sector: 'Technology' },
  { symbol: 'TSLA', name: 'Tesla', sector: 'Auto' },
  { symbol: 'JPM', name: 'JPMorgan', sector: 'Financials' },
  { symbol: 'GS', name: 'Goldman', sector: 'Financials' },
  { symbol: 'XOM', name: 'Exxon', sector: 'Energy' },
  { symbol: 'GLD', name: 'Gold ETF', sector: 'Commodity' },
  { symbol: 'TLT', name: 'Bond ETF', sector: 'Bonds' },
];

async function fetchReturns(symbol: string, days: number = 60): Promise<number[]> {
  if (!TWELVE_DATA_KEY) return [];
  try {
    const res = await fetch(`https://api.twelvedata.com/time_series?symbol=${symbol}&interval=1day&outputsize=${days + 1}&apikey=${TWELVE_DATA_KEY}`);
    if (!res.ok) return [];
    const data = await res.json();
    const values = data.values || [];
    if (values.length < 2) return [];
    const returns: number[] = [];
    for (let i = 0; i < values.length - 1; i++) {
      const today = parseFloat(values[i].close);
      const yesterday = parseFloat(values[i + 1].close);
      returns.push((today - yesterday) / yesterday);
    }
    return returns;
  } catch { return []; }
}

function calculateCorrelation(r1: number[], r2: number[]): number {
  const n = Math.min(r1.length, r2.length);
  if (n < 10) return 0;
  const a = r1.slice(0, n), b = r2.slice(0, n);
  const mean1 = a.reduce((s, v) => s + v, 0) / n;
  const mean2 = b.reduce((s, v) => s + v, 0) / n;
  let num = 0, d1 = 0, d2 = 0;
  for (let i = 0; i < n; i++) {
    const x = a[i] - mean1, y = b[i] - mean2;
    num += x * y; d1 += x * x; d2 += y * y;
  }
  return d1 === 0 || d2 === 0 ? 0 : num / Math.sqrt(d1 * d2);
}

function getRelationship(c: number): CorrelationResult['relationship'] {
  if (c >= 0.7) return 'strong_positive';
  if (c >= 0.3) return 'positive';
  if (c >= -0.3) return 'neutral';
  if (c >= -0.7) return 'negative';
  return 'strong_negative';
}

function getImplication(c: number, s1: string, s2: string): string {
  if (c >= 0.7) return `${s1} and ${s2} move together. Avoid both for diversification.`;
  if (c >= 0.3) return `Moderate correlation. Some diversification benefit.`;
  if (c >= -0.3) return `Low correlation. Good diversification.`;
  if (c >= -0.7) return `Negative correlation. Hedge opportunity.`;
  return `Strong inverse. Excellent hedge.`;
}

export async function GET(request: Request) {
  const start = Date.now();
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  const days = parseInt(searchParams.get('days') || '60');
  
  if (!symbol) return NextResponse.json({ success: false, error: 'Symbol required' }, { status: 400 });
  
  const target = symbol.toUpperCase();
  const targetReturns = await fetchReturns(target, days);
  if (targetReturns.length < 10) return NextResponse.json({ success: false, error: 'Insufficient data' }, { status: 400 });
  
  const compare = MAJOR_STOCKS.filter(s => s.symbol !== target);
  const correlations: CorrelationResult[] = [];
  
  for (const stock of compare) {
    const returns = await fetchReturns(stock.symbol, days);
    if (returns.length < 10) continue;
    const corr = calculateCorrelation(targetReturns, returns);
    correlations.push({
      symbol: stock.symbol,
      name: stock.name,
      sector: stock.sector,
      correlation: Math.round(corr * 1000) / 1000,
      relationship: getRelationship(corr),
      tradingImplication: getImplication(corr, target, stock.symbol)
    });
  }
  
  correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
  
  const high = correlations.filter(c => c.correlation >= 0.7);
  const inverse = correlations.filter(c => c.correlation <= -0.3);
  const uncorr = correlations.filter(c => Math.abs(c.correlation) < 0.3);
  
  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    processingTime: `${Date.now() - start}ms`,
    symbol: target,
    summary: { total: correlations.length, highlyCorrelated: high.length, inverselyCorrelated: inverse.length, uncorrelated: uncorr.length },
    categories: { highlyCorrelated: high.slice(0, 5), inverselyCorrelated: inverse.slice(0, 5), uncorrelated: uncorr.slice(0, 5) },
    allCorrelations: correlations.slice(0, 20)
  });
}
