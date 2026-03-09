/**
 * MARKET ORACLE - PORTFOLIO TRACKING API
 * Track holdings, P&L, and performance analytics
 * 
 * CR AudioViz AI - Fortune 50 Quality Standards
 * @version 2.0.0
 * @date December 27, 2025
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================================================
// TYPES
// ============================================================================

interface Holding {
  id?: string;
  user_id: string;
  portfolio_id: string;
  symbol: string;
  name?: string;
  shares: number;
  average_cost: number;
  current_price?: number;
  market_value?: number;
  gain_loss?: number;
  gain_loss_percent?: number;
  day_change?: number;
  day_change_percent?: number;
  created_at?: string;
  updated_at?: string;
}

interface Transaction {
  id?: string;
  user_id: string;
  portfolio_id: string;
  symbol: string;
  type: 'buy' | 'sell' | 'dividend' | 'split';
  shares: number;
  price: number;
  total: number;
  fees?: number;
  notes?: string;
  date: string;
  created_at?: string;
}

interface Portfolio {
  id?: string;
  user_id: string;
  name: string;
  description?: string;
  is_default: boolean;
  initial_value: number;
  current_value?: number;
  total_gain_loss?: number;
  total_gain_loss_percent?: number;
  holdings_count?: number;
  created_at?: string;
  updated_at?: string;
}

// ============================================================================
// GET - Fetch portfolio data
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'portfolios';
    const portfolioId = searchParams.get('portfolio_id');

    switch (action) {
      case 'portfolios':
        return await getPortfolios(user.id);
      case 'holdings':
        return await getHoldings(user.id, portfolioId);
      case 'transactions':
        return await getTransactions(user.id, portfolioId);
      case 'performance':
        return await getPerformance(user.id, portfolioId);
      case 'allocation':
        return await getAllocation(user.id, portfolioId);
      case 'summary':
        return await getPortfolioSummary(user.id);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Portfolio error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ============================================================================
// GET PORTFOLIOS
// ============================================================================

async function getPortfolios(userId: string): Promise<NextResponse> {
  const { data: portfolios, error } = await supabase
    .from('portfolios')
    .select('*')
    .eq('user_id', userId)
    .order('is_default', { ascending: false })
    .order('name', { ascending: true });

  if (error) throw error;

  // Calculate current values for each portfolio
  const enrichedPortfolios = await Promise.all(
    (portfolios || []).map(async (portfolio) => {
      const { data: holdings } = await supabase
        .from('holdings')
        .select('symbol, shares, average_cost')
        .eq('portfolio_id', portfolio.id);

      let totalValue = 0;
      let totalCost = 0;

      for (const holding of holdings || []) {
        const cost = holding.shares * holding.average_cost;
        totalCost += cost;
        
        // Get current price from cache
        const { data: quote } = await supabase
          .from('stock_quotes_cache')
          .select('data')
          .eq('symbol', holding.symbol)
          .single();

        if (quote?.data?.price) {
          totalValue += holding.shares * quote.data.price;
        } else {
          totalValue += cost; // Use cost if no current price
        }
      }

      return {
        ...portfolio,
        current_value: totalValue,
        total_cost: totalCost,
        total_gain_loss: totalValue - totalCost,
        total_gain_loss_percent: totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0,
        holdings_count: holdings?.length || 0,
      };
    })
  );

  return NextResponse.json({ portfolios: enrichedPortfolios });
}

// ============================================================================
// GET HOLDINGS
// ============================================================================

async function getHoldings(userId: string, portfolioId: string | null): Promise<NextResponse> {
  let query = supabase
    .from('holdings')
    .select(`
      *,
      portfolio:portfolios(id, name)
    `)
    .eq('user_id', userId);

  if (portfolioId) {
    query = query.eq('portfolio_id', portfolioId);
  }

  const { data: holdings, error } = await query.order('symbol');

  if (error) throw error;

  // Enrich with current prices
  const enrichedHoldings = await Promise.all(
    (holdings || []).map(async (holding) => {
      const { data: quote } = await supabase
        .from('stock_quotes_cache')
        .select('data')
        .eq('symbol', holding.symbol)
        .single();

      const currentPrice = quote?.data?.price || holding.average_cost;
      const marketValue = holding.shares * currentPrice;
      const totalCost = holding.shares * holding.average_cost;
      const gainLoss = marketValue - totalCost;
      const gainLossPercent = (gainLoss / totalCost) * 100;
      const dayChange = quote?.data?.change || 0;
      const dayChangePercent = quote?.data?.changePercent || 0;

      return {
        ...holding,
        current_price: currentPrice,
        market_value: marketValue,
        total_cost: totalCost,
        gain_loss: gainLoss,
        gain_loss_percent: gainLossPercent,
        day_change: dayChange * holding.shares,
        day_change_percent: dayChangePercent,
        name: quote?.data?.name || holding.symbol,
      };
    })
  );

  // Calculate totals
  const totalMarketValue = enrichedHoldings.reduce((sum, h) => sum + h.market_value, 0);
  const totalCost = enrichedHoldings.reduce((sum, h) => sum + h.total_cost, 0);
  const totalGainLoss = totalMarketValue - totalCost;
  const totalDayChange = enrichedHoldings.reduce((sum, h) => sum + h.day_change, 0);

  return NextResponse.json({
    holdings: enrichedHoldings,
    summary: {
      total_market_value: totalMarketValue,
      total_cost: totalCost,
      total_gain_loss: totalGainLoss,
      total_gain_loss_percent: totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0,
      total_day_change: totalDayChange,
      holdings_count: enrichedHoldings.length,
    },
  });
}

// ============================================================================
// GET TRANSACTIONS
// ============================================================================

async function getTransactions(userId: string, portfolioId: string | null): Promise<NextResponse> {
  let query = supabase
    .from('transactions')
    .select(`
      *,
      portfolio:portfolios(id, name)
    `)
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (portfolioId) {
    query = query.eq('portfolio_id', portfolioId);
  }

  const { data, error } = await query.limit(100);

  if (error) throw error;

  return NextResponse.json({ transactions: data || [] });
}

// ============================================================================
// GET PERFORMANCE
// ============================================================================

async function getPerformance(userId: string, portfolioId: string | null): Promise<NextResponse> {
  // Get historical snapshots
  let query = supabase
    .from('portfolio_snapshots')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: true });

  if (portfolioId) {
    query = query.eq('portfolio_id', portfolioId);
  }

  const { data: snapshots, error } = await query;

  if (error) throw error;

  // Calculate performance metrics
  const performance = {
    daily: [] as { date: string; value: number; change: number }[],
    weekly_return: 0,
    monthly_return: 0,
    ytd_return: 0,
    all_time_return: 0,
    best_day: { date: '', return: 0 },
    worst_day: { date: '', return: 0 },
    volatility: 0,
    sharpe_ratio: 0,
  };

  if (snapshots && snapshots.length > 0) {
    let prevValue = snapshots[0].value;
    const returns: number[] = [];

    for (const snapshot of snapshots) {
      const change = ((snapshot.value - prevValue) / prevValue) * 100;
      performance.daily.push({
        date: snapshot.date,
        value: snapshot.value,
        change,
      });
      returns.push(change);

      if (change > performance.best_day.return) {
        performance.best_day = { date: snapshot.date, return: change };
      }
      if (change < performance.worst_day.return) {
        performance.worst_day = { date: snapshot.date, return: change };
      }

      prevValue = snapshot.value;
    }

    // Calculate volatility (standard deviation of returns)
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const squaredDiffs = returns.map(r => Math.pow(r - avgReturn, 2));
    performance.volatility = Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / returns.length);

    // Calculate Sharpe Ratio (assuming 2% risk-free rate annually, ~0.008% daily)
    const riskFreeRate = 0.008;
    performance.sharpe_ratio = (avgReturn - riskFreeRate) / performance.volatility;

    // Period returns
    const firstValue = snapshots[0].value;
    const lastValue = snapshots[snapshots.length - 1].value;
    performance.all_time_return = ((lastValue - firstValue) / firstValue) * 100;

    // Find week ago, month ago, year start
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const weekSnapshot = snapshots.find(s => new Date(s.date) >= weekAgo);
    const monthSnapshot = snapshots.find(s => new Date(s.date) >= monthAgo);
    const ytdSnapshot = snapshots.find(s => new Date(s.date) >= yearStart);

    if (weekSnapshot) {
      performance.weekly_return = ((lastValue - weekSnapshot.value) / weekSnapshot.value) * 100;
    }
    if (monthSnapshot) {
      performance.monthly_return = ((lastValue - monthSnapshot.value) / monthSnapshot.value) * 100;
    }
    if (ytdSnapshot) {
      performance.ytd_return = ((lastValue - ytdSnapshot.value) / ytdSnapshot.value) * 100;
    }
  }

  return NextResponse.json({ performance });
}

// ============================================================================
// GET ALLOCATION
// ============================================================================

async function getAllocation(userId: string, portfolioId: string | null): Promise<NextResponse> {
  const holdingsResponse = await getHoldings(userId, portfolioId);
  const holdingsData = await holdingsResponse.json();
  
  const holdings = holdingsData.holdings || [];
  const totalValue = holdingsData.summary?.total_market_value || 0;

  // By stock
  const byStock = holdings.map((h: any) => ({
    symbol: h.symbol,
    name: h.name,
    value: h.market_value,
    percent: totalValue > 0 ? (h.market_value / totalValue) * 100 : 0,
    gain_loss_percent: h.gain_loss_percent,
  })).sort((a: any, b: any) => b.value - a.value);

  // By sector (would need sector data from API)
  const bySector: Record<string, { value: number; percent: number }> = {};

  // Concentration risk
  const top5Value = byStock.slice(0, 5).reduce((sum: number, h: any) => sum + h.value, 0);
  const concentrationRisk = totalValue > 0 ? (top5Value / totalValue) * 100 : 0;

  return NextResponse.json({
    allocation: {
      by_stock: byStock,
      by_sector: bySector,
      concentration_risk: concentrationRisk,
      diversification_score: Math.max(0, 100 - concentrationRisk),
    },
  });
}

// ============================================================================
// GET PORTFOLIO SUMMARY
// ============================================================================

async function getPortfolioSummary(userId: string): Promise<NextResponse> {
  const portfoliosResponse = await getPortfolios(userId);
  const portfoliosData = await portfoliosResponse.json();
  const portfolios = portfoliosData.portfolios || [];

  const totalValue = portfolios.reduce((sum: number, p: any) => sum + (p.current_value || 0), 0);
  const totalGainLoss = portfolios.reduce((sum: number, p: any) => sum + (p.total_gain_loss || 0), 0);
  const totalCost = portfolios.reduce((sum: number, p: any) => sum + (p.total_cost || 0), 0);

  return NextResponse.json({
    summary: {
      total_portfolios: portfolios.length,
      total_value: totalValue,
      total_cost: totalCost,
      total_gain_loss: totalGainLoss,
      total_gain_loss_percent: totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0,
      total_holdings: portfolios.reduce((sum: number, p: any) => sum + (p.holdings_count || 0), 0),
    },
    portfolios,
  });
}

// ============================================================================
// POST - Create portfolio, add holdings, record transactions
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'create_portfolio':
        return await createPortfolio(user.id, body);
      case 'add_transaction':
        return await addTransaction(user.id, body);
      case 'quick_add':
        return await quickAddHolding(user.id, body);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Portfolio POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ============================================================================
// CREATE PORTFOLIO
// ============================================================================

async function createPortfolio(userId: string, body: any): Promise<NextResponse> {
  const { name, description, initial_value, is_default } = body;

  if (!name) {
    return NextResponse.json({ error: 'Name required' }, { status: 400 });
  }

  // If setting as default, unset others
  if (is_default) {
    await supabase
      .from('portfolios')
      .update({ is_default: false })
      .eq('user_id', userId);
  }

  const { data, error } = await supabase
    .from('portfolios')
    .insert({
      user_id: userId,
      name,
      description,
      initial_value: initial_value || 0,
      is_default: is_default || false,
    })
    .select()
    .single();

  if (error) throw error;

  return NextResponse.json({
    success: true,
    portfolio: data,
    message: 'Portfolio created',
  });
}

// ============================================================================
// ADD TRANSACTION
// ============================================================================

async function addTransaction(userId: string, body: any): Promise<NextResponse> {
  const {
    portfolio_id,
    symbol,
    type,
    shares,
    price,
    fees,
    notes,
    date,
  } = body;

  if (!portfolio_id || !symbol || !type || !shares || !price) {
    return NextResponse.json({
      error: 'portfolio_id, symbol, type, shares, and price required'
    }, { status: 400 });
  }

  const total = shares * price + (fees || 0);

  // Record transaction
  const { data: transaction, error: txError } = await supabase
    .from('transactions')
    .insert({
      user_id: userId,
      portfolio_id,
      symbol: symbol.toUpperCase(),
      type,
      shares,
      price,
      total,
      fees,
      notes,
      date: date || new Date().toISOString().split('T')[0],
    })
    .select()
    .single();

  if (txError) throw txError;

  // Update holdings
  await updateHoldings(userId, portfolio_id, symbol.toUpperCase(), type, shares, price);

  return NextResponse.json({
    success: true,
    transaction,
    message: `${type.toUpperCase()} recorded: ${shares} shares of ${symbol} at $${price}`,
  });
}

// ============================================================================
// UPDATE HOLDINGS
// ============================================================================

async function updateHoldings(
  userId: string,
  portfolioId: string,
  symbol: string,
  type: string,
  shares: number,
  price: number
): Promise<void> {
  // Get current holding
  const { data: existing } = await supabase
    .from('holdings')
    .select('*')
    .eq('user_id', userId)
    .eq('portfolio_id', portfolioId)
    .eq('symbol', symbol)
    .single();

  if (type === 'buy') {
    if (existing) {
      // Update average cost
      const totalShares = existing.shares + shares;
      const totalCost = (existing.shares * existing.average_cost) + (shares * price);
      const newAvgCost = totalCost / totalShares;

      await supabase
        .from('holdings')
        .update({
          shares: totalShares,
          average_cost: newAvgCost,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
    } else {
      // Create new holding
      await supabase
        .from('holdings')
        .insert({
          user_id: userId,
          portfolio_id: portfolioId,
          symbol,
          shares,
          average_cost: price,
        });
    }
  } else if (type === 'sell') {
    if (existing) {
      const remainingShares = existing.shares - shares;
      
      if (remainingShares <= 0) {
        // Delete holding
        await supabase
          .from('holdings')
          .delete()
          .eq('id', existing.id);
      } else {
        // Update shares (keep average cost)
        await supabase
          .from('holdings')
          .update({
            shares: remainingShares,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
      }
    }
  }
}

// ============================================================================
// QUICK ADD HOLDING
// ============================================================================

async function quickAddHolding(userId: string, body: any): Promise<NextResponse> {
  const { portfolio_id, symbol, shares, average_cost } = body;

  if (!portfolio_id || !symbol || !shares || !average_cost) {
    return NextResponse.json({
      error: 'portfolio_id, symbol, shares, and average_cost required'
    }, { status: 400 });
  }

  // Check if holding exists
  const { data: existing } = await supabase
    .from('holdings')
    .select('id')
    .eq('user_id', userId)
    .eq('portfolio_id', portfolio_id)
    .eq('symbol', symbol.toUpperCase())
    .single();

  if (existing) {
    return NextResponse.json({
      error: 'Holding already exists. Use transactions to update.'
    }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('holdings')
    .insert({
      user_id: userId,
      portfolio_id,
      symbol: symbol.toUpperCase(),
      shares,
      average_cost,
    })
    .select()
    .single();

  if (error) throw error;

  return NextResponse.json({
    success: true,
    holding: data,
    message: `Added ${shares} shares of ${symbol}`,
  });
}
