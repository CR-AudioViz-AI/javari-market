'use client';

import { useEffect, useState, useMemo } from 'react';
import { 
  BarChart3, Play, TrendingUp, TrendingDown, RefreshCw,
  Calendar, DollarSign, Percent, Target, Award,
  ArrowUpRight, ArrowDownRight, HelpCircle, Clock,
  Sliders, LineChart, PieChart, Filter
} from 'lucide-react';
import { getPicks, getAIModels, type StockPick, type AIModel } from '@/lib/supabase';
import { JavariHelpButton } from '@/components/JavariWidget';

// Backtest configuration
interface BacktestConfig {
  startingCapital: number;
  aiModel: string | null;
  category: string | null;
  minConfidence: number;
  positionSize: 'equal' | 'confidence';
  maxPositions: number;
}

// Backtest result
interface BacktestResult {
  totalReturn: number;
  totalReturnPercent: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  maxDrawdown: number;
  sharpeRatio: number;
  trades: number;
  winners: number;
  losers: number;
  bestTrade: { ticker: string; return: number } | null;
  worstTrade: { ticker: string; return: number } | null;
  byAI: Record<string, { trades: number; return: number; winRate: number }>;
}

const DEFAULT_CONFIG: BacktestConfig = {
  startingCapital: 10000,
  aiModel: null,
  category: null,
  minConfidence: 60,
  positionSize: 'equal',
  maxPositions: 10,
};

export default function BacktestPage() {
  const [picks, setPicks] = useState<StockPick[]>([]);
  const [aiModels, setAIModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [config, setConfig] = useState<BacktestConfig>(DEFAULT_CONFIG);
  const [result, setResult] = useState<BacktestResult | null>(null);
  
  // Load data
  useEffect(() => {
    loadData();
  }, []);
  
  async function loadData() {
    setLoading(true);
    try {
      const [picksData, modelsData] = await Promise.all([
        getPicks({ limit: 500 }),
        getAIModels(),
      ]);
      setPicks(picksData);
      setAIModels(modelsData);
    } catch (e) {
      console.error('Error:', e);
    }
    setLoading(false);
  }
  
  // Run backtest
  const runBacktest = () => {
    setRunning(true);
    
    // Simulate async processing
    setTimeout(() => {
      // Filter picks based on config
      let filteredPicks = picks.filter(p => {
        if (config.aiModel && p.ai_model_id !== config.aiModel) return false;
        if (config.category && p.category !== config.category) return false;
        if (p.confidence < config.minConfidence) return false;
        if (!p.current_price || !p.entry_price) return false;
        return true;
      });
      
      // Sort by date and limit
      filteredPicks = filteredPicks
        .sort((a, b) => new Date(a.pick_date || a.created_at).getTime() - new Date(b.pick_date || b.created_at).getTime())
        .slice(0, config.maxPositions * 5); // Get more than needed for realistic sim
      
      if (filteredPicks.length === 0) {
        setResult(null);
        setRunning(false);
        return;
      }
      
      // Calculate results
      let totalReturn = 0;
      let winners = 0;
      let losers = 0;
      let totalWinReturn = 0;
      let totalLossReturn = 0;
      let bestTrade: { ticker: string; return: number } | null = null;
      let worstTrade: { ticker: string; return: number } | null = null;
      const byAI: Record<string, { trades: number; return: number; wins: number }> = {};
      
      // Position sizing
      const positionValue = config.positionSize === 'equal'
        ? config.startingCapital / Math.min(config.maxPositions, filteredPicks.length)
        : config.startingCapital / filteredPicks.length;
      
      filteredPicks.forEach(pick => {
        const tradeReturn = ((pick.current_price! - pick.entry_price) / pick.entry_price) * 100;
        const dollarReturn = positionValue * (tradeReturn / 100);
        
        totalReturn += dollarReturn;
        
        if (tradeReturn >= 0) {
          winners++;
          totalWinReturn += tradeReturn;
        } else {
          losers++;
          totalLossReturn += Math.abs(tradeReturn);
        }
        
        if (!bestTrade || tradeReturn > bestTrade.return) {
          bestTrade = { ticker: pick.ticker, return: tradeReturn };
        }
        if (!worstTrade || tradeReturn < worstTrade.return) {
          worstTrade = { ticker: pick.ticker, return: tradeReturn };
        }
        
        // By AI
        const aiName = pick.ai_display_name || 'Unknown';
        if (!byAI[aiName]) {
          byAI[aiName] = { trades: 0, return: 0, wins: 0 };
        }
        byAI[aiName].trades++;
        byAI[aiName].return += tradeReturn;
        if (tradeReturn >= 0) byAI[aiName].wins++;
      });
      
      const trades = filteredPicks.length;
      const winRate = trades > 0 ? (winners / trades) * 100 : 0;
      const avgWin = winners > 0 ? totalWinReturn / winners : 0;
      const avgLoss = losers > 0 ? totalLossReturn / losers : 0;
      
      // Simplified Sharpe ratio calculation
      const avgReturn = totalReturn / trades;
      const returns = filteredPicks.map(p => ((p.current_price! - p.entry_price) / p.entry_price) * 100);
      const stdDev = Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / trades);
      const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0;
      
      // Max drawdown (simplified)
      let peak = config.startingCapital;
      let maxDrawdown = 0;
      let runningValue = config.startingCapital;
      filteredPicks.forEach(pick => {
        const tradeReturn = ((pick.current_price! - pick.entry_price) / pick.entry_price);
        runningValue += positionValue * tradeReturn;
        if (runningValue > peak) peak = runningValue;
        const drawdown = ((peak - runningValue) / peak) * 100;
        if (drawdown > maxDrawdown) maxDrawdown = drawdown;
      });
      
      const byAIResult: Record<string, { trades: number; return: number; winRate: number }> = {};
      Object.entries(byAI).forEach(([name, data]) => {
        byAIResult[name] = {
          trades: data.trades,
          return: data.return,
          winRate: data.trades > 0 ? (data.wins / data.trades) * 100 : 0,
        };
      });
      
      setResult({
        totalReturn,
        totalReturnPercent: (totalReturn / config.startingCapital) * 100,
        winRate,
        avgWin,
        avgLoss,
        maxDrawdown,
        sharpeRatio,
        trades,
        winners,
        losers,
        bestTrade,
        worstTrade,
        byAI: byAIResult,
      });
      
      setRunning(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-3 flex items-center justify-center gap-3">
            <BarChart3 className="w-10 h-10 text-purple-400" />
            <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
              AI Backtester
            </span>
            <JavariHelpButton topic="backtesting how it works" />
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Test how AI picks would have performed. Configure strategy parameters and see historical results.
          </p>
        </div>
        
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Configuration Panel */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-purple-400" />
                Strategy Config
              </h2>
              
              {/* Starting Capital */}
              <div className="mb-4">
                <label className="text-sm text-gray-400 mb-2 block">Starting Capital</label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="number"
                    value={config.startingCapital}
                    onChange={(e) => setConfig({ ...config, startingCapital: parseInt(e.target.value) || 10000 })}
                    className="w-full pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
              
              {/* AI Model */}
              <div className="mb-4">
                <label className="text-sm text-gray-400 mb-2 block">AI Model</label>
                <select
                  value={config.aiModel || ''}
                  onChange={(e) => setConfig({ ...config, aiModel: e.target.value || null })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500"
                >
                  <option value="">All AIs</option>
                  {aiModels.map(ai => (
                    <option key={ai.id} value={ai.id}>{ai.display_name}</option>
                  ))}
                </select>
              </div>
              
              {/* Category */}
              <div className="mb-4">
                <label className="text-sm text-gray-400 mb-2 block">Category</label>
                <select
                  value={config.category || ''}
                  onChange={(e) => setConfig({ ...config, category: e.target.value || null })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500"
                >
                  <option value="">All Categories</option>
                  <option value="regular">Stocks</option>
                  <option value="penny">Penny Stocks</option>
                  <option value="crypto">Crypto</option>
                </select>
              </div>
              
              {/* Min Confidence */}
              <div className="mb-4">
                <label className="text-sm text-gray-400 mb-2 block">
                  Min Confidence: {config.minConfidence}%
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={config.minConfidence}
                  onChange={(e) => setConfig({ ...config, minConfidence: parseInt(e.target.value) })}
                  className="w-full accent-purple-500"
                />
              </div>
              
              {/* Position Sizing */}
              <div className="mb-4">
                <label className="text-sm text-gray-400 mb-2 block">Position Sizing</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfig({ ...config, positionSize: 'equal' })}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm ${
                      config.positionSize === 'equal'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-800 text-gray-400'
                    }`}
                  >
                    Equal Weight
                  </button>
                  <button
                    onClick={() => setConfig({ ...config, positionSize: 'confidence' })}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm ${
                      config.positionSize === 'confidence'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-800 text-gray-400'
                    }`}
                  >
                    By Confidence
                  </button>
                </div>
              </div>
              
              {/* Max Positions */}
              <div className="mb-6">
                <label className="text-sm text-gray-400 mb-2 block">Max Positions: {config.maxPositions}</label>
                <input
                  type="range"
                  min={1}
                  max={50}
                  value={config.maxPositions}
                  onChange={(e) => setConfig({ ...config, maxPositions: parseInt(e.target.value) })}
                  className="w-full accent-purple-500"
                />
              </div>
              
              {/* Run Button */}
              <button
                onClick={runBacktest}
                disabled={running || loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-gray-700 disabled:to-gray-700 rounded-xl font-medium transition-all"
              >
                {running ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Running Backtest...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    Run Backtest
                  </>
                )}
              </button>
              
              {/* Data Info */}
              <div className="mt-4 text-xs text-gray-500 text-center">
                {loading ? 'Loading data...' : `${picks.length} picks available`}
              </div>
            </div>
          </div>
          
          {/* Results Panel */}
          <div className="lg:col-span-2 space-y-4">
            {result ? (
              <>
                {/* Key Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className={`rounded-xl p-4 border ${
                    result.totalReturn >= 0 
                      ? 'bg-emerald-900/20 border-emerald-800/30' 
                      : 'bg-red-900/20 border-red-800/30'
                  }`}>
                    <div className="text-sm text-gray-400 mb-1">Total Return</div>
                    <div className={`text-2xl font-bold ${result.totalReturn >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {result.totalReturn >= 0 ? '+' : ''}${result.totalReturn.toFixed(2)}
                    </div>
                    <div className={`text-sm ${result.totalReturnPercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {result.totalReturnPercent >= 0 ? '+' : ''}{result.totalReturnPercent.toFixed(2)}%
                    </div>
                  </div>
                  
                  <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
                    <div className="text-sm text-gray-400 mb-1">Win Rate</div>
                    <div className="text-2xl font-bold text-cyan-400">{result.winRate.toFixed(1)}%</div>
                    <div className="text-sm text-gray-500">{result.winners}W / {result.losers}L</div>
                  </div>
                  
                  <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
                    <div className="text-sm text-gray-400 mb-1">Trades</div>
                    <div className="text-2xl font-bold">{result.trades}</div>
                    <div className="text-sm text-gray-500">positions</div>
                  </div>
                  
                  <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
                    <div className="text-sm text-gray-400 mb-1">Max Drawdown</div>
                    <div className="text-2xl font-bold text-red-400">-{result.maxDrawdown.toFixed(1)}%</div>
                    <div className="text-sm text-gray-500">peak to trough</div>
                  </div>
                </div>
                
                {/* Detailed Stats */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <LineChart className="w-5 h-5 text-purple-400" />
                      Performance Stats
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Avg Win</span>
                        <span className="text-emerald-400">+{result.avgWin.toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Avg Loss</span>
                        <span className="text-red-400">-{result.avgLoss.toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Sharpe Ratio</span>
                        <span className={result.sharpeRatio >= 1 ? 'text-emerald-400' : 'text-gray-300'}>
                          {result.sharpeRatio.toFixed(2)}
                        </span>
                      </div>
                      <div className="border-t border-gray-800 pt-3 mt-3">
                        <div className="flex justify-between mb-1">
                          <span className="text-gray-400">Best Trade</span>
                          <span className="text-emerald-400">
                            {result.bestTrade?.ticker} +{result.bestTrade?.return.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Worst Trade</span>
                          <span className="text-red-400">
                            {result.worstTrade?.ticker} {result.worstTrade?.return.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <PieChart className="w-5 h-5 text-cyan-400" />
                      By AI Model
                    </h3>
                    <div className="space-y-2">
                      {Object.entries(result.byAI)
                        .sort((a, b) => b[1].return - a[1].return)
                        .slice(0, 5)
                        .map(([name, data]) => (
                          <div key={name} className="flex items-center justify-between p-2 bg-gray-800/50 rounded-lg">
                            <div>
                              <div className="text-sm font-medium">{name}</div>
                              <div className="text-xs text-gray-500">{data.trades} trades</div>
                            </div>
                            <div className="text-right">
                              <div className={`text-sm font-medium ${data.return >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {data.return >= 0 ? '+' : ''}{data.return.toFixed(1)}%
                              </div>
                              <div className="text-xs text-gray-500">{data.winRate.toFixed(0)}% win</div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
                
                {/* Visual Progress Bar */}
                <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
                  <h3 className="text-sm font-medium text-gray-400 mb-3">Return Distribution</h3>
                  <div className="flex h-4 rounded-full overflow-hidden bg-gray-800">
                    <div 
                      className="bg-emerald-500 transition-all"
                      style={{ width: `${(result.winners / result.trades) * 100}%` }}
                    />
                    <div 
                      className="bg-red-500 transition-all"
                      style={{ width: `${(result.losers / result.trades) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-gray-500">
                    <span>{result.winners} Winners ({((result.winners / result.trades) * 100).toFixed(0)}%)</span>
                    <span>{result.losers} Losers ({((result.losers / result.trades) * 100).toFixed(0)}%)</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center bg-gray-900/30 rounded-xl border border-gray-800 min-h-[400px]">
                <div className="text-center">
                  <BarChart3 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-400 mb-2">Configure & Run Backtest</h3>
                  <p className="text-gray-500 max-w-md">
                    Set your strategy parameters on the left, then click "Run Backtest" 
                    to see how AI picks would have performed.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Disclaimer */}
        <div className="mt-8 p-4 bg-yellow-900/20 border border-yellow-800/50 rounded-xl">
          <p className="text-sm text-yellow-200 font-medium mb-1">⚠️ Backtest Disclaimer</p>
          <p className="text-xs text-gray-400">
            Past performance does not guarantee future results. This backtest uses historical data 
            and simplified assumptions. Actual trading involves additional costs, slippage, and risks.
            This is for educational purposes only - not financial advice.
          </p>
        </div>
      </main>
    </div>
  );
}
