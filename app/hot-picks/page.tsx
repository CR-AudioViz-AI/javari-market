'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Flame, TrendingUp, TrendingDown, Users, Target, 
  Brain, RefreshCw, ArrowUpRight, ArrowDownRight,
  Star, Trophy, Zap, HelpCircle, ChevronRight
} from 'lucide-react';
import { getHotPicks, type Category } from '@/lib/supabase';
import { JavariHelpButton } from '@/components/JavariWidget';

// Consensus tier configuration
const CONSENSUS_TIERS = {
  5: { name: '🔥 FIRE', label: '5 AIs Agree', color: 'from-red-500 to-orange-500', bgColor: 'bg-red-500/20', borderColor: 'border-red-500/50' },
  4: { name: '⚡ HOT', label: '4 AIs Agree', color: 'from-orange-500 to-yellow-500', bgColor: 'bg-orange-500/20', borderColor: 'border-orange-500/50' },
  3: { name: '✨ WARM', label: '3 AIs Agree', color: 'from-yellow-500 to-amber-500', bgColor: 'bg-yellow-500/20', borderColor: 'border-yellow-500/50' },
  2: { name: '👀 WATCH', label: '2 AIs Agree', color: 'from-blue-500 to-cyan-500', bgColor: 'bg-blue-500/20', borderColor: 'border-blue-500/50' },
};

function getTier(consensus: number) {
  if (consensus >= 5) return CONSENSUS_TIERS[5];
  if (consensus >= 4) return CONSENSUS_TIERS[4];
  if (consensus >= 3) return CONSENSUS_TIERS[3];
  return CONSENSUS_TIERS[2];
}

// Hot Pick Card with Entry | Current (↑↓) | Target
function HotPickCard({ pick }: { pick: any }) {
  const tier = getTier(pick.consensus);
  const currentPrice = pick.currentPrice || pick.picks?.[0]?.current_price;
  const avgEntry = pick.avgEntryPrice || pick.picks?.reduce((s: number, p: any) => s + p.entry_price, 0) / pick.picks?.length;
  const avgTarget = pick.avgTargetPrice || pick.picks?.reduce((s: number, p: any) => s + p.target_price, 0) / pick.picks?.length;
  
  const priceChange = currentPrice && avgEntry 
    ? ((currentPrice - avgEntry) / avgEntry) * 100 
    : 0;
  const isUp = priceChange >= 0;
  
  // Progress to target
  const progressToTarget = currentPrice && avgTarget && avgEntry
    ? Math.min(100, Math.max(0, ((currentPrice - avgEntry) / (avgTarget - avgEntry)) * 100))
    : 0;

  return (
    <div className={`rounded-xl border ${tier.borderColor} ${tier.bgColor} p-5 hover:scale-[1.02] transition-transform`}>
      {/* Header: Ticker + Consensus Badge */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${tier.color} flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
            {pick.ticker?.slice(0, 2) || '??'}
          </div>
          <div>
            <h3 className="font-bold text-white text-2xl">{pick.ticker || pick.symbol}</h3>
            <p className="text-sm text-gray-400">{pick.company_name || 'Stock'}</p>
          </div>
        </div>
        <div className={`px-3 py-1.5 rounded-full bg-gradient-to-r ${tier.color} text-white text-sm font-bold shadow-lg`}>
          {tier.name}
        </div>
      </div>
      
      {/* AI Consensus */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-400">{pick.consensus} AIs Agree:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(pick.aiNames || []).map((name: string, i: number) => (
            <span 
              key={i}
              className="px-2 py-0.5 rounded text-xs font-medium"
              style={{ 
                backgroundColor: pick.aiColors?.[i] || '#6366f1',
                color: 'white'
              }}
            >
              {name}
            </span>
          ))}
        </div>
      </div>
      
      {/* Price Display: Entry | Current (↑↓) | Target */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {/* Entry Price */}
        <div className="bg-black/30 rounded-lg py-3 px-2 text-center">
          <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Avg Entry</div>
          <div className="text-base font-bold text-gray-300">
            ${avgEntry?.toFixed(2) || '—'}
          </div>
        </div>
        
        {/* Current Price with Trend Arrow */}
        <div className={`rounded-lg py-3 px-2 text-center ${
          isUp 
            ? 'bg-emerald-900/40 border border-emerald-700/50' 
            : 'bg-red-900/40 border border-red-700/50'
        }`}>
          <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-1 flex items-center justify-center gap-1">
            Current
            {isUp ? (
              <TrendingUp className="w-3 h-3 text-emerald-400" />
            ) : (
              <TrendingDown className="w-3 h-3 text-red-400" />
            )}
          </div>
          <div className={`text-base font-bold ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
            ${currentPrice?.toFixed(2) || '—'}
          </div>
        </div>
        
        {/* Target Price */}
        <div className="bg-black/30 rounded-lg py-3 px-2 text-center">
          <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Avg Target</div>
          <div className="text-base font-bold text-cyan-400">
            ${avgTarget?.toFixed(2) || '—'}
          </div>
        </div>
      </div>
      
      {/* Change + Confidence */}
      <div className="flex items-center justify-between mb-4">
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${
          isUp ? 'bg-emerald-900/30 text-emerald-400' : 'bg-red-900/30 text-red-400'
        }`}>
          {isUp ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
          <span className="font-bold">{isUp ? '+' : ''}{priceChange.toFixed(1)}%</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-900/30 text-purple-400">
          <Star className="w-4 h-4" />
          <span className="font-medium">{pick.avgConfidence || 0}% conf</span>
        </div>
      </div>
      
      {/* Progress to Target */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Progress to Target</span>
          <span>{progressToTarget.toFixed(0)}%</span>
        </div>
        <div className="h-2 bg-black/40 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all ${
              progressToTarget >= 100 ? 'bg-gradient-to-r from-emerald-500 to-green-400' :
              progressToTarget >= 50 ? 'bg-gradient-to-r from-cyan-500 to-blue-400' :
              progressToTarget >= 0 ? 'bg-gradient-to-r from-blue-500 to-indigo-400' :
              'bg-gradient-to-r from-red-500 to-red-400'
            }`}
            style={{ width: `${Math.max(0, progressToTarget)}%` }}
          />
        </div>
      </div>
      
      {/* Direction */}
      <div className="flex items-center justify-between">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-medium ${
          pick.direction === 'UP' 
            ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800/50'
            : 'bg-red-900/30 text-red-400 border border-red-800/50'
        }`}>
          {pick.direction === 'UP' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          Consensus: {pick.direction}
        </span>
        <Link 
          href={`/stock/${pick.ticker}`}
          className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
        >
          Details <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

export default function HotPicksPage() {
  const [hotPicks, setHotPicks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<Category | 'all'>('all');

  useEffect(() => {
    loadHotPicks();
  }, [category]);

  async function loadHotPicks() {
    setLoading(true);
    try {
      const picks = await getHotPicks(category === 'all' ? undefined : category);
      setHotPicks(picks);
    } catch (error) {
      console.error('Error loading hot picks:', error);
    } finally {
      setLoading(false);
    }
  }

  // Group by consensus level
  const groupedPicks = {
    fire: hotPicks.filter(p => p.consensus >= 5),
    hot: hotPicks.filter(p => p.consensus === 4),
    warm: hotPicks.filter(p => p.consensus === 3),
    watch: hotPicks.filter(p => p.consensus === 2),
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 flex items-center justify-center gap-3">
            <Flame className="w-10 h-10 text-orange-500" />
            <span className="bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
              Hot Picks
            </span>
            <JavariHelpButton topic="hot picks consensus explained" />
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            When multiple AIs agree on a stock, pay attention! These consensus picks 
            have higher conviction from our AI battle competitors.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-xl p-4 border border-orange-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">🔥 Fire (5+ AIs)</p>
                <p className="text-3xl font-bold text-orange-400">{groupedPicks.fire.length}</p>
              </div>
              <Flame className="w-10 h-10 text-orange-400 opacity-50" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-orange-500/20 to-yellow-500/20 rounded-xl p-4 border border-yellow-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">⚡ Hot (4 AIs)</p>
                <p className="text-3xl font-bold text-yellow-400">{groupedPicks.hot.length}</p>
              </div>
              <Zap className="w-10 h-10 text-yellow-400 opacity-50" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-yellow-500/20 to-amber-500/20 rounded-xl p-4 border border-amber-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">✨ Warm (3 AIs)</p>
                <p className="text-3xl font-bold text-amber-400">{groupedPicks.warm.length}</p>
              </div>
              <Star className="w-10 h-10 text-amber-400 opacity-50" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl p-4 border border-cyan-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">👀 Watch (2 AIs)</p>
                <p className="text-3xl font-bold text-cyan-400">{groupedPicks.watch.length}</p>
              </div>
              <Target className="w-10 h-10 text-cyan-400 opacity-50" />
            </div>
          </div>
        </div>

        {/* Refresh + Filter */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">
            {hotPicks.length} Consensus Picks Found
          </h2>
          <button
            onClick={loadHotPicks}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <RefreshCw className="w-10 h-10 animate-spin text-cyan-400 mx-auto mb-4" />
              <p className="text-gray-400">Finding consensus picks...</p>
            </div>
          </div>
        )}

        {/* Hot Picks Grid */}
        {!loading && hotPicks.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hotPicks.map((pick, i) => (
              <HotPickCard key={`${pick.ticker}-${i}`} pick={pick} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && hotPicks.length === 0 && (
          <div className="text-center py-20">
            <Flame className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No Consensus Picks Yet</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              When 2 or more AIs agree on a stock pick, it will appear here. 
              Check back soon as our AI competitors analyze the market!
            </p>
            <Link 
              href="/"
              className="inline-block mt-6 px-6 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-lg font-medium transition-colors"
            >
              View All Picks
            </Link>
          </div>
        )}

        {/* What This Means Section */}
        <div className="mt-12 bg-gray-900/50 rounded-xl p-6 border border-gray-800">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-cyan-400" />
            What Does Consensus Mean?
          </h3>
          <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-400">
            <div>
              <p className="mb-3">
                <strong className="text-white">Higher consensus = More AIs agree.</strong> When multiple 
                AI models independently analyze the market and arrive at the same conclusion, 
                it suggests stronger conviction.
              </p>
              <p>
                Think of it like asking 6 expert analysts. If 5 of them say "buy NVDA", 
                that's more compelling than if only 1 recommends it.
              </p>
            </div>
            <div>
              <p className="font-medium text-white mb-2">Consensus Tiers:</p>
              <ul className="space-y-1.5">
                <li><span className="text-red-400 font-medium">🔥 FIRE (5+ AIs):</span> Extremely high conviction</li>
                <li><span className="text-orange-400 font-medium">⚡ HOT (4 AIs):</span> Strong agreement</li>
                <li><span className="text-amber-400 font-medium">✨ WARM (3 AIs):</span> Notable consensus</li>
                <li><span className="text-cyan-400 font-medium">👀 WATCH (2 AIs):</span> Early agreement</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
