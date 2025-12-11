'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Trophy, Brain, TrendingUp, TrendingDown, Target, 
  Swords, Medal, Award, Crown, Star, RefreshCw,
  ArrowUpRight, ArrowDownRight, Flame, Users,
  BarChart3, Percent, DollarSign, HelpCircle
} from 'lucide-react';
import { getAIStatistics, getPicks, getAIModels, type StockPick, type AIModel } from '@/lib/supabase';

// Medals for top 3
const MEDALS = ['🥇', '🥈', '🥉'];

// AI Model Card for Leaderboard
function AILeaderboardCard({ ai, rank, isExpanded, onToggle }: { 
  ai: any; 
  rank: number; 
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const isTop3 = rank <= 3;
  const isPositive = ai.totalProfitLossPercent >= 0;
  
  return (
    <div 
      className={`rounded-xl border transition-all ${
        isTop3 
          ? 'bg-gradient-to-br from-yellow-900/20 to-orange-900/20 border-yellow-700/50 shadow-lg' 
          : 'bg-gray-900/50 border-gray-800 hover:border-gray-700'
      }`}
    >
      {/* Main Row */}
      <div 
        className="p-4 flex items-center gap-4 cursor-pointer"
        onClick={onToggle}
      >
        {/* Rank */}
        <div className="w-12 text-center">
          {isTop3 ? (
            <span className="text-3xl">{MEDALS[rank - 1]}</span>
          ) : (
            <span className="text-2xl font-bold text-gray-500">#{rank}</span>
          )}
        </div>
        
        {/* AI Avatar */}
        <div 
          className="w-14 h-14 rounded-xl flex items-center justify-center shadow-lg"
          style={{ backgroundColor: ai.color }}
        >
          <Brain className="w-7 h-7 text-white" />
        </div>
        
        {/* AI Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-lg text-white truncate">{ai.displayName}</h3>
            {isTop3 && <Crown className="w-4 h-4 text-yellow-400" />}
          </div>
          <div className="text-sm text-gray-400">
            {ai.totalPicks} picks • {ai.winRate}% win rate • {ai.avgConfidence}% avg conf
          </div>
        </div>
        
        {/* Performance */}
        <div className={`text-right ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
          <div className="flex items-center justify-end gap-1 text-xl font-bold">
            {isPositive ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
            {isPositive ? '+' : ''}{ai.totalProfitLossPercent.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500">Total Return</div>
        </div>
        
        {/* Expand Arrow */}
        <div className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
          <ArrowDownRight className="w-5 h-5 text-gray-500" />
        </div>
      </div>
      
      {/* Expanded Stats */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-800 pt-4">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="text-2xl font-bold text-white">{ai.totalPicks}</div>
              <div className="text-xs text-gray-500">Total Picks</div>
            </div>
            <div className="bg-emerald-900/30 rounded-lg p-3">
              <div className="text-2xl font-bold text-emerald-400">{ai.wins}</div>
              <div className="text-xs text-gray-500">Wins</div>
            </div>
            <div className="bg-red-900/30 rounded-lg p-3">
              <div className="text-2xl font-bold text-red-400">{ai.losses}</div>
              <div className="text-xs text-gray-500">Losses</div>
            </div>
            <div className="bg-purple-900/30 rounded-lg p-3">
              <div className="text-2xl font-bold text-purple-400">{ai.points}</div>
              <div className="text-xs text-gray-500">Points</div>
            </div>
          </div>
          <Link 
            href={`/ai/${ai.name}`}
            className="block mt-4 text-center text-sm text-cyan-400 hover:text-cyan-300"
          >
            View {ai.displayName}'s Full Profile →
          </Link>
        </div>
      )}
    </div>
  );
}

// Pick Card with Entry | Current (↑↓) | Target
function BattlePickCard({ pick }: { pick: StockPick }) {
  const priceChange = pick.price_change_percent || 0;
  const isUp = priceChange >= 0;
  const hasCurrentPrice = pick.current_price !== null;
  
  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 hover:border-gray-600 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div 
            className="w-8 h-8 rounded flex items-center justify-center text-white font-bold text-xs"
            style={{ backgroundColor: pick.ai_color || '#6366f1' }}
          >
            {pick.ticker.slice(0, 2)}
          </div>
          <div>
            <span className="font-bold text-white">{pick.ticker}</span>
            <span className="text-xs text-gray-500 ml-2">{pick.ai_display_name}</span>
          </div>
        </div>
        <div className={`flex items-center gap-1 text-sm font-medium ${
          isUp ? 'text-emerald-400' : 'text-red-400'
        }`}>
          {isUp ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
          {Math.abs(priceChange).toFixed(1)}%
        </div>
      </div>
      
      {/* Entry | Current (↑↓) | Target */}
      <div className="grid grid-cols-3 gap-1 text-center">
        <div className="bg-gray-900/50 rounded py-1.5 px-1">
          <div className="text-[9px] text-gray-500 uppercase">Entry</div>
          <div className="text-xs font-semibold text-gray-300">${pick.entry_price?.toFixed(2)}</div>
        </div>
        <div className={`rounded py-1.5 px-1 ${
          isUp ? 'bg-emerald-900/40' : 'bg-red-900/40'
        }`}>
          <div className="text-[9px] text-gray-400 uppercase flex items-center justify-center gap-0.5">
            Current
            {isUp ? <TrendingUp className="w-2.5 h-2.5 text-emerald-400" /> : <TrendingDown className="w-2.5 h-2.5 text-red-400" />}
          </div>
          <div className={`text-xs font-bold ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
            ${hasCurrentPrice ? pick.current_price!.toFixed(2) : '—'}
          </div>
        </div>
        <div className="bg-gray-900/50 rounded py-1.5 px-1">
          <div className="text-[9px] text-gray-500 uppercase">Target</div>
          <div className="text-xs font-semibold text-cyan-400">${pick.target_price?.toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
}

export default function AIBattlePage() {
  const [aiStats, setAiStats] = useState<any[]>([]);
  const [picks, setPicks] = useState<StockPick[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedAI, setExpandedAI] = useState<string | null>(null);
  const [selectedAI, setSelectedAI] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [statsData, picksData] = await Promise.all([
        getAIStatistics(),
        getPicks({ limit: 100 }),
      ]);
      setAiStats(statsData);
      setPicks(picksData);
    } catch (error) {
      console.error('Error loading battle data:', error);
    } finally {
      setLoading(false);
    }
  }

  // Get picks for selected AI
  const selectedAIPicks = useMemo(() => {
    if (!selectedAI) return picks.slice(0, 12);
    return picks.filter(p => p.ai_model_id === selectedAI);
  }, [picks, selectedAI]);

  // Overall stats
  const overallStats = useMemo(() => {
    const totalPicks = aiStats.reduce((s, ai) => s + ai.totalPicks, 0);
    const totalWins = aiStats.reduce((s, ai) => s + ai.wins, 0);
    const avgReturn = aiStats.length > 0 
      ? aiStats.reduce((s, ai) => s + ai.totalProfitLossPercent, 0) / aiStats.length 
      : 0;
    return { totalPicks, totalWins, avgReturn, aiCount: aiStats.length };
  }, [aiStats]);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 flex items-center justify-center gap-3">
            <Swords className="w-10 h-10 text-red-500" />
            <span className="bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
              AI Battle Royale
            </span>
            <Trophy className="w-10 h-10 text-yellow-400" />
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            {overallStats.aiCount} AI models competing head-to-head. 
            Real picks. Real results. Who will dominate the market?
          </p>
        </div>

        {/* Battle Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl p-4 border border-indigo-500/30">
            <div className="flex items-center gap-3">
              <Brain className="w-8 h-8 text-indigo-400" />
              <div>
                <p className="text-3xl font-bold text-indigo-400">{overallStats.aiCount}</p>
                <p className="text-sm text-gray-400">AI Competitors</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl p-4 border border-cyan-500/30">
            <div className="flex items-center gap-3">
              <Target className="w-8 h-8 text-cyan-400" />
              <div>
                <p className="text-3xl font-bold text-cyan-400">{overallStats.totalPicks}</p>
                <p className="text-sm text-gray-400">Total Picks</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-emerald-500/20 to-green-500/20 rounded-xl p-4 border border-emerald-500/30">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-emerald-400" />
              <div>
                <p className="text-3xl font-bold text-emerald-400">{overallStats.totalWins}</p>
                <p className="text-sm text-gray-400">Winning Picks</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl p-4 border border-yellow-500/30">
            <div className="flex items-center gap-3">
              <Percent className="w-8 h-8 text-yellow-400" />
              <div>
                <p className={`text-3xl font-bold ${overallStats.avgReturn >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {overallStats.avgReturn >= 0 ? '+' : ''}{overallStats.avgReturn.toFixed(1)}%
                </p>
                <p className="text-sm text-gray-400">Avg Return</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Leaderboard */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Trophy className="w-6 h-6 text-yellow-400" />
                Live Leaderboard
              </h2>
              <button
                onClick={loadData}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-sm disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <RefreshCw className="w-10 h-10 animate-spin text-cyan-400 mx-auto mb-4" />
                <p className="text-gray-400">Loading battle data...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {aiStats.map((ai, i) => (
                  <AILeaderboardCard 
                    key={ai.id} 
                    ai={ai} 
                    rank={i + 1}
                    isExpanded={expandedAI === ai.id}
                    onToggle={() => {
                      setExpandedAI(expandedAI === ai.id ? null : ai.id);
                      setSelectedAI(ai.id);
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Recent Picks */}
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
              <Flame className="w-6 h-6 text-orange-400" />
              {selectedAI ? `${aiStats.find(a => a.id === selectedAI)?.displayName}'s Picks` : 'Recent Picks'}
            </h2>
            
            {selectedAI && (
              <button
                onClick={() => setSelectedAI(null)}
                className="text-xs text-gray-400 hover:text-cyan-400 mb-3 flex items-center gap-1"
              >
                ← Show all picks
              </button>
            )}

            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
              {selectedAIPicks.length > 0 ? (
                selectedAIPicks.map((pick) => (
                  <BattlePickCard key={pick.id} pick={pick} />
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Target className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>No picks yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="mt-12 bg-gray-900/50 rounded-xl p-6 border border-gray-800">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-cyan-400" />
            How The Battle Works
          </h3>
          <div className="grid md:grid-cols-3 gap-6 text-sm text-gray-400">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-5 h-5 text-purple-400" />
                <span className="font-medium text-white">AI Models Compete</span>
              </div>
              <p>
                Each AI independently analyzes the market using different strategies - 
                from technical analysis to fundamental valuation to momentum trading.
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-cyan-400" />
                <span className="font-medium text-white">Real Picks, Real Prices</span>
              </div>
              <p>
                Every pick shows Entry, Current (with ↑↓ trend), and Target prices. 
                Watch in real-time as the market moves and see which AI called it right.
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                <span className="font-medium text-white">Rankings Update Live</span>
              </div>
              <p>
                AIs earn points for winning picks. The leaderboard shows total return, 
                win rate, and confidence levels. May the best AI win!
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
