// app/api/stock/[symbol]/analysis/route.ts
// Market Oracle - Self-Contained Stock Analysis API
// Created: December 22, 2025
// Provides comprehensive stock analysis using Finnhub + Alpha Vantage

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

// Finnhub API calls
async function getFinnhubQuote(symbol: string) {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) return null;
  
  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.c) return null;
    
    return {
      price: data.c,
      change: data.d,
      changePercent: data.dp,
      high: data.h,
      low: data.l,
      open: data.o,
      previousClose: data.pc,
    };
  } catch {
    return null;
  }
}

async function getFinnhubProfile(symbol: string) {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) return null;
  
  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${apiKey}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.name) return null;
    
    return {
      name: data.name,
      industry: data.finnhubIndustry || 'Unknown',
      marketCap: (data.marketCapitalization || 0) * 1000000,
      logo: data.logo || '',
      website: data.weburl || '',
      exchange: data.exchange || '',
      country: data.country || '',
    };
  } catch {
    return null;
  }
}

async function getFinnhubRecommendations(symbol: string) {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) return null;
  
  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/stock/recommendation?symbol=${symbol}&token=${apiKey}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || data.length === 0) return null;
    
    const latest = data[0];
    const total = latest.strongBuy + latest.buy + latest.hold + latest.sell + latest.strongSell;
    if (total === 0) return null;
    
    const score = (
      (latest.strongBuy * 5) +
      (latest.buy * 4) +
      (latest.hold * 3) +
      (latest.sell * 2) +
      (latest.strongSell * 1)
    ) / total;
    
    let consensus: string;
    if (score >= 4.5) consensus = 'STRONG_BUY';
    else if (score >= 3.5) consensus = 'BUY';
    else if (score >= 2.5) consensus = 'HOLD';
    else if (score >= 1.5) consensus = 'SELL';
    else consensus = 'STRONG_SELL';
    
    return {
      consensus,
      score: Math.round(score * 10) / 10,
      totalAnalysts: total,
      distribution: {
        strongBuy: latest.strongBuy,
        buy: latest.buy,
        hold: latest.hold,
        sell: latest.sell,
        strongSell: latest.strongSell,
      },
    };
  } catch {
    return null;
  }
}

async function getFinnhubInsiders(symbol: string) {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) return null;
  
  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/stock/insider-transactions?symbol=${symbol}&token=${apiKey}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.data || data.data.length === 0) return null;
    
    const transactions = data.data.slice(0, 10);
    const buys = transactions.filter((t: { transactionCode: string }) => t.transactionCode === 'P');
    const sells = transactions.filter((t: { transactionCode: string }) => t.transactionCode === 'S');
    
    const signal = buys.length > sells.length ? 'BULLISH' 
                 : sells.length > buys.length ? 'BEARISH' 
                 : 'NEUTRAL';
    
    return {
      recentTransactions: transactions.length,
      buys: buys.length,
      sells: sells.length,
      signal,
      netBuying: buys.length > sells.length,
    };
  } catch {
    return null;
  }
}

async function getFinnhubSentiment(symbol: string) {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) return null;
  
  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/stock/social-sentiment?symbol=${symbol}&token=${apiKey}`,
      { next: { revalidate: 1800 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    
    const latestReddit = data.reddit?.slice(-1)[0];
    const latestTwitter = data.twitter?.slice(-1)[0];
    
    const redditScore = latestReddit?.score || 0;
    const twitterScore = latestTwitter?.score || 0;
    const overallScore = (redditScore + twitterScore) / 2;
    
    return {
      reddit: redditScore,
      twitter: twitterScore,
      overall: overallScore,
      sentiment: overallScore > 0.2 ? 'BULLISH' 
               : overallScore < -0.2 ? 'BEARISH' 
               : 'NEUTRAL',
      trending: (latestReddit?.mention || 0) + (latestTwitter?.mention || 0) > 100,
    };
  } catch {
    return null;
  }
}

async function getFinnhubNews(symbol: string) {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) return [];
  
  try {
    const to = new Date().toISOString().split('T')[0];
    const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const res = await fetch(
      `https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${from}&to=${to}&token=${apiKey}`,
      { next: { revalidate: 1800 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    
    return data.slice(0, 5).map((n: { headline: string; summary: string; source: string; url: string; datetime: number }) => ({
      headline: n.headline,
      summary: n.summary,
      source: n.source,
      url: n.url,
      datetime: new Date(n.datetime * 1000).toISOString(),
    }));
  } catch {
    return [];
  }
}

// Alpha Vantage technicals
async function getAlphaVantageTechnicals(symbol: string) {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  if (!apiKey) return null;
  
  try {
    // Get RSI
    const rsiRes = await fetch(
      `https://www.alphavantage.co/query?function=RSI&symbol=${symbol}&interval=daily&time_period=14&series_type=close&apikey=${apiKey}`,
      { next: { revalidate: 3600 } }
    );
    const rsiData = await rsiRes.json();
    const rsiValues = rsiData['Technical Analysis: RSI'];
    const latestRSI = rsiValues ? parseFloat(Object.values(rsiValues)[0] as string) : null;
    
    // Get MACD
    const macdRes = await fetch(
      `https://www.alphavantage.co/query?function=MACD&symbol=${symbol}&interval=daily&series_type=close&apikey=${apiKey}`,
      { next: { revalidate: 3600 } }
    );
    const macdData = await macdRes.json();
    const macdValues = macdData['Technical Analysis: MACD'];
    let macd = null;
    if (macdValues) {
      const latest = Object.values(macdValues)[0] as Record<string, string>;
      macd = {
        value: parseFloat(latest['MACD']),
        signal: parseFloat(latest['MACD_Signal']),
        histogram: parseFloat(latest['MACD_Hist']),
      };
    }
    
    return {
      rsi: latestRSI,
      rsiSignal: latestRSI 
        ? (latestRSI < 30 ? 'OVERSOLD' : latestRSI > 70 ? 'OVERBOUGHT' : 'NEUTRAL')
        : 'NEUTRAL',
      macd,
      macdTrend: macd 
        ? (macd.histogram > 0 ? 'BULLISH' : macd.histogram < 0 ? 'BEARISH' : 'NEUTRAL')
        : 'NEUTRAL',
    };
  } catch {
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol: rawSymbol } = await params;
  const symbol = rawSymbol.toUpperCase();

  try {
    // Parallel fetch all data
    const [quote, profile, analysts, insiders, sentiment, news, technicals] = await Promise.all([
      getFinnhubQuote(symbol),
      getFinnhubProfile(symbol),
      getFinnhubRecommendations(symbol),
      getFinnhubInsiders(symbol),
      getFinnhubSentiment(symbol),
      getFinnhubNews(symbol),
      getAlphaVantageTechnicals(symbol),
    ]);

    if (!quote && !profile) {
      return NextResponse.json(
        { error: `No data found for symbol: ${symbol}` },
        { status: 404 }
      );
    }

    // Calculate overall sentiment
    let overallSentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
    let sentimentScore = 0;
    
    if (analysts) {
      sentimentScore += analysts.score > 3.5 ? 25 : analysts.score < 2.5 ? -25 : 0;
    }
    if (insiders?.signal === 'BULLISH') sentimentScore += 20;
    else if (insiders?.signal === 'BEARISH') sentimentScore -= 20;
    if (sentiment?.sentiment === 'BULLISH') sentimentScore += 15;
    else if (sentiment?.sentiment === 'BEARISH') sentimentScore -= 15;
    if (technicals?.rsiSignal === 'OVERSOLD') sentimentScore += 10;
    else if (technicals?.rsiSignal === 'OVERBOUGHT') sentimentScore -= 10;
    if (technicals?.macdTrend === 'BULLISH') sentimentScore += 10;
    else if (technicals?.macdTrend === 'BEARISH') sentimentScore -= 10;
    
    if (sentimentScore > 20) overallSentiment = 'BULLISH';
    else if (sentimentScore < -20) overallSentiment = 'BEARISH';

    // Calculate risk score
    let riskScore = 50;
    const riskWarnings: string[] = [];
    
    if (profile?.marketCap && profile.marketCap < 2e9) {
      riskScore += 15;
      riskWarnings.push('Small cap stock - higher volatility expected');
    }
    if (quote?.changePercent && Math.abs(quote.changePercent) > 5) {
      riskScore += 10;
      riskWarnings.push('High daily volatility');
    }
    if (technicals?.rsiSignal === 'OVERBOUGHT') {
      riskScore += 10;
      riskWarnings.push('RSI indicates overbought conditions');
    } else if (technicals?.rsiSignal === 'OVERSOLD') {
      riskWarnings.push('RSI indicates oversold conditions - potential reversal');
    }
    
    const riskLevel = riskScore < 30 ? 'LOW'
                    : riskScore < 50 ? 'MODERATE'
                    : riskScore < 70 ? 'HIGH'
                    : riskScore < 85 ? 'VERY_HIGH'
                    : 'EXTREME';

    const response = {
      symbol,
      timestamp: new Date().toISOString(),
      
      profile: profile || null,
      
      price: quote ? {
        current: quote.price,
        change: quote.change,
        changePercent: quote.changePercent,
        open: quote.open,
        high: quote.high,
        low: quote.low,
        previousClose: quote.previousClose,
      } : null,
      
      technicals: technicals ? {
        rsi: technicals.rsi,
        rsiSignal: technicals.rsiSignal,
        macd: technicals.macd,
        macdTrend: technicals.macdTrend,
      } : null,
      
      sentiment: {
        overall: overallSentiment,
        score: sentimentScore,
        social: sentiment || { reddit: 0, twitter: 0, overall: 0, sentiment: 'NEUTRAL', trending: false },
        insiders: insiders || { recentTransactions: 0, buys: 0, sells: 0, signal: 'NEUTRAL', netBuying: false },
        analysts: analysts || null,
      },
      
      risk: {
        score: Math.min(100, riskScore),
        level: riskLevel,
        warnings: riskWarnings,
      },
      
      news,
      
      dataSources: [
        quote ? 'Finnhub' : null,
        technicals ? 'Alpha Vantage' : null,
      ].filter(Boolean),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error(`Stock analysis API error for ${symbol}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch stock analysis' },
      { status: 500 }
    );
  }
}
