/**
 * MARKET ORACLE - STOCK DATA API
 * Fetches real-time stock prices from Yahoo Finance
 * Caches data in database
 * November 24, 2025 - 4:45 AM ET
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface StockData {
  ticker: string;
  companyName: string;
  currentPrice: number;
  openPrice: number;
  highPrice: number;
  lowPrice: number;
  closePrice: number;
  volume: number;
  priceChange: number;
  priceChangePercent: number;
  lastUpdated: string;
}

/**
 * Fetch stock data from Yahoo Finance API
 */
async function fetchYahooFinanceData(ticker: string): Promise<StockData | null> {
  try {
    // Yahoo Finance API endpoint
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    });

    if (!response.ok) {
      console.error(`Yahoo Finance API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
      console.error(`No data returned for ${ticker}`);
      return null;
    }

    const result = data.chart.result[0];
    const meta = result.meta;
    const quote = result.indicators.quote[0];
    
    // Extract latest data
    const latestIndex = quote.close.length - 1;
    const currentPrice = meta.regularMarketPrice || quote.close[latestIndex];
    const openPrice = quote.open[latestIndex];
    const highPrice = quote.high[latestIndex];
    const lowPrice = quote.low[latestIndex];
    const closePrice = quote.close[latestIndex];
    const volume = quote.volume[latestIndex];
    
    // Calculate change
    const previousClose = meta.chartPreviousClose || meta.previousClose;
    const priceChange = currentPrice - previousClose;
    const priceChangePercent = (priceChange / previousClose) * 100;

    return {
      ticker: ticker.toUpperCase(),
      companyName: meta.longName || meta.shortName || ticker,
      currentPrice,
      openPrice,
      highPrice,
      lowPrice,
      closePrice,
      volume,
      priceChange,
      priceChangePercent,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Error fetching data for ${ticker}:`, error);
    return null;
  }
}

/**
 * Cache stock data in database
 */
async function cacheStockData(stockData: StockData): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    await supabase
      .from('stock_data_cache')
      .upsert({
        ticker: stockData.ticker,
        company_name: stockData.companyName,
        current_price: stockData.currentPrice,
        open_price: stockData.openPrice,
        high_price: stockData.highPrice,
        low_price: stockData.lowPrice,
        close_price: stockData.closePrice,
        volume: stockData.volume,
        price_change: stockData.priceChange,
        price_change_percent: stockData.priceChangePercent,
        data_date: today,
        last_updated: stockData.lastUpdated,
      }, {
        onConflict: 'ticker,data_date',
      });
  } catch (error) {
    console.error('Error caching stock data:', error);
  }
}

/**
 * GET /api/stock-data?ticker=AAPL
 * GET /api/stock-data?tickers=AAPL,TSLA,NVDA (batch)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker');
    const tickersParam = searchParams.get('tickers');

    // Single ticker
    if (ticker) {
      const stockData = await fetchYahooFinanceData(ticker);
      
      if (!stockData) {
        return NextResponse.json(
          { success: false, error: 'Failed to fetch stock data' },
          { status: 404 }
        );
      }

      // Cache in database
      await cacheStockData(stockData);

      return NextResponse.json({
        success: true,
        data: stockData,
      });
    }

    // Multiple tickers (batch)
    if (tickersParam) {
      const tickers = tickersParam.split(',').map(t => t.trim().toUpperCase());
      const results = await Promise.all(
        tickers.map(async (t) => {
          const data = await fetchYahooFinanceData(t);
          if (data) {
            await cacheStockData(data);
          }
          return data;
        })
      );

      const successfulResults = results.filter(r => r !== null);

      return NextResponse.json({
        success: true,
        data: successfulResults,
        total: successfulResults.length,
        failed: tickers.length - successfulResults.length,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Missing ticker or tickers parameter' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Stock data API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/stock-data/cached?ticker=AAPL&date=2025-11-24
 * Get cached stock data from database
 */
export async function POST(request: NextRequest) {
  try {
    const { ticker, date } = await request.json();

    if (!ticker) {
      return NextResponse.json(
        { success: false, error: 'Missing ticker parameter' },
        { status: 400 }
      );
    }

    const today = date || new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('stock_data_cache')
      .select('*')
      .eq('ticker', ticker.toUpperCase())
      .eq('data_date', today)
      .single();

    if (error || !data) {
      // Try fetching fresh data
      const freshData = await fetchYahooFinanceData(ticker);
      if (freshData) {
        await cacheStockData(freshData);
        return NextResponse.json({
          success: true,
          data: freshData,
          cached: false,
        });
      }

      return NextResponse.json(
        { success: false, error: 'Stock data not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ticker: data.ticker,
        companyName: data.company_name,
        currentPrice: parseFloat(data.current_price),
        openPrice: parseFloat(data.open_price),
        highPrice: parseFloat(data.high_price),
        lowPrice: parseFloat(data.low_price),
        closePrice: parseFloat(data.close_price),
        volume: data.volume,
        priceChange: parseFloat(data.price_change),
        priceChangePercent: parseFloat(data.price_change_percent),
        lastUpdated: data.last_updated,
      },
      cached: true,
    });

  } catch (error) {
    console.error('Cached stock data error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
