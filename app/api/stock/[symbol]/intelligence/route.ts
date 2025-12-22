// app/api/stock/[symbol]/intelligence/route.ts
// Market Oracle - Comprehensive Stock Intelligence API
// Created: December 22, 2025
// Combines all data sources for complete stock analysis

import { NextRequest, NextResponse } from 'next/server';
import { getComprehensiveMarketIntelligence } from '@/lib/connectors/market-intelligence';
import finnhubConnector from '@/lib/connectors/finnhub';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

interface StockIntelligenceResponse {
  symbol: string;
  timestamp: string;
  
  // Basic Info
  profile: {
    name: string;
    industry: string;
    sector: string | null;
    marketCap: number;
    logo: string;
    website: string;
    exchange: string;
  } | null;

  // Price Data
  price: {
    current: number;
    change: number;
    changePercent: number;
    open: number;
    high: number;
    low: number;
    previousClose: number;
    volume: number;
    avgVolume: number;
  } | null;

  // Technical Analysis
  technicals: {
    rsi: number | null;
    rsiSignal: 'OVERSOLD' | 'NEUTRAL' | 'OVERBOUGHT';
    macd: {
      value: number;
      signal: number;
      histogram: number;
      trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    } | null;
    movingAverages: {
      sma50: number | null;
      sma200: number | null;
      priceVsSma50: 'ABOVE' | 'BELOW';
      priceVsSma200: 'ABOVE' | 'BELOW';
      goldenCross: boolean;
      deathCross: boolean;
    };
    bollingerBands: {
      upper: number;
      middle: number;
      lower: number;
      position: 'UPPER' | 'MIDDLE' | 'LOWER';
    } | null;
  };

  // Sentiment Analysis
  sentiment: {
    overall: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    score: number;
    news: {
      count: number;
      positive: number;
      negative: number;
    };
    social: {
      reddit: number;
      twitter: number;
      trending: boolean;
    };
    insiders: {
      signal: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
      netBuying: boolean;
      recentTransactions: number;
    };
    analysts: {
      consensus: string;
      score: number;
      totalAnalysts: number;
      distribution: {
        strongBuy: number;
        buy: number;
        hold: number;
        sell: number;
        strongSell: number;
      };
    } | null;
  };

  // Risk Assessment
  risk: {
    score: number;
    level: 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH' | 'EXTREME';
    factors: {
      volatility: number;
      liquidity: number;
      marketCap: number;
      newsVolatility: number;
      technicalRisk: number;
    };
    warnings: string[];
  };

  // 52-Week Range
  yearRange: {
    high: number;
    low: number;
    percentFromHigh: number;
    percentFromLow: number;
  };

  // News
  news: Array<{
    headline: string;
    summary: string;
    source: string;
    datetime: string;
    url: string;
    sentiment: 'positive' | 'negative' | 'neutral';
  }>;

  // Data Quality
  dataQuality: {
    score: number;
    sources: string[];
    lastUpdated: string;
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { symbol: string } }
) {
  const symbol = params.symbol.toUpperCase();

  try {
    // Fetch data from all sources in parallel
    const [marketIntel, finnhubIntel] = await Promise.all([
      getComprehensiveMarketIntelligence(symbol),
      finnhubConnector.getStockIntelligence(symbol),
    ]);

    if (!marketIntel && !finnhubIntel.quote) {
      return NextResponse.json(
        { error: `No data found for symbol: ${symbol}` },
        { status: 404 }
      );
    }

    // Build comprehensive response
    const response: StockIntelligenceResponse = {
      symbol,
      timestamp: new Date().toISOString(),

      profile: finnhubIntel.profile ? {
        name: finnhubIntel.profile.name,
        industry: finnhubIntel.profile.industry,
        sector: marketIntel?.sector || null,
        marketCap: finnhubIntel.profile.marketCap,
        logo: finnhubIntel.profile.logo,
        website: finnhubIntel.profile.website,
        exchange: finnhubIntel.profile.exchange,
      } : null,

      price: marketIntel?.price || (finnhubIntel.quote ? {
        current: finnhubIntel.quote.price,
        change: finnhubIntel.quote.change,
        changePercent: finnhubIntel.quote.changePercent,
        open: finnhubIntel.quote.open,
        high: finnhubIntel.quote.high,
        low: finnhubIntel.quote.low,
        previousClose: finnhubIntel.quote.previousClose,
        volume: 0,
        avgVolume: 0,
      } : null),

      technicals: {
        rsi: marketIntel?.technicals.rsi || null,
        rsiSignal: marketIntel?.technicals.rsi 
          ? (marketIntel.technicals.rsi < 30 ? 'OVERSOLD' 
             : marketIntel.technicals.rsi > 70 ? 'OVERBOUGHT' 
             : 'NEUTRAL')
          : 'NEUTRAL',
        macd: marketIntel?.technicals.macd ? {
          ...marketIntel.technicals.macd,
          trend: marketIntel.technicals.macd.histogram > 0 ? 'BULLISH' 
                 : marketIntel.technicals.macd.histogram < 0 ? 'BEARISH' 
                 : 'NEUTRAL',
        } : null,
        movingAverages: {
          sma50: marketIntel?.technicals.sma50 || null,
          sma200: marketIntel?.technicals.sma200 || null,
          priceVsSma50: (marketIntel?.price.current || 0) > (marketIntel?.technicals.sma50 || 0) ? 'ABOVE' : 'BELOW',
          priceVsSma200: (marketIntel?.price.current || 0) > (marketIntel?.technicals.sma200 || 0) ? 'ABOVE' : 'BELOW',
          goldenCross: (marketIntel?.technicals.sma50 || 0) > (marketIntel?.technicals.sma200 || 0),
          deathCross: (marketIntel?.technicals.sma50 || 0) < (marketIntel?.technicals.sma200 || 0),
        },
        bollingerBands: marketIntel?.technicals.bollingerBands ? {
          ...marketIntel.technicals.bollingerBands,
          position: (marketIntel.price.current > marketIntel.technicals.bollingerBands.upper) ? 'UPPER'
                   : (marketIntel.price.current < marketIntel.technicals.bollingerBands.lower) ? 'LOWER'
                   : 'MIDDLE',
        } : null,
      },

      sentiment: {
        overall: marketIntel?.sentiment.overall || finnhubIntel.sentiment?.overallSentiment || 'NEUTRAL',
        score: marketIntel?.sentiment.score || 0,
        news: {
          count: marketIntel?.sentiment.newsCount || 0,
          positive: marketIntel?.sentiment.positiveNews || 0,
          negative: marketIntel?.sentiment.negativeNews || 0,
        },
        social: {
          reddit: finnhubIntel.sentiment?.reddit.score || 0,
          twitter: finnhubIntel.sentiment?.twitter.score || 0,
          trending: finnhubIntel.sentiment?.trending || false,
        },
        insiders: {
          signal: finnhubIntel.insiders?.summary.signal || 'NEUTRAL',
          netBuying: finnhubIntel.insiders?.summary.netBuying || false,
          recentTransactions: finnhubIntel.insiders?.transactions.length || 0,
        },
        analysts: finnhubIntel.analysts ? {
          consensus: finnhubIntel.analysts.consensus,
          score: finnhubIntel.analysts.score,
          totalAnalysts: finnhubIntel.analysts.totalAnalysts,
          distribution: finnhubIntel.analysts.distribution,
        } : null,
      },

      risk: marketIntel?.risk || {
        score: 50,
        level: 'MODERATE',
        factors: {
          volatility: 50,
          liquidity: 50,
          marketCap: 50,
          newsVolatility: 50,
          technicalRisk: 50,
        },
        warnings: [],
      },

      yearRange: marketIntel?.yearRange || {
        high: 0,
        low: 0,
        percentFromHigh: 0,
        percentFromLow: 0,
      },

      news: [
        ...(marketIntel?.sentiment.topHeadlines || []),
        ...finnhubIntel.news.map(n => ({
          headline: n.headline,
          summary: n.summary,
          source: n.source,
          datetime: n.datetime.toISOString(),
          url: n.url,
          sentiment: 'neutral' as const,
        })),
      ].slice(0, 10),

      dataQuality: {
        score: marketIntel?.dataQuality.score || 50,
        sources: [
          ...(marketIntel?.dataQuality.sources || []),
          'Finnhub',
        ],
        lastUpdated: new Date().toISOString(),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error(`Stock intelligence API error for ${symbol}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch stock intelligence' },
      { status: 500 }
    );
  }
}
