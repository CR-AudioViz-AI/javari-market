// Market Oracle - Macro Economic Alerts API
// Tracks and alerts on major economic events
// Sources: FRED, Economic calendars

import { NextResponse } from 'next/server';

const FRED_API_KEY = process.env.FRED_API_KEY || 'fc8d5b44ab7b1b7b47da21d2454d0f2a';

interface MacroEvent {
  id: string;
  name: string;
  date: string;
  time: string;
  importance: 'high' | 'medium' | 'low';
  category: string;
  previousValue?: string;
  forecastValue?: string;
  actualValue?: string;
  impact: 'bullish' | 'bearish' | 'neutral' | 'pending';
  description: string;
  tradingImplication: string;
}

// Major economic events calendar (simulated - would connect to real calendar API)
function getUpcomingEvents(): MacroEvent[] {
  const now = new Date();
  const events: MacroEvent[] = [];
  
  // Generate realistic upcoming events
  const eventTemplates = [
    { name: 'FOMC Interest Rate Decision', importance: 'high' as const, category: 'Federal Reserve', description: 'Federal Open Market Committee announces interest rate decision' },
    { name: 'FOMC Meeting Minutes', importance: 'high' as const, category: 'Federal Reserve', description: 'Detailed minutes from FOMC meeting released' },
    { name: 'Fed Chair Powell Speech', importance: 'high' as const, category: 'Federal Reserve', description: 'Federal Reserve Chair speaks on monetary policy' },
    { name: 'CPI Inflation Report', importance: 'high' as const, category: 'Inflation', description: 'Consumer Price Index monthly release' },
    { name: 'Core PCE Price Index', importance: 'high' as const, category: 'Inflation', description: 'Fed\'s preferred inflation measure' },
    { name: 'Nonfarm Payrolls', importance: 'high' as const, category: 'Employment', description: 'Monthly jobs report showing employment changes' },
    { name: 'Unemployment Rate', importance: 'high' as const, category: 'Employment', description: 'Percentage of labor force unemployed' },
    { name: 'Initial Jobless Claims', importance: 'medium' as const, category: 'Employment', description: 'Weekly new unemployment claims' },
    { name: 'GDP Growth Rate', importance: 'high' as const, category: 'Growth', description: 'Quarterly economic output measurement' },
    { name: 'Retail Sales', importance: 'medium' as const, category: 'Consumer', description: 'Monthly consumer spending indicator' },
    { name: 'Consumer Confidence', importance: 'medium' as const, category: 'Consumer', description: 'Survey of consumer sentiment' },
    { name: 'ISM Manufacturing PMI', importance: 'medium' as const, category: 'Manufacturing', description: 'Manufacturing sector health indicator' },
    { name: 'Housing Starts', importance: 'medium' as const, category: 'Housing', description: 'New residential construction begins' },
    { name: 'Existing Home Sales', importance: 'low' as const, category: 'Housing', description: 'Monthly existing home sales volume' },
    { name: 'Durable Goods Orders', importance: 'medium' as const, category: 'Manufacturing', description: 'Orders for long-lasting goods' },
  ];
  
  // Distribute events over next 30 days
  for (let i = 0; i < eventTemplates.length; i++) {
    const template = eventTemplates[i];
    const eventDate = new Date(now);
    eventDate.setDate(eventDate.getDate() + Math.floor(Math.random() * 30) + 1);
    
    const hour = template.importance === 'high' ? 8 : 10; // High importance at market open
    
    events.push({
      id: `macro-${i}-${eventDate.toISOString().split('T')[0]}`,
      name: template.name,
      date: eventDate.toISOString().split('T')[0],
      time: `${hour}:30 AM ET`,
      importance: template.importance,
      category: template.category,
      previousValue: generatePreviousValue(template.name),
      forecastValue: generateForecastValue(template.name),
      impact: 'pending',
      description: template.description,
      tradingImplication: getTradingImplication(template.name)
    });
  }
  
  // Sort by date
  events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  return events;
}

function generatePreviousValue(name: string): string {
  const values: Record<string, string> = {
    'FOMC Interest Rate Decision': '5.25-5.50%',
    'CPI Inflation Report': '3.2%',
    'Core PCE Price Index': '2.8%',
    'Nonfarm Payrolls': '+216K',
    'Unemployment Rate': '3.7%',
    'GDP Growth Rate': '3.2%',
    'Retail Sales': '+0.6%',
    'Initial Jobless Claims': '218K'
  };
  return values[name] || 'N/A';
}

function generateForecastValue(name: string): string {
  const values: Record<string, string> = {
    'FOMC Interest Rate Decision': '5.25-5.50%',
    'CPI Inflation Report': '3.1%',
    'Core PCE Price Index': '2.7%',
    'Nonfarm Payrolls': '+180K',
    'Unemployment Rate': '3.8%',
    'GDP Growth Rate': '2.8%',
    'Retail Sales': '+0.3%',
    'Initial Jobless Claims': '220K'
  };
  return values[name] || 'N/A';
}

function getTradingImplication(name: string): string {
  const implications: Record<string, string> = {
    'FOMC Interest Rate Decision': 'Rate cuts = bullish stocks, bearish dollar. Rate hikes = opposite.',
    'CPI Inflation Report': 'Higher than expected = hawkish Fed, bearish stocks. Lower = bullish.',
    'Core PCE Price Index': 'Fed\'s key metric. Deviation from forecast moves markets significantly.',
    'Nonfarm Payrolls': 'Strong jobs = mixed (good economy but hawkish Fed). Weak = bullish (rate cut hopes).',
    'Unemployment Rate': 'Rising unemployment = potential rate cuts. Falling = continued tight policy.',
    'GDP Growth Rate': 'Strong growth = bullish equities. Negative = recession fears.',
    'Retail Sales': 'Strong sales = consumer health. Weak = economic slowdown concerns.',
    'Initial Jobless Claims': 'Rising claims = labor weakness. Weekly leading indicator.'
  };
  return implications[name] || 'Monitor for market-moving surprises.';
}

async function fetchLatestFREDData(): Promise<any> {
  try {
    // Fetch key indicators
    const series = ['FEDFUNDS', 'CPIAUCSL', 'UNRATE'];
    const results: Record<string, any> = {};
    
    for (const s of series) {
      const response = await fetch(
        `https://api.stlouisfed.org/fred/series/observations?series_id=${s}&api_key=${FRED_API_KEY}&file_type=json&sort_order=desc&limit=2`
      );
      if (response.ok) {
        const data = await response.json();
        const obs = data.observations?.filter((o: any) => o.value !== '.') || [];
        if (obs.length >= 2) {
          results[s] = {
            current: parseFloat(obs[0].value),
            previous: parseFloat(obs[1].value),
            date: obs[0].date
          };
        }
      }
    }
    
    return results;
  } catch (error) {
    console.error('FRED fetch error:', error);
    return {};
  }
}

export async function GET(request: Request) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    const importance = searchParams.get('importance');
    const category = searchParams.get('category');
    const days = parseInt(searchParams.get('days') || '30');
    
    // Get upcoming events
    let events = getUpcomingEvents();
    
    // Filter by importance
    if (importance) {
      events = events.filter(e => e.importance === importance);
    }
    
    // Filter by category
    if (category) {
      events = events.filter(e => 
        e.category.toLowerCase().includes(category.toLowerCase())
      );
    }
    
    // Filter by days
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + days);
    events = events.filter(e => new Date(e.date) <= cutoffDate);
    
    // Get latest economic data
    const latestData = await fetchLatestFREDData();
    
    // Group by date
    const byDate: Record<string, MacroEvent[]> = {};
    for (const event of events) {
      if (!byDate[event.date]) byDate[event.date] = [];
      byDate[event.date].push(event);
    }
    
    // Calculate this week's events
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    const thisWeek = events.filter(e => new Date(e.date) <= weekFromNow);
    const highImportanceThisWeek = thisWeek.filter(e => e.importance === 'high');
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      processingTime: `${Date.now() - startTime}ms`,
      summary: {
        totalEvents: events.length,
        thisWeek: thisWeek.length,
        highImportance: events.filter(e => e.importance === 'high').length,
        categories: [...new Set(events.map(e => e.category))]
      },
      alertsThisWeek: highImportanceThisWeek.map(e => ({
        name: e.name,
        date: e.date,
        time: e.time,
        tradingImplication: e.tradingImplication
      })),
      currentIndicators: {
        fedFundsRate: latestData.FEDFUNDS ? `${latestData.FEDFUNDS.current.toFixed(2)}%` : 'N/A',
        inflation: latestData.CPIAUCSL ? `${latestData.CPIAUCSL.current.toFixed(1)}%` : 'N/A',
        unemployment: latestData.UNRATE ? `${latestData.UNRATE.current.toFixed(1)}%` : 'N/A'
      },
      calendar: Object.entries(byDate).map(([date, events]) => ({
        date,
        dayOfWeek: new Date(date).toLocaleDateString('en-US', { weekday: 'long' }),
        events: events.sort((a, b) => {
          const impOrder = { high: 0, medium: 1, low: 2 };
          return impOrder[a.importance] - impOrder[b.importance];
        })
      })),
      events,
      tradingTips: [
        'Avoid opening new positions 30 minutes before high-importance releases',
        'FOMC days typically see volatility spike after 2:00 PM ET announcement',
        'Jobs reports (first Friday of month) often set the tone for the week',
        'CPI releases can cause 1-2% market swings on surprises'
      ]
    });
    
  } catch (error) {
    console.error('Macro alerts error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch macro events',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
