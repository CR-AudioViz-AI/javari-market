// Market Oracle - Multi-Source News Aggregator API
// Aggregates news from 5+ sources with sentiment analysis
// Sources: NewsAPI, NewsData.io, Currents, TheNewsAPI, GNews

import { NextResponse } from 'next/server';

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// API Keys from credentials
const NEWS_API_KEY = process.env.NEWSAPI_API_KEY || '29a98d7494b74400b8423f0d1143e8ff';
const NEWSDATA_API_KEY = process.env.NEWSDATA_API_KEY || 'pub_7b15a6d1ccd243389a774daaf72b64b4';
const CURRENTS_API_KEY = process.env.CURRENTS_API_KEY || 'mYKRTO6yENe9IwvKYxdeh9vecgj6M_HWwpi0d3z2UvbsZwZd';
const THENEWS_API_KEY = process.env.THENEWS_API_KEY || 'NLC29DIjhVm3WM7dIPXWIGmnlKLd65JtpKKdWvTI';
const GNEWS_API_KEY = process.env.GNEWS_API_KEY || 'bdcf37e0b6b8ad8fc5cb1bdd0cd8ff88';

interface NewsArticle {
  id: string;
  title: string;
  description: string;
  content?: string;
  url: string;
  imageUrl?: string;
  source: string;
  sourceIcon?: string;
  author?: string;
  publishedAt: string;
  category: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  sentimentScore: number;
  relevanceScore: number;
  tickers: string[];
  keywords: string[];
  provider: string;
}

// Sentiment keywords for analysis
const BULLISH_KEYWORDS = [
  'surge', 'soar', 'rally', 'gain', 'jump', 'climb', 'rise', 'boost', 'breakthrough',
  'record high', 'beat', 'exceed', 'outperform', 'upgrade', 'buy', 'bullish',
  'growth', 'profit', 'revenue beat', 'strong', 'positive', 'optimistic',
  'acquisition', 'partnership', 'expansion', 'innovation', 'breakthrough'
];

const BEARISH_KEYWORDS = [
  'crash', 'plunge', 'tumble', 'drop', 'fall', 'decline', 'slump', 'sink',
  'record low', 'miss', 'disappoint', 'underperform', 'downgrade', 'sell', 'bearish',
  'loss', 'deficit', 'revenue miss', 'weak', 'negative', 'pessimistic',
  'layoff', 'lawsuit', 'investigation', 'recall', 'warning', 'concern'
];

// Stock ticker patterns
const TICKER_PATTERNS = /\b([A-Z]{1,5})\b/g;
const KNOWN_TICKERS = new Set([
  'AAPL', 'MSFT', 'GOOGL', 'GOOG', 'AMZN', 'META', 'TSLA', 'NVDA', 'AMD', 'INTC',
  'JPM', 'BAC', 'WFC', 'GS', 'MS', 'C', 'V', 'MA', 'PYPL', 'SQ',
  'DIS', 'NFLX', 'CMCSA', 'T', 'VZ', 'TMUS',
  'JNJ', 'PFE', 'UNH', 'MRK', 'ABBV', 'LLY', 'BMY',
  'XOM', 'CVX', 'COP', 'SLB', 'EOG',
  'HD', 'LOW', 'TGT', 'WMT', 'COST', 'AMZN',
  'BA', 'LMT', 'RTX', 'GE', 'CAT', 'DE',
  'BTC', 'ETH', 'SOL', 'XRP', 'ADA', 'DOGE'
]);

function analyzeSentiment(text: string): { sentiment: 'bullish' | 'bearish' | 'neutral'; score: number } {
  const lowerText = text.toLowerCase();
  
  let bullishScore = 0;
  let bearishScore = 0;
  
  for (const word of BULLISH_KEYWORDS) {
    if (lowerText.includes(word)) bullishScore++;
  }
  
  for (const word of BEARISH_KEYWORDS) {
    if (lowerText.includes(word)) bearishScore++;
  }
  
  const total = bullishScore + bearishScore;
  if (total === 0) return { sentiment: 'neutral', score: 0 };
  
  const score = ((bullishScore - bearishScore) / total) * 100;
  
  if (score > 20) return { sentiment: 'bullish', score: Math.round(score) };
  if (score < -20) return { sentiment: 'bearish', score: Math.round(score) };
  return { sentiment: 'neutral', score: Math.round(score) };
}

function extractTickers(text: string): string[] {
  const matches = text.match(TICKER_PATTERNS) || [];
  return [...new Set(matches.filter(m => KNOWN_TICKERS.has(m)))];
}

function extractKeywords(text: string): string[] {
  const keywords: string[] = [];
  const lowerText = text.toLowerCase();
  
  const topics = [
    'earnings', 'revenue', 'profit', 'guidance', 'forecast',
    'fed', 'interest rate', 'inflation', 'gdp', 'employment',
    'merger', 'acquisition', 'ipo', 'dividend', 'buyback',
    'ai', 'artificial intelligence', 'machine learning',
    'crypto', 'bitcoin', 'blockchain',
    'ev', 'electric vehicle', 'autonomous',
    'semiconductor', 'chip', 'gpu',
    'oil', 'energy', 'renewable',
    'tech', 'fintech', 'biotech'
  ];
  
  for (const topic of topics) {
    if (lowerText.includes(topic)) keywords.push(topic);
  }
  
  return keywords.slice(0, 5);
}

async function fetchNewsAPI(query: string): Promise<NewsArticle[]> {
  try {
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&pageSize=20&apiKey=${NEWS_API_KEY}`;
    const response = await fetch(url, { next: { revalidate: 300 } });
    
    if (!response.ok) return [];
    
    const data = await response.json();
    
    return (data.articles || []).map((article: any, idx: number) => {
      const text = `${article.title} ${article.description || ''}`;
      const { sentiment, score } = analyzeSentiment(text);
      
      return {
        id: `newsapi-${idx}-${Date.now()}`,
        title: article.title,
        description: article.description || '',
        content: article.content,
        url: article.url,
        imageUrl: article.urlToImage,
        source: article.source?.name || 'Unknown',
        author: article.author,
        publishedAt: article.publishedAt,
        category: 'market',
        sentiment,
        sentimentScore: score,
        relevanceScore: 80,
        tickers: extractTickers(text),
        keywords: extractKeywords(text),
        provider: 'NewsAPI'
      };
    });
  } catch (error) {
    console.error('NewsAPI error:', error);
    return [];
  }
}

async function fetchNewsData(query: string): Promise<NewsArticle[]> {
  try {
    const url = `https://newsdata.io/api/1/news?apikey=${NEWSDATA_API_KEY}&q=${encodeURIComponent(query)}&language=en&category=business`;
    const response = await fetch(url, { next: { revalidate: 300 } });
    
    if (!response.ok) return [];
    
    const data = await response.json();
    
    return (data.results || []).map((article: any, idx: number) => {
      const text = `${article.title} ${article.description || ''}`;
      const { sentiment, score } = analyzeSentiment(text);
      
      return {
        id: `newsdata-${idx}-${Date.now()}`,
        title: article.title,
        description: article.description || '',
        content: article.content,
        url: article.link,
        imageUrl: article.image_url,
        source: article.source_id || 'Unknown',
        sourceIcon: article.source_icon,
        author: article.creator?.[0],
        publishedAt: article.pubDate,
        category: article.category?.[0] || 'business',
        sentiment,
        sentimentScore: score,
        relevanceScore: 75,
        tickers: extractTickers(text),
        keywords: extractKeywords(text),
        provider: 'NewsData.io'
      };
    });
  } catch (error) {
    console.error('NewsData error:', error);
    return [];
  }
}

async function fetchCurrents(query: string): Promise<NewsArticle[]> {
  try {
    const url = `https://api.currentsapi.services/v1/search?keywords=${encodeURIComponent(query)}&language=en&apiKey=${CURRENTS_API_KEY}`;
    const response = await fetch(url, { next: { revalidate: 300 } });
    
    if (!response.ok) return [];
    
    const data = await response.json();
    
    return (data.news || []).map((article: any, idx: number) => {
      const text = `${article.title} ${article.description || ''}`;
      const { sentiment, score } = analyzeSentiment(text);
      
      return {
        id: `currents-${idx}-${Date.now()}`,
        title: article.title,
        description: article.description || '',
        url: article.url,
        imageUrl: article.image,
        source: article.author || 'Unknown',
        publishedAt: article.published,
        category: article.category?.[0] || 'business',
        sentiment,
        sentimentScore: score,
        relevanceScore: 70,
        tickers: extractTickers(text),
        keywords: extractKeywords(text),
        provider: 'Currents'
      };
    });
  } catch (error) {
    console.error('Currents error:', error);
    return [];
  }
}

async function fetchTheNewsAPI(query: string): Promise<NewsArticle[]> {
  try {
    const url = `https://api.thenewsapi.com/v1/news/all?api_token=${THENEWS_API_KEY}&search=${encodeURIComponent(query)}&language=en&categories=business,tech`;
    const response = await fetch(url, { next: { revalidate: 300 } });
    
    if (!response.ok) return [];
    
    const data = await response.json();
    
    return (data.data || []).map((article: any, idx: number) => {
      const text = `${article.title} ${article.description || ''}`;
      const { sentiment, score } = analyzeSentiment(text);
      
      return {
        id: `thenews-${idx}-${Date.now()}`,
        title: article.title,
        description: article.description || '',
        content: article.snippet,
        url: article.url,
        imageUrl: article.image_url,
        source: article.source || 'Unknown',
        publishedAt: article.published_at,
        category: article.categories?.[0] || 'business',
        sentiment,
        sentimentScore: score,
        relevanceScore: 72,
        tickers: extractTickers(text),
        keywords: extractKeywords(text),
        provider: 'TheNewsAPI'
      };
    });
  } catch (error) {
    console.error('TheNewsAPI error:', error);
    return [];
  }
}

async function fetchGNews(query: string): Promise<NewsArticle[]> {
  try {
    const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=en&country=us&max=10&apikey=${GNEWS_API_KEY}`;
    const response = await fetch(url, { next: { revalidate: 300 } });
    
    if (!response.ok) return [];
    
    const data = await response.json();
    
    return (data.articles || []).map((article: any, idx: number) => {
      const text = `${article.title} ${article.description || ''}`;
      const { sentiment, score } = analyzeSentiment(text);
      
      return {
        id: `gnews-${idx}-${Date.now()}`,
        title: article.title,
        description: article.description || '',
        content: article.content,
        url: article.url,
        imageUrl: article.image,
        source: article.source?.name || 'Unknown',
        publishedAt: article.publishedAt,
        category: 'business',
        sentiment,
        sentimentScore: score,
        relevanceScore: 78,
        tickers: extractTickers(text),
        keywords: extractKeywords(text),
        provider: 'GNews'
      };
    });
  } catch (error) {
    console.error('GNews error:', error);
    return [];
  }
}

function deduplicateNews(articles: NewsArticle[]): NewsArticle[] {
  const seen = new Map<string, NewsArticle>();
  
  for (const article of articles) {
    // Create a simple hash from title
    const titleHash = article.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 50);
    
    if (!seen.has(titleHash)) {
      seen.set(titleHash, article);
    } else {
      // Keep the one with higher relevance
      const existing = seen.get(titleHash)!;
      if (article.relevanceScore > existing.relevanceScore) {
        seen.set(titleHash, article);
      }
    }
  }
  
  return Array.from(seen.values());
}

export async function GET(request: Request) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || searchParams.get('query') || 'stock market';
    const ticker = searchParams.get('ticker');
    const sentiment = searchParams.get('sentiment') as 'bullish' | 'bearish' | 'neutral' | null;
    const limit = parseInt(searchParams.get('limit') || '50');
    
    // Build search query
    let searchQuery = query;
    if (ticker) {
      searchQuery = `${ticker} stock`;
    }
    
    // Fetch from all sources in parallel
    const [newsAPI, newsData, currents, theNews, gNews] = await Promise.all([
      fetchNewsAPI(searchQuery),
      fetchNewsData(searchQuery),
      fetchCurrents(searchQuery),
      fetchTheNewsAPI(searchQuery),
      fetchGNews(searchQuery)
    ]);
    
    // Combine and deduplicate
    let allArticles = [
      ...newsAPI,
      ...newsData,
      ...currents,
      ...theNews,
      ...gNews
    ];
    
    allArticles = deduplicateNews(allArticles);
    
    // Filter by sentiment if specified
    if (sentiment) {
      allArticles = allArticles.filter(a => a.sentiment === sentiment);
    }
    
    // Filter by ticker if specified
    if (ticker) {
      allArticles = allArticles.filter(a => 
        a.tickers.includes(ticker.toUpperCase()) ||
        a.title.toUpperCase().includes(ticker.toUpperCase()) ||
        a.description.toUpperCase().includes(ticker.toUpperCase())
      );
    }
    
    // Sort by published date (newest first)
    allArticles.sort((a, b) => 
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
    
    // Limit results
    allArticles = allArticles.slice(0, limit);
    
    // Calculate sentiment summary
    const bullishCount = allArticles.filter(a => a.sentiment === 'bullish').length;
    const bearishCount = allArticles.filter(a => a.sentiment === 'bearish').length;
    const neutralCount = allArticles.filter(a => a.sentiment === 'neutral').length;
    
    const avgSentiment = allArticles.length > 0
      ? allArticles.reduce((sum, a) => sum + a.sentimentScore, 0) / allArticles.length
      : 0;
    
    // Get trending tickers
    const tickerCounts: Record<string, number> = {};
    for (const article of allArticles) {
      for (const ticker of article.tickers) {
        tickerCounts[ticker] = (tickerCounts[ticker] || 0) + 1;
      }
    }
    const trendingTickers = Object.entries(tickerCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([ticker, count]) => ({ ticker, mentions: count }));
    
    // Get trending keywords
    const keywordCounts: Record<string, number> = {};
    for (const article of allArticles) {
      for (const keyword of article.keywords) {
        keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
      }
    }
    const trendingKeywords = Object.entries(keywordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([keyword, count]) => ({ keyword, mentions: count }));
    
    // Source breakdown
    const sourceBreakdown = {
      newsAPI: newsAPI.length,
      newsData: newsData.length,
      currents: currents.length,
      theNews: theNews.length,
      gNews: gNews.length,
      total: allArticles.length,
      afterDedup: allArticles.length
    };
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      processingTime: `${Date.now() - startTime}ms`,
      query: searchQuery,
      summary: {
        totalArticles: allArticles.length,
        sentiment: {
          overall: avgSentiment > 15 ? 'bullish' : avgSentiment < -15 ? 'bearish' : 'neutral',
          score: Math.round(avgSentiment),
          bullish: bullishCount,
          bearish: bearishCount,
          neutral: neutralCount
        },
        trendingTickers,
        trendingKeywords,
        sourceBreakdown
      },
      articles: allArticles,
      dataSources: ['NewsAPI', 'NewsData.io', 'Currents', 'TheNewsAPI', 'GNews']
    });
    
  } catch (error) {
    console.error('News aggregator error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch news',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
