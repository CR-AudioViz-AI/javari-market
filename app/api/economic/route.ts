// Market Oracle - Economic Data API (FRED)
// Provides Federal Reserve economic data for market analysis
// API: FRED (Federal Reserve Economic Data)

import { NextResponse } from 'next/server';

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const FRED_API_KEY = process.env.FRED_API_KEY || 'fc8d5b44ab7b1b7b47da21d2454d0f2a';
const FRED_BASE_URL = 'https://api.stlouisfed.org/fred';

interface FREDObservation {
  date: string;
  value: string;
}

interface EconomicIndicator {
  id: string;
  name: string;
  description: string;
  value: number | null;
  previousValue: number | null;
  change: number | null;
  changePercent: number | null;
  date: string;
  previousDate: string;
  trend: 'up' | 'down' | 'stable';
  impact: 'bullish' | 'bearish' | 'neutral';
  category: string;
}

// Key economic indicators to track
const INDICATORS = [
  { id: 'FEDFUNDS', name: 'Federal Funds Rate', category: 'Interest Rates', impactLogic: 'inverse' },
  { id: 'DGS10', name: '10-Year Treasury', category: 'Interest Rates', impactLogic: 'inverse' },
  { id: 'DGS2', name: '2-Year Treasury', category: 'Interest Rates', impactLogic: 'inverse' },
  { id: 'T10Y2Y', name: 'Yield Curve (10Y-2Y)', category: 'Interest Rates', impactLogic: 'direct' },
  { id: 'MORTGAGE30US', name: '30-Year Mortgage Rate', category: 'Housing', impactLogic: 'inverse' },
  { id: 'CPIAUCSL', name: 'Consumer Price Index', category: 'Inflation', impactLogic: 'inverse' },
  { id: 'PCEPI', name: 'PCE Price Index', category: 'Inflation', impactLogic: 'inverse' },
  { id: 'UNRATE', name: 'Unemployment Rate', category: 'Employment', impactLogic: 'inverse' },
  { id: 'PAYEMS', name: 'Nonfarm Payrolls', category: 'Employment', impactLogic: 'direct' },
  { id: 'ICSA', name: 'Initial Jobless Claims', category: 'Employment', impactLogic: 'inverse' },
  { id: 'GDP', name: 'Real GDP', category: 'Growth', impactLogic: 'direct' },
  { id: 'GDPC1', name: 'Real GDP Growth Rate', category: 'Growth', impactLogic: 'direct' },
  { id: 'RSXFS', name: 'Retail Sales', category: 'Consumer', impactLogic: 'direct' },
  { id: 'UMCSENT', name: 'Consumer Sentiment', category: 'Consumer', impactLogic: 'direct' },
  { id: 'INDPRO', name: 'Industrial Production', category: 'Manufacturing', impactLogic: 'direct' },
  { id: 'HOUST', name: 'Housing Starts', category: 'Housing', impactLogic: 'direct' },
  { id: 'DTWEXBGS', name: 'US Dollar Index', category: 'Currency', impactLogic: 'mixed' },
  { id: 'VIXCLS', name: 'VIX Volatility Index', category: 'Volatility', impactLogic: 'inverse' },
  { id: 'M2SL', name: 'M2 Money Supply', category: 'Monetary', impactLogic: 'direct' },
  { id: 'WALCL', name: 'Fed Balance Sheet', category: 'Monetary', impactLogic: 'direct' },
];

async function fetchFREDSeries(seriesId: string): Promise<FREDObservation[]> {
  try {
    const url = `${FRED_BASE_URL}/series/observations?series_id=${seriesId}&api_key=${FRED_API_KEY}&file_type=json&sort_order=desc&limit=10`;
    const response = await fetch(url, { next: { revalidate: 3600 } }); // Cache 1 hour
    
    if (!response.ok) {
      console.error(`FRED API error for ${seriesId}: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    return data.observations || [];
  } catch (error) {
    console.error(`Error fetching FRED series ${seriesId}:`, error);
    return [];
  }
}

function determineImpact(
  change: number | null, 
  impactLogic: string
): 'bullish' | 'bearish' | 'neutral' {
  if (change === null || Math.abs(change) < 0.01) return 'neutral';
  
  if (impactLogic === 'direct') {
    return change > 0 ? 'bullish' : 'bearish';
  } else if (impactLogic === 'inverse') {
    return change > 0 ? 'bearish' : 'bullish';
  }
  return 'neutral';
}

export async function GET(request: Request) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const indicatorId = searchParams.get('id');
    
    // Filter indicators if specific ones requested
    let indicatorsToFetch = INDICATORS;
    if (category) {
      indicatorsToFetch = INDICATORS.filter(i => 
        i.category.toLowerCase() === category.toLowerCase()
      );
    }
    if (indicatorId) {
      indicatorsToFetch = INDICATORS.filter(i => i.id === indicatorId);
    }
    
    // Fetch all indicators in parallel
    const results = await Promise.all(
      indicatorsToFetch.map(async (indicator) => {
        const observations = await fetchFREDSeries(indicator.id);
        
        if (observations.length === 0) {
          return null;
        }
        
        // Get current and previous values (skip "." which means no data)
        const validObs = observations.filter(o => o.value !== '.');
        if (validObs.length < 2) return null;
        
        const currentValue = parseFloat(validObs[0].value);
        const previousValue = parseFloat(validObs[1].value);
        const change = currentValue - previousValue;
        const changePercent = previousValue !== 0 ? (change / previousValue) * 100 : 0;
        
        const indicatorConfig = INDICATORS.find(i => i.id === indicator.id)!;
        
        return {
          id: indicator.id,
          name: indicator.name,
          description: getDescription(indicator.id),
          value: currentValue,
          previousValue,
          change: Math.round(change * 1000) / 1000,
          changePercent: Math.round(changePercent * 100) / 100,
          date: validObs[0].date,
          previousDate: validObs[1].date,
          trend: change > 0.001 ? 'up' : change < -0.001 ? 'down' : 'stable',
          impact: determineImpact(change, indicatorConfig.impactLogic),
          category: indicator.category,
        } as EconomicIndicator;
      })
    );
    
    const indicators = results.filter((r): r is EconomicIndicator => r !== null);
    
    // Group by category
    const byCategory: Record<string, EconomicIndicator[]> = {};
    for (const indicator of indicators) {
      if (!byCategory[indicator.category]) {
        byCategory[indicator.category] = [];
      }
      byCategory[indicator.category].push(indicator);
    }
    
    // Calculate overall market outlook
    const bullishCount = indicators.filter(i => i.impact === 'bullish').length;
    const bearishCount = indicators.filter(i => i.impact === 'bearish').length;
    const totalWithImpact = bullishCount + bearishCount;
    
    let overallOutlook: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    let outlookScore = 50;
    if (totalWithImpact > 0) {
      outlookScore = Math.round((bullishCount / totalWithImpact) * 100);
      if (outlookScore >= 60) overallOutlook = 'bullish';
      else if (outlookScore <= 40) overallOutlook = 'bearish';
    }
    
    // Key highlights
    const highlights = [];
    
    // Fed Funds Rate
    const fedFunds = indicators.find(i => i.id === 'FEDFUNDS');
    if (fedFunds) {
      highlights.push({
        title: 'Federal Funds Rate',
        value: `${fedFunds.value?.toFixed(2)}%`,
        insight: fedFunds.change! > 0 
          ? 'Rate hike - tightening monetary policy' 
          : fedFunds.change! < 0 
            ? 'Rate cut - easing monetary policy'
            : 'Rates unchanged',
        impact: fedFunds.impact
      });
    }
    
    // Inflation
    const cpi = indicators.find(i => i.id === 'CPIAUCSL');
    if (cpi && cpi.changePercent) {
      highlights.push({
        title: 'Inflation (CPI)',
        value: `${cpi.changePercent.toFixed(1)}% YoY`,
        insight: cpi.changePercent > 3 
          ? 'Above Fed target - hawkish pressure'
          : cpi.changePercent < 2 
            ? 'Below target - dovish potential'
            : 'Near Fed 2% target',
        impact: cpi.impact
      });
    }
    
    // Unemployment
    const unemployment = indicators.find(i => i.id === 'UNRATE');
    if (unemployment) {
      highlights.push({
        title: 'Unemployment',
        value: `${unemployment.value?.toFixed(1)}%`,
        insight: unemployment.value! < 4 
          ? 'Tight labor market'
          : unemployment.value! > 5 
            ? 'Elevated unemployment'
            : 'Healthy employment',
        impact: unemployment.impact
      });
    }
    
    // Yield Curve
    const yieldCurve = indicators.find(i => i.id === 'T10Y2Y');
    if (yieldCurve) {
      highlights.push({
        title: 'Yield Curve',
        value: `${yieldCurve.value?.toFixed(2)}%`,
        insight: yieldCurve.value! < 0 
          ? '⚠️ INVERTED - Recession signal'
          : 'Normal yield curve',
        impact: yieldCurve.value! < 0 ? 'bearish' : 'bullish'
      });
    }
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      processingTime: `${Date.now() - startTime}ms`,
      summary: {
        outlook: overallOutlook,
        outlookScore,
        bullishIndicators: bullishCount,
        bearishIndicators: bearishCount,
        neutralIndicators: indicators.length - bullishCount - bearishCount,
        totalIndicators: indicators.length,
      },
      highlights,
      categories: Object.keys(byCategory).map(cat => ({
        name: cat,
        indicators: byCategory[cat]
      })),
      indicators,
      dataSource: 'Federal Reserve Economic Data (FRED)',
      lastUpdated: indicators[0]?.date || new Date().toISOString().split('T')[0],
    });
    
  } catch (error) {
    console.error('Economic API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch economic data',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function getDescription(id: string): string {
  const descriptions: Record<string, string> = {
    'FEDFUNDS': 'The interest rate at which banks lend to each other overnight. Key Fed policy tool.',
    'DGS10': '10-year Treasury bond yield. Benchmark for mortgage rates and long-term borrowing.',
    'DGS2': '2-year Treasury yield. Sensitive to Fed policy expectations.',
    'T10Y2Y': 'Spread between 10-year and 2-year Treasury. Negative = inverted = recession warning.',
    'MORTGAGE30US': 'Average 30-year fixed mortgage rate. Impacts housing affordability.',
    'CPIAUCSL': 'Consumer Price Index. Primary measure of inflation for consumers.',
    'PCEPI': 'Personal Consumption Expenditures Price Index. The Fed\'s preferred inflation gauge.',
    'UNRATE': 'Percentage of labor force that is unemployed and actively seeking work.',
    'PAYEMS': 'Total nonfarm jobs added. Key measure of economic health.',
    'ICSA': 'Weekly new unemployment insurance claims. Leading indicator of labor market.',
    'GDP': 'Total economic output of the United States.',
    'GDPC1': 'Real GDP adjusted for inflation. Measures actual economic growth.',
    'RSXFS': 'Monthly retail sales excluding food services. Consumer spending indicator.',
    'UMCSENT': 'University of Michigan Consumer Sentiment Index. Consumer confidence measure.',
    'INDPRO': 'Output of manufacturing, mining, and utilities sectors.',
    'HOUST': 'Number of new residential construction projects started.',
    'DTWEXBGS': 'Trade-weighted US dollar against major currencies.',
    'VIXCLS': 'CBOE Volatility Index. Measures expected market volatility (fear gauge).',
    'M2SL': 'M2 money supply including cash, checking, and savings deposits.',
    'WALCL': 'Total assets held by the Federal Reserve. Measures QE/QT.',
  };
  return descriptions[id] || 'Economic indicator from Federal Reserve data.';
}
