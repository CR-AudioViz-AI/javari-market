'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Star, Plus, X, TrendingUp, TrendingDown, RefreshCw,
  Search, Bell, BellOff, ArrowUpRight, ArrowDownRight,
  Eye, HelpCircle, Target, Filter
} from 'lucide-react';
import { getPicks, type StockPick } from '@/lib/supabase';
import { JavariHelpButton } from '@/components/JavariWidget';

// Local storage key
const WATCHLIST_STORAGE_KEY = 'market-oracle-watchlist';

// Get watchlist from localStorage
function getStoredWatchlist(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(WATCHLIST_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Save watchlist to localStorage
function saveWatchlist(ids: string[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(ids));
}

// Watchlist Pick Card with Entry | Current (↑↓) | Target
function WatchlistCard({ 
  pick, 
  onRemove 
}: { 
  pick: StockPick; 
  onRemove: () => void;
}) {
  const priceChange = pick.price_change_percent || 0;
  const isUp = priceChange >= 0;
  const hasCurrentPrice = pick.current_price !== null;
  
  // Progress to target
  const progressToTarget = hasCurrentPrice && pick.target_price && pick.entry_price
    ? Math.min(100, Math.max(0, ((pick.current_price! - pick.entry_price) / (pick.target_price - pick.entry_price)) * 100))
    : 0;

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 hover:border-yellow-600/50 transition-all group">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
            style={{ backgroundColor: pick.ai_color || '#6366f1' }}
          >
            {pick.ticker.slice(0, 2)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-lg">{pick.ticker}</h3>
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            </div>
            <p className="text-xs text-gray-400">{pick.ai_display_name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1 px-2 py-1 rounded text-sm font-medium ${
            isUp ? 'bg-emerald-900/30 text-emerald-400' : 'bg-red-900/30 text-red-400'
          }`}>
            {isUp ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            {Math.abs(priceChange).toFixed(1)}%
          </div>
          <button
            onClick={onRemove}
            className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
            title="Remove from watchlist"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Price Display: Entry | Current | Target */}
      <div className="grid grid-cols-3 gap-2 mb-3 text-center">
        <div className="bg-gray-900/50 rounded-lg py-2 px-1">
          <div className="text-[10px] text-gray-500 uppercase tracking-wide">Entry</div>
          <div className="text-sm font-semibold text-gray-300">
            ${pick.entry_price?.toFixed(2) || '—'}
          </div>
        </div>
        
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
        
        <div className="bg-gray-900/50 rounded-lg py-2 px-1">
          <div className="text-[10px] text-gray-500 uppercase tracking-wide">Target</div>
          <div className="text-sm font-semibold text-cyan-400">
            ${pick.target_price?.toFixed(2) || '—'}
          </div>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex justify-between text-[10px] text-gray-500 mb-1">
          <span>Progress to Target</span>
          <span>{progressToTarget.toFixed(0)}%</span>
        </div>
        <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full ${
              progressToTarget >= 100 ? 'bg-emerald-500' : 
              progressToTarget >= 50 ? 'bg-cyan-500' : 
              progressToTarget >= 0 ? 'bg-blue-500' : 'bg-red-500'
            }`}
            style={{ width: `${Math.max(0, progressToTarget)}%` }}
          />
        </div>
      </div>
      
      {/* Footer */}
      <div className="flex items-center justify-between text-xs">
        <span className={`px-2 py-0.5 rounded ${
          pick.direction === 'UP' 
            ? 'bg-emerald-900/30 text-emerald-400' 
            : 'bg-red-900/30 text-red-400'
        }`}>
          {pick.direction}
        </span>
        <span className="text-gray-500">{pick.confidence}% confidence</span>
      </div>
    </div>
  );
}

// Add to Watchlist Card (mini version)
function AddPickCard({ 
  pick, 
  onAdd 
}: { 
  pick: StockPick; 
  onAdd: () => void;
}) {
  const priceChange = pick.price_change_percent || 0;
  const isUp = priceChange >= 0;

  return (
    <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-3 hover:border-gray-600 transition-all">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div 
            className="w-8 h-8 rounded flex items-center justify-center text-white font-bold text-xs"
            style={{ backgroundColor: pick.ai_color || '#6366f1' }}
          >
            {pick.ticker.slice(0, 2)}
          </div>
          <div>
            <div className="font-semibold text-sm">{pick.ticker}</div>
            <div className="text-[10px] text-gray-500">{pick.ai_display_name}</div>
          </div>
        </div>
        <div className={`text-xs font-medium ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
          {isUp ? '+' : ''}{priceChange.toFixed(1)}%
        </div>
      </div>
      
      {/* Mini price display */}
      <div className="flex justify-between text-xs text-gray-400 mb-2">
        <span>${pick.entry_price?.toFixed(2)}</span>
        <span>→</span>
        <span className="text-cyan-400">${pick.target_price?.toFixed(2)}</span>
      </div>
      
      <button
        onClick={onAdd}
        className="w-full flex items-center justify-center gap-1 px-2 py-1.5 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 rounded transition-colors text-xs font-medium"
      >
        <Star className="w-3 h-3" />
        Add to Watchlist
      </button>
    </div>
  );
}

export default function WatchlistPage() {
  const [picks, setPicks] = useState<StockPick[]>([]);
  const [watchlistIds, setWatchlistIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Load data
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);
  
  // Load watchlist from localStorage
  useEffect(() => {
    setWatchlistIds(getStoredWatchlist());
  }, []);
  
  async function loadData() {
    setLoading(true);
    try {
      const data = await getPicks({ limit: 500 });
      setPicks(data);
    } catch (e) {
      console.error('Error:', e);
    }
    setLoading(false);
  }
  
  // Watchlist picks
  const watchlistPicks = useMemo(() => {
    const idSet = new Set(watchlistIds);
    return picks.filter(p => idSet.has(p.id));
  }, [picks, watchlistIds]);
  
  // Available picks (not in watchlist)
  const availablePicks = useMemo(() => {
    const idSet = new Set(watchlistIds);
    let available = picks.filter(p => !idSet.has(p.id));
    
    if (search) {
      const term = search.toLowerCase();
      available = available.filter(p => 
        p.ticker.toLowerCase().includes(term) ||
        p.ai_display_name?.toLowerCase().includes(term)
      );
    }
    
    return available;
  }, [picks, watchlistIds, search]);
  
  // Add to watchlist
  const addToWatchlist = (pickId: string) => {
    const updated = [...watchlistIds, pickId];
    setWatchlistIds(updated);
    saveWatchlist(updated);
  };
  
  // Remove from watchlist
  const removeFromWatchlist = (pickId: string) => {
    const updated = watchlistIds.filter(id => id !== pickId);
    setWatchlistIds(updated);
    saveWatchlist(updated);
  };
  
  // Watchlist stats
  const stats = useMemo(() => {
    let totalGain = 0;
    let gainers = 0;
    let losers = 0;
    
    watchlistPicks.forEach(p => {
      const change = p.price_change_percent || 0;
      totalGain += change;
      if (change > 0) gainers++;
      else if (change < 0) losers++;
    });
    
    return {
      total: watchlistPicks.length,
      avgGain: watchlistPicks.length > 0 ? totalGain / watchlistPicks.length : 0,
      gainers,
      losers,
    };
  }, [watchlistPicks]);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-3 flex items-center justify-center gap-3">
            <Star className="w-10 h-10 text-yellow-400 fill-yellow-400" />
            <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              Watchlist
            </span>
            <JavariHelpButton topic="watchlist how to use" />
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Track your favorite AI picks. Your watchlist is saved locally and updates with real-time prices.
          </p>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-yellow-900/20 rounded-xl p-4 border border-yellow-800/30">
            <div className="flex items-center gap-2 text-yellow-400 text-sm mb-1">
              <Star className="w-4 h-4" />
              Watching
            </div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </div>
          <div className={`rounded-xl p-4 border ${
            stats.avgGain >= 0 
              ? 'bg-emerald-900/20 border-emerald-800/30' 
              : 'bg-red-900/20 border-red-800/30'
          }`}>
            <div className="text-sm text-gray-400 mb-1">Avg Change</div>
            <div className={`text-2xl font-bold ${stats.avgGain >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {stats.avgGain >= 0 ? '+' : ''}{stats.avgGain.toFixed(1)}%
            </div>
          </div>
          <div className="bg-emerald-900/20 rounded-xl p-4 border border-emerald-800/30">
            <div className="flex items-center gap-2 text-emerald-400 text-sm mb-1">
              <TrendingUp className="w-4 h-4" />
              Gainers
            </div>
            <div className="text-2xl font-bold text-emerald-400">{stats.gainers}</div>
          </div>
          <div className="bg-red-900/20 rounded-xl p-4 border border-red-800/30">
            <div className="flex items-center gap-2 text-red-400 text-sm mb-1">
              <TrendingDown className="w-4 h-4" />
              Losers
            </div>
            <div className="text-2xl font-bold text-red-400">{stats.losers}</div>
          </div>
        </div>
        
        {/* Watchlist Section */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Eye className="w-5 h-5 text-yellow-400" />
              Your Watchlist
            </h2>
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
          
          {watchlistPicks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {watchlistPicks.map(pick => (
                <WatchlistCard
                  key={pick.id}
                  pick={pick}
                  onRemove={() => removeFromWatchlist(pick.id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-900/30 rounded-xl border border-gray-800">
              <Star className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-400 mb-2">Your Watchlist is Empty</h3>
              <p className="text-gray-500 text-sm">Add picks from below to start tracking them</p>
            </div>
          )}
        </div>
        
        {/* Add to Watchlist Section */}
        <div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Plus className="w-5 h-5 text-cyan-400" />
              Add to Watchlist
            </h2>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search ticker or AI..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-cyan-500 w-full md:w-64"
              />
            </div>
          </div>
          
          {availablePicks.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {availablePicks.slice(0, 20).map(pick => (
                <AddPickCard
                  key={pick.id}
                  pick={pick}
                  onAdd={() => addToWatchlist(pick.id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              {picks.length === watchlistIds.length 
                ? 'All picks are in your watchlist!' 
                : 'No picks found matching your search'}
            </div>
          )}
          
          {availablePicks.length > 20 && (
            <p className="text-center text-gray-500 text-sm mt-4">
              Showing 20 of {availablePicks.length} available picks. Use search to find specific stocks.
            </p>
          )}
        </div>
        
        {/* Help Section */}
        <div className="mt-12 bg-gray-900/50 rounded-xl p-6 border border-gray-800">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-cyan-400" />
            About Your Watchlist
          </h3>
          <div className="grid md:grid-cols-3 gap-6 text-sm text-gray-400">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-5 h-5 text-yellow-400" />
                <span className="font-medium text-white">Save Locally</span>
              </div>
              <p>
                Your watchlist is saved in your browser's local storage. 
                It persists across sessions but is specific to this device.
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-cyan-400" />
                <span className="font-medium text-white">Entry | Current | Target</span>
              </div>
              <p>
                Every watchlist item shows Entry, Current (with ↑↓ trend), and Target prices. 
                Track progress toward AI targets in real-time.
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <RefreshCw className="w-5 h-5 text-emerald-400" />
                <span className="font-medium text-white">Auto-Update</span>
              </div>
              <p>
                Prices refresh automatically every 30 seconds. 
                Click Refresh to update manually.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
