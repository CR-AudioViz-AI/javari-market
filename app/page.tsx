'use client';

import { useEffect, useState, useMemo } from 'react';
import { 
  TrendingUp, TrendingDown, Target, Trophy, Flame, Filter, 
  BarChart3, PieChart, Coins, DollarSign, Bitcoin, Zap,
  ChevronDown, ChevronUp, Star, Award, Medal, Crown,
  Calendar, Download, RefreshCw, Search, X
} from 'lucide-react';
import { 
  getPicks, getAIModels, getAIStatistics, getHotPicks, getCategoryStats,
  type StockPick, type AIModel, type Category 
} from '@/lib/supabase';

// Category config
const CATEGORIES = {
  all: { name: 'All Assets', icon: BarChart3, color: 'indigo' },
  regular: { name: 'Regular Stocks', icon: DollarSign, color: 'blue' },
  penny: { name: 'Penny Stocks', icon: Coins, color: 'green' },
  crypto: { name: 'Crypto', icon: Bitcoin, color: 'orange' },
};

const AI_COLORS: Record<string, string> = {
  'GPT-4': '#10b981',
  'Claude': '#f59e0b', 
  'Gemini': '#3b82f6',
  'Perplexity': '#8b5cf6',
  'Javari': '#ef4444',
};

export default function DashboardPage() {
  // State
  const [picks, setPicks] = useState<StockPick[]>([]);
  const [aiModels, setAiModels] = useState<AIModel[]>([]);
  const [stats, setStats] = useState<any[]>([]);
  const [hotPicks, setHotPicks] = useState<any[]>([]);
  const [categoryStats, setCategoryStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [category, setCategory] = useState<Category>('all');
  const [selectedAI, setSelectedAI] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<string>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  
  // View state
  const [activeTab, setActiveTab] = useState<'overview' | 'picks' | 'leaderboard' | 'compare' | 'insights'>('overview');
  const [showFilters, setShowFilters] = useState(false);
  
  // Load data
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [category]);
  
  async function loadData() {
    setLoading(true);
    try {
      const [picksData, modelsData, statsData, hotData, catStats] = await Promise.all([
        getPicks({ category: category === 'all' ? undefined : category, limit: 500 }),
        getAIModels(),
        getAIStatistics(category === 'all' ? undefined : category),
        getHotPicks(category === 'all' ? undefined : category),
        getCategoryStats(),
      ]);
      
      setPicks(picksData);
      setAiModels(modelsData);
      setStats(statsData);
      setHotPicks(hotData);
      setCategoryStats(catStats);
    } catch (e) {
      console.error('Load error:', e);
    }
    setLoading(false);
  }
  
  // Filtered & sorted picks
  const filteredPicks = useMemo(() => {
    let result = [...picks];
    
    if (selectedAI !== 'all') {
      result = result.filter(p => p.ai_name?.toLowerCase().includes(selectedAI.toLowerCase()));
    }
    if (statusFilter !== 'all') {
      result = result.filter(p => p.status === statusFilter);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(p => 
        p.ticker.toLowerCase().includes(term) ||
        p.reasoning?.toLowerCase().includes(term)
      );
    }
    
    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case 'date': cmp = new Date(b.created_at).getTime() - new Date(a.created_at).getTime(); break;
        case 'confidence': cmp = (b.confidence || 0) - (a.confidence || 0); break;
        case 'profit': cmp = (b.profit_loss || 0) - (a.profit_loss || 0); break;
        case 'ticker': cmp = a.ticker.localeCompare(b.ticker); break;
      }
      return sortDir === 'desc' ? cmp : -cmp;
    });
    
    return result;
  }, [picks, selectedAI, statusFilter, searchTerm, sortBy, sortDir]);
  
  // Summary stats
  const summary = useMemo(() => {
    const total = filteredPicks.length;
    const active = filteredPicks.filter(p => p.status === 'active').length;
    const won = filteredPicks.filter(p => p.status === 'won').length;
    const lost = filteredPicks.filter(p => p.status === 'lost').length;
    const closed = won + lost;
    const winRate = closed > 0 ? (won / closed) * 100 : 0;
    const totalProfit = filteredPicks.reduce((s, p) => s + (p.profit_loss || 0), 0);
    const avgConfidence = total > 0 
      ? filteredPicks.reduce((s, p) => s + (p.confidence || 0), 0) / total 
      : 0;
    
    return { total, active, won, lost, winRate, totalProfit, avgConfidence };
  }, [filteredPicks]);
  
  // Leaderboard
  const leaderboard = useMemo(() => {
    return stats
      .sort((a, b) => b.points - a.points)
      .map((s, i) => ({ ...s, rank: i + 1 }));
  }, [stats]);
  
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gray-900/80 backdrop-blur-lg border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Market Oracle</h1>
                <p className="text-xs text-gray-400">AI Investment Battle</p>
              </div>
            </div>
            
            {/* Category Pills */}
            <div className="flex gap-2">
              {Object.entries(CATEGORIES).map(([key, cat]) => {
                const Icon = cat.icon;
                const isActive = category === key;
                return (
                  <button
                    key={key}
                    onClick={() => setCategory(key as Category)}
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all ${
                      isActive 
                        ? `bg-${cat.color}-500/20 text-${cat.color}-400 border border-${cat.color}-500/50` 
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {cat.name}
                  </button>
                );
              })}
            </div>
            
            <button 
              onClick={loadData}
              className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>
      
      {/* Tab Navigation */}
      <nav className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'picks', label: 'All Picks', icon: Target },
              { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
              { id: 'compare', label: 'Compare AIs', icon: Zap },
              { id: 'insights', label: 'Insights', icon: Flame },
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-3 flex items-center gap-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-400'
                      : 'border-transparent text-gray-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
          <StatCard label="Total Picks" value={summary.total} icon={Target} />
          <StatCard label="Active" value={summary.active} icon={Flame} color="yellow" />
          <StatCard label="Winners" value={summary.won} icon={TrendingUp} color="green" />
          <StatCard label="Losers" value={summary.lost} icon={TrendingDown} color="red" />
          <StatCard label="Win Rate" value={`${summary.winRate.toFixed(1)}%`} icon={Trophy} color="purple" />
          <StatCard label="Total P/L" value={`$${summary.totalProfit.toFixed(2)}`} icon={DollarSign} color={summary.totalProfit >= 0 ? 'green' : 'red'} />
          <StatCard label="Avg Confidence" value={`${summary.avgConfidence.toFixed(0)}%`} icon={Star} color="indigo" />
        </div>
        
        {/* Category Stats */}
        {category === 'all' && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            {Object.entries(categoryStats).map(([cat, data]: [string, any]) => (
              <div key={cat} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                <div className="flex items-center gap-2 mb-2">
                  {cat === 'regular' && <DollarSign className="w-5 h-5 text-blue-400" />}
                  {cat === 'penny' && <Coins className="w-5 h-5 text-green-400" />}
                  {cat === 'crypto' && <Bitcoin className="w-5 h-5 text-orange-400" />}
                  <span className="font-semibold capitalize">{cat}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">{data.total} picks</span>
                  <span className="text-green-400">{data.winRate.toFixed(1)}% win rate</span>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Tab Content */}
        {activeTab === 'overview' && (
          <OverviewTab 
            picks={filteredPicks} 
            stats={stats} 
            hotPicks={hotPicks}
            leaderboard={leaderboard}
          />
        )}
        
        {activeTab === 'picks' && (
          <PicksTab 
            picks={filteredPicks}
            aiModels={aiModels}
            selectedAI={selectedAI}
            setSelectedAI={setSelectedAI}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            sortBy={sortBy}
            setSortBy={setSortBy}
            sortDir={sortDir}
            setSortDir={setSortDir}
          />
        )}
        
        {activeTab === 'leaderboard' && (
          <LeaderboardTab leaderboard={leaderboard} category={category} />
        )}
        
        {activeTab === 'compare' && (
          <CompareTab stats={stats} picks={filteredPicks} />
        )}
        
        {activeTab === 'insights' && (
          <InsightsTab hotPicks={hotPicks} picks={filteredPicks} stats={stats} />
        )}
      </main>
    </div>
  );
}

// Stat Card Component
function StatCard({ label, value, icon: Icon, color = 'gray' }: { 
  label: string; 
  value: string | number; 
  icon: any; 
  color?: string 
}) {
  const colorClasses: Record<string, string> = {
    gray: 'bg-gray-800 text-gray-400',
    green: 'bg-green-500/10 text-green-400',
    red: 'bg-red-500/10 text-red-400',
    yellow: 'bg-yellow-500/10 text-yellow-400',
    purple: 'bg-purple-500/10 text-purple-400',
    indigo: 'bg-indigo-500/10 text-indigo-400',
    blue: 'bg-blue-500/10 text-blue-400',
  };
  
  return (
    <div className={`rounded-xl p-4 ${colorClasses[color]} border border-gray-800`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4" />
        <span className="text-xs uppercase tracking-wide opacity-80">{label}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

// Overview Tab
function OverviewTab({ picks, stats, hotPicks, leaderboard }: any) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Leaderboard Preview */}
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-400" />
          AI Leaderboard
        </h3>
        <div className="space-y-3">
          {leaderboard.slice(0, 5).map((ai: any, i: number) => (
            <div key={ai.aiName} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                i === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                i === 1 ? 'bg-gray-400/20 text-gray-300' :
                i === 2 ? 'bg-orange-500/20 text-orange-400' :
                'bg-gray-800 text-gray-400'
              }`}>
                {i + 1}
              </div>
              <div className="flex-1">
                <div className="font-medium">{ai.aiName}</div>
                <div className="text-xs text-gray-400">{ai.winRate.toFixed(1)}% win rate</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-indigo-400">{ai.points} pts</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Hot Picks */}
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-400" />
          Consensus Picks
        </h3>
        <div className="space-y-3">
          {hotPicks.slice(0, 5).map((pick: any) => (
            <div key={pick.ticker} className="flex items-center gap-3 p-2 bg-gray-800/50 rounded-lg">
              <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                <span className="font-bold text-indigo-400">{pick.ticker}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{pick.ticker}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    pick.direction === 'UP' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {pick.direction}
                  </span>
                </div>
                <div className="text-xs text-gray-400">
                  {pick.consensus} AIs agree • {pick.avgConfidence.toFixed(0)}% avg confidence
                </div>
              </div>
            </div>
          ))}
          {hotPicks.length === 0 && (
            <div className="text-center text-gray-400 py-4">No consensus picks yet</div>
          )}
        </div>
      </div>
      
      {/* Recent Winners */}
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-400" />
          Recent Winners
        </h3>
        <div className="space-y-3">
          {picks.filter((p: any) => p.status === 'won').slice(0, 5).map((pick: any) => (
            <div key={pick.id} className="flex items-center gap-3 p-2 bg-gray-800/50 rounded-lg">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-400" />
              </div>
              <div className="flex-1">
                <div className="font-medium">{pick.ticker}</div>
                <div className="text-xs text-gray-400">{pick.ai_name}</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-green-400">
                  +{pick.price_change_percent?.toFixed(1) || '?'}%
                </div>
              </div>
            </div>
          ))}
          {picks.filter((p: any) => p.status === 'won').length === 0 && (
            <div className="text-center text-gray-400 py-4">No winners yet</div>
          )}
        </div>
      </div>
    </div>
  );
}

// Picks Tab
function PicksTab({ picks, aiModels, selectedAI, setSelectedAI, statusFilter, setStatusFilter, searchTerm, setSearchTerm, sortBy, setSortBy, sortDir, setSortDir }: any) {
  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search ticker or reasoning..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:border-indigo-500 focus:outline-none"
          />
        </div>
        
        <select
          value={selectedAI}
          onChange={(e) => setSelectedAI(e.target.value)}
          className="px-4 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:border-indigo-500 focus:outline-none"
        >
          <option value="all">All AIs</option>
          {aiModels.map((ai: any) => (
            <option key={ai.id} value={ai.display_name}>{ai.display_name}</option>
          ))}
        </select>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:border-indigo-500 focus:outline-none"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="won">Winners</option>
          <option value="lost">Losers</option>
        </select>
        
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:border-indigo-500 focus:outline-none"
        >
          <option value="date">Sort by Date</option>
          <option value="confidence">Sort by Confidence</option>
          <option value="profit">Sort by Profit</option>
          <option value="ticker">Sort by Ticker</option>
        </select>
        
        <button
          onClick={() => setSortDir(sortDir === 'desc' ? 'asc' : 'desc')}
          className="px-3 py-2 bg-gray-800 rounded-lg border border-gray-700 hover:bg-gray-700"
        >
          {sortDir === 'desc' ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>
      
      {/* Picks Grid */}
      <div className="grid gap-4">
        {picks.map((pick: any) => (
          <PickCard key={pick.id} pick={pick} />
        ))}
        {picks.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            No picks found matching your filters
          </div>
        )}
      </div>
    </div>
  );
}

// Pick Card
function PickCard({ pick }: { pick: StockPick }) {
  const statusColors: Record<string, string> = {
    active: 'border-yellow-500/50 bg-yellow-500/5',
    won: 'border-green-500/50 bg-green-500/5',
    lost: 'border-red-500/50 bg-red-500/5',
    expired: 'border-gray-500/50 bg-gray-500/5',
  };
  
  return (
    <div className={`rounded-xl p-4 border ${statusColors[pick.status]} transition-all hover:scale-[1.01]`}>
      <div className="flex items-start gap-4">
        {/* Ticker */}
        <div className="flex-shrink-0">
          <div className="w-14 h-14 bg-gray-800 rounded-xl flex items-center justify-center">
            <span className="font-bold text-lg">{pick.ticker}</span>
          </div>
          <div className="text-center mt-1">
            <span className={`text-xs px-2 py-0.5 rounded capitalize ${
              pick.category === 'crypto' ? 'bg-orange-500/20 text-orange-400' :
              pick.category === 'penny' ? 'bg-green-500/20 text-green-400' :
              'bg-blue-500/20 text-blue-400'
            }`}>
              {pick.category}
            </span>
          </div>
        </div>
        
        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold">{pick.ai_name}</span>
            <span className={`text-xs px-2 py-0.5 rounded ${
              pick.direction === 'UP' ? 'bg-green-500/20 text-green-400' :
              pick.direction === 'DOWN' ? 'bg-red-500/20 text-red-400' :
              'bg-gray-500/20 text-gray-400'
            }`}>
              {pick.direction}
            </span>
            <span className="text-xs text-gray-400">{(pick.confidence || 0)}% confidence</span>
          </div>
          
          <p className="text-sm text-gray-400 line-clamp-2 mb-2">{pick.reasoning}</p>
          
          <div className="flex gap-4 text-xs">
            <div>
              <span className="text-gray-500">Entry:</span>{' '}
              <span className="text-white">${pick.entry_price?.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-gray-500">Target:</span>{' '}
              <span className="text-green-400">${pick.target_price?.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-gray-500">Stop:</span>{' '}
              <span className="text-red-400">${pick.stop_loss?.toFixed(2)}</span>
            </div>
            {pick.current_price && (
              <div>
                <span className="text-gray-500">Current:</span>{' '}
                <span className="text-indigo-400">${(pick.current_price || 0).toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Status & P/L - Shows ACTUAL performance */}
        <div className="text-right flex-shrink-0">
          <div className={`text-lg font-bold ${
            pick.status === 'won' ? 'text-green-400' :
            pick.status === 'lost' ? 'text-red-400' :
            pick.current_price && pick.price_change_percent !== null
              ? (pick.price_change_percent >= 0 ? 'text-green-400' : 'text-red-400')
              : 'text-yellow-400'
          }`}>
            {pick.current_price && pick.price_change_percent !== null
              ? `${pick.price_change_percent >= 0 ? '+' : ''}${pick.price_change_percent.toFixed(1)}%`
              : pick.status === 'active' 
                ? 'PENDING'
                : pick.status.toUpperCase()}
          </div>
          {pick.current_price && pick.price_change_percent !== null && (
            <div className={`text-xs ${pick.price_change_percent >= 0 ? 'text-green-400/70' : 'text-red-400/70'}`}>
              {pick.price_change_percent >= 0 ? '↑' : '↓'} ${Math.abs(pick.current_price - pick.entry_price).toFixed(2)}
            </div>
          )}
          {pick.points_earned !== null && pick.points_earned !== 0 && (
            <div className="text-sm text-gray-400">
              {pick.points_earned > 0 ? '+' : ''}{pick.points_earned} pts
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Leaderboard Tab
function LeaderboardTab({ leaderboard, category }: { leaderboard: any[]; category: Category }) {
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      <div className="p-4 border-b border-gray-800">
        <h3 className="font-semibold flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-400" />
          {category === 'all' ? 'Overall' : category.charAt(0).toUpperCase() + category.slice(1)} Leaderboard
        </h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-800/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Rank</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">AI</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-400">Picks</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-400">W/L</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-400">Win Rate</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Profit</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Points</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {leaderboard.map((ai, i) => (
              <tr key={ai.aiName} className="hover:bg-gray-800/30 transition-colors">
                <td className="px-4 py-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    i === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                    i === 1 ? 'bg-gray-400/20 text-gray-300' :
                    i === 2 ? 'bg-orange-500/20 text-orange-400' :
                    'bg-gray-800 text-gray-400'
                  }`}>
                    {i === 0 ? <Crown className="w-4 h-4" /> : i + 1}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: AI_COLORS[ai.aiName] || '#6366f1' }}
                    />
                    <span className="font-semibold">{ai.aiName}</span>
                  </div>
                </td>
                <td className="px-4 py-4 text-center">{ai.totalPicks}</td>
                <td className="px-4 py-4 text-center">
                  <span className="text-green-400">{ai.totalWins}</span>
                  <span className="text-gray-500">/</span>
                  <span className="text-red-400">{ai.totalLosses}</span>
                </td>
                <td className="px-4 py-4 text-center">
                  <span className={ai.winRate >= 50 ? 'text-green-400' : 'text-red-400'}>
                    {ai.winRate.toFixed(1)}%
                  </span>
                </td>
                <td className={`px-4 py-4 text-right font-medium ${
                  ai.totalProfitLoss >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  ${ai.totalProfitLoss.toFixed(2)}
                </td>
                <td className="px-4 py-4 text-right font-bold text-indigo-400">
                  {ai.points}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Compare Tab
function CompareTab({ stats, picks }: { stats: any[]; picks: StockPick[] }) {
  const [ai1, setAi1] = useState<string>(stats[0]?.aiName || '');
  const [ai2, setAi2] = useState<string>(stats[1]?.aiName || '');
  
  const ai1Stats = stats.find(s => s.aiName === ai1);
  const ai2Stats = stats.find(s => s.aiName === ai2);
  
  return (
    <div>
      <div className="flex gap-4 mb-6">
        <select
          value={ai1}
          onChange={(e) => setAi1(e.target.value)}
          className="flex-1 px-4 py-2 bg-gray-800 rounded-lg border border-gray-700"
        >
          {stats.map(s => (
            <option key={s.aiName} value={s.aiName}>{s.aiName}</option>
          ))}
        </select>
        <div className="flex items-center text-gray-400">VS</div>
        <select
          value={ai2}
          onChange={(e) => setAi2(e.target.value)}
          className="flex-1 px-4 py-2 bg-gray-800 rounded-lg border border-gray-700"
        >
          {stats.map(s => (
            <option key={s.aiName} value={s.aiName}>{s.aiName}</option>
          ))}
        </select>
      </div>
      
      {ai1Stats && ai2Stats && (
        <div className="grid grid-cols-3 gap-4">
          <CompareCard label="Total Picks" v1={ai1Stats.totalPicks} v2={ai2Stats.totalPicks} />
          <CompareCard label="Win Rate" v1={ai1Stats.winRate} v2={ai2Stats.winRate} format="percent" />
          <CompareCard label="Winners" v1={ai1Stats.totalWins} v2={ai2Stats.totalWins} />
          <CompareCard label="Losers" v1={ai1Stats.totalLosses} v2={ai2Stats.totalLosses} inverse />
          <CompareCard label="Profit/Loss" v1={ai1Stats.totalProfitLoss} v2={ai2Stats.totalProfitLoss} format="currency" />
          <CompareCard label="Points" v1={ai1Stats.points} v2={ai2Stats.points} />
          <CompareCard label="Avg Confidence" v1={ai1Stats.avgConfidence} v2={ai2Stats.avgConfidence} format="percent" />
        </div>
      )}
    </div>
  );
}

function CompareCard({ label, v1, v2, format, inverse }: { 
  label: string; 
  v1: number; 
  v2: number; 
  format?: 'percent' | 'currency';
  inverse?: boolean;
}) {
  const winner = inverse ? (v1 < v2 ? 1 : v1 > v2 ? 2 : 0) : (v1 > v2 ? 1 : v1 < v2 ? 2 : 0);
  
  const formatValue = (v: number) => {
    if (format === 'percent') return `${v.toFixed(1)}%`;
    if (format === 'currency') return `$${v.toFixed(2)}`;
    return v.toString();
  };
  
  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
      <div className="text-xs text-gray-400 uppercase tracking-wide mb-3">{label}</div>
      <div className="flex justify-between items-center">
        <div className={`text-2xl font-bold ${winner === 1 ? 'text-green-400' : 'text-white'}`}>
          {formatValue(v1)}
        </div>
        <div className={`text-2xl font-bold ${winner === 2 ? 'text-green-400' : 'text-white'}`}>
          {formatValue(v2)}
        </div>
      </div>
    </div>
  );
}

// Insights Tab
function InsightsTab({ hotPicks, picks, stats }: { hotPicks: any[]; picks: StockPick[]; stats: any[] }) {
  // Best performer this period
  const bestAI = stats[0];
  
  // Best single pick
  const bestPick = [...picks]
    .filter(p => p.status === 'won')
    .sort((a, b) => (b.price_change_percent || 0) - (a.price_change_percent || 0))[0];
  
  // Most active ticker
  const tickerCounts = picks.reduce((acc, p) => {
    acc[p.ticker] = (acc[p.ticker] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const mostActive = Object.entries(tickerCounts).sort((a, b) => b[1] - a[1])[0];
  
  return (
    <div className="space-y-6">
      {/* Key Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {bestAI && (
          <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl p-6 border border-yellow-500/30">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-5 h-5 text-yellow-400" />
              <span className="text-sm text-yellow-400">Leading AI</span>
            </div>
            <div className="text-2xl font-bold">{bestAI.aiName}</div>
            <div className="text-sm text-gray-400 mt-1">
              {bestAI.points} points • {bestAI.winRate.toFixed(1)}% win rate
            </div>
          </div>
        )}
        
        {bestPick && (
          <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl p-6 border border-green-500/30">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <span className="text-sm text-green-400">Best Pick</span>
            </div>
            <div className="text-2xl font-bold">{bestPick.ticker}</div>
            <div className="text-sm text-gray-400 mt-1">
              +{bestPick.price_change_percent?.toFixed(1)}% by {bestPick.ai_name}
            </div>
          </div>
        )}
        
        {mostActive && (
          <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl p-6 border border-indigo-500/30">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-5 h-5 text-indigo-400" />
              <span className="text-sm text-indigo-400">Most Picked</span>
            </div>
            <div className="text-2xl font-bold">{mostActive[0]}</div>
            <div className="text-sm text-gray-400 mt-1">
              {mostActive[1]} picks across all AIs
            </div>
          </div>
        )}
      </div>
      
      {/* Consensus Picks */}
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-400" />
          AI Consensus (2+ AIs agree)
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {hotPicks.map((pick: any) => (
            <div key={pick.ticker} className="bg-gray-800/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-bold">{pick.ticker}</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  pick.direction === 'UP' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {pick.direction}
                </span>
              </div>
              <div className="text-sm text-gray-400 mb-2">
                <span className="text-indigo-400 font-semibold">{pick.consensus} AIs</span> agree
              </div>
              <div className="flex flex-wrap gap-1">
                {pick.aiNames.map((name: string) => (
                  <span 
                    key={name} 
                    className="text-xs px-2 py-0.5 rounded-full bg-gray-700"
                    style={{ borderLeft: `3px solid ${AI_COLORS[name] || '#6366f1'}` }}
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
          ))}
          
          {hotPicks.length === 0 && (
            <div className="col-span-full text-center py-8 text-gray-400">
              No consensus picks found yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
