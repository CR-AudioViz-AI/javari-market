// app/hot-picks/page.tsx
// Hot Picks - Shows high-consensus stock picks

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Flame, TrendingUp, TrendingDown, RefreshCw,
  Target, Brain, Zap, Sparkles, Bot, Clock,
  ChevronRight, MinusCircle
} from 'lucide-react';

interface Pick {
  id: string;
  ai_model: string;
  symbol: string;
  company_name: string;
  sector: string;
  direction: 'UP' | 'DOWN' | 'HOLD';
  confidence: number;
  entry_price: number;
  target_price: number;
  stop_loss: number;
  thesis: string;
  status: string;
  created_at: string;
}

interface ConsensusPick {
  symbol: string;
  company_name: string;
  sector: string;
  direction: string;
  consensus_count: number;
  avg_confidence: number;
  avg_target: number;
  picks: Pick[];
}

const AI_INFO: Record<string, { name: string; color: string }> = {
  gpt4: { name: 'GPT-4', color: 'bg-emerald-500' },
  claude: { name: 'Claude', color: 'bg-purple-500' },
  gemini: { name: 'Gemini', color: 'bg-blue-500' },
  perplexity: { name: 'Perplexity', color: 'bg-cyan-500' },
};

export default function HotPicksPage() {
  const [picks, setPicks] = useState<Pick[]>([]);
  const [consensusPicks, setConsensusPicks] = useState<ConsensusPick[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'UP' | 'DOWN' | 'HOLD'>('all');

  useEffect(() => {
    fetchPicks();
  }, []);

  const fetchPicks = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai-picks/generate?limit=100');
      const data = await res.json();
      
      if (data.success && data.picks) {
        setPicks(data.picks);
        
        // Group by symbol to find consensus
        const bySymbol: Record<string, Pick[]> = {};
        for (const pick of data.picks) {
          if (!bySymbol[pick.symbol]) {
            bySymbol[pick.symbol] = [];
          }
          // Only add one pick per AI per symbol (most recent)
          const existingAI = bySymbol[pick.symbol].find(p => p.ai_model === pick.ai_model);
          if (!existingAI) {
            bySymbol[pick.symbol].push(pick);
          }
        }
        
        // Calculate consensus for each symbol
        const consensus: ConsensusPick[] = [];
        for (const [symbol, symbolPicks] of Object.entries(bySymbol)) {
          if (symbolPicks.length < 2) continue; // Need at least 2 AIs
          
          // Find majority direction
          const directions = symbolPicks.reduce((acc, p) => {
            acc[p.direction] = (acc[p.direction] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
          
          const maxDir = Object.entries(directions).sort((a, b) => b[1] - a[1])[0];
          const agreedPicks = symbolPicks.filter(p => p.direction === maxDir[0]);
          
          if (agreedPicks.length >= 2) {
            consensus.push({
              symbol,
              company_name: agreedPicks[0].company_name,
              sector: agreedPicks[0].sector,
              direction: maxDir[0],
              consensus_count: agreedPicks.length,
              avg_confidence: agreedPicks.reduce((a, p) => a + p.confidence, 0) / agreedPicks.length,
              avg_target: agreedPicks.reduce((a, p) => a + (p.target_price || 0), 0) / agreedPicks.length,
              picks: agreedPicks,
            });
          }
        }
        
        // Sort by consensus count and confidence
        consensus.sort((a, b) => {
          if (b.consensus_count !== a.consensus_count) {
            return b.consensus_count - a.consensus_count;
          }
          return b.avg_confidence - a.avg_confidence;
        });
        
        setConsensusPicks(consensus);
      }
    } catch (err) {
      console.error('Failed to fetch picks:', err);
    }
    setLoading(false);
  };

  const filteredPicks = consensusPicks.filter(p => 
    filter === 'all' || p.direction === filter
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
              <Flame className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Hot Picks</h1>
              <p className="text-gray-400">Stocks with strong AI consensus</p>
            </div>
          </div>
          
          {/* Filters */}
          <div className="flex gap-2 mt-6">
            {(['all', 'UP', 'DOWN', 'HOLD'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filter === f
                    ? 'bg-amber-500 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {f === 'all' ? 'All' : f}
              </button>
            ))}
            <button
              onClick={fetchPicks}
              className="ml-auto flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg text-gray-400 hover:bg-gray-700 transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
          </div>
        ) : filteredPicks.length === 0 ? (
          <div className="text-center py-20">
            <Flame className="w-16 h-16 text-gray-700 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400">No Hot Picks Found</h3>
            <p className="text-gray-500 mt-2">
              {filter !== 'all' 
                ? `No stocks with ${filter} consensus right now` 
                : 'Generate some stock analyses to see hot picks'}
            </p>
            <Link
              href="/ai-picks"
              className="inline-flex items-center gap-2 mt-6 bg-amber-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-amber-600 transition"
            >
              <TrendingUp className="w-5 h-5" />
              Analyze Stocks
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPicks.map((cp) => (
              <Link
                key={cp.symbol}
                href={`/stock/${cp.symbol}`}
                className="block bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/10 transition group"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
                      cp.direction === 'UP' ? 'bg-green-500/20 text-green-400' :
                      cp.direction === 'DOWN' ? 'bg-red-500/20 text-red-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {cp.symbol.slice(0, 2)}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg group-hover:text-amber-400 transition">{cp.symbol}</h3>
                      <p className="text-sm text-gray-500">{cp.company_name}</p>
                    </div>
                  </div>
                  
                  {/* Direction Badge */}
                  <div className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold ${
                    cp.direction === 'UP' ? 'bg-green-500/20 text-green-400' :
                    cp.direction === 'DOWN' ? 'bg-red-500/20 text-red-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {cp.direction === 'UP' ? <TrendingUp className="w-4 h-4" /> :
                     cp.direction === 'DOWN' ? <TrendingDown className="w-4 h-4" /> :
                     <MinusCircle className="w-4 h-4" />}
                    {cp.direction}
                  </div>
                </div>
                
                {/* Consensus */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-2xl font-bold ${
                      cp.consensus_count >= 4 ? 'text-orange-400' :
                      cp.consensus_count >= 3 ? 'text-yellow-400' :
                      'text-gray-400'
                    }`}>
                      {cp.consensus_count}/4
                    </span>
                    <span className="text-gray-500">AIs agree</span>
                    <span className="text-amber-400 ml-auto">{cp.avg_confidence.toFixed(0)}% avg</span>
                  </div>
                  
                  {/* AI Badges */}
                  <div className="flex flex-wrap gap-1">
                    {cp.picks.map((p, i) => {
                      const ai = AI_INFO[p.ai_model] || { name: p.ai_model, color: 'bg-gray-500' };
                      return (
                        <span
                          key={i}
                          className={`px-2 py-0.5 rounded text-xs font-medium text-white ${ai.color}`}
                        >
                          {ai.name}
                        </span>
                      );
                    })}
                  </div>
                </div>
                
                {/* Target */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-800">
                  <div>
                    <span className="text-gray-500 text-sm">Avg Target</span>
                    <div className="text-lg font-bold text-green-400">${cp.avg_target.toFixed(2)}</div>
                  </div>
                  <div className="flex items-center gap-1 text-gray-400 group-hover:text-amber-400 transition">
                    View Details
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Recent Picks Section */}
        {picks.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              Recent Individual Picks
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {picks.slice(0, 8).map((pick) => {
                const ai = AI_INFO[pick.ai_model] || { name: pick.ai_model, color: 'bg-gray-500' };
                return (
                  <Link
                    key={pick.id}
                    href={`/stock/${pick.symbol}`}
                    className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold">{pick.symbol}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium text-white ${ai.color}`}>
                        {ai.name}
                      </span>
                    </div>
                    <div className={`flex items-center gap-1 text-sm ${
                      pick.direction === 'UP' ? 'text-green-400' :
                      pick.direction === 'DOWN' ? 'text-red-400' :
                      'text-yellow-400'
                    }`}>
                      {pick.direction === 'UP' ? <TrendingUp className="w-3 h-3" /> :
                       pick.direction === 'DOWN' ? <TrendingDown className="w-3 h-3" /> :
                       <MinusCircle className="w-3 h-3" />}
                      {pick.direction} • {pick.confidence}%
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Target: ${pick.target_price?.toFixed(2)}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
