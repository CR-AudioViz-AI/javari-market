/**
 * NewsAPI Connector
 * 
 * Provides access to:
 * - 80,000+ news sources worldwide
 * - Real-time breaking news
 * - Historical articles (1 month back on free tier)
 * - Source filtering
 * - Keyword search
 * - Language support (14 languages)
 * - Sort by relevancy, popularity, publishedAt
 * - Full article content
 * - Article metadata
 * 
 * Free Tier: 100 requests per day
 * Rate Limit: 1000 requests per day on paid tier
 * 
 * @see https://newsapi.org/docs
 */

const NEWSAPI_BASE_URL = 'https://newsapi.org/v2';
const RATE_LIMIT_DELAY = 1000; // 1 second between calls (safe for 100/day)

interface NewsAPIConfig {
  apiKey: string;
  maxRetries?: number;
  retryDelay?: number;
}

interface Article {
  source: {
    id: string | null;
    name: string;
  };
  author: string | null;
  title: string;
  description: string;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  content: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  sentimentScore?: number;
}

interface NewsSource {
  id: string;
  name: string;
  description: string;
  url: string;
  category: string;
  language: string;
  country: string;
}

export class NewsAPIConnector {
  private apiKey: string;
  private maxRetries: number;
  private retryDelay: number;
  private lastCallTime: number = 0;
  private callCount: number = 0;
  private dailyLimit: number = 100;

  constructor(config: NewsAPIConfig) {
    this.apiKey = config.apiKey;
    this.maxRetries = config.maxRetries || 3;
    this.retryDelay = config.retryDelay || 1000;
  }

  /**
   * Enforce rate limiting
   */
  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastCallTime;
    
    if (timeSinceLastCall < RATE_LIMIT_DELAY) {
      const waitTime = RATE_LIMIT_DELAY - timeSinceLastCall;
      console.log(`[NewsAPI] Rate limit: waiting ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastCallTime = Date.now();
    this.callCount++;
  }

  /**
   * Make API request with retry logic
   */
  private async makeRequest<T>(
    endpoint: string,
    params: Record<string, string> = {},
    retryCount = 0
  ): Promise<T> {
    await this.enforceRateLimit();

    const url = new URL(`${NEWSAPI_BASE_URL}${endpoint}`);
    
    // Add API key
    url.searchParams.append('apiKey', this.apiKey);
    
    // Add query parameters
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    try {
      console.log(`[NewsAPI] Request: ${endpoint}`);
      
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        // Check for rate limit (429)
        if (response.status === 429) {
          console.warn('[NewsAPI] Rate limit hit (429)');
          
          if (retryCount < this.maxRetries) {
            // Wait longer before retry
            const waitTime = this.retryDelay * Math.pow(2, retryCount);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            return this.makeRequest<T>(endpoint, params, retryCount + 1);
          }
          
          throw new Error('Rate limit exceeded after retries');
        }

        const errorData = await response.json();
        throw new Error(`HTTP ${response.status}: ${errorData.message || response.statusText}`);
      }

      const data = await response.json();

      // Check for API errors
      if (data.status === 'error') {
        throw new Error(`API Error: ${data.message || 'Unknown error'}`);
      }

      return data as T;
    } catch (error) {
      if (retryCount < this.maxRetries) {
        console.warn(`[NewsAPI] Retry ${retryCount + 1}/${this.maxRetries}:`, error);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * (retryCount + 1)));
        return this.makeRequest<T>(endpoint, params, retryCount + 1);
      }
      
      throw error;
    }
  }

  /**
   * Search for articles
   */
  async searchArticles(
    query: string,
    options?: {
      searchIn?: 'title' | 'description' | 'content';
      sources?: string[];
      domains?: string[];
      excludeDomains?: string[];
      from?: string; // ISO 8601 date
      to?: string; // ISO 8601 date
      language?: string;
      sortBy?: 'relevancy' | 'popularity' | 'publishedAt';
      pageSize?: number;
      page?: number;
    }
  ): Promise<{ articles: Article[]; totalResults: number }> {
    try {
      const params: Record<string, string> = {
        q: query
      };

      if (options?.searchIn) {
        params.searchIn = options.searchIn;
      }

      if (options?.sources && options.sources.length > 0) {
        params.sources = options.sources.join(',');
      }

      if (options?.domains && options.domains.length > 0) {
        params.domains = options.domains.join(',');
      }

      if (options?.excludeDomains && options.excludeDomains.length > 0) {
        params.excludeDomains = options.excludeDomains.join(',');
      }

      if (options?.from) {
        params.from = options.from;
      }

      if (options?.to) {
        params.to = options.to;
      }

      if (options?.language) {
        params.language = options.language;
      }

      if (options?.sortBy) {
        params.sortBy = options.sortBy;
      }

      if (options?.pageSize) {
        params.pageSize = options.pageSize.toString();
      }

      if (options?.page) {
        params.page = options.page.toString();
      }

      const data = await this.makeRequest<any>('/everything', params);

      return {
        articles: data.articles || [],
        totalResults: data.totalResults || 0
      };
    } catch (error) {
      console.error('[NewsAPI] Error searching articles:', error);
      return { articles: [], totalResults: 0 };
    }
  }

  /**
   * Get top headlines
   */
  async getTopHeadlines(
    options?: {
      country?: string;
      category?: 'business' | 'entertainment' | 'general' | 'health' | 'science' | 'sports' | 'technology';
      sources?: string[];
      q?: string;
      pageSize?: number;
      page?: number;
    }
  ): Promise<{ articles: Article[]; totalResults: number }> {
    try {
      const params: Record<string, string> = {};

      if (options?.country) {
        params.country = options.country;
      }

      if (options?.category) {
        params.category = options.category;
      }

      if (options?.sources && options.sources.length > 0) {
        params.sources = options.sources.join(',');
      }

      if (options?.q) {
        params.q = options.q;
      }

      if (options?.pageSize) {
        params.pageSize = options.pageSize.toString();
      }

      if (options?.page) {
        params.page = options.page.toString();
      }

      const data = await this.makeRequest<any>('/top-headlines', params);

      return {
        articles: data.articles || [],
        totalResults: data.totalResults || 0
      };
    } catch (error) {
      console.error('[NewsAPI] Error fetching top headlines:', error);
      return { articles: [], totalResults: 0 };
    }
  }

  /**
   * Get all available news sources
   */
  async getSources(
    options?: {
      category?: 'business' | 'entertainment' | 'general' | 'health' | 'science' | 'sports' | 'technology';
      language?: string;
      country?: string;
    }
  ): Promise<NewsSource[]> {
    try {
      const params: Record<string, string> = {};

      if (options?.category) {
        params.category = options.category;
      }

      if (options?.language) {
        params.language = options.language;
      }

      if (options?.country) {
        params.country = options.country;
      }

      const data = await this.makeRequest<any>('/top-headlines/sources', params);

      return data.sources || [];
    } catch (error) {
      console.error('[NewsAPI] Error fetching sources:', error);
      return [];
    }
  }

  /**
   * Get market-related news
   */
  async getMarketNews(
    options?: {
      topics?: string[]; // e.g., ['stocks', 'crypto', 'forex']
      sortBy?: 'relevancy' | 'popularity' | 'publishedAt';
      pageSize?: number;
    }
  ): Promise<Article[]> {
    const topics = options?.topics || ['stocks', 'market', 'trading', 'investment'];
    const query = topics.join(' OR ');

    const { articles } = await this.searchArticles(query, {
      sortBy: options?.sortBy || 'publishedAt',
      pageSize: options?.pageSize || 50,
      language: 'en',
      from: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // Last 24 hours
    });

    return articles;
  }

  /**
   * Get stock-specific news
   */
  async getStockNews(
    symbol: string,
    options?: {
      pageSize?: number;
      days?: number;
    }
  ): Promise<Article[]> {
    const days = options?.days || 7;
    const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const { articles } = await this.searchArticles(symbol, {
      sortBy: 'publishedAt',
      pageSize: options?.pageSize || 20,
      language: 'en',
      from: fromDate,
      searchIn: 'title'
    });

    return articles;
  }

  /**
   * Get cryptocurrency news
   */
  async getCryptoNews(
    options?: {
      coins?: string[];
      pageSize?: number;
    }
  ): Promise<Article[]> {
    const coins = options?.coins || ['bitcoin', 'ethereum', 'cryptocurrency', 'crypto'];
    const query = coins.join(' OR ');

    const { articles } = await this.searchArticles(query, {
      sortBy: 'publishedAt',
      pageSize: options?.pageSize || 50,
      language: 'en',
      from: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    });

    return articles;
  }

  /**
   * Get financial news by category
   */
  async getFinancialNews(
    category: 'business' | 'technology' = 'business',
    options?: {
      country?: string;
      pageSize?: number;
    }
  ): Promise<Article[]> {
    const { articles } = await this.getTopHeadlines({
      category: category,
      country: options?.country || 'us',
      pageSize: options?.pageSize || 20
    });

    return articles;
  }

  /**
   * Analyze sentiment of articles (basic implementation)
   * Note: For production, integrate with a proper sentiment analysis API
   */
  analyzeSentiment(articles: Article[]): Article[] {
    return articles.map(article => {
      const text = `${article.title} ${article.description || ''}`.toLowerCase();
      
      // Basic sentiment analysis (can be enhanced)
      const positiveWords = ['gain', 'surge', 'rise', 'up', 'bull', 'growth', 'profit', 'success', 'win', 'positive'];
      const negativeWords = ['loss', 'fall', 'drop', 'down', 'bear', 'decline', 'crash', 'negative', 'risk', 'fail'];
      
      let positiveCount = 0;
      let negativeCount = 0;
      
      positiveWords.forEach(word => {
        if (text.includes(word)) positiveCount++;
      });
      
      negativeWords.forEach(word => {
        if (text.includes(word)) negativeCount++;
      });
      
      let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
      let sentimentScore = 0;
      
      if (positiveCount > negativeCount) {
        sentiment = 'positive';
        sentimentScore = positiveCount / (positiveCount + negativeCount);
      } else if (negativeCount > positiveCount) {
        sentiment = 'negative';
        sentimentScore = -negativeCount / (positiveCount + negativeCount);
      }
      
      return {
        ...article,
        sentiment,
        sentimentScore
      };
    });
  }

  /**
   * Get trending topics (based on article frequency)
   */
  async getTrendingTopics(
    days: number = 1,
    minArticles: number = 5
  ): Promise<Array<{ topic: string; count: number; sentiment: string }>> {
    try {
      const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      
      // Get business news
      const { articles } = await this.getTopHeadlines({
        category: 'business',
        pageSize: 100
      });

      // Extract keywords from titles
      const keywords: Record<string, number> = {};
      
      articles.forEach(article => {
        const words = article.title
          .toLowerCase()
          .split(/\W+/)
          .filter(word => word.length > 4); // Only words > 4 characters
        
        words.forEach(word => {
          keywords[word] = (keywords[word] || 0) + 1;
        });
      });

      // Filter and sort
      const trending = Object.entries(keywords)
        .filter(([_, count]) => count >= minArticles)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([topic, count]) => ({
          topic,
          count,
          sentiment: 'neutral' // Can be enhanced with sentiment analysis
        }));

      return trending;
    } catch (error) {
      console.error('[NewsAPI] Error getting trending topics:', error);
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
let instance: NewsAPIConnector | null = null;

export function getNewsAPIConnector(): NewsAPIConnector {
  if (!instance) {
    const apiKey = process.env.NEWSAPI_KEY || process.env.NEXT_PUBLIC_NEWSAPI_KEY;
    
    if (!apiKey) {
      throw new Error('NEWSAPI_KEY environment variable is not set');
    }

    instance = new NewsAPIConnector({ apiKey });
  }

  return instance;
}
