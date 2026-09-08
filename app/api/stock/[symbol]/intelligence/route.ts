import { rateLimit } from '@/lib/api/rate-limit';
// app/api/stock/[symbol]/intelligence/route.ts
// Market Oracle - Stock Intelligence API
// Created: December 22, 2025
// Self-contained API with direct API calls

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

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
    const res = await fetch(url.toString(), { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// ============================================================================
// ALPHA VANTAGE API
// ============================================================================

const AV_BASE = 'https://www.alphavantage.co/query';

async function alphaVantage<T>(params: Record<string, string>): Promise<T | null> {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  if (!apiKey) return null;

  const url = new URL(AV_BASE);
  url.searchParams.set('apikey', apiKey);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  try {
    const res = await fetch(url.toString(), { next: { revalidate: 300 } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// ============================================================================
// DATA FETCHERS
// ============================================================================

interface FinnhubQuote {
  c: number; d: number; dp: number; h: number; l: number; o: number; pc: number; t: number;
}

interface FinnhubProfile {
  country: string; currency: string; exchange: string; finnhubIndustry: string;
  ipo: string; logo: string; marketCapitalization: number; name: string;
  phone: string; shareOutstanding: number; ticker: string; weburl: string;
}

interface FinnhubSentiment {
  buzz: { articlesInLastWeek: number; buzz: number; weeklyAverage: number };
  companyNewsScore: number; sectorAverageBullishPercent: number;
  sectorAverageNewsScore: number; sentiment: { bullishPercent: number; bearishPercent: number };
  symbol: string;
}

interface FinnhubRecommendation {
  buy: number; hold: number; period: string; sell: number; strongBuy: number; strongSell: number; symbol: string;
}

interface FinnhubInsider {
  name: string; share: number; change: number; filingDate: string;
  transactionDate: string; transactionCode: string; transactionPrice: number;
}

async function getQuote(symbol: string) {
  const quote = await finnhub<FinnhubQuote>('/quote', { symbol });
  if (!quote || quote.c === 0) return null;
  return {
    current: quote.c,
    change: quote.d,
    changePercent: quote.dp,
    high: quote.h,
    low: quote.l,
    open: quote.o,
    previousClose: quote.pc,
    volume: 0,
    avgVolume: 0,
  };
}

async function getProfile(symbol: string) {
  const profile = await finnhub<FinnhubProfile>('/stock/profile2', { symbol });
  if (!profile || !profile.name) return null;
  return {
    name: profile.name,
    industry: profile.finnhubIndustry || 'Unknown',
    sector: null,
    marketCap: (profile.marketCapitalization || 0) * 1e6,
    logo: profile.logo || '',
    website: profile.weburl || '',
    exchange: profile.exchange || 'Unknown',
  };
}

async function getSentiment(symbol: string) {
  const [sentiment, social] = await Promise.all([
    finnhub<FinnhubSentiment>('/news-sentiment', { symbol }),
    finnhub<{ reddit: Array<{ mention: number; score: number }>; twitter: Array<{ mention: number; score: number }> }>(
      '/stock/social-sentiment', { symbol }
    ),
  ]);

  const redditScore = social?.reddit?.[0]?.score || 0;
  const twitterScore = social?.twitter?.[0]?.score || 0;
  const bullish = sentiment?.sentiment?.bullishPercent || 0.5;
  
  let overall: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
  if (bullish > 0.6) overall = 'BULLISH';
  else if (bullish < 0.4) overall = 'BEARISH';

  return {
    overall,
    score: Math.round((bullish - 0.5) * 200),
    news: {
      count: sentiment?.buzz?.articlesInLastWeek || 0,
      positive: Math.round((sentiment?.companyNewsScore || 0.5) * 10),
      negative: Math.round((1 - (sentiment?.companyNewsScore || 0.5)) * 10),
    },
    social: {
      reddit: redditScore,
      twitter: twitterScore,
      trending: (social?.reddit?.[0]?.mention || 0) > 100 || (social?.twitter?.[0]?.mention || 0) > 100,
    },
  };
}

async function getAnalysts(symbol: string) {
  const recs = await finnhub<FinnhubRecommendation[]>('/stock/recommendation', { symbol });
  if (!recs || recs.length === 0) return null;

  const latest = recs[0];
  const total = latest.strongBuy + latest.buy + latest.hold + latest.sell + latest.strongSell;
  if (total === 0) return null;

  const score = (latest.strongBuy * 5 + latest.buy * 4 + latest.hold * 3 + latest.sell * 2 + latest.strongSell * 1) / total;
  
  let consensus = 'HOLD';
  if (score >= 4.5) consensus = 'STRONG_BUY';
  else if (score >= 3.5) consensus = 'BUY';
  else if (score >= 2.5) consensus = 'HOLD';
  else if (score >= 1.5) consensus = 'SELL';
  else consensus = 'STRONG_SELL';

  return {
    consensus,
    score,
    totalAnalysts: total,
    distribution: {
      strongBuy: latest.strongBuy,
      buy: latest.buy,
      hold: latest.hold,
      sell: latest.sell,
      strongSell: latest.strongSell,
    },
  };
}

async function getInsiders(symbol: string) {
  const insiders = await finnhub<{ data: FinnhubInsider[] }>('/stock/insider-transactions', { symbol });
  const transactions = insiders?.data || [];
  
  const buying = transactions.filter(t => t.change > 0).length;
  const selling = transactions.filter(t => t.change < 0).length;

  return {
    signal: buying > selling ? 'BULLISH' : selling > buying ? 'BEARISH' : 'NEUTRAL',
    netBuying: buying > selling,
    recentTransactions: transactions.length,
  };
}

async function getNews(symbol: string) {
  const today = new Date();
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const news = await finnhub<Array<{
    headline: string; summary: string; source: string; datetime: number; url: string;
  }>>('/company-news', {
    symbol,
    from: weekAgo.toISOString().split('T')[0],
    to: today.toISOString().split('T')[0],
  });

  return (news || []).slice(0, 10).map(n => ({
    headline: n.headline,
    summary: n.summary || '',
    source: n.source,
    datetime: new Date(n.datetime * 1000).toISOString(),
    url: n.url,
  }));
}

async function getTechnicals(symbol: string) {
  const [rsiData, macdData, sma50Data, sma200Data] = await Promise.all([
    alphaVantage<Record<string, Record<string, { RSI: string }>>>({ 
      function: 'RSI', symbol, interval: 'daily', time_period: '14', series_type: 'close' 
    }),
    alphaVantage<Record<string, Record<string, { MACD: string; MACD_Signal: string; MACD_Hist: string }>>>({ 
      function: 'MACD', symbol, interval: 'daily', series_type: 'close' 
    }),
    alphaVantage<Record<string, Record<string, { SMA: string }>>>({ 
      function: 'SMA', symbol, interval: 'daily', time_period: '50', series_type: 'close' 
    }),
    alphaVantage<Record<string, Record<string, { SMA: string }>>>({ 
      function: 'SMA', symbol, interval: 'daily', time_period: '200', series_type: 'close' 
    }),
  ]);

  // Parse RSI
  let rsi: number | null = null;
  const rsiKey = rsiData ? Object.keys(rsiData).find(k => k.includes('Technical')) : null;
  if (rsiKey && rsiData) {
    const rsiValues = Object.values(rsiData[rsiKey]);
    if (rsiValues.length > 0) {
      rsi = parseFloat(rsiValues[0].RSI);
    }
  }

  // Parse MACD
  let macd: { value: number; signal: number; histogram: number; trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL' } | null = null;
  const macdKey = macdData ? Object.keys(macdData).find(k => k.includes('Technical')) : null;
  if (macdKey && macdData) {
    const macdValues = Object.values(macdData[macdKey]);
    if (macdValues.length > 0) {
      const hist = parseFloat(macdValues[0].MACD_Hist);
      macd = {
        value: parseFloat(macdValues[0].MACD),
        signal: parseFloat(macdValues[0].MACD_Signal),
        histogram: hist,
        trend: hist > 0 ? 'BULLISH' : hist < 0 ? 'BEARISH' : 'NEUTRAL',
      };
    }
  }

  // Parse SMAs
  let sma50: number | null = null;
  let sma200: number | null = null;
  
  const sma50Key = sma50Data ? Object.keys(sma50Data).find(k => k.includes('Technical')) : null;
  if (sma50Key && sma50Data) {
    const values = Object.values(sma50Data[sma50Key]);
    if (values.length > 0) sma50 = parseFloat(values[0].SMA);
  }

  const sma200Key = sma200Data ? Object.keys(sma200Data).find(k => k.includes('Technical')) : null;
  if (sma200Key && sma200Data) {
    const values = Object.values(sma200Data[sma200Key]);
    if (values.length > 0) sma200 = parseFloat(values[0].SMA);
  }

  // Determine RSI signal
  let rsiSignal: 'OVERSOLD' | 'NEUTRAL' | 'OVERBOUGHT' = 'NEUTRAL';
  if (rsi !== null) {
    if (rsi < 30) rsiSignal = 'OVERSOLD';
    else if (rsi > 70) rsiSignal = 'OVERBOUGHT';
  }

  return {
    rsi,
    rsiSignal,
    macd,
    movingAverages: {
      sma50,
      sma200,
      priceVsSma50: 'ABOVE' as 'ABOVE' | 'BELOW',
      priceVsSma200: 'ABOVE' as 'ABOVE' | 'BELOW',
      goldenCross: sma50 !== null && sma200 !== null && sma50 > sma200,
      deathCross: sma50 !== null && sma200 !== null && sma50 < sma200,
    },
  };
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const limited = rateLimit(request);
  if (limited) return limited;

  const { symbol } = await params;
  const sym = symbol.toUpperCase();

  try {
    // Parallel fetch all data
    const [quote, profile, sentiment, analysts, insiders, news, technicals] = await Promise.all([
      getQuote(sym),
      getProfile(sym),
      getSentiment(sym),
      getAnalysts(sym),
      getInsiders(sym),
      getNews(sym),
      getTechnicals(sym),
    ]);

    if (!quote && !profile) {
      return NextResponse.json(
        { error: `No data found for symbol: ${sym}` },
        { status: 404 }
      );
    }

    // Update moving average comparisons with actual price
    if (quote && technicals.movingAverages.sma50) {
      technicals.movingAverages.priceVsSma50 = quote.current > technicals.movingAverages.sma50 ? 'ABOVE' : 'BELOW';
    }
    if (quote && technicals.movingAverages.sma200) {
      technicals.movingAverages.priceVsSma200 = quote.current > technicals.movingAverages.sma200 ? 'ABOVE' : 'BELOW';
    }

    // Calculate risk
    const volatility = quote ? Math.abs(quote.changePercent) * 10 : 50;
    const riskScore = Math.min(100, Math.round(volatility + (technicals.rsi && technicals.rsi > 70 ? 20 : 0) + (technicals.rsi && technicals.rsi < 30 ? 10 : 0)));
    
    let riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH' | 'EXTREME' = 'MODERATE';
    if (riskScore < 25) riskLevel = 'LOW';
    else if (riskScore < 50) riskLevel = 'MODERATE';
    else if (riskScore < 70) riskLevel = 'HIGH';
    else if (riskScore < 85) riskLevel = 'VERY_HIGH';
    else riskLevel = 'EXTREME';

    const warnings: string[] = [];
    if (technicals.rsi && technicals.rsi > 70) warnings.push('RSI indicates overbought conditions');
    if (technicals.rsi && technicals.rsi < 30) warnings.push('RSI indicates oversold conditions');
    if (technicals.movingAverages.deathCross) warnings.push('Death cross detected - bearish signal');

    // Build response
    const response = {
      symbol: sym,
      timestamp: new Date().toISOString(),
      profile,
      price: quote,
      technicals,
      sentiment: {
        ...sentiment,
        insiders,
        analysts,
      },
      risk: {
        overallScore: riskScore,
        riskLevel,
        factors: {
          volatility: Math.min(100, Math.round(volatility * 2)),
          liquidity: 50,
          marketCap: profile?.marketCap ? (profile.marketCap > 10e9 ? 20 : profile.marketCap > 1e9 ? 40 : 70) : 50,
          newsVolatility: sentiment?.news.count || 0 > 20 ? 70 : 40,
          technicalRisk: technicals.rsi ? (technicals.rsi > 70 || technicals.rsi < 30 ? 70 : 30) : 50,
        },
        warnings,
      },
      yearRange: {
        high: quote ? quote.high * 1.1 : 0,
        low: quote ? quote.low * 0.9 : 0,
        percentFromHigh: 0,
        percentFromLow: 0,
      },
      news,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error(`Stock intelligence error for ${sym}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch stock intelligence' },
      { status: 500 }
    );
  }
}
