// Market Oracle - Sector Rotation Tracker API
// Tracks money flow between sectors using ETF performance
// Shows economic cycle positioning

import { NextResponse } from 'next/server';

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || 'd50o3i9r01qm94qn6ag0d50o3i9r01qm94qn6agg';
const TWELVE_DATA_KEY = process.env.TWELVE_DATA_API_KEY || '820e92da2fe34f3b8347b3faea0dade8';

interface SectorData {
  name: string;
  symbol: string;
  etf: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  avgVolume?: number;
  volumeRatio?: number;
  weekChange?: number;
  monthChange?: number;
  yearChange?: number;
  relativeStrength: number;
  flowSignal: 'inflow' | 'outflow' | 'neutral';
  cyclePhase: string;
  ranking: number;
}

// Sector ETFs and their economic cycle characteristics
const SECTORS = [
  { name: 'Technology', symbol: 'XLK', cycle: 'early-mid', beta: 1.2 },
  { name: 'Consumer Discretionary', symbol: 'XLY', cycle: 'early', beta: 1.1 },
  { name: 'Industrials', symbol: 'XLI', cycle: 'mid', beta: 1.0 },
  { name: 'Materials', symbol: 'XLB', cycle: 'mid-late', beta: 1.1 },
  { name: 'Energy', symbol: 'XLE', cycle: 'late', beta: 1.3 },
  { name: 'Financials', symbol: 'XLF', cycle: 'early', beta: 1.1 },
  { name: 'Real Estate', symbol: 'XLRE', cycle: 'early-mid', beta: 0.8 },
  { name: 'Healthcare', symbol: 'XLV', cycle: 'late-recession', beta: 0.7 },
  { name: 'Consumer Staples', symbol: 'XLP', cycle: 'recession', beta: 0.6 },
  { name: 'Utilities', symbol: 'XLU', cycle: 'recession', beta: 0.5 },
  { name: 'Communication Services', symbol: 'XLC', cycle: 'mid', beta: 1.0 },
];

// Market benchmarks
const BENCHMARKS = [
  { name: 'S&P 500', symbol: 'SPY' },
  { name: 'Nasdaq 100', symbol: 'QQQ' },
  { name: 'Russell 2000', symbol: 'IWM' },
  { name: 'Dow Jones', symbol: 'DIA' },
];

async function fetchQuote(symbol: string): Promise<any | null> {
  try {
    const response = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`
    );
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${symbol}:`, error);
    return null;
  }
}

async function fetchSectorData(): Promise<SectorData[]> {
  // Fetch SPY for relative strength calculation
  const spyQuote = await fetchQuote('SPY');
  const spyChange = spyQuote?.dp || 0;
  
  // Fetch all sector ETFs
  const quotes = await Promise.all(
    SECTORS.map(async (sector) => {
      const quote = await fetchQuote(sector.symbol);
      if (!quote) return null;
      
      const changePercent = quote.dp || 0;
      const relativeStrength = changePercent - spyChange;
      
      // Determine flow signal
      let flowSignal: 'inflow' | 'outflow' | 'neutral' = 'neutral';
      if (relativeStrength > 0.5) flowSignal = 'inflow';
      else if (relativeStrength < -0.5) flowSignal = 'outflow';
      
      return {
        name: sector.name,
        symbol: sector.symbol,
        etf: sector.symbol,
        price: quote.c || 0,
        change: quote.d || 0,
        changePercent,
        volume: 0, // Would need additional API call
        relativeStrength: Math.round(relativeStrength * 100) / 100,
        flowSignal,
        cyclePhase: sector.cycle,
        ranking: 0 // Will calculate after sorting
      };
    })
  );
  
  // Filter nulls and sort by performance
  const validQuotes = quotes.filter((q): q is SectorData => q !== null);
  validQuotes.sort((a, b) => b.changePercent - a.changePercent);
  
  // Assign rankings
  validQuotes.forEach((q, i) => { q.ranking = i + 1; });
  
  return validQuotes;
}

async function fetchBenchmarks(): Promise<any[]> {
  const quotes = await Promise.all(
    BENCHMARKS.map(async (bench) => {
      const quote = await fetchQuote(bench.symbol);
      if (!quote) return null;
      
      return {
        name: bench.name,
        symbol: bench.symbol,
        price: quote.c || 0,
        change: quote.d || 0,
        changePercent: quote.dp || 0
      };
    })
  );
  
  return quotes.filter(q => q !== null);
}

function determineMarketCycle(sectors: SectorData[]): any {
  // Count which cycle phases are leading
  const phaseScores: Record<string, number> = {
    'early': 0,
    'early-mid': 0,
    'mid': 0,
    'mid-late': 0,
    'late': 0,
    'late-recession': 0,
    'recession': 0
  };
  
  // Weight by ranking (top performers get more weight)
  sectors.forEach((s, i) => {
    const weight = sectors.length - i;
    if (s.cyclePhase && phaseScores[s.cyclePhase] !== undefined) {
      phaseScores[s.cyclePhase] += weight;
    }
  });
  
  // Find dominant phase
  const sorted = Object.entries(phaseScores).sort((a, b) => b[1] - a[1]);
  const dominantPhase = sorted[0][0];
  
  // Map to readable description
  const phaseDescriptions: Record<string, any> = {
    'early': {
      name: 'Early Expansion',
      description: 'Economy recovering. Financials, Consumer Discretionary, and Tech typically lead.',
      outlook: 'Bullish - risk-on assets favored'
    },
    'early-mid': {
      name: 'Early-Mid Expansion',
      description: 'Growth accelerating. Technology and Real Estate performing well.',
      outlook: 'Bullish - growth stocks favored'
    },
    'mid': {
      name: 'Mid Cycle',
      description: 'Steady growth. Industrials and Communication Services stable.',
      outlook: 'Neutral to Bullish - balanced approach'
    },
    'mid-late': {
      name: 'Late Expansion',
      description: 'Growth maturing. Materials and commodity-linked sectors strengthening.',
      outlook: 'Cautiously Bullish - inflation protection'
    },
    'late': {
      name: 'Late Cycle',
      description: 'Peak growth. Energy often outperforms as inflation rises.',
      outlook: 'Cautious - consider defensive positioning'
    },
    'late-recession': {
      name: 'Pre-Recession',
      description: 'Slowdown beginning. Healthcare becoming defensive haven.',
      outlook: 'Defensive - reduce risk exposure'
    },
    'recession': {
      name: 'Recession/Defensive',
      description: 'Economic contraction. Utilities and Consumer Staples lead.',
      outlook: 'Defensive - capital preservation focus'
    }
  };
  
  return {
    phase: dominantPhase,
    ...phaseDescriptions[dominantPhase],
    confidence: Math.round((sorted[0][1] / sectors.length) * 10)
  };
}

function generateRotationInsights(sectors: SectorData[]): string[] {
  const insights: string[] = [];
  
  // Top performers
  const top3 = sectors.slice(0, 3);
  insights.push(`Leading sectors: ${top3.map(s => s.name).join(', ')}`);
  
  // Laggards
  const bottom3 = sectors.slice(-3);
  insights.push(`Lagging sectors: ${bottom3.map(s => s.name).join(', ')}`);
  
  // Inflows
  const inflows = sectors.filter(s => s.flowSignal === 'inflow');
  if (inflows.length > 0) {
    insights.push(`Money flowing into: ${inflows.map(s => s.name).join(', ')}`);
  }
  
  // Outflows
  const outflows = sectors.filter(s => s.flowSignal === 'outflow');
  if (outflows.length > 0) {
    insights.push(`Money flowing out of: ${outflows.map(s => s.name).join(', ')}`);
  }
  
  // Defensive vs Cyclical
  const defensives = sectors.filter(s => 
    ['Healthcare', 'Consumer Staples', 'Utilities'].includes(s.name)
  );
  const cyclicals = sectors.filter(s => 
    ['Technology', 'Consumer Discretionary', 'Industrials', 'Financials'].includes(s.name)
  );
  
  const defAvg = defensives.reduce((sum, s) => sum + s.changePercent, 0) / defensives.length;
  const cycAvg = cyclicals.reduce((sum, s) => sum + s.changePercent, 0) / cyclicals.length;
  
  if (cycAvg > defAvg + 0.5) {
    insights.push('Risk-on mode: Cyclical sectors outperforming defensives');
  } else if (defAvg > cycAvg + 0.5) {
    insights.push('Risk-off mode: Defensive sectors outperforming cyclicals');
  }
  
  return insights;
}

export async function GET() {
  const startTime = Date.now();
  
  try {
    // Fetch all data in parallel
    const [sectors, benchmarks] = await Promise.all([
      fetchSectorData(),
      fetchBenchmarks()
    ]);
    
    if (sectors.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Could not fetch sector data'
      }, { status: 500 });
    }
    
    // Determine market cycle
    const cycle = determineMarketCycle(sectors);
    
    // Generate insights
    const insights = generateRotationInsights(sectors);
    
    // Calculate spread (best vs worst)
    const spread = sectors[0].changePercent - sectors[sectors.length - 1].changePercent;
    
    // Rotation velocity (how fast money is moving)
    const inflowCount = sectors.filter(s => s.flowSignal === 'inflow').length;
    const outflowCount = sectors.filter(s => s.flowSignal === 'outflow').length;
    const rotationVelocity = inflowCount + outflowCount;
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      processingTime: `${Date.now() - startTime}ms`,
      summary: {
        marketCycle: cycle,
        spread: Math.round(spread * 100) / 100,
        rotationVelocity,
        inflowSectors: inflowCount,
        outflowSectors: outflowCount,
        topPerformer: sectors[0],
        bottomPerformer: sectors[sectors.length - 1]
      },
      insights,
      sectors,
      benchmarks,
      heatmap: sectors.map(s => ({
        name: s.name,
        symbol: s.symbol,
        change: s.changePercent,
        color: s.changePercent > 1 ? '#00C853' 
             : s.changePercent > 0 ? '#69F0AE'
             : s.changePercent > -1 ? '#FF6D00'
             : '#DD2C00'
      })),
      cycleExplanation: {
        early: 'Financials, Consumer Discretionary lead',
        mid: 'Technology, Industrials lead',
        late: 'Energy, Materials lead',
        recession: 'Utilities, Healthcare, Staples lead'
      }
    });
    
  } catch (error) {
    console.error('Sector rotation error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch sector rotation data',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
