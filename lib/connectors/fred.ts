// lib/connectors/fred.ts
// Market Oracle - Federal Reserve Economic Data Connector
// Created: December 22, 2025
// Provides mortgage rates, economic indicators, and macro data

/**
 * FRED (Federal Reserve Economic Data) Connector
 * 
 * Key Series Available:
 * - MORTGAGE30US: 30-year fixed mortgage rate
 * - MORTGAGE15US: 15-year fixed mortgage rate
 * - FEDFUNDS: Federal funds rate
 * - CPIAUCSL: Consumer Price Index (inflation)
 * - UNRATE: Unemployment rate
 * - GDP: Gross Domestic Product
 * - DGS10: 10-year Treasury rate
 * - VIXCLS: VIX volatility index
 */

const FRED_BASE_URL = 'https://api.stlouisfed.org/fred';

interface FredObservation {
  date: string;
  value: string;
}

interface FredSeriesInfo {
  id: string;
  title: string;
  observation_start: string;
  observation_end: string;
  frequency: string;
  units: string;
  notes: string;
}

interface EconomicIndicator {
  seriesId: string;
  name: string;
  currentValue: number | null;
  previousValue: number | null;
  change: number | null;
  changePercent: number | null;
  lastUpdated: string;
  units: string;
  frequency: string;
  history: Array<{ date: string; value: number }>;
}

interface MacroEconomicSnapshot {
  mortgageRates: {
    thirtyYear: number | null;
    fifteenYear: number | null;
  };
  fedFundsRate: number | null;
  inflation: {
    cpi: number | null;
    yoyChange: number | null;
  };
  unemployment: number | null;
  treasuryYields: {
    tenYear: number | null;
    twoYear: number | null;
  };
  vix: number | null;
  gdpGrowth: number | null;
  lastUpdated: string;
}

// Key economic series with descriptions
const ECONOMIC_SERIES = {
  MORTGAGE30US: { name: '30-Year Mortgage Rate', units: 'percent' },
  MORTGAGE15US: { name: '15-Year Mortgage Rate', units: 'percent' },
  FEDFUNDS: { name: 'Federal Funds Rate', units: 'percent' },
  CPIAUCSL: { name: 'Consumer Price Index', units: 'index' },
  UNRATE: { name: 'Unemployment Rate', units: 'percent' },
  GDP: { name: 'Gross Domestic Product', units: 'billions USD' },
  DGS10: { name: '10-Year Treasury Yield', units: 'percent' },
  DGS2: { name: '2-Year Treasury Yield', units: 'percent' },
  VIXCLS: { name: 'VIX Volatility Index', units: 'index' },
  SP500: { name: 'S&P 500 Index', units: 'index' },
  DCOILWTICO: { name: 'WTI Crude Oil Price', units: 'USD per barrel' },
  GOLDAMGBD228NLBM: { name: 'Gold Price', units: 'USD per ounce' },
} as const;

type SeriesId = keyof typeof ECONOMIC_SERIES;

/**
 * Fetch observations for a FRED series
 */
async function fetchFredSeries(
  seriesId: string,
  options: {
    startDate?: string;
    endDate?: string;
    limit?: number;
    sortOrder?: 'asc' | 'desc';
  } = {}
): Promise<FredObservation[]> {
  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) {
    console.warn('FRED_API_KEY not configured');
    return [];
  }

  const params = new URLSearchParams({
    series_id: seriesId,
    api_key: apiKey,
    file_type: 'json',
    sort_order: options.sortOrder || 'desc',
  });

  if (options.startDate) params.set('observation_start', options.startDate);
  if (options.endDate) params.set('observation_end', options.endDate);
  if (options.limit) params.set('limit', options.limit.toString());

  try {
    const response = await fetch(
      `${FRED_BASE_URL}/series/observations?${params}`,
      { next: { revalidate: 3600 } } // Cache for 1 hour
    );

    if (!response.ok) {
      console.error(`FRED API error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    return data.observations || [];
  } catch (error) {
    console.error('FRED fetch error:', error);
    return [];
  }
}

/**
 * Get the latest value for a series
 */
async function getLatestValue(seriesId: string): Promise<number | null> {
  const observations = await fetchFredSeries(seriesId, { limit: 1 });
  if (observations.length === 0) return null;
  
  const value = parseFloat(observations[0].value);
  return isNaN(value) ? null : value;
}

/**
 * Get an economic indicator with history
 */
export async function getEconomicIndicator(
  seriesId: SeriesId,
  historyDays: number = 365
): Promise<EconomicIndicator | null> {
  const seriesInfo = ECONOMIC_SERIES[seriesId];
  if (!seriesInfo) return null;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - historyDays);
  const startDateStr = startDate.toISOString().split('T')[0];

  const observations = await fetchFredSeries(seriesId, {
    startDate: startDateStr,
    sortOrder: 'desc',
  });

  if (observations.length === 0) return null;

  const validObs = observations
    .map(o => ({ date: o.date, value: parseFloat(o.value) }))
    .filter(o => !isNaN(o.value));

  if (validObs.length === 0) return null;

  const current = validObs[0].value;
  const previous = validObs.length > 1 ? validObs[1].value : null;
  const change = previous !== null ? current - previous : null;
  const changePercent = previous !== null && previous !== 0
    ? ((current - previous) / previous) * 100
    : null;

  return {
    seriesId,
    name: seriesInfo.name,
    currentValue: current,
    previousValue: previous,
    change,
    changePercent,
    lastUpdated: validObs[0].date,
    units: seriesInfo.units,
    frequency: 'varies',
    history: validObs.reverse(), // Oldest first for charts
  };
}

/**
 * Get mortgage rates (30-year and 15-year)
 */
export async function getMortgageRates(): Promise<{
  thirtyYear: EconomicIndicator | null;
  fifteenYear: EconomicIndicator | null;
}> {
  const [thirtyYear, fifteenYear] = await Promise.all([
    getEconomicIndicator('MORTGAGE30US', 365),
    getEconomicIndicator('MORTGAGE15US', 365),
  ]);

  return { thirtyYear, fifteenYear };
}

/**
 * Get complete macro economic snapshot
 */
export async function getMacroSnapshot(): Promise<MacroEconomicSnapshot> {
  const [
    mortgage30,
    mortgage15,
    fedFunds,
    cpi,
    unemployment,
    treasury10,
    treasury2,
    vix,
  ] = await Promise.all([
    getLatestValue('MORTGAGE30US'),
    getLatestValue('MORTGAGE15US'),
    getLatestValue('FEDFUNDS'),
    getLatestValue('CPIAUCSL'),
    getLatestValue('UNRATE'),
    getLatestValue('DGS10'),
    getLatestValue('DGS2'),
    getLatestValue('VIXCLS'),
  ]);

  return {
    mortgageRates: {
      thirtyYear: mortgage30,
      fifteenYear: mortgage15,
    },
    fedFundsRate: fedFunds,
    inflation: {
      cpi,
      yoyChange: null, // Would need YoY calculation
    },
    unemployment,
    treasuryYields: {
      tenYear: treasury10,
      twoYear: treasury2,
    },
    vix,
    gdpGrowth: null, // Quarterly, needs special handling
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Get yield curve data (2Y vs 10Y spread)
 */
export async function getYieldCurve(): Promise<{
  spread: number | null;
  isInverted: boolean;
  twoYear: number | null;
  tenYear: number | null;
  signal: 'NORMAL' | 'FLAT' | 'INVERTED';
}> {
  const [twoYear, tenYear] = await Promise.all([
    getLatestValue('DGS2'),
    getLatestValue('DGS10'),
  ]);

  const spread = twoYear !== null && tenYear !== null
    ? tenYear - twoYear
    : null;

  let signal: 'NORMAL' | 'FLAT' | 'INVERTED' = 'NORMAL';
  if (spread !== null) {
    if (spread < -0.1) signal = 'INVERTED';
    else if (spread < 0.25) signal = 'FLAT';
  }

  return {
    spread,
    isInverted: spread !== null && spread < 0,
    twoYear,
    tenYear,
    signal,
  };
}

/**
 * Get market fear indicator (VIX analysis)
 */
export async function getMarketFear(): Promise<{
  vix: number | null;
  level: 'LOW' | 'MODERATE' | 'ELEVATED' | 'HIGH' | 'EXTREME';
  description: string;
}> {
  const vix = await getLatestValue('VIXCLS');

  let level: 'LOW' | 'MODERATE' | 'ELEVATED' | 'HIGH' | 'EXTREME' = 'MODERATE';
  let description = 'Market conditions are normal.';

  if (vix !== null) {
    if (vix < 12) {
      level = 'LOW';
      description = 'Extreme complacency. Markets may be overbought.';
    } else if (vix < 20) {
      level = 'MODERATE';
      description = 'Normal market conditions. Typical volatility expected.';
    } else if (vix < 25) {
      level = 'ELEVATED';
      description = 'Increased uncertainty. Consider defensive positions.';
    } else if (vix < 35) {
      level = 'HIGH';
      description = 'Significant fear in markets. High volatility expected.';
    } else {
      level = 'EXTREME';
      description = 'Panic conditions. Extreme caution advised.';
    }
  }

  return { vix, level, description };
}

/**
 * Get all key economic indicators for dashboard
 */
export async function getAllEconomicIndicators(): Promise<{
  indicators: EconomicIndicator[];
  snapshot: MacroEconomicSnapshot;
  yieldCurve: Awaited<ReturnType<typeof getYieldCurve>>;
  marketFear: Awaited<ReturnType<typeof getMarketFear>>;
}> {
  const indicatorPromises = (Object.keys(ECONOMIC_SERIES) as SeriesId[])
    .slice(0, 6) // Top 6 most important
    .map(id => getEconomicIndicator(id, 90));

  const [indicators, snapshot, yieldCurve, marketFear] = await Promise.all([
    Promise.all(indicatorPromises),
    getMacroSnapshot(),
    getYieldCurve(),
    getMarketFear(),
  ]);

  return {
    indicators: indicators.filter((i): i is EconomicIndicator => i !== null),
    snapshot,
    yieldCurve,
    marketFear,
  };
}

export default {
  getEconomicIndicator,
  getMortgageRates,
  getMacroSnapshot,
  getYieldCurve,
  getMarketFear,
  getAllEconomicIndicators,
  ECONOMIC_SERIES,
};
