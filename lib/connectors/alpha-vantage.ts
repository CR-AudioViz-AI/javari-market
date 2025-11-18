/**
 * Alpha Vantage API Connector
 * 
 * Provides access to:
 * - Real-time stock quotes (15-min delay on free tier)
 * - Historical data (intraday, daily, weekly, monthly)
 * - 50+ technical indicators (RSI, MACD, SMA, EMA, etc.)
 * - Company fundamentals (income statements, balance sheets, cash flow)
 * - Market news & sentiment analysis
 * - Forex rates & commodities
 * 
 * Free Tier: 500 calls per day (25 calls per day per function)
 * Rate Limit: 5 API requests per minute
 * 
 * @see https://www.alphavantage.co/documentation/
 */

const ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query';
const RATE_LIMIT_DELAY = 12000; // 12 seconds between calls (5 per minute)

interface AlphaVantageConfig {
  apiKey: string;
  maxRetries?: number;
  retryDelay?: number;
}

interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  open: number;
  high: number;
  low: number;
  previousClose: number;
  timestamp: string;
}

interface TechnicalIndicator {
  symbol: string;
  indicator: string;
  timestamp: string;
  value: number;
  metadata?: Record<string, any>;
}

interface NewsArticle {
  title: string;
  url: string;
  timePublished: string;
  authors: string[];
  summary: string;
  source: string;
  category: string;
  topics: string[];
  overallSentiment: string;
  sentimentScore: number;
  relevanceScore: number;
  tickerSentiment: Array<{
    ticker: string;
    relevanceScore: number;
    tickerSentiment: string;
    tickerSentimentScore: number;
  }>;
}

export class AlphaVantageConnector {
  private apiKey: string;
  private maxRetries: number;
  private retryDelay: number;
  private lastCallTime: number = 0;
  private callCount: number = 0;
  private dailyLimit: number = 500;

  constructor(config: AlphaVantageConfig) {
    this.apiKey = config.apiKey;
    this.maxRetries = config.maxRetries || 3;
    this.retryDelay = config.retryDelay || 1000;
  }

  /**
   * Enforce rate limiting (5 calls per minute)
   */
  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastCallTime;
    
    if (timeSinceLastCall < RATE_LIMIT_DELAY) {
      const waitTime = RATE_LIMIT_DELAY - timeSinceLastCall;
      console.log(`[AlphaVantage] Rate limit: waiting ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastCallTime = Date.now();
    this.callCount++;
  }

  /**
   * Make API request with retry logic
   */
  private async makeRequest<T>(
    params: Record<string, string>,
    retryCount = 0
  ): Promise<T> {
    await this.enforceRateLimit();

    const url = new URL(ALPHA_VANTAGE_BASE_URL);
    url.searchParams.append('apikey', this.apiKey);
    
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    try {
      console.log(`[AlphaVantage] Request: ${params.function} ${params.symbol || ''}`);
      
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Check for API errors
      if ('Error Message' in data) {
        throw new Error(`API Error: ${data['Error Message']}`);
      }

      // Check for rate limit
      if ('Note' in data) {
        console.warn(`[AlphaVantage] Rate limit warning: ${data.Note}`);
        
        if (retryCount < this.maxRetries) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * (retryCount + 1)));
          return this.makeRequest<T>(params, retryCount + 1);
        }
        
        throw new Error('Rate limit exceeded');
      }

      // Check for daily limit
      if ('Information' in data && data.Information.includes('higher API call volume')) {
        throw new Error('Daily API limit reached (500 calls per day)');
      }

      return data as T;
    } catch (error) {
      if (retryCount < this.maxRetries) {
        console.warn(`[AlphaVantage] Retry ${retryCount + 1}/${this.maxRetries}:`, error);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * (retryCount + 1)));
        return this.makeRequest<T>(params, retryCount + 1);
      }
      
      throw error;
    }
  }

  /**
   * Get real-time stock quote
   */
  async getQuote(symbol: string): Promise<StockQuote | null> {
    try {
      const data = await this.makeRequest<any>({
        function: 'GLOBAL_QUOTE',
        symbol: symbol
      });

      const quote = data['Global Quote'];
      
      if (!quote || Object.keys(quote).length === 0) {
        console.warn(`[AlphaVantage] No quote data for ${symbol}`);
        return null;
      }

      return {
        symbol: symbol,
        price: parseFloat(quote['05. price']) || 0,
        change: parseFloat(quote['09. change']) || 0,
        changePercent: parseFloat(quote['10. change percent']?.replace('%', '') || '0'),
        volume: parseInt(quote['06. volume']) || 0,
        open: parseFloat(quote['02. open']) || 0,
        high: parseFloat(quote['03. high']) || 0,
        low: parseFloat(quote['04. low']) || 0,
        previousClose: parseFloat(quote['08. previous close']) || 0,
        timestamp: quote['07. latest trading day'] || new Date().toISOString()
      };
    } catch (error) {
      console.error(`[AlphaVantage] Error fetching quote for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Get multiple stock quotes (with rate limiting)
   */
  async getMultipleQuotes(symbols: string[]): Promise<StockQuote[]> {
    const quotes: StockQuote[] = [];
    
    console.log(`[AlphaVantage] Fetching ${symbols.length} quotes...`);
    
    for (let i = 0; i < symbols.length; i++) {
      const quote = await this.getQuote(symbols[i]);
      
      if (quote) {
        quotes.push(quote);
      }
      
      // Progress update every 10 stocks
      if ((i + 1) % 10 === 0) {
        console.log(`[AlphaVantage] Progress: ${i + 1}/${symbols.length} (${quotes.length} successful)`);
      }
    }
    
    console.log(`[AlphaVantage] Completed: ${quotes.length}/${symbols.length} quotes`);
    return quotes;
  }

  /**
   * Get technical indicator (RSI, MACD, SMA, EMA, etc.)
   */
  async getTechnicalIndicator(
    symbol: string,
    indicator: string,
    interval: '1min' | '5min' | '15min' | '30min' | '60min' | 'daily' | 'weekly' | 'monthly' = 'daily',
    timePeriod: number = 14
  ): Promise<TechnicalIndicator[]> {
    try {
      const functionMap: Record<string, string> = {
        'RSI': 'RSI',
        'MACD': 'MACD',
        'SMA': 'SMA',
        'EMA': 'EMA',
        'STOCH': 'STOCH',
        'ADX': 'ADX',
        'CCI': 'CCI',
        'AROON': 'AROON',
        'BBANDS': 'BBANDS',
        'AD': 'AD',
        'OBV': 'OBV'
      };

      const functionName = functionMap[indicator.toUpperCase()];
      
      if (!functionName) {
        throw new Error(`Unsupported indicator: ${indicator}`);
      }

      const data = await this.makeRequest<any>({
        function: functionName,
        symbol: symbol,
        interval: interval,
        time_period: timePeriod.toString(),
        series_type: 'close'
      });

      const timeSeriesKey = `Technical Analysis: ${functionName}`;
      const timeSeries = data[timeSeriesKey];

      if (!timeSeries) {
        console.warn(`[AlphaVantage] No ${indicator} data for ${symbol}`);
        return [];
      }

      const results: TechnicalIndicator[] = [];
      
      Object.entries(timeSeries).slice(0, 30).forEach(([timestamp, values]: [string, any]) => {
        const value = values[functionName] || values[Object.keys(values)[0]];
        
        results.push({
          symbol: symbol,
          indicator: indicator,
          timestamp: timestamp,
          value: parseFloat(value) || 0,
          metadata: values
        });
      });

      return results;
    } catch (error) {
      console.error(`[AlphaVantage] Error fetching ${indicator} for ${symbol}:`, error);
      return [];
    }
  }

  /**
   * Get market news & sentiment
   */
  async getNews(
    tickers?: string[],
    topics?: string[],
    timeFrom?: string,
    timeTo?: string,
    limit: number = 50
  ): Promise<NewsArticle[]> {
    try {
      const params: Record<string, string> = {
        function: 'NEWS_SENTIMENT',
        limit: limit.toString()
      };

      if (tickers && tickers.length > 0) {
        params.tickers = tickers.join(',');
      }

      if (topics && topics.length > 0) {
        params.topics = topics.join(',');
      }

      if (timeFrom) {
        params.time_from = timeFrom;
      }

      if (timeTo) {
        params.time_to = timeTo;
      }

      const data = await this.makeRequest<any>(params);

      if (!data.feed || !Array.isArray(data.feed)) {
        console.warn('[AlphaVantage] No news data found');
        return [];
      }

      return data.feed.map((article: any) => ({
        title: article.title || '',
        url: article.url || '',
        timePublished: article.time_published || '',
        authors: article.authors || [],
        summary: article.summary || '',
        source: article.source || '',
        category: article.category_within_source || '',
        topics: article.topics?.map((t: any) => t.topic) || [],
        overallSentiment: article.overall_sentiment_label || 'Neutral',
        sentimentScore: parseFloat(article.overall_sentiment_score) || 0,
        relevanceScore: parseFloat(article.relevance_score) || 0,
        tickerSentiment: article.ticker_sentiment || []
      }));
    } catch (error) {
      console.error('[AlphaVantage] Error fetching news:', error);
      return [];
    }
  }

  /**
   * Get company fundamentals
   */
  async getCompanyOverview(symbol: string): Promise<Record<string, any> | null> {
    try {
      const data = await this.makeRequest<any>({
        function: 'OVERVIEW',
        symbol: symbol
      });

      if (!data.Symbol) {
        console.warn(`[AlphaVantage] No company data for ${symbol}`);
        return null;
      }

      return data;
    } catch (error) {
      console.error(`[AlphaVantage] Error fetching overview for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Get historical daily prices
   */
  async getDailyPrices(
    symbol: string,
    outputSize: 'compact' | 'full' = 'compact'
  ): Promise<Array<{ date: string; open: number; high: number; low: number; close: number; volume: number }>> {
    try {
      const data = await this.makeRequest<any>({
        function: 'TIME_SERIES_DAILY',
        symbol: symbol,
        outputsize: outputSize
      });

      const timeSeries = data['Time Series (Daily)'];

      if (!timeSeries) {
        console.warn(`[AlphaVantage] No daily data for ${symbol}`);
        return [];
      }

      return Object.entries(timeSeries).map(([date, values]: [string, any]) => ({
        date: date,
        open: parseFloat(values['1. open']) || 0,
        high: parseFloat(values['2. high']) || 0,
        low: parseFloat(values['3. low']) || 0,
        close: parseFloat(values['4. close']) || 0,
        volume: parseInt(values['5. volume']) || 0
      }));
    } catch (error) {
      console.error(`[AlphaVantage] Error fetching daily prices for ${symbol}:`, error);
      return [];
    }
  }

  /**
   * Get API usage stats
   */
  getUsageStats(): { callCount: number; dailyLimit: number; remaining: number } {
    return {
      callCount: this.callCount,
      dailyLimit: this.dailyLimit,
      remaining: this.dailyLimit - this.callCount
    };
  }
}

// Export singleton instance
let instance: AlphaVantageConnector | null = null;

export function getAlphaVantageConnector(): AlphaVantageConnector {
  if (!instance) {
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY || process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY;
    
    if (!apiKey) {
      throw new Error('ALPHA_VANTAGE_API_KEY environment variable is not set');
    }

    instance = new AlphaVantageConnector({ apiKey });
  }

  return instance;
}
