'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { 
  TrendingUp, TrendingDown, Target, Trophy, Flame, 
  BarChart3, Coins, DollarSign, Bitcoin, Zap,
  ChevronDown, ChevronUp, Star, RefreshCw, Search, 
  Filter, ArrowUpRight, ArrowDownRight, HelpCircle,
  Brain, Eye, Clock, Percent
} from 'lucide-react';
import { 
  getPicks, getAIModels, getAIStatistics, getHotPicks, 
  getOverallStats, getRecentWinners,
  type StockPick, type AIModel, type Category 
} from '@/lib/supabase';

// Category configuration
const CATEGORIES: Record<Category | 'all', { name: string; icon: any; color: string }> = {
  all: { name: 'All Assets', icon: BarChart3, color: 'indigo' },
  regular: { name: 'Stocks', icon: DollarSign, color: 'blue' },
  penny: { name: 'Penny Stocks', icon: Coins, color: 'emerald' },
  crypto: { name: 'Crypto', icon: Bitcoin, color: 'orange' },
};

// Pick Card Component with Entry | Current (↑↓) | Target
function PickCard({ pick }: { pick: StockPick }) {
  const priceChange = pick.price_change_percent || 0;
  const isUp = priceChange >= 0;
  const hasCurrentPrice = pick.current_price !== null;
  
  // Calculate progress toward target
  const progressToTarget = hasCurrentPrice && pick.target_price && pick.entry_price
    ? Math.min(100, Math.max(0, ((pick.current_price! - pick.entry_price) / (pick.target_price - pick.entry_price)) * 100))
    : 0;

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 hover:border-gray-600 transition-all hover:shadow-lg group">
      {/* Header: Ticker + AI + Confidence */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
            style={{ backgroundColor: pick.ai_color || '#6366f1' }}
          >
            {pick.ticker.slice(0, 2)}
          </div>
          <div>
            <h3 className="font-bold text-white text-lg">{pick.ticker}</h3>
            <p className="text-xs text-gray-400">{pick.ai_display_name}</p>
          </div>
        </div>
        <div className="text-right">
          <div className={`flex items-center gap-1 text-sm font-medium ${
            isUp ? 'text-emerald-400' : 'text-red-400'
          }`}>
            {isUp ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            {Math.abs(priceChange).toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500">
            {pick.confidence}% conf
          </div>
        </div>
      </div>
      
      {/* Price Display: Entry | Current | Target */}
      <div className="grid grid-cols-3 gap-2 mb-3 text-center">
        {/* Entry Price */}
        <div className="bg-gray-900/50 rounded-lg py-2 px-1">
          <div className="text-[10px] text-gray-500 uppercase tracking-wide">Entry</div>
          <div className="text-sm font-semibold text-gray-300">
            ${pick.entry_price?.toFixed(2) || '—'}
          </div>
        </div>
        
        {/* Current Price with Arrow */}
        <div className={`rounded-lg py-2 px-1 ${
          isUp ? 'bg-emerald-900/30 border border-emerald-800/50' : 'bg-red-900/30 border border-red-800/50'
        }`}>
          <div className="text-[10px] text-gray-500 uppercase tracking-wide flex items-center justify-center gap-1">
            Current
            {isUp ? (
              <TrendingUp className="w-3 h-3 text-emerald-400" />
            ) : (
              <TrendingDown className="w-3 h-3 text-red-400" />
            )}
          </div>
          <div className={`text-sm font-bold ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
            ${hasCurrentPrice ? pick.current_price!.toFixed(2) : '—'}
          </div>
        </div>
        
        {/* Target Price */}
        <div className="bg-gray-900/50 rounded-lg py-2 px-1">
          <div className="text-[10px] text-gray-500 uppercase tracking-wide">Target</div>
          <div className="text-sm font-semibold text-cyan-400">
            ${pick.target_price?.toFixed(2) || '—'}
          </div>
        </div>
      </div>
      
      {/* Progress to Target */}
      <div className="mb-3">
        <div className="flex justify-between text-[10px] text-gray-500 mb-1">
          <span>Progress to Target</span>
          <span>{progressToTarget.toFixed(0)}%</span>
        </div>
        <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all ${
              progressToTarget >= 100 ? 'bg-emerald-500' : 
              progressToTarget >= 50 ? 'bg-cyan-500' : 
              progressToTarget >= 0 ? 'bg-blue-500' : 'bg-red-500'
            }`}
            style={{ width: `${Math.max(0, progressToTarget)}%` }}
          />
        </div>
      </div>
      
      {/* Direction + Status */}
      <div className="flex items-center justify-between">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
          pick.direction === 'UP' 
            ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-800/50'
            : pick.direction === 'DOWN'
            ? 'bg-red-900/50 text-red-400 border border-red-800/50'
            : 'bg-gray-700 text-gray-400'
        }`}>
          {pick.direction === 'UP' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {pick.direction}
        </span>
        <span className={`px-2 py-0.5 rounded text-xs ${
          pick.status === 'active' ? 'bg-yellow-900/50 text-yellow-400' :
          pick.status === 'won' ? 'bg-emerald-900/50 text-emerald-400' :
          pick.status === 'lost' ? 'bg-red-900/50 text-red-400' :
          'bg-gray-700 text-gray-400'
        }`}>
          {pick.status?.toUpperCase() || 'ACTIVE'}
        </span>
      </div>
      
      {/* View Details Link */}
      <Link 
        href={`/stock/${pick.ticker}`}
        className="mt-3 block text-center text-xs text-gray-400 hover:text-cyan-400 transition-colors"
      >
        View AI Reasoning →
      </Link>
    </div>
  );
}

// AI Leaderboard Card
function AILeaderboardCard({ ai, rank }: { ai: any; rank: number }) {
  const medals = ['🥇', '🥈', '🥉'];
  
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg ${
      rank <= 3 ? 'bg-gradient-to-r from-yellow-900/20 to-transparent border border-yellow-800/30' : 'bg-gray-800/30'
    }`}>
      <div className="w-8 text-center">
        {rank <= 3 ? (
          <span className="text-xl">{medals[rank - 1]}</span>
        ) : (
          <span className="text-gray-500 font-bold">#{rank}</span>
        )}
      </div>
      <div 
        className="w-10 h-10 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: ai.color }}
      >
        <Brain className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-white truncate">{ai.displayName}</div>
        <div className="text-xs text-gray-400">{ai.totalPicks} picks • {ai.winRate}% win rate</div>
      </div>
      <div className={`text-right ${ai.totalProfitLossPercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
        <div className="font-bold flex items-center justify-end gap-1">
          {ai.totalProfitLossPercent >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          {ai.totalProfitLossPercent >= 0 ? '+' : ''}{ai.totalProfitLossPercent.toFixed(1)}%
        </div>
        <div className="text-xs text-gray-500">Total Return</div>
      </div>
    </div>
  );
}

// Main Dashboard Component
export default function DashboardPage() {
  // State
  const [picks, setPicks] = useState<StockPick[]>([]);
  const [aiModels, setAiModels] = useState<AIModel[]>([]);
  const [aiStats, setAiStats] = useState<any[]>([]);
  const [hotPicks, setHotPicks] = useState<any[]>([]);
  const [overallStats, setOverallStats] = useState<any>({});
  const [recentWinners, setRecentWinners] = useState<StockPick[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  // Filters
  const [category, setCategory] = useState<Category | 'all'>('all');
  const [selectedAI, setSelectedAI] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'confidence' | 'change'>('date');
  
  // Load data function
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [picksData, modelsData, statsData, hotData, overallData, winnersData] = await Promise.all([
        getPicks({ category: category === 'all' ? undefined : category, limit: 500 }),
        getAIModels(),
        getAIStatistics(category === 'all' ? undefined : category),
        getHotPicks(category === 'all' ? undefined : category),
        getOverallStats(),
        getRecentWinners(5),
      ]);
      
      setPicks(picksData);
      setAiModels(modelsData);
      setAiStats(statsData);
      setHotPicks(hotData);
      setOverallStats(overallData);
      setRecentWinners(winnersData);
      setLastUpdate(new Date());
    } catch (e) {
      console.error('Load error:', e);
    }
    setLoading(false);
  }, [category]);
  
  // Initial load + auto-refresh
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [loadData]);
  
  // Filtered picks
  const filteredPicks = useMemo(() => {
    let result = [...picks];
    
    if (selectedAI !== 'all') {
      result = result.filter(p => p.ai_model_id === selectedAI);
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(p => 
        p.ticker.toLowerCase().includes(term) ||
        p.company_name?.toLowerCase().includes(term) ||
        p.ai_display_name?.toLowerCase().includes(term)
      );
    }
    
    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'confidence':
          return b.confidence - a.confidence;
        case 'change':
          return (b.price_change_percent || 0) - (a.price_change_percent || 0);
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
    
    return result;
  }, [picks, selectedAI, searchTerm, sortBy]);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="sticky top-16 z-30 bg-gray-900/95 backdrop-blur-lg border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Title + Last Update */}
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Trophy className="w-6 h-6 text-yellow-400" />
                AI Stock Battle
              </h1>
              <p className="text-sm text-gray-400 flex items-center gap-2">
                <Clock className="w-3 h-3" />
                {lastUpdate ? `Updated ${lastUpdate.toLocaleTimeString()}` : 'Loading...'}
                {loading && <RefreshCw className="w-3 h-3 animate-spin" />}
              </p>
            </div>
            
            {/* Category Tabs */}
            <div className="flex gap-2 flex-wrap">
              {Object.entries(CATEGORIES).map(([key, { name, icon: Icon, color }]) => (
                <button
                  key={key}
                  onClick={() => setCategory(key as Category | 'all')}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all ${
                    category === key
                      ? `bg-${color}-500/20 text-${color}-400 border border-${color}-500/50`
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {name}
                </button>
              ))}
            </div>
            
            {/* Refresh Button */}
            <button
              onClick={loadData}
              disabled={loading}
              className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
          <StatCard 
            icon={Target} 
            label="Total Picks" 
            value={overallStats.totalPicks || 0}
            color="gray"
          />
          <StatCard 
            icon={Flame} 
            label="Active" 
            value={overallStats.activePicks || 0}
            color="yellow"
          />
          <StatCard 
            icon={TrendingUp} 
            label="Winners" 
            value={overallStats.winners || 0}
            color="emerald"
          />
          <StatCard 
            icon={TrendingDown} 
            label="Losers" 
            value={overallStats.losers || 0}
            color="red"
          />
          <StatCard 
            icon={Trophy} 
            label="Win Rate" 
            value={`${overallStats.winRate || 0}%`}
            color="purple"
          />
          <StatCard 
            icon={DollarSign} 
            label="Total P/L" 
            value={`$${(overallStats.totalPL || 0).toFixed(0)}`}
            color={overallStats.totalPL >= 0 ? 'emerald' : 'red'}
          />
          <StatCard 
            icon={Star} 
            label="Avg Conf" 
            value={`${overallStats.avgConfidence || 0}%`}
            color="indigo"
          />
        </div>
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* AI Leaderboard */}
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              AI Leaderboard
              <Link href="/battle" className="ml-auto text-xs text-cyan-400 hover:underline">
                View Full →
              </Link>
            </h3>
            <div className="space-y-2">
              {aiStats.length > 0 ? (
                aiStats.slice(0, 6).map((ai, i) => (
                  <AILeaderboardCard key={ai.id} ai={ai} rank={i + 1} />
                ))
              ) : (
                <div className="text-center text-gray-500 py-8">
                  {loading ? 'Loading...' : 'No AI data yet'}
                </div>
              )}
            </div>
          </div>
          
          {/* Hot Picks (Consensus) */}
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-400" />
              Hot Picks (2+ AIs Agree)
              <Link href="/hot-picks" className="ml-auto text-xs text-cyan-400 hover:underline">
                View All →
              </Link>
            </h3>
            <div className="space-y-3">
              {hotPicks.length > 0 ? (
                hotPicks.slice(0, 5).map((hp) => (
                  <div key={hp.ticker} className="flex items-center gap-3 p-2 bg-gray-800/50 rounded-lg">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center font-bold">
                      {hp.consensus}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">{hp.ticker}</div>
                      <div className="text-xs text-gray-400">{hp.aiNames.join(', ')}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{hp.avgConfidence}%</div>
                      <div className="text-xs text-gray-500">avg conf</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-8">
                  {loading ? 'Loading...' : 'No consensus picks yet'}
                </div>
              )}
            </div>
          </div>
          
          {/* Recent Winners */}
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              Top Gainers
              <Link href="/insights" className="ml-auto text-xs text-cyan-400 hover:underline">
                View All →
              </Link>
            </h3>
            <div className="space-y-2">
              {recentWinners.length > 0 ? (
                recentWinners.map((pick) => {
                  const gain = pick.current_price && pick.entry_price 
                    ? ((pick.current_price - pick.entry_price) / pick.entry_price) * 100
                    : 0;
                  return (
                    <div key={pick.id} className="flex items-center gap-3 p-2 bg-emerald-900/20 rounded-lg border border-emerald-800/30">
                      <div 
                        className="w-8 h-8 rounded flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: pick.ai_color }}
                      >
                        {pick.ticker.slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{pick.ticker}</div>
                        <div className="text-xs text-gray-400">{pick.ai_display_name}</div>
                      </div>
                      <div className="text-emerald-400 font-bold flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        +{gain.toFixed(1)}%
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center text-gray-500 py-8">
                  {loading ? 'Loading...' : 'No winners yet'}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Filters + Search */}
        <div className="mt-8 mb-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Target className="w-5 h-5 text-cyan-400" />
            All AI Picks ({filteredPicks.length})
          </h2>
          
          <div className="flex flex-wrap gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search ticker..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-cyan-500 w-40"
              />
            </div>
            
            {/* AI Filter */}
            <select
              value={selectedAI}
              onChange={(e) => setSelectedAI(e.target.value)}
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All AIs</option>
              {aiModels.map(ai => (
                <option key={ai.id} value={ai.id}>{ai.display_name}</option>
              ))}
            </select>
            
            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-cyan-500"
            >
              <option value="date">Newest First</option>
              <option value="confidence">Highest Confidence</option>
              <option value="change">Best Performance</option>
            </select>
          </div>
        </div>
        
        {/* Picks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredPicks.length > 0 ? (
            filteredPicks.map((pick) => (
              <PickCard key={pick.id} pick={pick} />
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-gray-500">
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Loading picks...
                </div>
              ) : (
                <div>
                  <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No picks found</p>
                  <p className="text-sm mt-1">Try adjusting your filters</p>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Help Link */}
        <div className="mt-8 text-center">
          <Link 
            href="/help/understanding-picks" 
            className="inline-flex items-center gap-2 text-gray-400 hover:text-cyan-400 transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
            Need help understanding these picks?
          </Link>
        </div>
      </main>
    </div>
  );
}

// Stat Card Component
function StatCard({ icon: Icon, label, value, color }: { 
  icon: any; 
  label: string; 
  value: string | number;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    gray: 'bg-gray-800 text-gray-400',
    yellow: 'bg-yellow-500/10 text-yellow-400',
    emerald: 'bg-emerald-500/10 text-emerald-400',
    red: 'bg-red-500/10 text-red-400',
    purple: 'bg-purple-500/10 text-purple-400',
    indigo: 'bg-indigo-500/10 text-indigo-400',
    blue: 'bg-blue-500/10 text-blue-400',
    orange: 'bg-orange-500/10 text-orange-400',
  };
  
  return (
    <div className={`rounded-xl p-3 border border-gray-800 ${colorClasses[color] || colorClasses.gray}`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4" />
        <span className="text-[10px] uppercase tracking-wide opacity-80">{label}</span>
      </div>
      <div className="text-xl font-bold">{value}</div>
    </div>
  );
}
