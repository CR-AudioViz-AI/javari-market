'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  DollarSign, TrendingUp, TrendingDown, ShoppingCart, 
  Wallet, PieChart, RefreshCw, Plus, Minus, X,
  ArrowUpRight, ArrowDownRight, Target, HelpCircle,
  RotateCcw, History, Award, Percent, Search
} from 'lucide-react';
import { getPicks, type StockPick } from '@/lib/supabase';
import { JavariHelpButton } from '@/components/JavariWidget';

// Local storage keys
const PAPER_PORTFOLIO_KEY = 'market-oracle-paper-portfolio';
const PAPER_BALANCE_KEY = 'market-oracle-paper-balance';
const PAPER_HISTORY_KEY = 'market-oracle-paper-history';

const STARTING_BALANCE = 10000;

interface Position {
  pickId: string;
  ticker: string;
  shares: number;
  buyPrice: number;
  boughtAt: string;
}

interface Trade {
  id: string;
  type: 'BUY' | 'SELL';
  ticker: string;
  shares: number;
  price: number;
  total: number;
  timestamp: string;
}

// Storage functions
function getStoredData<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function saveData<T>(key: string, data: T) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
}

// Position Card with Entry | Current | Target
function PositionCard({ 
  position, 
  pick, 
  onSell 
}: { 
  position: Position; 
  pick?: StockPick;
  onSell: (shares: number) => void;
}) {
  const [sellShares, setSellShares] = useState(position.shares);
  const [showSellModal, setShowSellModal] = useState(false);
  
  const currentPrice = pick?.current_price || position.buyPrice;
  const priceChange = pick?.price_change_percent || 0;
  const isUp = currentPrice >= position.buyPrice;
  
  const positionValue = position.shares * currentPrice;
  const positionCost = position.shares * position.buyPrice;
  const positionPL = positionValue - positionCost;
  const positionPLPercent = (positionPL / positionCost) * 100;

  return (
    <>
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 hover:border-gray-600 transition-all">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: pick?.ai_color || '#6366f1' }}
            >
              {position.ticker.slice(0, 2)}
            </div>
            <div>
              <h3 className="font-bold text-white">{position.ticker}</h3>
              <p className="text-xs text-gray-400">{position.shares} shares</p>
            </div>
          </div>
          <button
            onClick={() => setShowSellModal(true)}
            className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm font-medium transition-colors"
          >
            Sell
          </button>
        </div>
        
        {/* Price Display: Entry | Current | Target */}
        <div className="grid grid-cols-3 gap-2 mb-3 text-center">
          <div className="bg-gray-900/50 rounded-lg py-2 px-1">
            <div className="text-[10px] text-gray-500 uppercase">Buy Price</div>
            <div className="text-sm font-semibold text-gray-300">
              ${position.buyPrice.toFixed(2)}
            </div>
          </div>
          <div className={`rounded-lg py-2 px-1 ${
            isUp ? 'bg-emerald-900/30 border border-emerald-800/50' : 'bg-red-900/30 border border-red-800/50'
          }`}>
            <div className="text-[10px] text-gray-500 uppercase flex items-center justify-center gap-1">
              Current
              {isUp ? <TrendingUp className="w-3 h-3 text-emerald-400" /> : <TrendingDown className="w-3 h-3 text-red-400" />}
            </div>
            <div className={`text-sm font-bold ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
              ${currentPrice.toFixed(2)}
            </div>
          </div>
          <div className="bg-gray-900/50 rounded-lg py-2 px-1">
            <div className="text-[10px] text-gray-500 uppercase">Target</div>
            <div className="text-sm font-semibold text-cyan-400">
              ${pick?.target_price?.toFixed(2) || '—'}
            </div>
          </div>
        </div>
        
        {/* P/L */}
        <div className={`rounded-lg p-2 ${
          positionPL >= 0 ? 'bg-emerald-900/20' : 'bg-red-900/20'
        }`}>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">P/L</span>
            <div className={`flex items-center gap-2 font-bold ${
              positionPL >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {positionPL >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              ${Math.abs(positionPL).toFixed(2)} ({positionPLPercent >= 0 ? '+' : ''}{positionPLPercent.toFixed(1)}%)
            </div>
          </div>
        </div>
      </div>
      
      {/* Sell Modal */}
      {showSellModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl border border-gray-700 w-full max-w-sm p-6">
            <h3 className="text-lg font-bold mb-4">Sell {position.ticker}</h3>
            
            <div className="mb-4">
              <label className="text-sm text-gray-400 mb-2 block">Shares to Sell</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSellShares(Math.max(1, sellShares - 1))}
                  className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  value={sellShares}
                  onChange={(e) => setSellShares(Math.min(position.shares, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-center text-lg"
                  min={1}
                  max={position.shares}
                />
                <button
                  onClick={() => setSellShares(Math.min(position.shares, sellShares + 1))}
                  className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={() => setSellShares(position.shares)}
                className="w-full mt-2 text-xs text-cyan-400 hover:text-cyan-300"
              >
                Sell All ({position.shares} shares)
              </button>
            </div>
            
            <div className="bg-gray-800/50 rounded-lg p-3 mb-4 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Current Price</span>
                <span>${currentPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total Proceeds</span>
                <span className="font-bold text-emerald-400">${(sellShares * currentPrice).toFixed(2)}</span>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowSellModal(false)}
                className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onSell(sellShares);
                  setShowSellModal(false);
                }}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg font-medium"
              >
                Sell
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Buy Modal
function BuyModal({ 
  picks, 
  existingIds,
  balance,
  onBuy, 
  onClose 
}: { 
  picks: StockPick[];
  existingIds: Set<string>;
  balance: number;
  onBuy: (pick: StockPick, shares: number) => void;
  onClose: () => void;
}) {
  const [selectedPick, setSelectedPick] = useState<StockPick | null>(null);
  const [shares, setShares] = useState(10);
  const [search, setSearch] = useState('');
  
  const filteredPicks = picks.filter(p => 
    p.ticker.toLowerCase().includes(search.toLowerCase()) ||
    p.ai_display_name?.toLowerCase().includes(search.toLowerCase())
  );
  
  const price = selectedPick?.current_price || selectedPick?.entry_price || 0;
  const total = shares * price;
  const canAfford = total <= balance;
  const maxShares = Math.floor(balance / price);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl border border-gray-700 w-full max-w-lg max-h-[80vh] overflow-hidden">
        <div className="p-4 border-b border-gray-800">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-emerald-400" />
            Buy Stock
          </h3>
        </div>
        
        {!selectedPick ? (
          <>
            <div className="p-4 border-b border-gray-800">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search ticker..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
            <div className="max-h-80 overflow-y-auto p-4">
              <div className="space-y-2">
                {filteredPicks.slice(0, 15).map(pick => {
                  const pickPrice = pick.current_price || pick.entry_price;
                  const change = pick.price_change_percent || 0;
                  const owned = existingIds.has(pick.id);
                  
                  return (
                    <button
                      key={pick.id}
                      onClick={() => {
                        setSelectedPick(pick);
                        setShares(Math.min(10, Math.floor(balance / pickPrice)));
                      }}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
                        owned 
                          ? 'bg-cyan-900/20 border border-cyan-800/50' 
                          : 'bg-gray-800/50 hover:bg-gray-700/50'
                      }`}
                    >
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                        style={{ backgroundColor: pick.ai_color || '#6366f1' }}
                      >
                        {pick.ticker.slice(0, 2)}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold flex items-center gap-2">
                          {pick.ticker}
                          {owned && <span className="text-[10px] text-cyan-400 bg-cyan-900/30 px-1.5 py-0.5 rounded">OWNED</span>}
                        </div>
                        <div className="text-xs text-gray-400">{pick.ai_display_name}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">${pickPrice.toFixed(2)}</div>
                        <div className={`text-xs ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {change >= 0 ? '+' : ''}{change.toFixed(1)}%
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <div className="p-4">
            {/* Selected Stock */}
            <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg mb-4">
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: selectedPick.ai_color || '#6366f1' }}
              >
                {selectedPick.ticker.slice(0, 2)}
              </div>
              <div className="flex-1">
                <div className="font-bold text-lg">{selectedPick.ticker}</div>
                <div className="text-sm text-gray-400">${price.toFixed(2)} per share</div>
              </div>
              <button
                onClick={() => setSelectedPick(null)}
                className="text-xs text-gray-400 hover:text-white"
              >
                Change
              </button>
            </div>
            
            {/* Shares */}
            <div className="mb-4">
              <label className="text-sm text-gray-400 mb-2 block">Number of Shares</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShares(Math.max(1, shares - 1))}
                  className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  value={shares}
                  onChange={(e) => setShares(Math.max(1, parseInt(e.target.value) || 1))}
                  className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-center text-lg"
                  min={1}
                />
                <button
                  onClick={() => setShares(shares + 1)}
                  className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {maxShares > 0 && (
                <button
                  onClick={() => setShares(maxShares)}
                  className="w-full mt-2 text-xs text-cyan-400 hover:text-cyan-300"
                >
                  Max: {maxShares} shares (${(maxShares * price).toFixed(2)})
                </button>
              )}
            </div>
            
            {/* Order Summary */}
            <div className="bg-gray-800/50 rounded-lg p-3 mb-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Price per Share</span>
                <span>${price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Shares</span>
                <span>{shares}</span>
              </div>
              <div className="border-t border-gray-700 pt-2 flex justify-between">
                <span className="text-gray-400">Total Cost</span>
                <span className={`font-bold ${canAfford ? 'text-emerald-400' : 'text-red-400'}`}>
                  ${total.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Available</span>
                <span className="text-gray-500">${balance.toFixed(2)}</span>
              </div>
            </div>
            
            {!canAfford && (
              <div className="mb-4 p-2 bg-red-900/20 border border-red-800/50 rounded-lg text-sm text-red-400">
                Insufficient funds. Reduce shares or add more cash.
              </div>
            )}
          </div>
        )}
        
        <div className="p-4 border-t border-gray-800 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg"
          >
            Cancel
          </button>
          {selectedPick && (
            <button
              onClick={() => {
                if (canAfford) {
                  onBuy(selectedPick, shares);
                  onClose();
                }
              }}
              disabled={!canAfford}
              className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg font-medium"
            >
              Buy {shares} Shares
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PaperTradingPage() {
  const [picks, setPicks] = useState<StockPick[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [balance, setBalance] = useState(STARTING_BALANCE);
  const [history, setHistory] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  
  // Load data
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);
  
  // Load from localStorage
  useEffect(() => {
    setPositions(getStoredData(PAPER_PORTFOLIO_KEY, []));
    setBalance(getStoredData(PAPER_BALANCE_KEY, STARTING_BALANCE));
    setHistory(getStoredData(PAPER_HISTORY_KEY, []));
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
  
  // Pick map
  const pickMap = useMemo(() => new Map(picks.map(p => [p.id, p])), [picks]);
  const existingIds = new Set(positions.map(p => p.pickId));
  
  // Portfolio stats
  const stats = useMemo(() => {
    let portfolioValue = 0;
    let portfolioCost = 0;
    
    positions.forEach(pos => {
      const pick = pickMap.get(pos.pickId);
      const currentPrice = pick?.current_price || pos.buyPrice;
      portfolioValue += pos.shares * currentPrice;
      portfolioCost += pos.shares * pos.buyPrice;
    });
    
    const portfolioPL = portfolioValue - portfolioCost;
    const totalEquity = balance + portfolioValue;
    const totalPL = totalEquity - STARTING_BALANCE;
    
    return {
      balance,
      portfolioValue,
      portfolioPL,
      totalEquity,
      totalPL,
      totalPLPercent: (totalPL / STARTING_BALANCE) * 100,
      positions: positions.length,
    };
  }, [positions, pickMap, balance]);
  
  // Buy stock
  const buyStock = (pick: StockPick, shares: number) => {
    const price = pick.current_price || pick.entry_price;
    const total = shares * price;
    
    if (total > balance) return;
    
    // Check if already own this stock
    const existingPos = positions.find(p => p.pickId === pick.id);
    
    let newPositions: Position[];
    if (existingPos) {
      // Add to existing position
      const newShares = existingPos.shares + shares;
      const newAvgPrice = ((existingPos.shares * existingPos.buyPrice) + (shares * price)) / newShares;
      newPositions = positions.map(p => 
        p.pickId === pick.id 
          ? { ...p, shares: newShares, buyPrice: newAvgPrice }
          : p
      );
    } else {
      // New position
      newPositions = [...positions, {
        pickId: pick.id,
        ticker: pick.ticker,
        shares,
        buyPrice: price,
        boughtAt: new Date().toISOString(),
      }];
    }
    
    const newBalance = balance - total;
    const newTrade: Trade = {
      id: Date.now().toString(),
      type: 'BUY',
      ticker: pick.ticker,
      shares,
      price,
      total,
      timestamp: new Date().toISOString(),
    };
    
    setPositions(newPositions);
    setBalance(newBalance);
    setHistory([newTrade, ...history]);
    
    saveData(PAPER_PORTFOLIO_KEY, newPositions);
    saveData(PAPER_BALANCE_KEY, newBalance);
    saveData(PAPER_HISTORY_KEY, [newTrade, ...history]);
  };
  
  // Sell stock
  const sellStock = (pickId: string, sharesToSell: number) => {
    const position = positions.find(p => p.pickId === pickId);
    if (!position) return;
    
    const pick = pickMap.get(pickId);
    const price = pick?.current_price || position.buyPrice;
    const total = sharesToSell * price;
    
    let newPositions: Position[];
    if (sharesToSell >= position.shares) {
      // Sell all
      newPositions = positions.filter(p => p.pickId !== pickId);
    } else {
      // Partial sell
      newPositions = positions.map(p => 
        p.pickId === pickId 
          ? { ...p, shares: p.shares - sharesToSell }
          : p
      );
    }
    
    const newBalance = balance + total;
    const newTrade: Trade = {
      id: Date.now().toString(),
      type: 'SELL',
      ticker: position.ticker,
      shares: sharesToSell,
      price,
      total,
      timestamp: new Date().toISOString(),
    };
    
    setPositions(newPositions);
    setBalance(newBalance);
    setHistory([newTrade, ...history]);
    
    saveData(PAPER_PORTFOLIO_KEY, newPositions);
    saveData(PAPER_BALANCE_KEY, newBalance);
    saveData(PAPER_HISTORY_KEY, [newTrade, ...history]);
  };
  
  // Reset account
  const resetAccount = () => {
    if (confirm('Reset your paper trading account? This will clear all positions and history.')) {
      setPositions([]);
      setBalance(STARTING_BALANCE);
      setHistory([]);
      saveData(PAPER_PORTFOLIO_KEY, []);
      saveData(PAPER_BALANCE_KEY, STARTING_BALANCE);
      saveData(PAPER_HISTORY_KEY, []);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-3 flex items-center justify-center gap-3">
            <DollarSign className="w-10 h-10 text-emerald-400" />
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent">
              Paper Trading
            </span>
            <JavariHelpButton topic="paper trading simulation" />
          </h1>
          <p className="text-gray-400">
            Practice trading with ${STARTING_BALANCE.toLocaleString()} virtual money. No real money involved!
          </p>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-emerald-900/20 rounded-xl p-4 border border-emerald-800/30">
            <div className="flex items-center gap-2 text-emerald-400 text-sm mb-1">
              <Wallet className="w-4 h-4" />
              Cash
            </div>
            <div className="text-2xl font-bold text-emerald-400">
              ${stats.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="bg-cyan-900/20 rounded-xl p-4 border border-cyan-800/30">
            <div className="flex items-center gap-2 text-cyan-400 text-sm mb-1">
              <PieChart className="w-4 h-4" />
              Portfolio
            </div>
            <div className="text-2xl font-bold text-cyan-400">
              ${stats.portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
              <Target className="w-4 h-4" />
              Total Equity
            </div>
            <div className="text-2xl font-bold">
              ${stats.totalEquity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className={`rounded-xl p-4 border ${
            stats.totalPL >= 0 ? 'bg-emerald-900/20 border-emerald-800/30' : 'bg-red-900/20 border-red-800/30'
          }`}>
            <div className="flex items-center gap-2 text-sm mb-1">
              {stats.totalPL >= 0 ? <TrendingUp className="w-4 h-4 text-emerald-400" /> : <TrendingDown className="w-4 h-4 text-red-400" />}
              <span className="text-gray-400">Total P/L</span>
            </div>
            <div className={`text-2xl font-bold ${stats.totalPL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {stats.totalPL >= 0 ? '+' : ''}${stats.totalPL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className={`rounded-xl p-4 border ${
            stats.totalPLPercent >= 0 ? 'bg-emerald-900/20 border-emerald-800/30' : 'bg-red-900/20 border-red-800/30'
          }`}>
            <div className="flex items-center gap-2 text-sm mb-1">
              <Percent className="w-4 h-4" />
              <span className="text-gray-400">Return</span>
            </div>
            <div className={`text-2xl font-bold ${stats.totalPLPercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {stats.totalPLPercent >= 0 ? '+' : ''}{stats.totalPLPercent.toFixed(2)}%
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <PieChart className="w-5 h-5 text-cyan-400" />
            Positions ({stats.positions})
          </h2>
          <div className="flex gap-3">
            <button
              onClick={() => setShowHistory(true)}
              className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm"
            >
              <History className="w-4 h-4" />
              History
            </button>
            <button
              onClick={resetAccount}
              className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-red-400"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
            <button
              onClick={() => setShowBuyModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-medium"
            >
              <ShoppingCart className="w-4 h-4" />
              Buy Stock
            </button>
          </div>
        </div>
        
        {/* Positions Grid */}
        {positions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {positions.map(position => (
              <PositionCard
                key={position.pickId}
                position={position}
                pick={pickMap.get(position.pickId)}
                onSell={(shares) => sellStock(position.pickId, shares)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-gray-900/30 rounded-xl border border-gray-800">
            <ShoppingCart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No Positions Yet</h3>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              Start paper trading by buying AI-recommended stocks. You have ${STARTING_BALANCE.toLocaleString()} virtual cash to invest.
            </p>
            <button
              onClick={() => setShowBuyModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-medium"
            >
              <ShoppingCart className="w-5 h-5" />
              Buy Your First Stock
            </button>
          </div>
        )}
        
        {/* Disclaimer */}
        <div className="mt-8 p-4 bg-yellow-900/20 border border-yellow-800/50 rounded-xl">
          <p className="text-sm text-yellow-200 font-medium mb-1">⚠️ Paper Trading Disclaimer</p>
          <p className="text-xs text-gray-400">
            This is a simulation using virtual money for educational purposes only. 
            No real trades are executed. Past performance does not guarantee future results.
            Always consult a financial advisor before real investing.
          </p>
        </div>
      </main>
      
      {/* Buy Modal */}
      {showBuyModal && (
        <BuyModal
          picks={picks}
          existingIds={existingIds}
          balance={balance}
          onBuy={buyStock}
          onClose={() => setShowBuyModal(false)}
        />
      )}
      
      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl border border-gray-700 w-full max-w-lg max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <History className="w-5 h-5 text-cyan-400" />
                Trade History
              </h3>
              <button onClick={() => setShowHistory(false)} className="p-1 hover:bg-gray-800 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto p-4">
              {history.length > 0 ? (
                <div className="space-y-2">
                  {history.map(trade => (
                    <div key={trade.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded flex items-center justify-center ${
                          trade.type === 'BUY' ? 'bg-emerald-900/30 text-emerald-400' : 'bg-red-900/30 text-red-400'
                        }`}>
                          {trade.type === 'BUY' ? <Plus className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="font-medium">{trade.type} {trade.ticker}</div>
                          <div className="text-xs text-gray-500">
                            {trade.shares} shares @ ${trade.price.toFixed(2)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-medium ${trade.type === 'BUY' ? 'text-red-400' : 'text-emerald-400'}`}>
                          {trade.type === 'BUY' ? '-' : '+'}${trade.total.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-gray-500">
                          {new Date(trade.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No trades yet
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
