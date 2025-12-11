'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Briefcase, TrendingUp, TrendingDown, Plus, Trash2, 
  RefreshCw, DollarSign, Percent, Target, PieChart,
  ArrowUpRight, ArrowDownRight, Star, Eye, EyeOff,
  Download, HelpCircle, Brain, Wallet
} from 'lucide-react';
import { getPicks, getAIModels, type StockPick, type AIModel } from '@/lib/supabase';

// Local storage key for tracked positions
const PORTFOLIO_STORAGE_KEY = 'market-oracle-portfolio';

interface PortfolioPosition {
  pickId: string;
  ticker: string;
  shares: number;
  addedAt: string;
}

// Get portfolio from localStorage
function getStoredPortfolio(): PortfolioPosition[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(PORTFOLIO_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Save portfolio to localStorage
function savePortfolio(positions: PortfolioPosition[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PORTFOLIO_STORAGE_KEY, JSON.stringify(positions));
}

// Position Card with Entry | Current (↑↓) | Target
function PositionCard({ 
  pick, 
  position, 
  onUpdateShares, 
  onRemove 
}: { 
  pick: StockPick; 
  position: PortfolioPosition;
  onUpdateShares: (shares: number) => void;
  onRemove: () => void;
}) {
  const [editingShares, setEditingShares] = useState(false);
  const [tempShares, setTempShares] = useState(position.shares.toString());
  
  const priceChange = pick.price_change_percent || 0;
  const isUp = priceChange >= 0;
  const hasCurrentPrice = pick.current_price !== null;
  
  // Calculate position P/L
  const positionValue = hasCurrentPrice ? position.shares * pick.current_price! : 0;
  const positionCost = position.shares * pick.entry_price;
  const positionPL = positionValue - positionCost;
  const positionPLPercent = positionCost > 0 ? (positionPL / positionCost) * 100 : 0;
  
  // Progress to target
  const progressToTarget = hasCurrentPrice && pick.target_price && pick.entry_price
    ? Math.min(100, Math.max(0, ((pick.current_price! - pick.entry_price) / (pick.target_price - pick.entry_price)) * 100))
    : 0;

  const handleSaveShares = () => {
    const newShares = parseInt(tempShares) || 1;
    onUpdateShares(Math.max(1, newShares));
    setEditingShares(false);
  };

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 hover:border-gray-600 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold"
            style={{ backgroundColor: pick.ai_color || '#6366f1' }}
          >
            {pick.ticker.slice(0, 2)}
          </div>
          <div>
            <h3 className="font-bold text-white text-lg">{pick.ticker}</h3>
            <p className="text-xs text-gray-400">{pick.ai_display_name}</p>
          </div>
        </div>
        <button
          onClick={onRemove}
          className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
          title="Remove from portfolio"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      
      {/* Price Display: Entry | Current | Target */}
      <div className="grid grid-cols-3 gap-2 mb-4 text-center">
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
      
      {/* Shares + Position Value */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-900/50 rounded-lg p-3">
          <div className="text-xs text-gray-500 mb-1">Shares</div>
          {editingShares ? (
            <div className="flex gap-2">
              <input
                type="number"
                value={tempShares}
                onChange={(e) => setTempShares(e.target.value)}
                className="w-16 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm"
                min="1"
                autoFocus
              />
              <button
                onClick={handleSaveShares}
                className="px-2 py-1 bg-cyan-600 rounded text-xs"
              >
                Save
              </button>
            </div>
          ) : (
            <div 
              className="text-lg font-bold text-white cursor-pointer hover:text-cyan-400"
              onClick={() => {
                setTempShares(position.shares.toString());
                setEditingShares(true);
              }}
              title="Click to edit"
            >
              {position.shares}
            </div>
          )}
        </div>
        <div className="bg-gray-900/50 rounded-lg p-3">
          <div className="text-xs text-gray-500 mb-1">Position Value</div>
          <div className="text-lg font-bold text-white">
            ${positionValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>
      
      {/* Position P/L */}
      <div className={`rounded-lg p-3 mb-3 ${
        positionPL >= 0 ? 'bg-emerald-900/20 border border-emerald-800/30' : 'bg-red-900/20 border border-red-800/30'
      }`}>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Position P/L</span>
          <div className={`flex items-center gap-2 font-bold ${
            positionPL >= 0 ? 'text-emerald-400' : 'text-red-400'
          }`}>
            {positionPL >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            <span>${Math.abs(positionPL).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span className="text-sm">({positionPLPercent >= 0 ? '+' : ''}{positionPLPercent.toFixed(1)}%)</span>
          </div>
        </div>
      </div>
      
      {/* Progress to Target */}
      <div>
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
    </div>
  );
}

// Add Pick Modal
function AddPickModal({ 
  picks, 
  existingIds, 
  onAdd, 
  onClose 
}: { 
  picks: StockPick[]; 
  existingIds: Set<string>;
  onAdd: (pick: StockPick, shares: number) => void;
  onClose: () => void;
}) {
  const [selectedPick, setSelectedPick] = useState<StockPick | null>(null);
  const [shares, setShares] = useState(10);
  const [search, setSearch] = useState('');
  
  const availablePicks = picks.filter(p => !existingIds.has(p.id));
  const filteredPicks = availablePicks.filter(p => 
    p.ticker.toLowerCase().includes(search.toLowerCase()) ||
    p.ai_display_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl border border-gray-700 w-full max-w-lg max-h-[80vh] overflow-hidden">
        <div className="p-4 border-b border-gray-800">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Plus className="w-5 h-5 text-cyan-400" />
            Add to Portfolio
          </h3>
        </div>
        
        {!selectedPick ? (
          <>
            <div className="p-4 border-b border-gray-800">
              <input
                type="text"
                placeholder="Search ticker or AI..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div className="max-h-80 overflow-y-auto p-4">
              {filteredPicks.length > 0 ? (
                <div className="space-y-2">
                  {filteredPicks.map(pick => (
                    <button
                      key={pick.id}
                      onClick={() => setSelectedPick(pick)}
                      className="w-full flex items-center gap-3 p-3 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg transition-colors text-left"
                    >
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                        style={{ backgroundColor: pick.ai_color || '#6366f1' }}
                      >
                        {pick.ticker.slice(0, 2)}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold">{pick.ticker}</div>
                        <div className="text-xs text-gray-400">{pick.ai_display_name}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">${pick.entry_price?.toFixed(2)}</div>
                        <div className={`text-xs ${(pick.price_change_percent || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {(pick.price_change_percent || 0) >= 0 ? '+' : ''}{(pick.price_change_percent || 0).toFixed(1)}%
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {availablePicks.length === 0 ? 'All picks already in portfolio' : 'No picks found'}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="p-4">
            <div className="flex items-center gap-3 mb-6 p-3 bg-gray-800/50 rounded-lg">
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: selectedPick.ai_color || '#6366f1' }}
              >
                {selectedPick.ticker.slice(0, 2)}
              </div>
              <div>
                <div className="font-bold text-lg">{selectedPick.ticker}</div>
                <div className="text-sm text-gray-400">{selectedPick.ai_display_name}</div>
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm text-gray-400 mb-2">Number of Shares</label>
              <input
                type="number"
                value={shares}
                onChange={(e) => setShares(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-lg focus:outline-none focus:border-cyan-500"
                min="1"
              />
            </div>
            
            <div className="bg-gray-800/50 rounded-lg p-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Entry Price</span>
                <span>${selectedPick.entry_price?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-gray-400">Position Cost</span>
                <span className="font-bold">${(shares * (selectedPick.entry_price || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedPick(null)}
                className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => {
                  onAdd(selectedPick, shares);
                  onClose();
                }}
                className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-colors font-medium"
              >
                Add to Portfolio
              </button>
            </div>
          </div>
        )}
        
        <div className="p-4 border-t border-gray-800">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PortfolioPage() {
  const [picks, setPicks] = useState<StockPick[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Load data
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);
  
  // Load portfolio from localStorage on mount
  useEffect(() => {
    setPortfolio(getStoredPortfolio());
  }, []);
  
  async function loadData() {
    setLoading(true);
    try {
      const picksData = await getPicks({ limit: 500 });
      setPicks(picksData);
    } catch (e) {
      console.error('Load error:', e);
    }
    setLoading(false);
  }
  
  // Portfolio picks (matched with current data)
  const portfolioPicks = useMemo(() => {
    const pickMap = new Map(picks.map(p => [p.id, p]));
    return portfolio
      .map(pos => ({
        position: pos,
        pick: pickMap.get(pos.pickId)
      }))
      .filter((item): item is { position: PortfolioPosition; pick: StockPick } => item.pick !== undefined);
  }, [picks, portfolio]);
  
  // Portfolio stats
  const stats = useMemo(() => {
    let totalValue = 0;
    let totalCost = 0;
    let totalPL = 0;
    
    portfolioPicks.forEach(({ position, pick }) => {
      const value = position.shares * (pick.current_price || pick.entry_price);
      const cost = position.shares * pick.entry_price;
      totalValue += value;
      totalCost += cost;
      totalPL += value - cost;
    });
    
    return {
      totalValue,
      totalCost,
      totalPL,
      totalPLPercent: totalCost > 0 ? (totalPL / totalCost) * 100 : 0,
      positionCount: portfolioPicks.length,
    };
  }, [portfolioPicks]);
  
  // Add position
  const addPosition = (pick: StockPick, shares: number) => {
    const newPosition: PortfolioPosition = {
      pickId: pick.id,
      ticker: pick.ticker,
      shares,
      addedAt: new Date().toISOString(),
    };
    const updated = [...portfolio, newPosition];
    setPortfolio(updated);
    savePortfolio(updated);
  };
  
  // Update shares
  const updateShares = (pickId: string, shares: number) => {
    const updated = portfolio.map(p => 
      p.pickId === pickId ? { ...p, shares } : p
    );
    setPortfolio(updated);
    savePortfolio(updated);
  };
  
  // Remove position
  const removePosition = (pickId: string) => {
    const updated = portfolio.filter(p => p.pickId !== pickId);
    setPortfolio(updated);
    savePortfolio(updated);
  };
  
  const existingIds = new Set(portfolio.map(p => p.pickId));

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-3 flex items-center justify-center gap-3">
            <Briefcase className="w-10 h-10 text-cyan-400" />
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Portfolio Tracker
            </span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Track AI picks you're following. Add picks from the battle to see your hypothetical gains in real-time.
          </p>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
              <Wallet className="w-4 h-4" />
              Positions
            </div>
            <div className="text-2xl font-bold">{stats.positionCount}</div>
          </div>
          <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
              <DollarSign className="w-4 h-4" />
              Total Cost
            </div>
            <div className="text-2xl font-bold">
              ${stats.totalCost.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
          </div>
          <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
              <Target className="w-4 h-4" />
              Current Value
            </div>
            <div className="text-2xl font-bold text-cyan-400">
              ${stats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
          </div>
          <div className={`rounded-xl p-4 border ${
            stats.totalPL >= 0 
              ? 'bg-emerald-900/20 border-emerald-800/50' 
              : 'bg-red-900/20 border-red-800/50'
          }`}>
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
              {stats.totalPL >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              Total P/L
            </div>
            <div className={`text-2xl font-bold ${stats.totalPL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {stats.totalPL >= 0 ? '+' : ''}${stats.totalPL.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
          </div>
          <div className={`rounded-xl p-4 border ${
            stats.totalPLPercent >= 0 
              ? 'bg-emerald-900/20 border-emerald-800/50' 
              : 'bg-red-900/20 border-red-800/50'
          }`}>
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
              <Percent className="w-4 h-4" />
              Return
            </div>
            <div className={`text-2xl font-bold ${stats.totalPLPercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {stats.totalPLPercent >= 0 ? '+' : ''}{stats.totalPLPercent.toFixed(1)}%
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <PieChart className="w-5 h-5 text-cyan-400" />
            Your Positions
          </h2>
          <div className="flex gap-3">
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-colors font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Pick
            </button>
          </div>
        </div>
        
        {/* Portfolio Grid */}
        {portfolioPicks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {portfolioPicks.map(({ position, pick }) => (
              <PositionCard
                key={position.pickId}
                pick={pick}
                position={position}
                onUpdateShares={(shares) => updateShares(position.pickId, shares)}
                onRemove={() => removePosition(position.pickId)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-gray-900/30 rounded-xl border border-gray-800">
            <Briefcase className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">Your Portfolio is Empty</h3>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              Add AI picks to track their performance as if you owned them. 
              See Entry, Current (with trend arrows), and Target prices in real-time.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              Add Your First Pick
            </button>
          </div>
        )}
        
        {/* Help Section */}
        <div className="mt-12 bg-gray-900/50 rounded-xl p-6 border border-gray-800">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-cyan-400" />
            How Portfolio Tracking Works
          </h3>
          <div className="grid md:grid-cols-3 gap-6 text-sm text-gray-400">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Plus className="w-5 h-5 text-emerald-400" />
                <span className="font-medium text-white">Add Picks</span>
              </div>
              <p>
                Select any AI pick from the battle and specify how many shares you'd like to track. 
                Your portfolio is saved locally on your device.
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-cyan-400" />
                <span className="font-medium text-white">Track Progress</span>
              </div>
              <p>
                Every pick shows Entry, Current (with ↑↓ trend arrow), and Target prices. 
                Watch your hypothetical gains update in real-time.
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-5 h-5 text-purple-400" />
                <span className="font-medium text-white">Follow AIs</span>
              </div>
              <p>
                Track picks from different AI models to see which strategies would have 
                worked best for you. Learn from the AI battle!
              </p>
            </div>
          </div>
        </div>
      </main>
      
      {/* Add Pick Modal */}
      {showAddModal && (
        <AddPickModal
          picks={picks}
          existingIds={existingIds}
          onAdd={addPosition}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}
