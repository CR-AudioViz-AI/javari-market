// app/api/dashboard/market-intelligence/route.ts
// Market Oracle - Unified Market Intelligence API
// Created: December 22, 2025
// Combines all data sources into comprehensive market view

import { NextRequest, NextResponse } from 'next/server';
import fredConnector from '@/lib/connectors/fred';
import finnhubConnector from '@/lib/connectors/finnhub';
import cryptoConnector from '@/lib/connectors/crypto-enhanced';

export const dynamic = 'force-dynamic';
export const revalidate = 60; // Revalidate every minute

interface MarketIntelligenceResponse {
  timestamp: string;
  markets: {
    stocks: {
      status: 'open' | 'closed' | 'pre-market' | 'after-hours';
      majorIndexes: Array<{
        symbol: string;
        name: string;
        price: number;
        change: number;
        changePercent: number;
      }>;
    };
    crypto: {
      globalStats: {
        totalMarketCap: number;
        totalVolume24h: number;
        btcDominance: number;
        marketCapChange24h: number;
      } | null;
      fearGreed: {
        value: number;
        classification: string;
      };
      btcPrice: number | null;
      ethPrice: number | null;
      trending: Array<{ id: string; symbol: string; name: string }>;
    };
  };
  economy: {
    mortgageRates: {
      thirtyYear: number | null;
      fifteenYear: number | null;
    };
    fedFundsRate: number | null;
    unemployment: number | null;
    yieldCurve: {
      spread: number | null;
      signal: 'NORMAL' | 'FLAT' | 'INVERTED';
    };
    vix: {
      value: number | null;
      level: string;
    };
  };
  news: Array<{
    headline: string;
    source: string;
    datetime: string;
    url: string;
  }>;
  earnings: Array<{
    symbol: string;
    date: string;
    hour: string;
  }>;
}

// Determine market status based on time
function getMarketStatus(): 'open' | 'closed' | 'pre-market' | 'after-hours' {
  const now = new Date();
  const nyTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const day = nyTime.getDay();
  const hours = nyTime.getHours();
  const minutes = nyTime.getMinutes();
  const time = hours * 100 + minutes;

  // Weekend
  if (day === 0 || day === 6) return 'closed';

  // Pre-market: 4:00 AM - 9:30 AM
  if (time >= 400 && time < 930) return 'pre-market';

  // Market hours: 9:30 AM - 4:00 PM
  if (time >= 930 && time < 1600) return 'open';

  // After hours: 4:00 PM - 8:00 PM
  if (time >= 1600 && time < 2000) return 'after-hours';

  return 'closed';
}

export async function GET(request: NextRequest) {
  try {
    // Parallel fetch all data
    const [
      macroSnapshot,
      yieldCurve,
      marketFear,
      cryptoDashboard,
      marketNews,
      earnings,
    ] = await Promise.all([
      fredConnector.getMacroSnapshot(),
      fredConnector.getYieldCurve(),
      fredConnector.getMarketFear(),
      cryptoConnector.getCryptoDashboard(),
      finnhubConnector.getMarketNews('general'),
      finnhubConnector.getEarningsCalendar(),
    ]);

    // Get major index prices via Finnhub
    const [spy, qqq, dia] = await Promise.all([
      finnhubConnector.getQuote('SPY'),
      finnhubConnector.getQuote('QQQ'),
      finnhubConnector.getQuote('DIA'),
    ]);

    const response: MarketIntelligenceResponse = {
      timestamp: new Date().toISOString(),
      markets: {
        stocks: {
          status: getMarketStatus(),
          majorIndexes: [
            spy ? {
              symbol: 'SPY',
              name: 'S&P 500 ETF',
              price: spy.price,
              change: spy.change,
              changePercent: spy.changePercent,
            } : null,
            qqq ? {
              symbol: 'QQQ',
              name: 'Nasdaq 100 ETF',
              price: qqq.price,
              change: qqq.change,
              changePercent: qqq.changePercent,
            } : null,
            dia ? {
              symbol: 'DIA',
              name: 'Dow Jones ETF',
              price: dia.price,
              change: dia.change,
              changePercent: dia.changePercent,
            } : null,
          ].filter((i): i is NonNullable<typeof i> => i !== null),
        },
        crypto: {
          globalStats: cryptoDashboard.global,
          fearGreed: {
            value: cryptoDashboard.fearGreed.value,
            classification: cryptoDashboard.fearGreed.classification,
          },
          btcPrice: cryptoDashboard.btc?.price || null,
          ethPrice: cryptoDashboard.eth?.price || null,
          trending: cryptoDashboard.trending.slice(0, 5).map(t => ({
            id: t.id,
            symbol: t.symbol,
            name: t.name,
          })),
        },
      },
      economy: {
        mortgageRates: macroSnapshot.mortgageRates,
        fedFundsRate: macroSnapshot.fedFundsRate,
        unemployment: macroSnapshot.unemployment,
        yieldCurve: {
          spread: yieldCurve.spread,
          signal: yieldCurve.signal,
        },
        vix: {
          value: marketFear.vix,
          level: marketFear.level,
        },
      },
      news: marketNews.slice(0, 10).map(n => ({
        headline: n.headline,
        source: n.source,
        datetime: n.datetime.toISOString(),
        url: n.url,
      })),
      earnings: earnings.slice(0, 10).map(e => ({
        symbol: e.symbol,
        date: e.date,
        hour: e.hour,
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Market intelligence API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market intelligence' },
      { status: 500 }
    );
  }
}
