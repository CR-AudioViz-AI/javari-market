// lib/connectors/finnhub.ts
// Market Oracle - Finnhub Real-Time Market Data Connector
// Created: December 22, 2025
// Provides real-time quotes, insider trading, sentiment, and earnings

/**
 * Finnhub Connector
 * 
 * Features:
 * - Real-time stock quotes
 * - Company profiles
 * - Insider transactions
 * - Social sentiment (Reddit, Twitter)
 * - Earnings calendar
 * - News
 * - Analyst recommendations
 */

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

interface FinnhubQuote {
  c: number;  // Current price
  h: number;  // High
  l: number;  // Low
  o: number;  // Open
  pc: number; // Previous close
  t: number;  // Timestamp
  d: number;  // Change
  dp: number; // Change percent
}

interface CompanyProfile {
  country: string;
  currency: string;
  exchange: string;
  ipo: string;
  marketCapitalization: number;
  name: string;
  phone: string;
  shareOutstanding: number;
  ticker: string;
  weburl: string;
  logo: string;
  finnhubIndustry: string;
}

interface InsiderTransaction {
  symbol: string;
  name: string;
  share: number;
  change: number;
  filingDate: string;
  transactionDate: string;
  transactionCode: string;
  transactionPrice: number;
}

interface SocialSentiment {
  symbol: string;
  reddit: Array<{
    atTime: string;
    mention: number;
    positiveScore: number;
    negativeScore: number;
    score: number;
  }>;
  twitter: Array<{
    atTime: string;
    mention: number;
    positiveScore: number;
    negativeScore: number;
    score: number;
  }>;
}

interface AnalystRecommendation {
  symbol: string;
  buy: number;
  hold: number;
  sell: number;
  strongBuy: number;
  strongSell: number;
  period: string;
}

interface EarningsCalendar {
  earningsCalendar: Array<{
    date: string;
    epsActual: number | null;
    epsEstimate: number | null;
    hour: string;
    quarter: number;
    revenueActual: number | null;
    revenueEstimate: number | null;
    symbol: string;
    year: number;
  }>;
}

interface MarketNews {
  category: string;
  datetime: number;
  headline: string;
  id: number;
  image: string;
  related: string;
  source: string;
  summary: string;
  url: string;
}

// Helper to make Finnhub API calls
async function fetchFinnhub<T>(endpoint: string, params: Record<string, string> = {}): Promise<T | null> {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    console.warn('FINNHUB_API_KEY not configured');
    return null;
  }

  const url = new URL(`${FINNHUB_BASE_URL}${endpoint}`);
  url.searchParams.set('token', apiKey);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  try {
    const response = await fetch(url.toString(), {
      next: { revalidate: 60 }, // Cache for 1 minute
    });

    if (!response.ok) {
      console.error(`Finnhub API error: ${response.status}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Finnhub fetch error:', error);
    return null;
  }
}

/**
 * Get real-time quote for a symbol
 */
export async function getQuote(symbol: string): Promise<{
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  timestamp: number;
} | null> {
  const quote = await fetchFinnhub<FinnhubQuote>('/quote', { symbol: symbol.toUpperCase() });
  if (!quote || quote.c === 0) return null;

  return {
    symbol: symbol.toUpperCase(),
    price: quote.c,
    change: quote.d,
    changePercent: quote.dp,
    high: quote.h,
    low: quote.l,
    open: quote.o,
    previousClose: quote.pc,
    timestamp: quote.t,
  };
}

/**
 * Get company profile
 */
export async function getCompanyProfile(symbol: string): Promise<{
  symbol: string;
  name: string;
  industry: string;
  marketCap: number;
  logo: string;
  website: string;
  exchange: string;
  country: string;
  ipo: string;
  sharesOutstanding: number;
} | null> {
  const profile = await fetchFinnhub<CompanyProfile>('/stock/profile2', { symbol: symbol.toUpperCase() });
  if (!profile || !profile.name) return null;

  return {
    symbol: profile.ticker,
    name: profile.name,
    industry: profile.finnhubIndustry,
    marketCap: profile.marketCapitalization * 1000000, // Convert to actual value
    logo: profile.logo,
    website: profile.weburl,
    exchange: profile.exchange,
    country: profile.country,
    ipo: profile.ipo,
    sharesOutstanding: profile.shareOutstanding * 1000000,
  };
}

/**
 * Get insider transactions
 */
export async function getInsiderTransactions(symbol: string): Promise<{
  transactions: Array<{
    name: string;
    shares: number;
    change: number;
    transactionDate: string;
    filingDate: string;
    type: 'BUY' | 'SELL' | 'OTHER';
    price: number | null;
    value: number | null;
  }>;
  summary: {
    netBuying: boolean;
    totalBuys: number;
    totalSells: number;
    netShares: number;
    signal: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  };
} | null> {
  const data = await fetchFinnhub<{ data: InsiderTransaction[] }>('/stock/insider-transactions', {
    symbol: symbol.toUpperCase(),
  });

  if (!data?.data || data.data.length === 0) {
    return {
      transactions: [],
      summary: {
        netBuying: false,
        totalBuys: 0,
        totalSells: 0,
        netShares: 0,
        signal: 'NEUTRAL',
      },
    };
  }

  const transactions = data.data.slice(0, 20).map(t => {
    let type: 'BUY' | 'SELL' | 'OTHER' = 'OTHER';
    if (t.transactionCode === 'P') type = 'BUY';
    else if (t.transactionCode === 'S') type = 'SELL';

    return {
      name: t.name,
      shares: Math.abs(t.share),
      change: t.change,
      transactionDate: t.transactionDate,
      filingDate: t.filingDate,
      type,
      price: t.transactionPrice || null,
      value: t.transactionPrice ? Math.abs(t.share * t.transactionPrice) : null,
    };
  });

  const buys = transactions.filter(t => t.type === 'BUY');
  const sells = transactions.filter(t => t.type === 'SELL');
  const totalBuys = buys.reduce((sum, t) => sum + t.shares, 0);
  const totalSells = sells.reduce((sum, t) => sum + t.shares, 0);
  const netShares = totalBuys - totalSells;

  let signal: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
  if (netShares > 0 && buys.length > sells.length) signal = 'BULLISH';
  else if (netShares < 0 && sells.length > buys.length) signal = 'BEARISH';

  return {
    transactions,
    summary: {
      netBuying: netShares > 0,
      totalBuys,
      totalSells,
      netShares,
      signal,
    },
  };
}

/**
 * Get social sentiment (Reddit + Twitter)
 */
export async function getSocialSentiment(symbol: string): Promise<{
  overallScore: number;
  overallSentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  reddit: {
    mentions: number;
    score: number;
    sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  };
  twitter: {
    mentions: number;
    score: number;
    sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  };
  trending: boolean;
} | null> {
  const data = await fetchFinnhub<SocialSentiment>('/stock/social-sentiment', {
    symbol: symbol.toUpperCase(),
  });

  if (!data) {
    return {
      overallScore: 0,
      overallSentiment: 'NEUTRAL',
      reddit: { mentions: 0, score: 0, sentiment: 'NEUTRAL' },
      twitter: { mentions: 0, score: 0, sentiment: 'NEUTRAL' },
      trending: false,
    };
  }

  // Get latest data points
  const latestReddit = data.reddit?.slice(-1)[0];
  const latestTwitter = data.twitter?.slice(-1)[0];

  const redditScore = latestReddit?.score || 0;
  const twitterScore = latestTwitter?.score || 0;
  const redditMentions = latestReddit?.mention || 0;
  const twitterMentions = latestTwitter?.mention || 0;

  const getSentiment = (score: number): 'BULLISH' | 'BEARISH' | 'NEUTRAL' => {
    if (score > 0.2) return 'BULLISH';
    if (score < -0.2) return 'BEARISH';
    return 'NEUTRAL';
  };

  const overallScore = (redditScore + twitterScore) / 2;
  const totalMentions = redditMentions + twitterMentions;

  return {
    overallScore,
    overallSentiment: getSentiment(overallScore),
    reddit: {
      mentions: redditMentions,
      score: redditScore,
      sentiment: getSentiment(redditScore),
    },
    twitter: {
      mentions: twitterMentions,
      score: twitterScore,
      sentiment: getSentiment(twitterScore),
    },
    trending: totalMentions > 100,
  };
}

/**
 * Get analyst recommendations
 */
export async function getAnalystRecommendations(symbol: string): Promise<{
  consensus: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';
  score: number; // 1-5 scale
  distribution: {
    strongBuy: number;
    buy: number;
    hold: number;
    sell: number;
    strongSell: number;
  };
  totalAnalysts: number;
  period: string;
} | null> {
  const data = await fetchFinnhub<AnalystRecommendation[]>('/stock/recommendation', {
    symbol: symbol.toUpperCase(),
  });

  if (!data || data.length === 0) return null;

  const latest = data[0];
  const total = latest.strongBuy + latest.buy + latest.hold + latest.sell + latest.strongSell;
  
  if (total === 0) return null;

  // Calculate weighted score (1-5 scale)
  const score = (
    (latest.strongBuy * 5) +
    (latest.buy * 4) +
    (latest.hold * 3) +
    (latest.sell * 2) +
    (latest.strongSell * 1)
  ) / total;

  let consensus: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';
  if (score >= 4.5) consensus = 'STRONG_BUY';
  else if (score >= 3.5) consensus = 'BUY';
  else if (score >= 2.5) consensus = 'HOLD';
  else if (score >= 1.5) consensus = 'SELL';
  else consensus = 'STRONG_SELL';

  return {
    consensus,
    score: Math.round(score * 10) / 10,
    distribution: {
      strongBuy: latest.strongBuy,
      buy: latest.buy,
      hold: latest.hold,
      sell: latest.sell,
      strongSell: latest.strongSell,
    },
    totalAnalysts: total,
    period: latest.period,
  };
}

/**
 * Get upcoming earnings
 */
export async function getEarningsCalendar(
  from?: string,
  to?: string
): Promise<Array<{
  symbol: string;
  date: string;
  hour: 'BMO' | 'AMC' | 'DMH'; // Before Market Open, After Market Close, During Market Hours
  epsEstimate: number | null;
  revenueEstimate: number | null;
  quarter: number;
  year: number;
}>> {
  const today = new Date();
  const defaultFrom = today.toISOString().split('T')[0];
  const defaultTo = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const data = await fetchFinnhub<EarningsCalendar>('/calendar/earnings', {
    from: from || defaultFrom,
    to: to || defaultTo,
  });

  if (!data?.earningsCalendar) return [];

  return data.earningsCalendar.map(e => ({
    symbol: e.symbol,
    date: e.date,
    hour: e.hour as 'BMO' | 'AMC' | 'DMH',
    epsEstimate: e.epsEstimate,
    revenueEstimate: e.revenueEstimate,
    quarter: e.quarter,
    year: e.year,
  }));
}

/**
 * Get market news
 */
export async function getMarketNews(category: 'general' | 'forex' | 'crypto' | 'merger' = 'general'): Promise<Array<{
  id: number;
  headline: string;
  summary: string;
  source: string;
  url: string;
  image: string;
  datetime: Date;
  related: string[];
}>> {
  const data = await fetchFinnhub<MarketNews[]>('/news', { category });

  if (!data) return [];

  return data.slice(0, 20).map(n => ({
    id: n.id,
    headline: n.headline,
    summary: n.summary,
    source: n.source,
    url: n.url,
    image: n.image,
    datetime: new Date(n.datetime * 1000),
    related: n.related ? n.related.split(',') : [],
  }));
}

/**
 * Get company news
 */
export async function getCompanyNews(
  symbol: string,
  from?: string,
  to?: string
): Promise<Array<{
  headline: string;
  summary: string;
  source: string;
  url: string;
  image: string;
  datetime: Date;
}>> {
  const today = new Date();
  const defaultFrom = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const defaultTo = today.toISOString().split('T')[0];

  const data = await fetchFinnhub<MarketNews[]>('/company-news', {
    symbol: symbol.toUpperCase(),
    from: from || defaultFrom,
    to: to || defaultTo,
  });

  if (!data) return [];

  return data.slice(0, 20).map(n => ({
    headline: n.headline,
    summary: n.summary,
    source: n.source,
    url: n.url,
    image: n.image,
    datetime: new Date(n.datetime * 1000),
  }));
}

/**
 * Get comprehensive stock intelligence
 */
export async function getStockIntelligence(symbol: string): Promise<{
  quote: Awaited<ReturnType<typeof getQuote>>;
  profile: Awaited<ReturnType<typeof getCompanyProfile>>;
  insiders: Awaited<ReturnType<typeof getInsiderTransactions>>;
  sentiment: Awaited<ReturnType<typeof getSocialSentiment>>;
  analysts: Awaited<ReturnType<typeof getAnalystRecommendations>>;
  news: Awaited<ReturnType<typeof getCompanyNews>>;
}> {
  const [quote, profile, insiders, sentiment, analysts, news] = await Promise.all([
    getQuote(symbol),
    getCompanyProfile(symbol),
    getInsiderTransactions(symbol),
    getSocialSentiment(symbol),
    getAnalystRecommendations(symbol),
    getCompanyNews(symbol),
  ]);

  return { quote, profile, insiders, sentiment, analysts, news };
}

export default {
  getQuote,
  getCompanyProfile,
  getInsiderTransactions,
  getSocialSentiment,
  getAnalystRecommendations,
  getEarningsCalendar,
  getMarketNews,
  getCompanyNews,
  getStockIntelligence,
};
