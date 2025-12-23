// app/api/scanners/crypto/route.ts
// Market Oracle - Crypto Screener API
// Created: December 22, 2025
// Scans and filters cryptocurrencies with various metrics

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

// ============================================================================
// COINGECKO API
// ============================================================================

const CG_BASE = 'https://api.coingecko.com/api/v3';

async function coingecko<T>(endpoint: string): Promise<T | null> {
  const apiKey = process.env.COINGECKO_API_KEY;
  const headers: Record<string, string> = { 'Accept': 'application/json' };
  if (apiKey) headers['x-cg-demo-api-key'] = apiKey;

  try {
    const res = await fetch(`${CG_BASE}${endpoint}`, { 
      headers,
      next: { revalidate: 60 } 
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

interface CoinMarket {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  fully_diluted_valuation: number | null;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d_in_currency?: number;
  price_change_percentage_30d_in_currency?: number;
  market_cap_change_24h: number;
  market_cap_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number | null;
  max_supply: number | null;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  atl: number;
  atl_change_percentage: number;
  atl_date: string;
  last_updated: string;
}

interface ScreenedCrypto {
  id: string;
  symbol: string;
  name: string;
  image: string;
  price: number;
  marketCap: number;
  rank: number;
  volume24h: number;
  change24h: number;
  change7d: number | null;
  change30d: number | null;
  high24h: number;
  low24h: number;
  ath: number;
  athChangePercent: number;
  circulatingSupply: number;
  totalSupply: number | null;
  volumeToMarketCap: number;
  signals: string[];
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  score: number;
}

function analyzeSignals(coin: CoinMarket): { signals: string[]; score: number; sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL' } {
  const signals: string[] = [];
  let score = 50;

  // 24h momentum
  if (coin.price_change_percentage_24h > 10) {
    signals.push('Strong 24h rally (+10%+)');
    score += 15;
  } else if (coin.price_change_percentage_24h > 5) {
    signals.push('Positive 24h momentum');
    score += 10;
  } else if (coin.price_change_percentage_24h < -10) {
    signals.push('Heavy 24h selloff');
    score -= 15;
  } else if (coin.price_change_percentage_24h < -5) {
    signals.push('Negative 24h pressure');
    score -= 10;
  }

  // 7d trend
  if (coin.price_change_percentage_7d_in_currency) {
    if (coin.price_change_percentage_7d_in_currency > 20) {
      signals.push('Strong weekly uptrend');
      score += 12;
    } else if (coin.price_change_percentage_7d_in_currency < -20) {
      signals.push('Weak weekly performance');
      score -= 12;
    }
  }

  // Volume analysis
  const volumeToMcap = coin.total_volume / coin.market_cap;
  if (volumeToMcap > 0.5) {
    signals.push('Extremely high volume');
    score += 10;
  } else if (volumeToMcap > 0.2) {
    signals.push('High trading activity');
    score += 5;
  } else if (volumeToMcap < 0.01) {
    signals.push('Low liquidity warning');
    score -= 10;
  }

  // ATH analysis
  if (coin.ath_change_percentage > -5) {
    signals.push('Near all-time high');
    score += 8;
  } else if (coin.ath_change_percentage < -90) {
    signals.push('90%+ below ATH');
    score -= 5;
  } else if (coin.ath_change_percentage < -70 && coin.ath_change_percentage > -90) {
    signals.push('Potential recovery play');
    score += 3;
  }

  // Market cap rank
  if (coin.market_cap_rank <= 10) {
    signals.push('Top 10 by market cap');
    score += 5;
  } else if (coin.market_cap_rank <= 50) {
    signals.push('Top 50 cryptocurrency');
  } else if (coin.market_cap_rank > 500) {
    signals.push('Small cap - higher risk');
    score -= 5;
  }

  // Price action
  const dailyRange = ((coin.high_24h - coin.low_24h) / coin.low_24h) * 100;
  if (dailyRange > 15) {
    signals.push('High daily volatility');
    score += 3;
  }

  // Determine sentiment
  let sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
  if (score >= 65) sentiment = 'BULLISH';
  else if (score <= 35) sentiment = 'BEARISH';

  return { signals, score: Math.min(100, Math.max(0, score)), sentiment };
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  // Parse filters
  const minPrice = parseFloat(searchParams.get('minPrice') || '0');
  const maxPrice = parseFloat(searchParams.get('maxPrice') || '1000000');
  const minMarketCap = parseFloat(searchParams.get('minMarketCap') || '0');
  const maxMarketCap = parseFloat(searchParams.get('maxMarketCap') || '1e15');
  const minChange24h = parseFloat(searchParams.get('minChange24h') || '-100');
  const maxChange24h = parseFloat(searchParams.get('maxChange24h') || '1000');
  const minVolume = parseFloat(searchParams.get('minVolume') || '0');
  const sentiment = searchParams.get('sentiment') || '';
  const sortBy = searchParams.get('sortBy') || 'market_cap';
  const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 250);
  const page = parseInt(searchParams.get('page') || '1');

  try {
    // Fetch top coins with extended data
    const coins = await coingecko<CoinMarket[]>(
      `/coins/markets?vs_currency=usd&order=${sortBy}_desc&per_page=${limit}&page=${page}&sparkline=false&price_change_percentage=7d,30d`
    );

    if (!coins) {
      return NextResponse.json(
        { error: 'Failed to fetch crypto data' },
        { status: 500 }
      );
    }

    // Process and filter coins
    let screened: ScreenedCrypto[] = coins.map(coin => {
      const { signals, score, sentiment: coinSentiment } = analyzeSignals(coin);

      return {
        id: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        image: coin.image,
        price: coin.current_price,
        marketCap: coin.market_cap,
        rank: coin.market_cap_rank,
        volume24h: coin.total_volume,
        change24h: coin.price_change_percentage_24h,
        change7d: coin.price_change_percentage_7d_in_currency || null,
        change30d: coin.price_change_percentage_30d_in_currency || null,
        high24h: coin.high_24h,
        low24h: coin.low_24h,
        ath: coin.ath,
        athChangePercent: coin.ath_change_percentage,
        circulatingSupply: coin.circulating_supply,
        totalSupply: coin.total_supply,
        volumeToMarketCap: coin.total_volume / coin.market_cap,
        signals,
        sentiment: coinSentiment,
        score,
      };
    });

    // Apply filters
    screened = screened.filter(coin => {
      if (coin.price < minPrice || coin.price > maxPrice) return false;
      if (coin.marketCap < minMarketCap || coin.marketCap > maxMarketCap) return false;
      if (coin.change24h < minChange24h || coin.change24h > maxChange24h) return false;
      if (coin.volume24h < minVolume) return false;
      if (sentiment && coin.sentiment !== sentiment.toUpperCase()) return false;
      return true;
    });

    // Build response
    const response = {
      timestamp: new Date().toISOString(),
      count: screened.length,
      page,
      filters: {
        minPrice,
        maxPrice,
        minMarketCap,
        maxMarketCap,
        minChange24h,
        maxChange24h,
        minVolume,
        sentiment: sentiment || 'ALL',
        sortBy,
      },
      summary: {
        bullish: screened.filter(c => c.sentiment === 'BULLISH').length,
        bearish: screened.filter(c => c.sentiment === 'BEARISH').length,
        neutral: screened.filter(c => c.sentiment === 'NEUTRAL').length,
        avgChange24h: screened.length > 0 
          ? screened.reduce((sum, c) => sum + c.change24h, 0) / screened.length 
          : 0,
        totalMarketCap: screened.reduce((sum, c) => sum + c.marketCap, 0),
        totalVolume24h: screened.reduce((sum, c) => sum + c.volume24h, 0),
      },
      topGainers: [...screened].sort((a, b) => b.change24h - a.change24h).slice(0, 10),
      topLosers: [...screened].sort((a, b) => a.change24h - b.change24h).slice(0, 10),
      highestScores: [...screened].sort((a, b) => b.score - a.score).slice(0, 10),
      highVolume: [...screened].sort((a, b) => b.volumeToMarketCap - a.volumeToMarketCap).slice(0, 10),
      coins: screened,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Crypto screener error:', error);
    return NextResponse.json(
      { error: 'Failed to screen cryptocurrencies' },
      { status: 500 }
    );
  }
}
