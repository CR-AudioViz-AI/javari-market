'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  PieChart,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

interface Position {
  id: string;
  user_id: string;
  ticker: string;
  ai_name: string;
  entry_price: number;
  quantity: number;
  entry_date: string;
  current_price?: number;
  last_updated?: string;
  notes?: string;
}

interface PositionWithMetrics extends Position {
  current_value: number;
  cost_basis: number;
  total_gain_loss: number;
  gain_loss_percentage: number;
  days_held: number;
}

export default function MyPositionsComplete() {
  const [positions, setPositions] = useState<PositionWithMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [portfolioStats, setPortfolioStats] = useState({
    totalValue: 0,
    totalCost: 0,
    totalGainLoss: 0,
    totalGainLossPercent: 0,
    bestPerformer: { ticker: '', gain: 0 },
    worstPerformer: { ticker: '', gain: 0 }
  });
  const supabase = createClientComponentClient();

  useEffect(() => {
    loadPositions();
  }, []);

  const loadPositions = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Load user's paper trading positions
      const { data: positionsData, error } = await supabase
        .from('paper_trading_positions')
        .select('*')
        .eq('user_id', user.id)
        .order('entry_date', { ascending: false });

      if (error) throw error;

      if (!positionsData || positionsData.length === 0) {
        setPositions([]);
        setLoading(false);
        return;
      }

      // Get current prices for all tickers
      const tickers = [...new Set(positionsData.map(p => p.ticker))];
      const { data: pricesData } = await supabase
        .from('ai_stock_picks')
        .select('ticker, current_price, last_updated')
        .in('ticker', tickers);

      // Create price lookup map
      const priceMap = new Map();
      pricesData?.forEach(p => {
        priceMap.set(p.ticker, {
          current_price: p.current_price,
          last_updated: p.last_updated
        });
      });

      // Calculate metrics for each position
      const positionsWithMetrics: PositionWithMetrics[] = positionsData.map(position => {
        const priceInfo = priceMap.get(position.ticker);
        const currentPrice = priceInfo?.current_price || position.entry_price;
        
        const costBasis = position.entry_price * position.quantity;
        const currentValue = currentPrice * position.quantity;
        const totalGainLoss = currentValue - costBasis;
        const gainLossPercentage = ((currentValue - costBasis) / costBasis) * 100;
        
        const entryDate = new Date(position.entry_date);
        const now = new Date();
        const daysHeld = Math.floor((now.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));

        return {
          ...position,
          current_price: currentPrice,
          last_updated: priceInfo?.last_updated,
          current_value: currentValue,
          cost_basis: costBasis,
          total_gain_loss: totalGainLoss,
          gain_loss_percentage: gainLossPercentage,
          days_held: daysHeld
        };
      });

      setPositions(positionsWithMetrics);

      // Calculate portfolio statistics
      const totalCost = positionsWithMetrics.reduce((sum, p) => sum + p.cost_basis, 0);
      const totalValue = positionsWithMetrics.reduce((sum, p) => sum + p.current_value, 0);
      const totalGainLoss = totalValue - totalCost;
      const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

      const sortedByGain = [...positionsWithMetrics].sort((a, b) => b.gain_loss_percentage - a.gain_loss_percentage);
      const bestPerformer = sortedByGain[0] || { ticker: 'N/A', gain_loss_percentage: 0 };
      const worstPerformer = sortedByGain[sortedByGain.length - 1] || { ticker: 'N/A', gain_loss_percentage: 0 };

      setPortfolioStats({
        totalValue,
        totalCost,
        totalGainLoss,
        totalGainLossPercent,
        bestPerformer: { ticker: bestPerformer.ticker, gain: bestPerformer.gain_loss_percentage },
        worstPerformer: { ticker: worstPerformer.ticker, gain: worstPerformer.gain_loss_percentage }
      });

      setLoading(false);
    } catch (error) {
      console.error('Error loading positions:', error);
      setLoading(false);
    }
  };

  const refreshPrices = async () => {
    setRefreshing(true);
    await loadPositions();
    setRefreshing(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Activity className="w-12 h-12 animate-pulse mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading your positions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Positions</h1>
            <p className="text-gray-600">
              Track your paper trading portfolio with real-time gains and losses
            </p>
          </div>
          <Button
            onClick={refreshPrices}
            disabled={refreshing}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Prices
          </Button>
        </div>
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Portfolio Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(portfolioStats.totalValue)}</div>
            <p className="text-xs text-gray-500 mt-1">Current market value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(portfolioStats.totalCost)}</div>
            <p className="text-xs text-gray-500 mt-1">Total invested</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Gain/Loss</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${portfolioStats.totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(portfolioStats.totalGainLoss)}
            </div>
            <p className={`text-sm mt-1 ${portfolioStats.totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatPercentage(portfolioStats.totalGainLossPercent)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Best Performer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {portfolioStats.bestPerformer.ticker}
            </div>
            <p className="text-sm text-green-600 mt-1">
              {formatPercentage(portfolioStats.bestPerformer.gain)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Positions Table */}
      {positions.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <PieChart className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">No Positions Yet</h3>
              <p className="text-gray-600 mb-4">
                Start paper trading to build your portfolio
              </p>
              <Button>Browse AI Picks</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Positions ({positions.length})</CardTitle>
            <CardDescription>
              Your paper trading positions with live performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Stock</th>
                    <th className="text-left py-3 px-4">AI Pick</th>
                    <th className="text-right py-3 px-4">Quantity</th>
                    <th className="text-right py-3 px-4">Entry Price</th>
                    <th className="text-right py-3 px-4">Current Price</th>
                    <th className="text-right py-3 px-4">Cost Basis</th>
                    <th className="text-right py-3 px-4">Current Value</th>
                    <th className="text-right py-3 px-4">Gain/Loss</th>
                    <th className="text-right py-3 px-4">%</th>
                    <th className="text-right py-3 px-4">Days Held</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((position) => (
                    <tr key={position.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-bold">{position.ticker}</p>
                          <p className="text-xs text-gray-600">
                            {new Date(position.entry_date).toLocaleDateString()}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline">{position.ai_name}</Badge>
                      </td>
                      <td className="text-right py-3 px-4">{position.quantity}</td>
                      <td className="text-right py-3 px-4">
                        {formatCurrency(position.entry_price)}
                      </td>
                      <td className="text-right py-3 px-4">
                        <div>
                          <p className="font-semibold">
                            {formatCurrency(position.current_price || position.entry_price)}
                          </p>
                          {position.last_updated && (
                            <p className="text-xs text-gray-500">
                              {new Date(position.last_updated).toLocaleTimeString()}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="text-right py-3 px-4">
                        {formatCurrency(position.cost_basis)}
                      </td>
                      <td className="text-right py-3 px-4 font-semibold">
                        {formatCurrency(position.current_value)}
                      </td>
                      <td className={`text-right py-3 px-4 font-bold ${
                        position.total_gain_loss >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        <div className="flex items-center justify-end gap-1">
                          {position.total_gain_loss >= 0 ? (
                            <TrendingUp className="w-4 h-4" />
                          ) : (
                            <TrendingDown className="w-4 h-4" />
                          )}
                          {formatCurrency(Math.abs(position.total_gain_loss))}
                        </div>
                      </td>
                      <td className={`text-right py-3 px-4 font-bold ${
                        position.gain_loss_percentage >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatPercentage(position.gain_loss_percentage)}
                      </td>
                      <td className="text-right py-3 px-4 text-gray-600">
                        {position.days_held}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Breakdown */}
      {positions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Winners</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {positions
                  .filter(p => p.gain_loss_percentage > 0)
                  .sort((a, b) => b.gain_loss_percentage - a.gain_loss_percentage)
                  .slice(0, 5)
                  .map((position) => (
                    <div key={position.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div>
                        <p className="font-bold">{position.ticker}</p>
                        <p className="text-sm text-gray-600">{position.ai_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">
                          {formatCurrency(position.total_gain_loss)}
                        </p>
                        <p className="text-sm text-green-600">
                          {formatPercentage(position.gain_loss_percentage)}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Losers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {positions
                  .filter(p => p.gain_loss_percentage < 0)
                  .sort((a, b) => a.gain_loss_percentage - b.gain_loss_percentage)
                  .slice(0, 5)
                  .map((position) => (
                    <div key={position.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div>
                        <p className="font-bold">{position.ticker}</p>
                        <p className="text-sm text-gray-600">{position.ai_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-red-600">
                          {formatCurrency(position.total_gain_loss)}
                        </p>
                        <p className="text-sm text-red-600">
                          {formatPercentage(position.gain_loss_percentage)}
                        </p>
                      </div>
                    </div>
                  ))}
                {positions.filter(p => p.gain_loss_percentage < 0).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <AlertCircle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>No losing positions yet!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
