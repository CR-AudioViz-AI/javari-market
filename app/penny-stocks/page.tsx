'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Zap, TrendingUp, TrendingDown, Trophy, Target,
  AlertTriangle, Clock, Flame, RefreshCw, ArrowUpRight,
  ArrowDownRight, Filter, ChevronDown, Star, DollarSign
} from 'lucide-react';
import { getPennyStockPicks, getAIStatistics, type StockPick, type AIStatistics, AI_MODELS } from '@/lib/supabase';
import { JavariHelpButton } from '@/components/JavariWidget';

export default function PennyStocksPage() {
  const [picks, setPicks] = useState<StockPick[]>([]);
  const [stats, setStats] = useState<AIStatistics[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'closed'>('all');
  const [selectedAI, setSelectedAI] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'confidence' | 'return'>('date');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [picksData, statsData] = await Promise.all([
        getPennyStockPicks(),
        getAIStatistics('penny_stock')
      ]);
      setPicks(picksData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading penny stocks:', error);
    }
    setLoading(false);
  }

  const filteredPicks = useMemo(() => {
    let result = [...picks];
    
    if (filter !== 'all') {
      result = result.filter(p => p.status === filter);
    }
    if (selectedAI !== 'all') {
      result = result.filter(p => p.ai_model_id === selectedAI);
    }
    
    switch (sortBy) {
      case 'confidence':
        result.sort((a, b) => b.confidence - a.confidence);
        break;
      case 'return':
        result.sort((a, b) => (b.actual_return || b.price_change_percent || 0) - (a.actual_return || a.price_change_percent || 0));
        break;
      default:
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    
    return result;
  }, [picks, filter, selectedAI, sortBy]);

  const activePicks = picks.filter(p => p.status === 'active');
  const avgConfidence = picks.length > 0 
    ? Math.round(picks.reduce((sum, p) => sum + p.confidence, 0) / picks.length) 
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Zap className="w-16 h-16 text-yellow-400 animate-pulse mx-auto mb-4" />
          <p className="text-gray-400">Loading penny stock picks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-900/20 via-orange-900/10 to-gray-950" />
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-yellow-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 py-16">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                Penny Stocks
              </h1>
              <p className="text-gray-400">High-risk, high-reward picks under $5</p>
            </div>
            <JavariHelpButton topic="Penny Stocks" className="ml-auto" />
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-gray-900/50 backdrop-blur border border-yellow-500/20 rounded-xl p-4">
              <div className="flex items-center gap-2 text-yellow-400 mb-2">
                <Flame className="w-4 h-4" />
                <span className="text-sm">Active Picks</span>
              </div>
              <div className="text-2xl font-bold">{activePicks.length}</div>
            </div>
            <div className="bg-gray-900/50 backdrop-blur border border-orange-500/20 rounded-xl p-4">
              <div className="flex items-center gap-2 text-orange-400 mb-2">
                <Target className="w-4 h-4" />
                <span className="text-sm">Avg Confidence</span>
              </div>
              <div className="text-2xl font-bold">{avgConfidence}%</div>
            </div>
            <div className="bg-gray-900/50 backdrop-blur border border-green-500/20 rounded-xl p-4">
              <div className="flex items-center gap-2 text-green-400 mb-2">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm">Total Picks</span>
              </div>
              <div className="text-2xl font-bold">{picks.length}</div>
            </div>
            <div className="bg-gray-900/50 backdrop-blur border border-purple-500/20 rounded-xl p-4">
              <div className="flex items-center gap-2 text-purple-400 mb-2">
                <DollarSign className="w-4 h-4" />
                <span className="text-sm">Price Range</span>
              </div>
              <div className="text-2xl font-bold">&lt; $5</div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Battle Section */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-400" />
            AI Penny Stock Battle
          </h2>
          <Link href="/competition" className="text-cyan-400 hover:text-cyan-300 text-sm flex items-center gap-1">
            Full Leaderboard <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <div 
              key={stat.aiModelId}
              className={`relative bg-gray-900/50 backdrop-blur border rounded-xl p-4 transition-all hover:scale-[1.02] ${
                index === 0 ? 'border-yellow-500/50 ring-1 ring-yellow-500/20' : 'border-gray-700/50'
              }`}
            >
              {index === 0 && (
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                  <Trophy className="w-4 h-4 text-black" />
                </div>
              )}
              <div className="flex items-center gap-2 mb-3">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: stat.color }}
                />
                <span className="font-semibold">{stat.displayName}</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Win Rate</span>
                  <span className={stat.winRate >= 50 ? 'text-green-400' : 'text-red-400'}>
                    {stat.winRate.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Picks</span>
                  <span>{stat.totalPicks}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Avg Return</span>
                  <span className={stat.avgReturn >= 0 ? 'text-green-400' : 'text-red-400'}>
                    {stat.avgReturn >= 0 ? '+' : ''}{stat.avgReturn.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2 bg-gray-800/50 rounded-lg p-1">
            {['all', 'active', 'closed'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as typeof filter)}
                className={`px-3 py-1.5 rounded-md text-sm transition-all ${
                  filter === f
                    ? 'bg-yellow-500 text-black font-medium'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          
          <select
            value={selectedAI}
            onChange={(e) => setSelectedAI(e.target.value)}
            className="bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-sm"
          >
            <option value="all">All AIs</option>
            {AI_MODELS.map(model => (
              <option key={model.id} value={model.id}>{model.name}</option>
            ))}
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-sm"
          >
            <option value="date">Newest First</option>
            <option value="confidence">Highest Confidence</option>
            <option value="return">Best Return</option>
          </select>
          
          <button
            onClick={loadData}
            className="ml-auto flex items-center gap-2 px-3 py-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Picks Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPicks.length === 0 ? (
            <div className="col-span-full text-center py-16">
              <AlertTriangle className="w-16 h-16 text-yellow-500/50 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Penny Stock Picks Yet</h3>
              <p className="text-gray-400">AI models are analyzing the market for high-potential penny stocks.</p>
            </div>
          ) : (
            filteredPicks.map((pick) => (
              <PickCard key={pick.id} pick={pick} />
            ))
          )}
        </div>
      </div>
      
      {/* Risk Warning */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-8 h-8 text-yellow-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-400 mb-2">High Risk Warning</h3>
              <p className="text-gray-300 text-sm">
                Penny stocks are highly speculative and can result in significant losses. 
                These AI predictions are for educational purposes only. Always do your own 
                research and never invest more than you can afford to lose.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PickCard({ pick }: { pick: StockPick }) {
  const priceChange = pick.price_change_percent || 0;
  const isUp = priceChange >= 0;
  const aiModel = AI_MODELS.find(m => m.id === pick.ai_model_id);
  
  return (
    <div className="bg-gray-900/50 backdrop-blur border border-gray-700/50 rounded-xl p-4 hover:border-yellow-500/30 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
            style={{ backgroundColor: aiModel?.color + '20', color: aiModel?.color }}
          >
            {aiModel?.displayName?.slice(0, 2) || 'AI'}
          </div>
          <div>
            <div className="font-bold text-lg">{pick.ticker}</div>
            <div className="text-xs text-gray-500">{pick.company_name}</div>
          </div>
        </div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
          pick.direction === 'UP' 
            ? 'bg-green-900/30 text-green-400' 
            : pick.direction === 'DOWN'
            ? 'bg-red-900/30 text-red-400'
            : 'bg-gray-700/50 text-gray-400'
        }`}>
          {pick.direction === 'UP' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {pick.direction}
        </div>
      </div>
      
      {/* Prices */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-gray-800/50 rounded-lg p-2 text-center">
          <div className="text-[10px] text-gray-500 uppercase">Entry</div>
          <div className="text-sm font-semibold">${pick.entry_price.toFixed(2)}</div>
        </div>
        <div className={`rounded-lg p-2 text-center ${isUp ? 'bg-green-900/20' : 'bg-red-900/20'}`}>
          <div className="text-[10px] text-gray-400 uppercase">Current</div>
          <div className={`text-sm font-bold ${isUp ? 'text-green-400' : 'text-red-400'}`}>
            ${pick.current_price?.toFixed(2) || '—'}
          </div>
        </div>
        <div className="bg-cyan-900/20 rounded-lg p-2 text-center">
          <div className="text-[10px] text-gray-500 uppercase">Target</div>
          <div className="text-sm font-semibold text-cyan-400">${pick.target_price.toFixed(2)}</div>
        </div>
      </div>
      
      {/* Confidence & Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-full bg-gray-700 rounded-full h-1.5 w-20">
            <div 
              className="h-1.5 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500"
              style={{ width: `${pick.confidence}%` }}
            />
          </div>
          <span className="text-xs text-gray-400">{pick.confidence}%</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Clock className="w-3 h-3" />
          {pick.timeframe}
        </div>
      </div>
      
      {/* Return (if closed) */}
      {pick.status === 'closed' && pick.actual_return !== undefined && (
        <div className={`mt-3 pt-3 border-t border-gray-700/50 flex items-center justify-between`}>
          <span className="text-sm text-gray-400">Final Return</span>
          <span className={`text-lg font-bold ${pick.actual_return >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {pick.actual_return >= 0 ? '+' : ''}{pick.actual_return.toFixed(1)}%
          </span>
        </div>
      )}
    </div>
  );
}

