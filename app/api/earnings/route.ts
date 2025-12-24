// Market Oracle - Earnings Calendar API
// Shows upcoming earnings, historical surprises, and guidance
// Sources: Finnhub, Financial Modeling Prep

import { NextResponse } from 'next/server';

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || 'd50o3i9r01qm94qn6ag0d50o3i9r01qm94qn6agg';
const FMP_API_KEY = process.env.FMP_API_KEY || 'tkfzWoW3wJIAHRRlMRXgqzrFcEspDVts';

interface EarningsEvent {
  id: string;
  symbol: string;
  companyName?: string;
  date: string;
  time: 'bmo' | 'amc' | 'during' | 'unknown'; // Before Market Open, After Market Close
  fiscalQuarter: string;
  fiscalYear: number;
  epsEstimate: number | null;
  epsActual: number | null;
  epsSurprise: number | null;
  epsSurprisePercent: number | null;
  revenueEstimate: number | null;
  revenueActual: number | null;
  revenueSurprise: number | null;
  revenueSurprisePercent: number | null;
  status: 'upcoming' | 'reported';
  impact: 'high' | 'medium' | 'low';
  historicalBeatRate?: number;
  avgSurprise?: number;
  source: string;
}

async function fetchFinnhubEarnings(from: string, to: string): Promise<EarningsEvent[]> {
  try {
    const url = `https://finnhub.io/api/v1/calendar/earnings?from=${from}&to=${to}&token=${FINNHUB_API_KEY}`;
    const response = await fetch(url, { next: { revalidate: 3600 } });
    
    if (!response.ok) return [];
    
    const data = await response.json();
    
    return (data.earningsCalendar || []).map((event: any, idx: number) => {
      const epsSurprise = event.epsActual && event.epsEstimate 
        ? event.epsActual - event.epsEstimate 
        : null;
      const epsSurprisePercent = event.epsEstimate && epsSurprise
        ? (epsSurprise / Math.abs(event.epsEstimate)) * 100
        : null;
      
      return {
        id: `finnhub-${event.symbol}-${event.date}-${idx}`,
        symbol: event.symbol,
        date: event.date,
        time: parseEarningsTime(event.hour),
        fiscalQuarter: `Q${event.quarter || '?'}`,
        fiscalYear: event.year || new Date().getFullYear(),
        epsEstimate: event.epsEstimate,
        epsActual: event.epsActual,
        epsSurprise,
        epsSurprisePercent: epsSurprisePercent ? Math.round(epsSurprisePercent * 100) / 100 : null,
        revenueEstimate: event.revenueEstimate,
        revenueActual: event.revenueActual,
        revenueSurprise: event.revenueActual && event.revenueEstimate 
          ? event.revenueActual - event.revenueEstimate 
          : null,
        revenueSurprisePercent: null,
        status: event.epsActual ? 'reported' : 'upcoming',
        impact: determineImpact(event.symbol),
        source: 'Finnhub'
      };
    });
  } catch (error) {
    console.error('Finnhub earnings error:', error);
    return [];
  }
}

async function fetchFMPEarningsCalendar(from: string, to: string): Promise<EarningsEvent[]> {
  try {
    const url = `https://financialmodelingprep.com/stable/earning-calendar?from=${from}&to=${to}&apikey=${FMP_API_KEY}`;
    const response = await fetch(url, { next: { revalidate: 3600 } });
    
    if (!response.ok) return [];
    
    const data = await response.json();
    
    return (data || []).map((event: any, idx: number) => {
      const epsSurprise = event.eps && event.epsEstimated 
        ? event.eps - event.epsEstimated 
        : null;
      const epsSurprisePercent = event.epsEstimated && epsSurprise
        ? (epsSurprise / Math.abs(event.epsEstimated)) * 100
        : null;
      
      const revenueSurprise = event.revenue && event.revenueEstimated
        ? event.revenue - event.revenueEstimated
        : null;
      const revenueSurprisePercent = event.revenueEstimated && revenueSurprise
        ? (revenueSurprise / event.revenueEstimated) * 100
        : null;
      
      return {
        id: `fmp-${event.symbol}-${event.date}-${idx}`,
        symbol: event.symbol,
        companyName: event.companyName,
        date: event.date,
        time: parseEarningsTime(event.time),
        fiscalQuarter: event.fiscalDateEnding ? `Q${getQuarter(event.fiscalDateEnding)}` : 'Q?',
        fiscalYear: event.fiscalDateEnding ? new Date(event.fiscalDateEnding).getFullYear() : new Date().getFullYear(),
        epsEstimate: event.epsEstimated,
        epsActual: event.eps,
        epsSurprise,
        epsSurprisePercent: epsSurprisePercent ? Math.round(epsSurprisePercent * 100) / 100 : null,
        revenueEstimate: event.revenueEstimated,
        revenueActual: event.revenue,
        revenueSurprise,
        revenueSurprisePercent: revenueSurprisePercent ? Math.round(revenueSurprisePercent * 100) / 100 : null,
        status: event.eps ? 'reported' : 'upcoming',
        impact: determineImpact(event.symbol),
        source: 'FMP'
      };
    });
  } catch (error) {
    console.error('FMP earnings error:', error);
    return [];
  }
}

async function fetchEarningsSurprises(symbol: string): Promise<any[]> {
  try {
    const url = `https://finnhub.io/api/v1/stock/earnings?symbol=${symbol}&token=${FINNHUB_API_KEY}`;
    const response = await fetch(url, { next: { revalidate: 86400 } }); // Cache 24h
    
    if (!response.ok) return [];
    
    return await response.json() || [];
  } catch (error) {
    console.error('Earnings surprises error:', error);
    return [];
  }
}

function parseEarningsTime(time: string | number | null): 'bmo' | 'amc' | 'during' | 'unknown' {
  if (!time) return 'unknown';
  const timeStr = String(time).toLowerCase();
  if (timeStr.includes('bmo') || timeStr.includes('before') || timeStr === '1') return 'bmo';
  if (timeStr.includes('amc') || timeStr.includes('after') || timeStr === '2') return 'amc';
  if (timeStr.includes('during') || timeStr === '3') return 'during';
  return 'unknown';
}

function getQuarter(dateStr: string): number {
  const month = new Date(dateStr).getMonth();
  return Math.floor(month / 3) + 1;
}

function determineImpact(symbol: string): 'high' | 'medium' | 'low' {
  // Major stocks have high impact
  const highImpact = new Set([
    'AAPL', 'MSFT', 'GOOGL', 'GOOG', 'AMZN', 'META', 'NVDA', 'TSLA',
    'JPM', 'BAC', 'WFC', 'GS', 'V', 'MA',
    'UNH', 'JNJ', 'PFE', 'LLY',
    'XOM', 'CVX',
    'WMT', 'HD', 'COST',
    'DIS', 'NFLX'
  ]);
  
  const mediumImpact = new Set([
    'AMD', 'INTC', 'QCOM', 'AVGO', 'TXN',
    'CRM', 'ORCL', 'ADBE', 'NOW', 'SNOW',
    'PYPL', 'SQ', 'COIN',
    'BA', 'CAT', 'DE', 'GE',
    'MCD', 'SBUX', 'NKE'
  ]);
  
  if (highImpact.has(symbol)) return 'high';
  if (mediumImpact.has(symbol)) return 'medium';
  return 'low';
}

function deduplicateEarnings(events: EarningsEvent[]): EarningsEvent[] {
  const seen = new Map<string, EarningsEvent>();
  
  for (const event of events) {
    const key = `${event.symbol}-${event.date}`;
    
    if (!seen.has(key)) {
      seen.set(key, event);
    } else {
      // Merge data, preferring actual values
      const existing = seen.get(key)!;
      if (event.epsActual && !existing.epsActual) {
        seen.set(key, { ...existing, ...event });
      } else if (event.companyName && !existing.companyName) {
        existing.companyName = event.companyName;
      }
    }
  }
  
  return Array.from(seen.values());
}

export async function GET(request: Request) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const days = parseInt(searchParams.get('days') || '14');
    const impact = searchParams.get('impact') as 'high' | 'medium' | 'low' | null;
    const status = searchParams.get('status') as 'upcoming' | 'reported' | null;
    
    // Calculate date range
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 7); // Include recent past
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + days);
    
    const from = startDate.toISOString().split('T')[0];
    const to = endDate.toISOString().split('T')[0];
    
    let events: EarningsEvent[] = [];
    
    if (symbol) {
      // Get historical surprises for specific symbol
      const [finnhub, fmp, surprises] = await Promise.all([
        fetchFinnhubEarnings(from, to),
        fetchFMPEarningsCalendar(from, to),
        fetchEarningsSurprises(symbol.toUpperCase())
      ]);
      
      events = [...finnhub, ...fmp].filter(e => 
        e.symbol.toUpperCase() === symbol.toUpperCase()
      );
      
      // Add historical beat rate
      if (surprises.length > 0) {
        const beats = surprises.filter((s: any) => s.surprise && s.surprise > 0).length;
        const beatRate = Math.round((beats / surprises.length) * 100);
        const avgSurprise = surprises.reduce((sum: number, s: any) => sum + (s.surprisePercent || 0), 0) / surprises.length;
        
        events = events.map(e => ({
          ...e,
          historicalBeatRate: beatRate,
          avgSurprise: Math.round(avgSurprise * 100) / 100
        }));
      }
    } else {
      // Get all earnings in date range
      const [finnhub, fmp] = await Promise.all([
        fetchFinnhubEarnings(from, to),
        fetchFMPEarningsCalendar(from, to)
      ]);
      events = [...finnhub, ...fmp];
    }
    
    // Deduplicate
    events = deduplicateEarnings(events);
    
    // Filter by impact
    if (impact) {
      events = events.filter(e => e.impact === impact);
    }
    
    // Filter by status
    if (status) {
      events = events.filter(e => e.status === status);
    }
    
    // Sort by date
    events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Group by date
    const byDate: Record<string, EarningsEvent[]> = {};
    for (const event of events) {
      if (!byDate[event.date]) byDate[event.date] = [];
      byDate[event.date].push(event);
    }
    
    // Calculate summary stats
    const upcoming = events.filter(e => e.status === 'upcoming');
    const reported = events.filter(e => e.status === 'reported');
    const beats = reported.filter(e => e.epsSurprise && e.epsSurprise > 0);
    const misses = reported.filter(e => e.epsSurprise && e.epsSurprise < 0);
    
    const summary = {
      totalEvents: events.length,
      upcoming: upcoming.length,
      reported: reported.length,
      beats: beats.length,
      misses: misses.length,
      beatRate: reported.length > 0 ? Math.round((beats.length / reported.length) * 100) : null,
      highImpact: events.filter(e => e.impact === 'high').length,
      thisWeek: events.filter(e => {
        const eventDate = new Date(e.date);
        const weekFromNow = new Date();
        weekFromNow.setDate(weekFromNow.getDate() + 7);
        return eventDate >= today && eventDate <= weekFromNow;
      }).length
    };
    
    // Notable upcoming (high impact this week)
    const notableUpcoming = events
      .filter(e => e.status === 'upcoming' && e.impact === 'high')
      .slice(0, 10);
    
    // Recent surprises
    const recentSurprises = reported
      .filter(e => Math.abs(e.epsSurprisePercent || 0) > 5)
      .sort((a, b) => Math.abs(b.epsSurprisePercent || 0) - Math.abs(a.epsSurprisePercent || 0))
      .slice(0, 10);
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      processingTime: `${Date.now() - startTime}ms`,
      dateRange: { from, to },
      symbol: symbol || 'all',
      summary,
      notableUpcoming,
      recentSurprises,
      calendar: Object.entries(byDate).map(([date, events]) => ({
        date,
        dayOfWeek: new Date(date).toLocaleDateString('en-US', { weekday: 'long' }),
        events: events.sort((a, b) => {
          const timeOrder = { bmo: 0, during: 1, amc: 2, unknown: 3 };
          return timeOrder[a.time] - timeOrder[b.time];
        })
      })),
      events,
      dataSources: ['Finnhub', 'Financial Modeling Prep']
    });
    
  } catch (error) {
    console.error('Earnings calendar API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch earnings calendar',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
