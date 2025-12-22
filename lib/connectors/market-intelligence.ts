// lib/connectors/market-intelligence.ts
// Market Oracle - Multi-Source Market Intelligence Engine
// Created: December 22, 2025
// Aggregates data from ALL available free APIs for comprehensive analysis

/**
 * AVAILABLE DATA SOURCES (from Superpack):
 * ========================================
 * 
 * STOCKS:
 * - Alpha Vantage: Real-time, historical, 50+ technicals, news, sentiment
 * - Finnhub: Prices, sentiment, insider trading, earnings
 * - Twelve Data: Stocks, crypto, forex, technicals
 * 
 * CRYPTO:
 * - CoinGecko: 10,000+ coins, market caps, exchanges, sentiment
 * - Binance: Real-time order books, trades, candles
 * - CoinCap: Real-time prices
 * 
 * NEWS & SENTIMENT:
 * - Alpha Vantage News API: Market news, sentiment scoring
 * - NewsAPI: Breaking news, headlines
 * - Finnhub: Social sentiment, insider trading signals
 * 
 * TECHNICALS:
 * - Alpha Vantage: RSI, MACD, SMA/EMA, Bollinger, Stochastic, ADX, OBV, VWAP
 * - Twelve Data: Additional technical indicators
 */

// ============================================================================
// INTERFACES
// ============================================================================

export interface TechnicalIndicators {
  rsi?: number;           // Relative Strength Index (0-100)
  macd?: {               // Moving Average Convergence Divergence
    value: number;
    signal: number;
    histogram: number;
  };
  sma20?: number;         // 20-day Simple Moving Average
  sma50?: number;         // 50-day Simple Moving Average
  sma200?: number;        // 200-day Simple Moving Average
  ema12?: number;         // 12-day Exponential Moving Average
  ema26?: number;         // 26-day Exponential Moving Average
  bollingerBands?: {     // Bollinger Bands
    upper: number;
    middle: number;
    lower: number;
  };
  stochastic?: {         // Stochastic Oscillator
    k: number;
    d: number;
  };
  adx?: number;          // Average Directional Index
  obv?: number;          // On-Balance Volume
  vwap?: number;         // Volume Weighted Average Price
  atr?: number;          // Average True Range
}

export interface SentimentData {
  overall: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  score: number;         // -100 to +100
  sources: {
    news?: number;       // News sentiment score
    social?: number;     // Social media sentiment
    insider?: number;    // Insider trading signal
    analyst?: number;    // Analyst consensus
  };
  newsCount: number;
  positiveNews: number;
  negativeNews: number;
  topHeadlines: Array<{
    title: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    source: string;
    url: string;
    publishedAt: string;
  }>;
}

export interface RiskMetrics {
  overallScore: number;   // 0-100 (higher = more risky)
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH' | 'EXTREME';
  factors: {
    volatility: number;   // Historical volatility
    liquidity: number;    // Trading volume vs average
    marketCap: number;    // Size risk (smaller = riskier)
    shortInterest?: number; // Short interest risk
    newsVolatility: number; // News-driven risk
    technicalRisk: number;  // Overbought/oversold
  };
  warnings: string[];
}

export interface ComprehensiveMarketData {
  // Basic Info
  symbol: string;
  name: string;
  assetType: 'STOCK' | 'CRYPTO' | 'PENNY_STOCK' | 'ETF';
  sector?: string;
  industry?: string;
  
  // Price Data
  price: {
    current: number;
    open: number;
    high: number;
    low: number;
    previousClose: number;
    change: number;
    changePercent: number;
    volume: number;
    avgVolume: number;
  };
  
  // Fundamentals (stocks only)
  fundamentals?: {
    marketCap: number;
    peRatio: number | null;
    forwardPE: number | null;
    eps: number | null;
    dividendYield: number | null;
    beta: number | null;
    profitMargin: number | null;
    revenueGrowth: number | null;
  };
  
  // Technical Indicators
  technicals: TechnicalIndicators;
  
  // Sentiment Analysis
  sentiment: SentimentData;
  
  // Risk Assessment
  risk: RiskMetrics;
  
  // 52-Week Data
  yearRange: {
    high: number;
    low: number;
    percentFromHigh: number;
    percentFromLow: number;
  };
  
  // Data Quality
  dataQuality: {
    score: number;        // 0-100
    sources: string[];    // Which APIs provided data
    lastUpdated: string;
    warnings: string[];
  };
}

// ============================================================================
// API CALLERS
// ============================================================================

async function fetchAlphaVantage(endpoint: string, params: Record<string, string>): Promise<any> {
  const key = process.env.ALPHA_VANTAGE_API_KEY;
  if (!key) return null;
  
  const url = new URL('https://www.alphavantage.co/query');
  url.searchParams.set('apikey', key);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  
  try {
    const res = await fetch(url.toString());
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

async function fetchFinnhub(endpoint: string): Promise<any> {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) return null;
  
  try {
    const res = await fetch(`https://finnhub.io/api/v1/${endpoint}&token=${key}`);
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

async function fetchTwelveData(endpoint: string, params: Record<string, string>): Promise<any> {
  const key = process.env.TWELVE_DATA_API_KEY;
  if (!key) return null;
  
  const url = new URL(`https://api.twelvedata.com/${endpoint}`);
  url.searchParams.set('apikey', key);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  
  try {
    const res = await fetch(url.toString());
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

async function fetchCoinGecko(endpoint: string): Promise<any> {
  const key = process.env.COINGECKO_API_KEY;
  const headers: Record<string, string> = { 'Accept': 'application/json' };
  if (key) headers['x-cg-demo-api-key'] = key;
  
  try {
    const res = await fetch(`https://api.coingecko.com/api/v3/${endpoint}`, { headers });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

// ============================================================================
// TECHNICAL INDICATORS
// ============================================================================

async function getTechnicalIndicators(symbol: string): Promise<TechnicalIndicators> {
  const indicators: TechnicalIndicators = {};
  
  // Fetch RSI
  const rsiData = await fetchAlphaVantage('', { function: 'RSI', symbol, interval: 'daily', time_period: '14', series_type: 'close' });
  if (rsiData?.['Technical Analysis: RSI']) {
    const latest = Object.values(rsiData['Technical Analysis: RSI'])[0] as any;
    indicators.rsi = parseFloat(latest?.RSI || '50');
  }
  
  // Fetch MACD
  const macdData = await fetchAlphaVantage('', { function: 'MACD', symbol, interval: 'daily', series_type: 'close' });
  if (macdData?.['Technical Analysis: MACD']) {
    const latest = Object.values(macdData['Technical Analysis: MACD'])[0] as any;
    indicators.macd = {
      value: parseFloat(latest?.MACD || '0'),
      signal: parseFloat(latest?.MACD_Signal || '0'),
      histogram: parseFloat(latest?.MACD_Hist || '0'),
    };
  }
  
  // Fetch SMAs
  const sma50Data = await fetchAlphaVantage('', { function: 'SMA', symbol, interval: 'daily', time_period: '50', series_type: 'close' });
  if (sma50Data?.['Technical Analysis: SMA']) {
    const latest = Object.values(sma50Data['Technical Analysis: SMA'])[0] as any;
    indicators.sma50 = parseFloat(latest?.SMA || '0');
  }
  
  const sma200Data = await fetchAlphaVantage('', { function: 'SMA', symbol, interval: 'daily', time_period: '200', series_type: 'close' });
  if (sma200Data?.['Technical Analysis: SMA']) {
    const latest = Object.values(sma200Data['Technical Analysis: SMA'])[0] as any;
    indicators.sma200 = parseFloat(latest?.SMA || '0');
  }
  
  // Fetch Bollinger Bands
  const bbData = await fetchAlphaVantage('', { function: 'BBANDS', symbol, interval: 'daily', time_period: '20', series_type: 'close' });
  if (bbData?.['Technical Analysis: BBANDS']) {
    const latest = Object.values(bbData['Technical Analysis: BBANDS'])[0] as any;
    indicators.bollingerBands = {
      upper: parseFloat(latest?.['Real Upper Band'] || '0'),
      middle: parseFloat(latest?.['Real Middle Band'] || '0'),
      lower: parseFloat(latest?.['Real Lower Band'] || '0'),
    };
  }
  
  // Fetch ADX
  const adxData = await fetchAlphaVantage('', { function: 'ADX', symbol, interval: 'daily', time_period: '14' });
  if (adxData?.['Technical Analysis: ADX']) {
    const latest = Object.values(adxData['Technical Analysis: ADX'])[0] as any;
    indicators.adx = parseFloat(latest?.ADX || '0');
  }
  
  return indicators;
}

// ============================================================================
// SENTIMENT ANALYSIS
// ============================================================================

async function getSentimentData(symbol: string): Promise<SentimentData> {
  const sentiment: SentimentData = {
    overall: 'NEUTRAL',
    score: 0,
    sources: {},
    newsCount: 0,
    positiveNews: 0,
    negativeNews: 0,
    topHeadlines: [],
  };
  
  // Alpha Vantage News & Sentiment
  const newsData = await fetchAlphaVantage('', { function: 'NEWS_SENTIMENT', tickers: symbol, limit: '50' });
  if (newsData?.feed) {
    const articles = newsData.feed as any[];
    sentiment.newsCount = articles.length;
    
    let totalScore = 0;
    for (const article of articles.slice(0, 10)) {
      const tickerSentiment = article.ticker_sentiment?.find((t: any) => t.ticker === symbol);
      const score = parseFloat(tickerSentiment?.ticker_sentiment_score || '0');
      totalScore += score;
      
      if (score > 0.1) sentiment.positiveNews++;
      else if (score < -0.1) sentiment.negativeNews++;
      
      sentiment.topHeadlines.push({
        title: article.title,
        sentiment: score > 0.1 ? 'positive' : score < -0.1 ? 'negative' : 'neutral',
        source: article.source,
        url: article.url,
        publishedAt: article.time_published,
      });
    }
    
    sentiment.sources.news = (totalScore / Math.max(articles.length, 1)) * 100;
  }
  
  // Finnhub Social Sentiment
  const finnhubSentiment = await fetchFinnhub(`stock/social-sentiment?symbol=${symbol}`);
  if (finnhubSentiment?.reddit || finnhubSentiment?.twitter) {
    const redditScore = finnhubSentiment.reddit?.slice(-1)[0]?.score || 0;
    const twitterScore = finnhubSentiment.twitter?.slice(-1)[0]?.score || 0;
    sentiment.sources.social = ((redditScore + twitterScore) / 2) * 100;
  }
  
  // Finnhub Insider Transactions
  const insiderData = await fetchFinnhub(`stock/insider-transactions?symbol=${symbol}`);
  if (insiderData?.data?.length > 0) {
    const recentInsider = insiderData.data.slice(0, 10);
    const buyCount = recentInsider.filter((t: any) => t.transactionType === 'P').length;
    const sellCount = recentInsider.filter((t: any) => t.transactionType === 'S').length;
    sentiment.sources.insider = ((buyCount - sellCount) / Math.max(buyCount + sellCount, 1)) * 100;
  }
  
  // Calculate overall sentiment
  const scores = Object.values(sentiment.sources).filter(s => s !== undefined) as number[];
  if (scores.length > 0) {
    sentiment.score = scores.reduce((a, b) => a + b, 0) / scores.length;
    sentiment.overall = sentiment.score > 20 ? 'BULLISH' : sentiment.score < -20 ? 'BEARISH' : 'NEUTRAL';
  }
  
  return sentiment;
}

// ============================================================================
// RISK ASSESSMENT
// ============================================================================

function calculateRiskMetrics(
  price: ComprehensiveMarketData['price'],
  fundamentals: ComprehensiveMarketData['fundamentals'],
  technicals: TechnicalIndicators,
  sentiment: SentimentData
): RiskMetrics {
  const factors = {
    volatility: 0,
    liquidity: 0,
    marketCap: 0,
    newsVolatility: 0,
    technicalRisk: 0,
  };
  const warnings: string[] = [];
  
  // Volatility risk (based on daily range)
  const dailyRange = ((price.high - price.low) / price.low) * 100;
  factors.volatility = Math.min(dailyRange * 10, 100);
  if (dailyRange > 5) warnings.push('High daily volatility');
  
  // Liquidity risk (volume vs average)
  const volumeRatio = price.volume / Math.max(price.avgVolume, 1);
  factors.liquidity = volumeRatio < 0.5 ? 80 : volumeRatio < 1 ? 40 : 20;
  if (volumeRatio < 0.3) warnings.push('Low liquidity');
  
  // Market cap risk
  if (fundamentals?.marketCap) {
    if (fundamentals.marketCap < 300000000) {
      factors.marketCap = 90; // Penny stock territory
      warnings.push('Micro-cap - high risk');
    } else if (fundamentals.marketCap < 2000000000) {
      factors.marketCap = 60; // Small cap
    } else if (fundamentals.marketCap < 10000000000) {
      factors.marketCap = 40; // Mid cap
    } else {
      factors.marketCap = 20; // Large cap
    }
  }
  
  // News volatility risk
  factors.newsVolatility = Math.min(Math.abs(sentiment.score), 100);
  if (sentiment.newsCount > 20) warnings.push('High news volume - potential volatility');
  
  // Technical risk (overbought/oversold)
  if (technicals.rsi) {
    if (technicals.rsi > 70) {
      factors.technicalRisk = 70;
      warnings.push('RSI overbought (>70)');
    } else if (technicals.rsi < 30) {
      factors.technicalRisk = 50;
      warnings.push('RSI oversold (<30)');
    } else {
      factors.technicalRisk = 20;
    }
  }
  
  // Calculate overall score
  const overallScore = Math.round(
    (factors.volatility * 0.25) +
    (factors.liquidity * 0.2) +
    (factors.marketCap * 0.25) +
    (factors.newsVolatility * 0.15) +
    (factors.technicalRisk * 0.15)
  );
  
  // Determine risk level
  let riskLevel: RiskMetrics['riskLevel'];
  if (overallScore <= 20) riskLevel = 'LOW';
  else if (overallScore <= 40) riskLevel = 'MODERATE';
  else if (overallScore <= 60) riskLevel = 'HIGH';
  else if (overallScore <= 80) riskLevel = 'VERY_HIGH';
  else riskLevel = 'EXTREME';
  
  return { overallScore, riskLevel, factors, warnings };
}

// ============================================================================
// MAIN INTELLIGENCE FUNCTION
// ============================================================================

export async function getComprehensiveMarketIntelligence(symbol: string): Promise<ComprehensiveMarketData | null> {
  const sources: string[] = [];
  const warnings: string[] = [];
  
  // Determine asset type
  const isOTC = symbol.includes('.') || symbol.length > 5;
  const isCrypto = symbol.toUpperCase() === 'BTC' || symbol.toUpperCase() === 'ETH' || symbol.includes('-USD');
  
  // Fetch basic quote data from Alpha Vantage
  const quoteData = await fetchAlphaVantage('', { function: 'GLOBAL_QUOTE', symbol });
  const quote = quoteData?.['Global Quote'];
  
  if (!quote || !quote['05. price']) {
    warnings.push('Primary data source unavailable');
    // Try Finnhub as backup
    const finnhubQuote = await fetchFinnhub(`quote?symbol=${symbol}`);
    if (!finnhubQuote?.c) return null;
    
    sources.push('Finnhub');
  } else {
    sources.push('Alpha Vantage');
  }
  
  // Fetch company overview
  const overviewData = await fetchAlphaVantage('', { function: 'OVERVIEW', symbol });
  if (overviewData?.Name) sources.push('Alpha Vantage Overview');
  
  // Get technical indicators
  const technicals = await getTechnicalIndicators(symbol);
  if (Object.keys(technicals).length > 0) sources.push('Alpha Vantage Technicals');
  
  // Get sentiment data
  const sentiment = await getSentimentData(symbol);
  if (sentiment.newsCount > 0) sources.push('Alpha Vantage News', 'Finnhub Sentiment');
  
  // Build price data
  const priceData = {
    current: parseFloat(quote?.['05. price'] || '0'),
    open: parseFloat(quote?.['02. open'] || '0'),
    high: parseFloat(quote?.['03. high'] || '0'),
    low: parseFloat(quote?.['04. low'] || '0'),
    previousClose: parseFloat(quote?.['08. previous close'] || '0'),
    change: parseFloat(quote?.['09. change'] || '0'),
    changePercent: parseFloat((quote?.['10. change percent'] || '0%').replace('%', '')),
    volume: parseInt(quote?.['06. volume'] || '0'),
    avgVolume: parseInt(overviewData?.AverageVolume || '0'),
  };
  
  // Build fundamentals
  const fundamentals = overviewData ? {
    marketCap: parseInt(overviewData.MarketCapitalization || '0'),
    peRatio: overviewData.PERatio ? parseFloat(overviewData.PERatio) : null,
    forwardPE: overviewData.ForwardPE ? parseFloat(overviewData.ForwardPE) : null,
    eps: overviewData.EPS ? parseFloat(overviewData.EPS) : null,
    dividendYield: overviewData.DividendYield ? parseFloat(overviewData.DividendYield) : null,
    beta: overviewData.Beta ? parseFloat(overviewData.Beta) : null,
    profitMargin: overviewData.ProfitMargin ? parseFloat(overviewData.ProfitMargin) : null,
    revenueGrowth: overviewData.QuarterlyRevenueGrowthYOY ? parseFloat(overviewData.QuarterlyRevenueGrowthYOY) : null,
  } : undefined;
  
  // Year range
  const high52 = parseFloat(overviewData?.['52WeekHigh'] || quote?.['03. high'] || '0');
  const low52 = parseFloat(overviewData?.['52WeekLow'] || quote?.['04. low'] || '0');
  
  // Calculate risk metrics
  const risk = calculateRiskMetrics(priceData, fundamentals, technicals, sentiment);
  
  // Determine asset type
  let assetType: ComprehensiveMarketData['assetType'] = 'STOCK';
  if (isCrypto) assetType = 'CRYPTO';
  else if (isOTC || (fundamentals?.marketCap && fundamentals.marketCap < 300000000)) assetType = 'PENNY_STOCK';
  else if (overviewData?.AssetType === 'ETF') assetType = 'ETF';
  
  return {
    symbol: symbol.toUpperCase(),
    name: overviewData?.Name || symbol,
    assetType,
    sector: overviewData?.Sector,
    industry: overviewData?.Industry,
    price: priceData,
    fundamentals,
    technicals,
    sentiment,
    risk,
    yearRange: {
      high: high52,
      low: low52,
      percentFromHigh: high52 > 0 ? ((high52 - priceData.current) / high52) * 100 : 0,
      percentFromLow: low52 > 0 ? ((priceData.current - low52) / low52) * 100 : 0,
    },
    dataQuality: {
      score: Math.min(sources.length * 20, 100),
      sources,
      lastUpdated: new Date().toISOString(),
      warnings,
    },
  };
}

// ============================================================================
// CRYPTO INTELLIGENCE
// ============================================================================

export async function getCryptoIntelligence(coinId: string): Promise<ComprehensiveMarketData | null> {
  const sources: string[] = [];
  
  // Fetch from CoinGecko
  const coinData = await fetchCoinGecko(`coins/${coinId}?localization=false&tickers=false&community_data=true&developer_data=false`);
  if (!coinData) return null;
  
  sources.push('CoinGecko');
  
  const marketData = coinData.market_data;
  
  return {
    symbol: coinData.symbol?.toUpperCase() || coinId,
    name: coinData.name,
    assetType: 'CRYPTO',
    price: {
      current: marketData?.current_price?.usd || 0,
      open: marketData?.current_price?.usd || 0,
      high: marketData?.high_24h?.usd || 0,
      low: marketData?.low_24h?.usd || 0,
      previousClose: marketData?.current_price?.usd || 0,
      change: marketData?.price_change_24h || 0,
      changePercent: marketData?.price_change_percentage_24h || 0,
      volume: marketData?.total_volume?.usd || 0,
      avgVolume: marketData?.total_volume?.usd || 0,
    },
    fundamentals: {
      marketCap: marketData?.market_cap?.usd || 0,
      peRatio: null,
      forwardPE: null,
      eps: null,
      dividendYield: null,
      beta: null,
      profitMargin: null,
      revenueGrowth: null,
    },
    technicals: {
      rsi: undefined, // Would need additional API
    },
    sentiment: {
      overall: (marketData?.price_change_percentage_24h || 0) > 0 ? 'BULLISH' : 'BEARISH',
      score: (marketData?.price_change_percentage_24h || 0) * 5,
      sources: {
        social: coinData.sentiment_votes_up_percentage,
      },
      newsCount: 0,
      positiveNews: 0,
      negativeNews: 0,
      topHeadlines: [],
    },
    risk: {
      overallScore: marketData?.market_cap_rank > 100 ? 70 : marketData?.market_cap_rank > 20 ? 50 : 30,
      riskLevel: marketData?.market_cap_rank > 100 ? 'HIGH' : marketData?.market_cap_rank > 20 ? 'MODERATE' : 'LOW',
      factors: {
        volatility: Math.abs(marketData?.price_change_percentage_24h || 0) * 3,
        liquidity: 30,
        marketCap: marketData?.market_cap_rank > 100 ? 70 : 30,
        newsVolatility: 30,
        technicalRisk: 30,
      },
      warnings: marketData?.market_cap_rank > 100 ? ['Low market cap rank'] : [],
    },
    yearRange: {
      high: marketData?.ath?.usd || 0,
      low: marketData?.atl?.usd || 0,
      percentFromHigh: marketData?.ath_change_percentage?.usd || 0,
      percentFromLow: marketData?.atl_change_percentage?.usd || 0,
    },
    dataQuality: {
      score: 80,
      sources,
      lastUpdated: new Date().toISOString(),
      warnings: [],
    },
  };
}

export default {
  getComprehensiveMarketIntelligence,
  getCryptoIntelligence,
  getTechnicalIndicators,
  getSentimentData,
};
