// Market Oracle - Insider Trading Alerts API
// Tracks executive and institutional insider transactions
// Sources: Finnhub, Financial Modeling Prep

import { NextResponse } from 'next/server';

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || 'd50o3i9r01qm94qn6ag0d50o3i9r01qm94qn6agg';
const FMP_API_KEY = process.env.FMP_API_KEY || 'tkfzWoW3wJIAHRRlMRXgqzrFcEspDVts';

interface InsiderTransaction {
  id: string;
  symbol: string;
  companyName?: string;
  filingDate: string;
  transactionDate: string;
  insiderName: string;
  insiderTitle: string;
  transactionType: 'buy' | 'sell' | 'exercise' | 'gift';
  shares: number;
  pricePerShare: number;
  totalValue: number;
  sharesOwned: number;
  ownershipChange: number;
  source: string;
  significance: 'high' | 'medium' | 'low';
  signal: 'bullish' | 'bearish' | 'neutral';
}

interface ClusterAlert {
  symbol: string;
  companyName: string;
  transactionCount: number;
  totalBought: number;
  totalSold: number;
  netActivity: number;
  insiders: string[];
  dateRange: { start: string; end: string };
  signal: 'bullish' | 'bearish' | 'neutral';
  significance: 'high' | 'medium' | 'low';
}

async function fetchFinnhubInsiderTransactions(symbol: string): Promise<InsiderTransaction[]> {
  try {
    const url = `https://finnhub.io/api/v1/stock/insider-transactions?symbol=${symbol}&token=${FINNHUB_API_KEY}`;
    const response = await fetch(url, { next: { revalidate: 3600 } });
    
    if (!response.ok) return [];
    
    const data = await response.json();
    
    return (data.data || []).map((tx: any, idx: number) => {
      const isBuy = tx.transactionCode === 'P' || tx.change > 0;
      const isSell = tx.transactionCode === 'S' || tx.change < 0;
      
      let transactionType: 'buy' | 'sell' | 'exercise' | 'gift' = 'buy';
      if (tx.transactionCode === 'S') transactionType = 'sell';
      else if (tx.transactionCode === 'M' || tx.transactionCode === 'A') transactionType = 'exercise';
      else if (tx.transactionCode === 'G') transactionType = 'gift';
      
      const shares = Math.abs(tx.change || 0);
      const price = tx.transactionPrice || 0;
      const totalValue = shares * price;
      
      // Determine significance
      let significance: 'high' | 'medium' | 'low' = 'low';
      if (totalValue > 1000000) significance = 'high';
      else if (totalValue > 100000) significance = 'medium';
      
      // Determine signal
      let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
      if (transactionType === 'buy' && totalValue > 50000) signal = 'bullish';
      else if (transactionType === 'sell' && totalValue > 100000) signal = 'bearish';
      
      return {
        id: `finnhub-${symbol}-${idx}-${tx.filingDate}`,
        symbol: tx.symbol || symbol,
        filingDate: tx.filingDate,
        transactionDate: tx.transactionDate,
        insiderName: tx.name || 'Unknown',
        insiderTitle: getInsiderTitle(tx.name),
        transactionType,
        shares,
        pricePerShare: price,
        totalValue,
        sharesOwned: tx.share || 0,
        ownershipChange: tx.change || 0,
        source: 'Finnhub',
        significance,
        signal
      };
    });
  } catch (error) {
    console.error('Finnhub insider error:', error);
    return [];
  }
}

async function fetchFMPInsiderTransactions(symbol: string): Promise<InsiderTransaction[]> {
  try {
    const url = `https://financialmodelingprep.com/stable/insider-trading?symbol=${symbol}&limit=50&apikey=${FMP_API_KEY}`;
    const response = await fetch(url, { next: { revalidate: 3600 } });
    
    if (!response.ok) return [];
    
    const data = await response.json();
    
    return (data || []).map((tx: any, idx: number) => {
      let transactionType: 'buy' | 'sell' | 'exercise' | 'gift' = 'buy';
      const txType = (tx.transactionType || '').toLowerCase();
      if (txType.includes('sale') || txType.includes('sell')) transactionType = 'sell';
      else if (txType.includes('exercise') || txType.includes('option')) transactionType = 'exercise';
      else if (txType.includes('gift')) transactionType = 'gift';
      
      const shares = Math.abs(tx.securitiesTransacted || 0);
      const price = tx.price || 0;
      const totalValue = shares * price;
      
      let significance: 'high' | 'medium' | 'low' = 'low';
      if (totalValue > 1000000) significance = 'high';
      else if (totalValue > 100000) significance = 'medium';
      
      let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
      if (transactionType === 'buy' && totalValue > 50000) signal = 'bullish';
      else if (transactionType === 'sell' && totalValue > 100000) signal = 'bearish';
      
      return {
        id: `fmp-${symbol}-${idx}-${tx.filingDate}`,
        symbol: tx.symbol || symbol,
        companyName: tx.companyName,
        filingDate: tx.filingDate,
        transactionDate: tx.transactionDate,
        insiderName: tx.reportingName || 'Unknown',
        insiderTitle: tx.typeOfOwner || 'Insider',
        transactionType,
        shares,
        pricePerShare: price,
        totalValue,
        sharesOwned: tx.securitiesOwned || 0,
        ownershipChange: shares * (transactionType === 'sell' ? -1 : 1),
        source: 'FMP',
        significance,
        signal
      };
    });
  } catch (error) {
    console.error('FMP insider error:', error);
    return [];
  }
}

async function fetchLatestInsiderActivity(): Promise<InsiderTransaction[]> {
  try {
    const url = `https://financialmodelingprep.com/stable/insider-trading?limit=100&apikey=${FMP_API_KEY}`;
    const response = await fetch(url, { next: { revalidate: 1800 } }); // 30 min cache
    
    if (!response.ok) return [];
    
    const data = await response.json();
    
    return (data || []).slice(0, 100).map((tx: any, idx: number) => {
      let transactionType: 'buy' | 'sell' | 'exercise' | 'gift' = 'buy';
      const txType = (tx.transactionType || '').toLowerCase();
      if (txType.includes('sale') || txType.includes('sell')) transactionType = 'sell';
      else if (txType.includes('exercise') || txType.includes('option')) transactionType = 'exercise';
      else if (txType.includes('gift')) transactionType = 'gift';
      
      const shares = Math.abs(tx.securitiesTransacted || 0);
      const price = tx.price || 0;
      const totalValue = shares * price;
      
      let significance: 'high' | 'medium' | 'low' = 'low';
      if (totalValue > 1000000) significance = 'high';
      else if (totalValue > 100000) significance = 'medium';
      
      let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
      if (transactionType === 'buy' && totalValue > 50000) signal = 'bullish';
      else if (transactionType === 'sell' && totalValue > 100000) signal = 'bearish';
      
      return {
        id: `fmp-latest-${idx}-${tx.filingDate}`,
        symbol: tx.symbol,
        companyName: tx.companyName,
        filingDate: tx.filingDate,
        transactionDate: tx.transactionDate,
        insiderName: tx.reportingName || 'Unknown',
        insiderTitle: tx.typeOfOwner || 'Insider',
        transactionType,
        shares,
        pricePerShare: price,
        totalValue,
        sharesOwned: tx.securitiesOwned || 0,
        ownershipChange: shares * (transactionType === 'sell' ? -1 : 1),
        source: 'FMP',
        significance,
        signal
      };
    });
  } catch (error) {
    console.error('FMP latest insider error:', error);
    return [];
  }
}

function getInsiderTitle(name: string): string {
  const nameLower = (name || '').toLowerCase();
  if (nameLower.includes('ceo') || nameLower.includes('chief executive')) return 'CEO';
  if (nameLower.includes('cfo') || nameLower.includes('chief financial')) return 'CFO';
  if (nameLower.includes('coo') || nameLower.includes('chief operating')) return 'COO';
  if (nameLower.includes('cto') || nameLower.includes('chief technology')) return 'CTO';
  if (nameLower.includes('president')) return 'President';
  if (nameLower.includes('director')) return 'Director';
  if (nameLower.includes('vp') || nameLower.includes('vice president')) return 'VP';
  return 'Insider';
}

function detectClusters(transactions: InsiderTransaction[]): ClusterAlert[] {
  // Group by symbol
  const bySymbol: Record<string, InsiderTransaction[]> = {};
  for (const tx of transactions) {
    if (!bySymbol[tx.symbol]) bySymbol[tx.symbol] = [];
    bySymbol[tx.symbol].push(tx);
  }
  
  const clusters: ClusterAlert[] = [];
  
  for (const [symbol, txs] of Object.entries(bySymbol)) {
    // Look for multiple transactions within 7 days
    const recent = txs.filter(tx => {
      const txDate = new Date(tx.transactionDate || tx.filingDate);
      const daysAgo = (Date.now() - txDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysAgo <= 30;
    });
    
    if (recent.length >= 3) {
      const buys = recent.filter(tx => tx.transactionType === 'buy');
      const sells = recent.filter(tx => tx.transactionType === 'sell');
      
      const totalBought = buys.reduce((sum, tx) => sum + tx.totalValue, 0);
      const totalSold = sells.reduce((sum, tx) => sum + tx.totalValue, 0);
      const netActivity = totalBought - totalSold;
      
      const dates = recent.map(tx => new Date(tx.transactionDate || tx.filingDate).getTime());
      
      let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
      if (netActivity > 500000) signal = 'bullish';
      else if (netActivity < -500000) signal = 'bearish';
      
      let significance: 'high' | 'medium' | 'low' = 'low';
      if (Math.abs(netActivity) > 5000000) significance = 'high';
      else if (Math.abs(netActivity) > 1000000) significance = 'medium';
      
      clusters.push({
        symbol,
        companyName: recent[0].companyName || symbol,
        transactionCount: recent.length,
        totalBought,
        totalSold,
        netActivity,
        insiders: [...new Set(recent.map(tx => tx.insiderName))],
        dateRange: {
          start: new Date(Math.min(...dates)).toISOString().split('T')[0],
          end: new Date(Math.max(...dates)).toISOString().split('T')[0]
        },
        signal,
        significance
      });
    }
  }
  
  // Sort by significance and net activity
  clusters.sort((a, b) => {
    const sigOrder = { high: 0, medium: 1, low: 2 };
    if (sigOrder[a.significance] !== sigOrder[b.significance]) {
      return sigOrder[a.significance] - sigOrder[b.significance];
    }
    return Math.abs(b.netActivity) - Math.abs(a.netActivity);
  });
  
  return clusters;
}

export async function GET(request: Request) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const type = searchParams.get('type') || 'all'; // all, buy, sell
    const significance = searchParams.get('significance'); // high, medium, low
    const limit = parseInt(searchParams.get('limit') || '50');
    
    let transactions: InsiderTransaction[] = [];
    
    if (symbol) {
      // Fetch for specific symbol from both sources
      const [finnhub, fmp] = await Promise.all([
        fetchFinnhubInsiderTransactions(symbol.toUpperCase()),
        fetchFMPInsiderTransactions(symbol.toUpperCase())
      ]);
      transactions = [...finnhub, ...fmp];
    } else {
      // Fetch latest across all stocks
      transactions = await fetchLatestInsiderActivity();
    }
    
    // Filter by type
    if (type !== 'all') {
      transactions = transactions.filter(tx => tx.transactionType === type);
    }
    
    // Filter by significance
    if (significance) {
      transactions = transactions.filter(tx => tx.significance === significance);
    }
    
    // Sort by date (newest first)
    transactions.sort((a, b) => 
      new Date(b.filingDate).getTime() - new Date(a.filingDate).getTime()
    );
    
    // Limit results
    transactions = transactions.slice(0, limit);
    
    // Detect clusters
    const clusters = detectClusters(transactions);
    
    // Calculate statistics
    const stats = {
      totalTransactions: transactions.length,
      buys: transactions.filter(tx => tx.transactionType === 'buy').length,
      sells: transactions.filter(tx => tx.transactionType === 'sell').length,
      exercises: transactions.filter(tx => tx.transactionType === 'exercise').length,
      totalBuyValue: transactions
        .filter(tx => tx.transactionType === 'buy')
        .reduce((sum, tx) => sum + tx.totalValue, 0),
      totalSellValue: transactions
        .filter(tx => tx.transactionType === 'sell')
        .reduce((sum, tx) => sum + tx.totalValue, 0),
      highSignificance: transactions.filter(tx => tx.significance === 'high').length,
      bullishSignals: transactions.filter(tx => tx.signal === 'bullish').length,
      bearishSignals: transactions.filter(tx => tx.signal === 'bearish').length
    };
    
    // Notable transactions (high value or significance)
    const notable = transactions
      .filter(tx => tx.significance === 'high' || tx.totalValue > 500000)
      .slice(0, 10);
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      processingTime: `${Date.now() - startTime}ms`,
      symbol: symbol || 'all',
      stats,
      clusters: clusters.slice(0, 10),
      notable,
      transactions,
      insight: generateInsight(stats, clusters),
      dataSources: ['Finnhub', 'Financial Modeling Prep']
    });
    
  } catch (error) {
    console.error('Insider trading API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch insider trading data',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function generateInsight(stats: any, clusters: ClusterAlert[]): string {
  let insight = '';
  
  const buyRatio = stats.buys / (stats.buys + stats.sells);
  if (buyRatio > 0.6) {
    insight = 'Insiders are buying more than selling, which historically correlates with positive stock performance. ';
  } else if (buyRatio < 0.4) {
    insight = 'Insider selling outpaces buying. While not always negative, this warrants attention. ';
  } else {
    insight = 'Insider activity is balanced between buying and selling. ';
  }
  
  if (clusters.length > 0) {
    const bullishClusters = clusters.filter(c => c.signal === 'bullish');
    if (bullishClusters.length > 0) {
      insight += `Notable cluster buying detected in ${bullishClusters.map(c => c.symbol).join(', ')}. `;
    }
  }
  
  if (stats.highSignificance > 0) {
    insight += `${stats.highSignificance} high-value transactions detected (>$1M each).`;
  }
  
  return insight;
}
