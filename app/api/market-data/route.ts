/**
 * ENHANCED MARKET DATA API
 * Multi-source market data aggregation
 * 
 * Data Sources:
 * - Alpha Vantage (primary stock data)
 * - Finnhub (real-time quotes, news)
 * - Twelve Data (technical indicators)
 * - Financial Modeling Prep (fundamentals)
 * - CoinGecko (crypto data)
 * - FRED (economic indicators)
 * - NewsAPI + NewsData.io (news aggregation)
 * 
 * @version 2.0.0
 * @date December 27, 2025
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// API Keys from environment
const API_KEYS = {
  alphaVantage: process.env.ALPHA_VANTAGE_API_KEY,
  finnhub: process.env.FINNHUB_API_KEY,
  twelveData: process.env.TWELVE_DATA_API_KEY,
  fmp: process.env.FMP_API_KEY,
  coinGecko: process.env.COINGECKO_API_KEY,
  fred: process.env.FRED_API_KEY,
  newsApi: process.env.NEWSAPI_API_KEY,
  newsData: process.env.NEWSDATA_API_KEY,
};

// ============================================================================
// TYPES
// ============================================================================

interface MarketDataRequest {
  symbol: string;
  type?: 'stock' | 'crypto' | 'etf' | 'forex';
  include?: string[]; // ['quote', 'fundamentals', 'technicals', 'news', 'sentiment']
}

interface AggregatedMarketData {
  symbol: string;
  type: string;
  quote?: QuoteData;
  fundamentals?: FundamentalsData;
  technicals?: TechnicalsData;
  news?: NewsItem[];
  sentiment?: SentimentData;
  sources: string[];
  timestamp: string;
}

interface QuoteData {
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  previousClose: number;
  marketCap?: number;
  pe?: number;
  dividend?: number;
  source: string;
}

interface FundamentalsData {
  marketCap: number;
  peRatio: number;
  pegRatio: number;
  eps: number;
  revenue: number;
  revenueGrowth: number;
  profitMargin: number;
  debtToEquity: number;
  currentRatio: number;
  roe: number;
  dividendYield: number;
  beta: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  analystRating: string;
  priceTarget: number;
  source: string;
}

interface TechnicalsData {
  rsi: number;
  macd: { value: number; signal: number; histogram: number };
  sma20: number;
  sma50: number;
  sma200: number;
  ema12: number;
  ema26: number;
  bollingerBands: { upper: number; middle: number; lower: number };
  atr: number;
  adx: number;
  volume: number;
  avgVolume: number;
  relativeVolume: number;
  source: string;
}

interface NewsItem {
  title: string;
  summary: string;
  url: string;
  source: string;
  publishedAt: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
}

interface SentimentData {
  overall: 'bullish' | 'bearish' | 'neutral';
  score: number; // -1 to 1
  newsScore: number;
  socialScore: number;
  analystScore: number;
  insiderScore: number;
  source: string;
}

// ============================================================================
// DATA FETCHERS
// ============================================================================

async function fetchAlphaVantageQuote(symbol: string): Promise<QuoteData | null> {
  if (!API_KEYS.alphaVantage) return null;
  
  try {
    const response = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEYS.alphaVantage}`
    );
    const data = await response.json();
    const quote = data['Global Quote'];
    
    if (!quote) return null;
    
    return {
      price: parseFloat(quote['05. price']),
      change: parseFloat(quote['09. change']),
      changePercent: parseFloat(quote['10. change percent']?.replace('%', '')),
      open: parseFloat(quote['02. open']),
      high: parseFloat(quote['03. high']),
      low: parseFloat(quote['04. low']),
      volume: parseInt(quote['06. volume']),
      previousClose: parseFloat(quote['08. previous close']),
      source: 'Alpha Vantage'
    };
  } catch (error) {
    console.error('Alpha Vantage error:', error);
    return null;
  }
}

async function fetchFinnhubQuote(symbol: string): Promise<QuoteData | null> {
  if (!API_KEYS.finnhub) return null;
  
  try {
    const response = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${API_KEYS.finnhub}`
    );
    const data = await response.json();
    
    if (!data.c) return null;
    
    return {
      price: data.c,
      change: data.d,
      changePercent: data.dp,
      open: data.o,
      high: data.h,
      low: data.l,
      volume: 0, // Not provided in quote
      previousClose: data.pc,
      source: 'Finnhub'
    };
  } catch (error) {
    console.error('Finnhub error:', error);
    return null;
  }
}

async function fetchTwelveDataTechnicals(symbol: string): Promise<TechnicalsData | null> {
  if (!API_KEYS.twelveData) return null;
  
  try {
    // Fetch multiple indicators
    const [rsiRes, macdRes, smaRes] = await Promise.all([
      fetch(`https://api.twelvedata.com/rsi?symbol=${symbol}&interval=1day&apikey=${API_KEYS.twelveData}`),
      fetch(`https://api.twelvedata.com/macd?symbol=${symbol}&interval=1day&apikey=${API_KEYS.twelveData}`),
      fetch(`https://api.twelvedata.com/sma?symbol=${symbol}&interval=1day&time_period=20&apikey=${API_KEYS.twelveData}`)
    ]);
    
    const [rsiData, macdData, smaData] = await Promise.all([
      rsiRes.json(),
      macdRes.json(),
      smaRes.json()
    ]);
    
    return {
      rsi: parseFloat(rsiData.values?.[0]?.rsi || 50),
      macd: {
        value: parseFloat(macdData.values?.[0]?.macd || 0),
        signal: parseFloat(macdData.values?.[0]?.macd_signal || 0),
        histogram: parseFloat(macdData.values?.[0]?.macd_hist || 0)
      },
      sma20: parseFloat(smaData.values?.[0]?.sma || 0),
      sma50: 0,
      sma200: 0,
      ema12: 0,
      ema26: 0,
      bollingerBands: { upper: 0, middle: 0, lower: 0 },
      atr: 0,
      adx: 0,
      volume: 0,
      avgVolume: 0,
      relativeVolume: 1,
      source: 'Twelve Data'
    };
  } catch (error) {
    console.error('Twelve Data error:', error);
    return null;
  }
}

async function fetchFMPFundamentals(symbol: string): Promise<FundamentalsData | null> {
  if (!API_KEYS.fmp) return null;
  
  try {
    const response = await fetch(
      `https://financialmodelingprep.com/api/v3/profile/${symbol}?apikey=${API_KEYS.fmp}`
    );
    const data = await response.json();
    const profile = data[0];
    
    if (!profile) return null;
    
    return {
      marketCap: profile.mktCap,
      peRatio: profile.pe || 0,
      pegRatio: 0,
      eps: profile.eps || 0,
      revenue: 0,
      revenueGrowth: 0,
      profitMargin: 0,
      debtToEquity: 0,
      currentRatio: 0,
      roe: 0,
      dividendYield: profile.lastDiv || 0,
      beta: profile.beta || 1,
      fiftyTwoWeekHigh: profile.range?.split('-')[1] ? parseFloat(profile.range.split('-')[1]) : 0,
      fiftyTwoWeekLow: profile.range?.split('-')[0] ? parseFloat(profile.range.split('-')[0]) : 0,
      analystRating: '',
      priceTarget: 0,
      source: 'Financial Modeling Prep'
    };
  } catch (error) {
    console.error('FMP error:', error);
    return null;
  }
}

async function fetchNews(symbol: string): Promise<NewsItem[]> {
  const news: NewsItem[] = [];
  
  // Finnhub News
  if (API_KEYS.finnhub) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const response = await fetch(
        `https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${weekAgo}&to=${today}&token=${API_KEYS.finnhub}`
      );
      const data = await response.json();
      
      if (Array.isArray(data)) {
        news.push(...data.slice(0, 5).map((item: any) => ({
          title: item.headline,
          summary: item.summary,
          url: item.url,
          source: item.source,
          publishedAt: new Date(item.datetime * 1000).toISOString(),
          sentiment: item.sentiment as any
        })));
      }
    } catch (error) {
      console.error('Finnhub news error:', error);
    }
  }
  
  // NewsAPI
  if (API_KEYS.newsApi && news.length < 10) {
    try {
      const response = await fetch(
        `https://newsapi.org/v2/everything?q=${symbol}&sortBy=publishedAt&pageSize=5&apiKey=${API_KEYS.newsApi}`
      );
      const data = await response.json();
      
      if (data.articles) {
        news.push(...data.articles.map((item: any) => ({
          title: item.title,
          summary: item.description,
          url: item.url,
          source: item.source?.name || 'NewsAPI',
          publishedAt: item.publishedAt,
          sentiment: undefined
        })));
      }
    } catch (error) {
      console.error('NewsAPI error:', error);
    }
  }
  
  return news.slice(0, 10);
}

async function fetchSentiment(symbol: string): Promise<SentimentData | null> {
  if (!API_KEYS.finnhub) return null;
  
  try {
    const response = await fetch(
      `https://finnhub.io/api/v1/news-sentiment?symbol=${symbol}&token=${API_KEYS.finnhub}`
    );
    const data = await response.json();
    
    if (!data.sentiment) return null;
    
    const score = data.sentiment.bullishPercent - data.sentiment.bearishPercent;
    
    return {
      overall: score > 0.2 ? 'bullish' : score < -0.2 ? 'bearish' : 'neutral',
      score: score,
      newsScore: data.companyNewsScore || 0,
      socialScore: data.sectorAverageBullishPercent || 0,
      analystScore: 0,
      insiderScore: 0,
      source: 'Finnhub'
    };
  } catch (error) {
    console.error('Sentiment error:', error);
    return null;
  }
}

async function fetchCryptoData(symbol: string): Promise<QuoteData | null> {
  try {
    // Map common symbols to CoinGecko IDs
    const symbolMap: Record<string, string> = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'SOL': 'solana',
      'XRP': 'ripple',
      'ADA': 'cardano',
      'DOGE': 'dogecoin'
    };
    
    const coinId = symbolMap[symbol.toUpperCase()] || symbol.toLowerCase();
    
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&community_data=false&developer_data=false`
    );
    const data = await response.json();
    
    if (!data.market_data) return null;
    
    const md = data.market_data;
    
    return {
      price: md.current_price.usd,
      change: md.price_change_24h,
      changePercent: md.price_change_percentage_24h,
      open: md.current_price.usd - md.price_change_24h,
      high: md.high_24h.usd,
      low: md.low_24h.usd,
      volume: md.total_volume.usd,
      previousClose: md.current_price.usd - md.price_change_24h,
      marketCap: md.market_cap.usd,
      source: 'CoinGecko'
    };
  } catch (error) {
    console.error('CoinGecko error:', error);
    return null;
  }
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get('symbol')?.toUpperCase();
  const type = searchParams.get('type') as 'stock' | 'crypto' | 'etf' | 'forex' || 'stock';
  const include = searchParams.get('include')?.split(',') || ['quote', 'fundamentals', 'technicals', 'news', 'sentiment'];
  
  if (!symbol) {
    return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
  }
  
  const result: AggregatedMarketData = {
    symbol,
    type,
    sources: [],
    timestamp: new Date().toISOString()
  };
  
  try {
    // Fetch data based on type
    if (type === 'crypto') {
      // Crypto data
      if (include.includes('quote')) {
        result.quote = await fetchCryptoData(symbol) || undefined;
        if (result.quote) result.sources.push('CoinGecko');
      }
    } else {
      // Stock data - fetch from multiple sources
      const fetchPromises: Promise<any>[] = [];
      
      if (include.includes('quote')) {
        fetchPromises.push(
          Promise.race([
            fetchFinnhubQuote(symbol),
            fetchAlphaVantageQuote(symbol)
          ]).then(quote => {
            if (quote) {
              result.quote = quote;
              result.sources.push(quote.source);
            }
          })
        );
      }
      
      if (include.includes('fundamentals')) {
        fetchPromises.push(
          fetchFMPFundamentals(symbol).then(fundamentals => {
            if (fundamentals) {
              result.fundamentals = fundamentals;
              result.sources.push(fundamentals.source);
            }
          })
        );
      }
      
      if (include.includes('technicals')) {
        fetchPromises.push(
          fetchTwelveDataTechnicals(symbol).then(technicals => {
            if (technicals) {
              result.technicals = technicals;
              result.sources.push(technicals.source);
            }
          })
        );
      }
      
      if (include.includes('news')) {
        fetchPromises.push(
          fetchNews(symbol).then(news => {
            result.news = news;
            if (news.length > 0) result.sources.push('News Aggregation');
          })
        );
      }
      
      if (include.includes('sentiment')) {
        fetchPromises.push(
          fetchSentiment(symbol).then(sentiment => {
            if (sentiment) {
              result.sentiment = sentiment;
              result.sources.push('Finnhub Sentiment');
            }
          })
        );
      }
      
      await Promise.all(fetchPromises);
    }
    
    // Remove duplicates from sources
    result.sources = [...new Set(result.sources)];
    
    return NextResponse.json(result);
    
  } catch (error: any) {
    console.error('Market data aggregation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch market data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Batch request for multiple symbols
  try {
    const { symbols, type, include } = await request.json() as {
      symbols: string[];
      type?: string;
      include?: string[];
    };
    
    if (!symbols || !Array.isArray(symbols)) {
      return NextResponse.json({ error: 'Symbols array required' }, { status: 400 });
    }
    
    // Limit batch size
    const limitedSymbols = symbols.slice(0, 10);
    
    const results = await Promise.all(
      limitedSymbols.map(async symbol => {
        const params = new URLSearchParams({
          symbol,
          type: type || 'stock',
          include: (include || ['quote']).join(',')
        });
        
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL}/api/market-data?${params}`
        );
        return response.json();
      })
    );
    
    return NextResponse.json({ results });
    
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
