// app/api/dashboard/market-intelligence/route.ts
// Market Oracle - Unified Market Intelligence API
// Created: December 22, 2025
// Combines all data sources into comprehensive market view

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 60; // Revalidate every minute

// ============================================================================
// FRED API (Federal Reserve Economic Data)
// ============================================================================

const FRED_BASE_URL = 'https://api.stlouisfed.org/fred';

async function fetchFredSeries(seriesId: string): Promise<number | null> {
  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch(
      `${FRED_BASE_URL}/series/observations?series_id=${seriesId}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=1`,
      { next: { revalidate: 3600 } }
    );

    if (!response.ok) return null;
    const data = await response.json();
    const value = parseFloat(data.observations?.[0]?.value);
    return isNaN(value) ? null : value;
  } catch {
    return null;
  }
}

// ============================================================================
// FINNHUB API
// ============================================================================

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

async function fetchFinnhub<T>(endpoint: string, params: Record<string, string> = {}): Promise<T | null> {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) return null;

  const url = new URL(`${FINNHUB_BASE_URL}${endpoint}`);
  url.searchParams.set('token', apiKey);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));

  try {
    const response = await fetch(url.toString(), { next: { revalidate: 60 } });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

interface IndexQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

async function getFinnhubQuote(symbol: string, name: string): Promise<IndexQuote | null> {
  const quote = await fetchFinnhub<{
    c: number; h: number; l: number; o: number; pc: number; d: number; dp: number;
  }>('/quote', { symbol });
  
  if (!quote || quote.c === 0) return null;
  return {
    symbol,
    name,
    price: quote.c,
    change: quote.d,
    changePercent: quote.dp,
  };
}

async function getMarketNews() {
  const data = await fetchFinnhub<Array<{
    id: number; headline: string; source: string; datetime: number; url: string;
  }>>('/news', { category: 'general' });
  
  return (data || []).slice(0, 10).map(n => ({
    headline: n.headline,
    source: n.source,
    datetime: new Date(n.datetime * 1000).toISOString(),
    url: n.url,
  }));
}

async function getEarningsCalendar() {
  const today = new Date();
  const from = today.toISOString().split('T')[0];
  const to = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const data = await fetchFinnhub<{ earningsCalendar: Array<{
    symbol: string; date: string; hour: string;
  }> }>('/calendar/earnings', { from, to });
  
  return (data?.earningsCalendar || []).slice(0, 10).map(e => ({
    symbol: e.symbol,
    date: e.date,
    hour: e.hour,
  }));
}

// ============================================================================
// COINGECKO API
// ============================================================================

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

async function fetchCoinGecko<T>(endpoint: string): Promise<T | null> {
  const apiKey = process.env.COINGECKO_API_KEY;
  const headers: Record<string, string> = { 'Accept': 'application/json' };
  if (apiKey) headers['x-cg-demo-api-key'] = apiKey;

  try {
    const response = await fetch(`${COINGECKO_BASE}${endpoint}`, {
      headers,
      next: { revalidate: 60 },
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

async function getCryptoData() {
  const [global, btc, eth, trending] = await Promise.all([
    fetchCoinGecko<{ data: {
      total_market_cap: { usd: number };
      total_volume: { usd: number };
      market_cap_percentage: { btc: number };
      market_cap_change_percentage_24h_usd: number;
    } }>('/global'),
    fetchCoinGecko<{
      market_data: { current_price: { usd: number }; price_change_percentage_24h: number };
    }>('/coins/bitcoin?localization=false&tickers=false&community_data=false&developer_data=false'),
    fetchCoinGecko<{
      market_data: { current_price: { usd: number }; price_change_percentage_24h: number };
    }>('/coins/ethereum?localization=false&tickers=false&community_data=false&developer_data=false'),
    fetchCoinGecko<{ coins: Array<{ item: { id: string; symbol: string; name: string } }> }>('/search/trending'),
  ]);

  // Calculate Fear & Greed from market data
  let fearGreedValue = 50;
  if (global?.data && btc?.market_data) {
    const marketCapFactor = Math.min(Math.max((global.data.market_cap_change_percentage_24h_usd || 0) * 2, -25), 25);
    const btcFactor = Math.min(Math.max((btc.market_data.price_change_percentage_24h || 0) * 3, -25), 25);
    fearGreedValue = Math.round(50 + marketCapFactor + btcFactor);
    fearGreedValue = Math.max(0, Math.min(100, fearGreedValue));
  }

  let fearGreedClass: string;
  if (fearGreedValue <= 20) fearGreedClass = 'Extreme Fear';
  else if (fearGreedValue <= 40) fearGreedClass = 'Fear';
  else if (fearGreedValue <= 60) fearGreedClass = 'Neutral';
  else if (fearGreedValue <= 80) fearGreedClass = 'Greed';
  else fearGreedClass = 'Extreme Greed';

  return {
    globalStats: global?.data ? {
      totalMarketCap: global.data.total_market_cap?.usd || 0,
      totalVolume24h: global.data.total_volume?.usd || 0,
      btcDominance: global.data.market_cap_percentage?.btc || 0,
      marketCapChange24h: global.data.market_cap_change_percentage_24h_usd || 0,
    } : null,
    fearGreed: {
      value: fearGreedValue,
      classification: fearGreedClass,
    },
    btcPrice: btc?.market_data?.current_price?.usd || null,
    ethPrice: eth?.market_data?.current_price?.usd || null,
    trending: (trending?.coins || []).slice(0, 5).map(c => ({
      id: c.item.id,
      symbol: c.item.symbol?.toUpperCase() || '',
      name: c.item.name,
    })),
  };
}

// ============================================================================
// MAIN API HANDLER
// ============================================================================

function getMarketStatus(): 'open' | 'closed' | 'pre-market' | 'after-hours' {
  const now = new Date();
  const nyTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const day = nyTime.getDay();
  const hours = nyTime.getHours();
  const minutes = nyTime.getMinutes();
  const time = hours * 100 + minutes;

  if (day === 0 || day === 6) return 'closed';
  if (time >= 400 && time < 930) return 'pre-market';
  if (time >= 930 && time < 1600) return 'open';
  if (time >= 1600 && time < 2000) return 'after-hours';
  return 'closed';
}

export async function GET(request: NextRequest) {
  try {
    // Parallel fetch all data
    const [
      mortgage30,
      mortgage15,
      fedFunds,
      unemployment,
      treasury10,
      treasury2,
      vix,
      spy,
      qqq,
      dia,
      cryptoData,
      news,
      earnings,
    ] = await Promise.all([
      fetchFredSeries('MORTGAGE30US'),
      fetchFredSeries('MORTGAGE15US'),
      fetchFredSeries('FEDFUNDS'),
      fetchFredSeries('UNRATE'),
      fetchFredSeries('DGS10'),
      fetchFredSeries('DGS2'),
      fetchFredSeries('VIXCLS'),
      getFinnhubQuote('SPY', 'S&P 500 ETF'),
      getFinnhubQuote('QQQ', 'Nasdaq 100 ETF'),
      getFinnhubQuote('DIA', 'Dow Jones ETF'),
      getCryptoData(),
      getMarketNews(),
      getEarningsCalendar(),
    ]);

    // Calculate yield curve
    const yieldSpread = treasury10 !== null && treasury2 !== null ? treasury10 - treasury2 : null;
    let yieldSignal: 'NORMAL' | 'FLAT' | 'INVERTED' = 'NORMAL';
    if (yieldSpread !== null) {
      if (yieldSpread < -0.1) yieldSignal = 'INVERTED';
      else if (yieldSpread < 0.25) yieldSignal = 'FLAT';
    }

    // VIX level
    let vixLevel = 'MODERATE';
    if (vix !== null) {
      if (vix < 12) vixLevel = 'LOW';
      else if (vix < 20) vixLevel = 'MODERATE';
      else if (vix < 25) vixLevel = 'ELEVATED';
      else if (vix < 35) vixLevel = 'HIGH';
      else vixLevel = 'EXTREME';
    }

    // Build major indexes array - no spread needed now
    const majorIndexes: IndexQuote[] = [];
    if (spy) majorIndexes.push(spy);
    if (qqq) majorIndexes.push(qqq);
    if (dia) majorIndexes.push(dia);

    const response = {
      timestamp: new Date().toISOString(),
      markets: {
        stocks: {
          status: getMarketStatus(),
          majorIndexes,
        },
        crypto: cryptoData,
      },
      economy: {
        mortgageRates: {
          thirtyYear: mortgage30,
          fifteenYear: mortgage15,
        },
        fedFundsRate: fedFunds,
        unemployment,
        yieldCurve: {
          spread: yieldSpread,
          signal: yieldSignal,
        },
        vix: {
          value: vix,
          level: vixLevel,
        },
      },
      news,
      earnings,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Market intelligence API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market intelligence' },
      { status: 500 }
    );
  }
}
