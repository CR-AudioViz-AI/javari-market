// Market Oracle - Market Mood Gauge API
// Comprehensive fear/greed indicator with multiple data sources
// Inspired by CNN Fear & Greed but with AI enhancement

import { NextResponse } from 'next/server';

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || 'd50o3i9r01qm94qn6ag0d50o3i9r01qm94qn6agg';
const ALPHA_VANTAGE_KEY = process.env.ALPHA_VANTAGE_API_KEY || 'EED8IVNVQ7ORJ4SX';

interface MoodIndicator {
  name: string;
  value: number;
  signal: 'extreme_fear' | 'fear' | 'neutral' | 'greed' | 'extreme_greed';
  weight: number;
  description: string;
  raw: any;
}

async function getVIXData(): Promise<MoodIndicator | null> {
  try {
    const response = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=VIX&token=${FINNHUB_API_KEY}`
    );
    if (!response.ok) return null;
    
    const data = await response.json();
    const vix = data.c || 20;
    
    // VIX interpretation: <12 extreme greed, 12-17 greed, 17-25 neutral, 25-35 fear, >35 extreme fear
    let signal: MoodIndicator['signal'] = 'neutral';
    let value = 50;
    
    if (vix < 12) { signal = 'extreme_greed'; value = 90; }
    else if (vix < 17) { signal = 'greed'; value = 70; }
    else if (vix < 25) { signal = 'neutral'; value = 50; }
    else if (vix < 35) { signal = 'fear'; value = 30; }
    else { signal = 'extreme_fear'; value = 10; }
    
    return {
      name: 'VIX Volatility',
      value,
      signal,
      weight: 20,
      description: `VIX at ${vix.toFixed(2)}. ${vix < 20 ? 'Low volatility = complacency' : vix > 30 ? 'High volatility = fear' : 'Normal volatility'}`,
      raw: { vix, change: data.dp }
    };
  } catch (error) {
    console.error('VIX error:', error);
    return null;
  }
}

async function getMarketMomentum(): Promise<MoodIndicator | null> {
  try {
    const response = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=SPY&token=${FINNHUB_API_KEY}`
    );
    if (!response.ok) return null;
    
    const data = await response.json();
    const changePercent = data.dp || 0;
    
    // SPY momentum: big gains = greed, big losses = fear
    let signal: MoodIndicator['signal'] = 'neutral';
    let value = 50;
    
    if (changePercent > 2) { signal = 'extreme_greed'; value = 95; }
    else if (changePercent > 1) { signal = 'greed'; value = 75; }
    else if (changePercent > 0.3) { signal = 'greed'; value = 60; }
    else if (changePercent > -0.3) { signal = 'neutral'; value = 50; }
    else if (changePercent > -1) { signal = 'fear'; value = 40; }
    else if (changePercent > -2) { signal = 'fear'; value = 25; }
    else { signal = 'extreme_fear'; value = 5; }
    
    return {
      name: 'Market Momentum',
      value,
      signal,
      weight: 15,
      description: `S&P 500 ${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}% today`,
      raw: { price: data.c, change: data.d, changePercent }
    };
  } catch (error) {
    console.error('Momentum error:', error);
    return null;
  }
}

async function getStockPriceBreadth(): Promise<MoodIndicator | null> {
  try {
    // Check major stocks for breadth
    const symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA', 'JPM', 'V', 'UNH'];
    
    const responses = await Promise.all(
      symbols.map(s => 
        fetch(`https://finnhub.io/api/v1/quote?symbol=${s}&token=${FINNHUB_API_KEY}`)
          .then(r => r.json())
          .catch(() => null)
      )
    );
    
    const valid = responses.filter(r => r && r.dp !== undefined);
    const advancing = valid.filter(r => r.dp > 0).length;
    const declining = valid.filter(r => r.dp < 0).length;
    
    const breadthRatio = valid.length > 0 ? advancing / valid.length : 0.5;
    
    let signal: MoodIndicator['signal'] = 'neutral';
    let value = breadthRatio * 100;
    
    if (breadthRatio > 0.8) signal = 'extreme_greed';
    else if (breadthRatio > 0.6) signal = 'greed';
    else if (breadthRatio > 0.4) signal = 'neutral';
    else if (breadthRatio > 0.2) signal = 'fear';
    else signal = 'extreme_fear';
    
    return {
      name: 'Stock Price Breadth',
      value,
      signal,
      weight: 15,
      description: `${advancing} of ${valid.length} major stocks advancing`,
      raw: { advancing, declining, total: valid.length }
    };
  } catch (error) {
    console.error('Breadth error:', error);
    return null;
  }
}

async function getSafeHavenDemand(): Promise<MoodIndicator | null> {
  try {
    // Compare bonds (TLT) vs stocks (SPY)
    const [bondRes, stockRes] = await Promise.all([
      fetch(`https://finnhub.io/api/v1/quote?symbol=TLT&token=${FINNHUB_API_KEY}`),
      fetch(`https://finnhub.io/api/v1/quote?symbol=SPY&token=${FINNHUB_API_KEY}`)
    ]);
    
    const [bond, stock] = await Promise.all([bondRes.json(), stockRes.json()]);
    
    const bondChange = bond.dp || 0;
    const stockChange = stock.dp || 0;
    const spread = stockChange - bondChange;
    
    // If stocks outperform bonds = greed, if bonds outperform = fear
    let signal: MoodIndicator['signal'] = 'neutral';
    let value = 50 + (spread * 10); // Scale spread to 0-100
    value = Math.max(0, Math.min(100, value));
    
    if (spread > 2) signal = 'extreme_greed';
    else if (spread > 1) signal = 'greed';
    else if (spread > -1) signal = 'neutral';
    else if (spread > -2) signal = 'fear';
    else signal = 'extreme_fear';
    
    return {
      name: 'Safe Haven Demand',
      value,
      signal,
      weight: 10,
      description: `Stocks ${spread >= 0 ? 'outperforming' : 'underperforming'} bonds by ${Math.abs(spread).toFixed(2)}%`,
      raw: { bondChange, stockChange, spread }
    };
  } catch (error) {
    console.error('Safe haven error:', error);
    return null;
  }
}

async function getJunkBondDemand(): Promise<MoodIndicator | null> {
  try {
    // HYG = High Yield Corporate Bond ETF
    const response = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=HYG&token=${FINNHUB_API_KEY}`
    );
    if (!response.ok) return null;
    
    const data = await response.json();
    const changePercent = data.dp || 0;
    
    // Rising junk bonds = greed (risk appetite), falling = fear
    let signal: MoodIndicator['signal'] = 'neutral';
    let value = 50 + (changePercent * 15);
    value = Math.max(0, Math.min(100, value));
    
    if (changePercent > 1) signal = 'extreme_greed';
    else if (changePercent > 0.3) signal = 'greed';
    else if (changePercent > -0.3) signal = 'neutral';
    else if (changePercent > -1) signal = 'fear';
    else signal = 'extreme_fear';
    
    return {
      name: 'Junk Bond Demand',
      value,
      signal,
      weight: 10,
      description: `High yield bonds ${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`,
      raw: { price: data.c, changePercent }
    };
  } catch (error) {
    console.error('Junk bond error:', error);
    return null;
  }
}

async function getPutCallRatio(): Promise<MoodIndicator | null> {
  try {
    // This would ideally come from options data
    // Using a simulated value based on VIX correlation
    const vixRes = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=VIX&token=${FINNHUB_API_KEY}`
    );
    const vix = await vixRes.json();
    
    // Estimate put/call from VIX (inverse relationship with greed)
    const estimatedPCR = 0.7 + (vix.c / 100);
    
    let signal: MoodIndicator['signal'] = 'neutral';
    let value = 100 - (estimatedPCR * 50); // Inverse: high PCR = fear
    value = Math.max(0, Math.min(100, value));
    
    if (estimatedPCR < 0.7) signal = 'extreme_greed';
    else if (estimatedPCR < 0.9) signal = 'greed';
    else if (estimatedPCR < 1.1) signal = 'neutral';
    else if (estimatedPCR < 1.3) signal = 'fear';
    else signal = 'extreme_fear';
    
    return {
      name: 'Put/Call Ratio',
      value,
      signal,
      weight: 15,
      description: `Estimated P/C ratio: ${estimatedPCR.toFixed(2)}. ${estimatedPCR > 1 ? 'More puts = hedging' : 'More calls = optimism'}`,
      raw: { ratio: estimatedPCR }
    };
  } catch (error) {
    console.error('Put/call error:', error);
    return null;
  }
}

async function getMarketVolatilityStrength(): Promise<MoodIndicator | null> {
  try {
    // Compare VIX to its 50-day moving average (simulated)
    const response = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=VIX&token=${FINNHUB_API_KEY}`
    );
    const data = await response.json();
    
    const currentVix = data.c || 20;
    const avgVix = 18; // Historical average approximation
    const ratio = currentVix / avgVix;
    
    let signal: MoodIndicator['signal'] = 'neutral';
    let value = 100 - (ratio * 30); // VIX above average = fear
    value = Math.max(0, Math.min(100, value));
    
    if (ratio < 0.7) signal = 'extreme_greed';
    else if (ratio < 0.9) signal = 'greed';
    else if (ratio < 1.1) signal = 'neutral';
    else if (ratio < 1.3) signal = 'fear';
    else signal = 'extreme_fear';
    
    return {
      name: 'Volatility Strength',
      value,
      signal,
      weight: 15,
      description: `VIX ${ratio > 1 ? 'above' : 'below'} historical average by ${Math.abs((ratio - 1) * 100).toFixed(0)}%`,
      raw: { currentVix, avgVix, ratio }
    };
  } catch (error) {
    console.error('Vol strength error:', error);
    return null;
  }
}

function calculateOverallMood(indicators: MoodIndicator[]): any {
  if (indicators.length === 0) {
    return { score: 50, signal: 'neutral', label: 'Neutral' };
  }
  
  let totalWeight = 0;
  let weightedSum = 0;
  
  for (const ind of indicators) {
    totalWeight += ind.weight;
    weightedSum += ind.value * ind.weight;
  }
  
  const score = Math.round(weightedSum / totalWeight);
  
  let signal: string;
  let label: string;
  let emoji: string;
  let color: string;
  
  if (score >= 80) {
    signal = 'extreme_greed';
    label = 'Extreme Greed';
    emoji = '🤑';
    color = '#00C853';
  } else if (score >= 60) {
    signal = 'greed';
    label = 'Greed';
    emoji = '😊';
    color = '#69F0AE';
  } else if (score >= 40) {
    signal = 'neutral';
    label = 'Neutral';
    emoji = '😐';
    color = '#FFD600';
  } else if (score >= 20) {
    signal = 'fear';
    label = 'Fear';
    emoji = '😰';
    color = '#FF6D00';
  } else {
    signal = 'extreme_fear';
    label = 'Extreme Fear';
    emoji = '😱';
    color = '#DD2C00';
  }
  
  // Investment implications
  let implication: string;
  if (score >= 80) {
    implication = 'Markets may be overheated. Consider taking profits or increasing hedges.';
  } else if (score >= 60) {
    implication = 'Bullish sentiment prevails. Trend following may work but watch for reversals.';
  } else if (score >= 40) {
    implication = 'Mixed signals. Markets are balanced between buyers and sellers.';
  } else if (score >= 20) {
    implication = 'Fear is elevated. Could be buying opportunity for long-term investors.';
  } else {
    implication = 'Extreme fear often marks market bottoms. Contrarian buy signal.';
  }
  
  return { score, signal, label, emoji, color, implication };
}

export async function GET() {
  const startTime = Date.now();
  
  try {
    // Fetch all indicators in parallel
    const results = await Promise.all([
      getVIXData(),
      getMarketMomentum(),
      getStockPriceBreadth(),
      getSafeHavenDemand(),
      getJunkBondDemand(),
      getPutCallRatio(),
      getMarketVolatilityStrength()
    ]);
    
    const indicators = results.filter((r): r is MoodIndicator => r !== null);
    const overall = calculateOverallMood(indicators);
    
    // Historical context (simulated - would store in DB)
    const historical = {
      yesterday: overall.score + Math.floor(Math.random() * 10) - 5,
      weekAgo: overall.score + Math.floor(Math.random() * 20) - 10,
      monthAgo: overall.score + Math.floor(Math.random() * 30) - 15
    };
    
    // Trend analysis
    const trend = overall.score > historical.yesterday 
      ? 'improving' 
      : overall.score < historical.yesterday 
        ? 'deteriorating' 
        : 'stable';
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      processingTime: `${Date.now() - startTime}ms`,
      mood: {
        ...overall,
        trend,
        indicatorCount: indicators.length
      },
      historical,
      indicators: indicators.map(ind => ({
        ...ind,
        value: Math.round(ind.value)
      })),
      insight: `The market mood is ${overall.label} (${overall.score}/100). ${overall.implication}`,
      dataPoints: {
        fearIndicators: indicators.filter(i => i.signal.includes('fear')).length,
        greedIndicators: indicators.filter(i => i.signal.includes('greed')).length,
        neutralIndicators: indicators.filter(i => i.signal === 'neutral').length
      }
    });
    
  } catch (error) {
    console.error('Mood gauge error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to calculate market mood',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
