/**
 * CoinGecko API Connector
 * 
 * Provides access to:
 * - 21,000,000+ cryptocurrency tokens
 * - Real-time prices in 60+ currencies
 * - Market cap, volume, circulating supply
 * - 24h/7d/14d/30d/1y price changes
 * - Historical price data (daily back to 2013)
 * - OHLCV chart data
 * - DEX data from 1000+ exchanges
 * - NFT floor prices
 * - On-chain data
 * - Trending coins
 * 
 * Free Tier: 30 calls per minute (43,200 per day)
 * Rate Limit: 10-30 calls/minute depending on endpoint
 * 
 * @see https://docs.coingecko.com/v3.0.1/reference/introduction
 */

const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';
const RATE_LIMIT_DELAY = 2000; // 2 seconds between calls (30 per minute)

interface CoinGeckoConfig {
  apiKey: string;
  maxRetries?: number;
  retryDelay?: number;
}

interface CryptoPrice {
  id: string;
  symbol: string;
  name: string;
  currentPrice: number;
  marketCap: number;
  marketCapRank: number;
  fullyDilutedValuation: number | null;
  totalVolume: number;
  high24h: number;
  low24h: number;
  priceChange24h: number;
  priceChangePercentage24h: number;
  marketCapChange24h: number;
  marketCapChangePercentage24h: number;
  circulatingSupply: number;
  totalSupply: number | null;
  maxSupply: number | null;
  ath: number;
  athChangePercentage: number;
  athDate: string;
  atl: number;
  atlChangePercentage: number;
  atlDate: string;
  lastUpdated: string;
}

interface TrendingCoin {
  id: string;
  name: string;
  symbol: string;
  marketCapRank: number;
  thumb: string;
  small: string;
  large: string;
  slug: string;
  priceBtc: number;
  score: number;
}

interface CryptoMarketData {
  prices: Array<[number, number]>;
  marketCaps: Array<[number, number]>;
  totalVolumes: Array<[number, number]>;
}

export class CoinGeckoConnector {
  private apiKey: string;
  private maxRetries: number;
  private retryDelay: number;
  private lastCallTime: number = 0;
  private callCount: number = 0;
  private dailyLimit: number = 43200;

  constructor(config: CoinGeckoConfig) {
    this.apiKey = config.apiKey;
    this.maxRetries = config.maxRetries || 3;
    this.retryDelay = config.retryDelay || 1000;
  }

  /**
   * Enforce rate limiting (30 calls per minute)
   */
  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastCallTime;
    
    if (timeSinceLastCall < RATE_LIMIT_DELAY) {
      const waitTime = RATE_LIMIT_DELAY - timeSinceLastCall;
      console.log(`[CoinGecko] Rate limit: waiting ${waitTime}ms...`);
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

    const url = new URL(`${COINGECKO_BASE_URL}${endpoint}`);
    
    // Add API key to headers
    const headers: HeadersInit = {
      'accept': 'application/json',
      'x-cg-demo-api-key': this.apiKey
    };

    // Add query parameters
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    try {
      console.log(`[CoinGecko] Request: ${endpoint}`);
      
      const response = await fetch(url.toString(), { headers });
      
      if (!response.ok) {
        // Check for rate limit (429)
        if (response.status === 429) {
          console.warn('[CoinGecko] Rate limit hit (429)');
          
          if (retryCount < this.maxRetries) {
            // Exponential backoff
            const waitTime = this.retryDelay * Math.pow(2, retryCount);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            return this.makeRequest<T>(endpoint, params, retryCount + 1);
          }
          
          throw new Error('Rate limit exceeded after retries');
        }

        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data as T;
    } catch (error) {
      if (retryCount < this.maxRetries) {
        console.warn(`[CoinGecko] Retry ${retryCount + 1}/${this.maxRetries}:`, error);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * (retryCount + 1)));
        return this.makeRequest<T>(endpoint, params, retryCount + 1);
      }
      
      throw error;
    }
  }

  /**
   * Get list of all supported coins
   */
  async getCoinsList(): Promise<Array<{ id: string; symbol: string; name: string }>> {
    try {
      return await this.makeRequest<Array<{ id: string; symbol: string; name: string }>>('/coins/list');
    } catch (error) {
      console.error('[CoinGecko] Error fetching coins list:', error);
      return [];
    }
  }

  /**
   * Get current prices for multiple coins
   */
  async getPrices(
    coinIds: string[],
    vsCurrency: string = 'usd',
    includeMarketCap: boolean = true,
    includeVolume: boolean = true,
    include24hrChange: boolean = true
  ): Promise<Record<string, any>> {
    try {
      const params: Record<string, string> = {
        ids: coinIds.join(','),
        vs_currencies: vsCurrency,
        include_market_cap: includeMarketCap.toString(),
        include_24hr_vol: includeVolume.toString(),
        include_24hr_change: include24hrChange.toString()
      };

      return await this.makeRequest<Record<string, any>>('/simple/price', params);
    } catch (error) {
      console.error('[CoinGecko] Error fetching prices:', error);
      return {};
    }
  }

  /**
   * Get detailed market data for multiple coins
   */
  async getMarketData(
    vsCurrency: string = 'usd',
    ids?: string[],
    category?: string,
    order: string = 'market_cap_desc',
    perPage: number = 100,
    page: number = 1,
    sparkline: boolean = false,
    priceChangePercentage?: string
  ): Promise<CryptoPrice[]> {
    try {
      const params: Record<string, string> = {
        vs_currency: vsCurrency,
        order: order,
        per_page: perPage.toString(),
        page: page.toString(),
        sparkline: sparkline.toString()
      };

      if (ids && ids.length > 0) {
        params.ids = ids.join(',');
      }

      if (category) {
        params.category = category;
      }

      if (priceChangePercentage) {
        params.price_change_percentage = priceChangePercentage;
      }

      const data = await this.makeRequest<any[]>('/coins/markets', params);

      return data.map(coin => ({
        id: coin.id,
        symbol: coin.symbol,
        name: coin.name,
        currentPrice: coin.current_price || 0,
        marketCap: coin.market_cap || 0,
        marketCapRank: coin.market_cap_rank || 0,
        fullyDilutedValuation: coin.fully_diluted_valuation,
        totalVolume: coin.total_volume || 0,
        high24h: coin.high_24h || 0,
        low24h: coin.low_24h || 0,
        priceChange24h: coin.price_change_24h || 0,
        priceChangePercentage24h: coin.price_change_percentage_24h || 0,
        marketCapChange24h: coin.market_cap_change_24h || 0,
        marketCapChangePercentage24h: coin.market_cap_change_percentage_24h || 0,
        circulatingSupply: coin.circulating_supply || 0,
        totalSupply: coin.total_supply,
        maxSupply: coin.max_supply,
        ath: coin.ath || 0,
        athChangePercentage: coin.ath_change_percentage || 0,
        athDate: coin.ath_date || '',
        atl: coin.atl || 0,
        atlChangePercentage: coin.atl_change_percentage || 0,
        atlDate: coin.atl_date || '',
        lastUpdated: coin.last_updated || ''
      }));
    } catch (error) {
      console.error('[CoinGecko] Error fetching market data:', error);
      return [];
    }
  }

  /**
   * Get detailed coin data by ID
   */
  async getCoinData(
    coinId: string,
    localization: boolean = false,
    tickers: boolean = false,
    marketData: boolean = true,
    communityData: boolean = false,
    developerData: boolean = false,
    sparkline: boolean = false
  ): Promise<any> {
    try {
      const params: Record<string, string> = {
        localization: localization.toString(),
        tickers: tickers.toString(),
        market_data: marketData.toString(),
        community_data: communityData.toString(),
        developer_data: developerData.toString(),
        sparkline: sparkline.toString()
      };

      return await this.makeRequest<any>(`/coins/${coinId}`, params);
    } catch (error) {
      console.error(`[CoinGecko] Error fetching data for ${coinId}:`, error);
      return null;
    }
  }

  /**
   * Get historical market data (OHLC)
   */
  async getMarketChart(
    coinId: string,
    vsCurrency: string = 'usd',
    days: number | 'max' = 30,
    interval?: 'daily'
  ): Promise<CryptoMarketData> {
    try {
      const params: Record<string, string> = {
        vs_currency: vsCurrency,
        days: days.toString()
      };

      if (interval) {
        params.interval = interval;
      }

      const data = await this.makeRequest<any>(`/coins/${coinId}/market_chart`, params);

      return {
        prices: data.prices || [],
        marketCaps: data.market_caps || [],
        totalVolumes: data.total_volumes || []
      };
    } catch (error) {
      console.error(`[CoinGecko] Error fetching market chart for ${coinId}:`, error);
      return { prices: [], marketCaps: [], totalVolumes: [] };
    }
  }

  /**
   * Get OHLC data
   */
  async getOHLC(
    coinId: string,
    vsCurrency: string = 'usd',
    days: number = 7
  ): Promise<Array<[number, number, number, number, number]>> {
    try {
      const params: Record<string, string> = {
        vs_currency: vsCurrency,
        days: days.toString()
      };

      return await this.makeRequest<Array<[number, number, number, number, number]>>(
        `/coins/${coinId}/ohlc`,
        params
      );
    } catch (error) {
      console.error(`[CoinGecko] Error fetching OHLC for ${coinId}:`, error);
      return [];
    }
  }

  /**
   * Get trending coins
   */
  async getTrendingCoins(): Promise<TrendingCoin[]> {
    try {
      const data = await this.makeRequest<any>('/search/trending');

      return data.coins.map((item: any) => ({
        id: item.item.id,
        name: item.item.name,
        symbol: item.item.symbol,
        marketCapRank: item.item.market_cap_rank,
        thumb: item.item.thumb,
        small: item.item.small,
        large: item.item.large,
        slug: item.item.slug,
        priceBtc: item.item.price_btc,
        score: item.item.score
      }));
    } catch (error) {
      console.error('[CoinGecko] Error fetching trending coins:', error);
      return [];
    }
  }

  /**
   * Search for coins
   */
  async searchCoins(query: string): Promise<Array<{ id: string; name: string; symbol: string; marketCapRank: number }>> {
    try {
      const data = await this.makeRequest<any>('/search', { query });

      return data.coins.map((coin: any) => ({
        id: coin.id,
        name: coin.name,
        symbol: coin.symbol,
        marketCapRank: coin.market_cap_rank || 0
      }));
    } catch (error) {
      console.error('[CoinGecko] Error searching coins:', error);
      return [];
    }
  }

  /**
   * Get global cryptocurrency market data
   */
  async getGlobalData(): Promise<any> {
    try {
      return await this.makeRequest<any>('/global');
    } catch (error) {
      console.error('[CoinGecko] Error fetching global data:', error);
      return null;
    }
  }

  /**
   * Get exchange rates
   */
  async getExchangeRates(): Promise<any> {
    try {
      return await this.makeRequest<any>('/exchange_rates');
    } catch (error) {
      console.error('[CoinGecko] Error fetching exchange rates:', error);
      return null;
    }
  }

  /**
   * Get top 100 cryptocurrencies by market cap
   */
  async getTop100(vsCurrency: string = 'usd'): Promise<CryptoPrice[]> {
    return this.getMarketData(vsCurrency, undefined, undefined, 'market_cap_desc', 100, 1);
  }

  /**
   * Get top gainers in last 24h
   */
  async getTopGainers(vsCurrency: string = 'usd', limit: number = 50): Promise<CryptoPrice[]> {
    return this.getMarketData(vsCurrency, undefined, undefined, 'price_change_percentage_24h_desc', limit, 1);
  }

  /**
   * Get top losers in last 24h
   */
  async getTopLosers(vsCurrency: string = 'usd', limit: number = 50): Promise<CryptoPrice[]> {
    return this.getMarketData(vsCurrency, undefined, undefined, 'price_change_percentage_24h_asc', limit, 1);
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
let instance: CoinGeckoConnector | null = null;

export function getCoinGeckoConnector(): CoinGeckoConnector {
  if (!instance) {
    const apiKey = process.env.COINGECKO_API_KEY || process.env.NEXT_PUBLIC_COINGECKO_API_KEY;
    
    if (!apiKey) {
      throw new Error('COINGECKO_API_KEY environment variable is not set');
    }

    instance = new CoinGeckoConnector({ apiKey });
  }

  return instance;
}
