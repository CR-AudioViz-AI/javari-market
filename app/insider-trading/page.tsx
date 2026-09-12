'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, TrendingUp, TrendingDown, DollarSign, RefreshCw, AlertCircle, Filter } from 'lucide-react';

interface InsiderTransaction {
  symbol: string;
  name: string;
  insiderName: string;
  title: string;
  transactionType: string;
  shares: number;
  value: number;
  price: number;
  date: string;
  signal: 'bullish' | 'bearish' | 'neutral';
}

interface ClusterAlert {
  symbol: string;
  transactions: number;
  netActivity: number;
  signal: string;
  insiders: string[];
}

interface InsiderData {
  transactions: InsiderTransaction[];
  clusters: ClusterAlert[];
  // 2026-09-11: the API returns `stats` with these names. The page read a
  // `statistics` object that has never existed, so it crashed on load.
  stats: { totalTransactions: number; buys: number; sells: number; exercises: number; totalBuyValue: number; totalSellValue: number; bullishSignals: number; bearishSignals: number };
  notable: InsiderTransaction[];
}

export default function InsiderTradingPage() {
  const [data, setData] = useState<InsiderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'buy' | 'sell'>('all');
  const [symbol, setSymbol] = useState('');

  useEffect(() => { loadData(); }, []);

  async function loadData(sym?: string) {
    setLoading(true);
    try {
      const url = sym ? `/api/insider?symbol=${sym}` : '/api/insider';
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) setData(json);
    } catch (error) { console.error('Error:', error); }
    setLoading(false);
  }

  const formatValue = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };

  const filteredTransactions = data?.transactions.filter(t => {
    if (filter === 'buy') return t.transactionType.toLowerCase().includes('buy');
    if (filter === 'sell') return t.transactionType.toLowerCase().includes('sell');
    return true;
  }) || [];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-900/20 via-teal-900/10 to-gray-950">
        <div className="absolute inset-0">
          <div className="absolute top-10 right-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
                  Insider Trading Tracker
                </h1>
                <p className="text-gray-400">Follow the smart money - executive buys and sells</p>
              </div>
            </div>
            <button onClick={() => loadData()} className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Stats */}
          {data && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
                <div className="text-gray-400 text-sm flex items-center gap-1">
                  <TrendingUp className="w-4 h-4 text-green-400" /> Buys
                </div>
                <div className="text-2xl font-bold text-green-400">{data.stats.buys}</div>
                <div className="text-sm text-gray-500">{formatValue(data.stats.totalBuyValue)}</div>
              </div>
              <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
                <div className="text-gray-400 text-sm flex items-center gap-1">
                  <TrendingDown className="w-4 h-4 text-red-400" /> Sells
                </div>
                <div className="text-2xl font-bold text-red-400">{data.stats.sells}</div>
                <div className="text-sm text-gray-500">{formatValue(data.stats.totalSellValue)}</div>
              </div>
              <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
                <div className="text-gray-400 text-sm">Buy/Sell Ratio</div>
                <div className={`text-2xl font-bold ${(data.stats.sells ? data.stats.buys / data.stats.sells : 0) > 1 ? 'text-green-400' : 'text-red-400'}`}>
                  {(data.stats.sells ? data.stats.buys / data.stats.sells : 0).toFixed(2)}x
                </div>
              </div>
              <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
                <div className="text-gray-400 text-sm">Cluster Alerts</div>
                <div className="text-2xl font-bold text-amber-400">{data.clusters.length}</div>
              </div>
            </div>
          )}

          {/* Search & Filters */}
          <div className="flex flex-wrap gap-4">
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && loadData(symbol)}
              placeholder="Search by symbol..."
              className="px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-xl focus:border-emerald-500 focus:outline-none"
            />
            <div className="flex gap-2">
              {(['all', 'buy', 'sell'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-xl capitalize ${
                    filter === f
                      ? f === 'buy' ? 'bg-green-500/20 text-green-400'
                        : f === 'sell' ? 'bg-red-500/20 text-red-400'
                        : 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {f === 'all' ? 'All' : f + 's'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Feed */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold mb-4">📊 Recent Insider Activity</h2>
            
            {loading ? (
              <div className="text-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-400 mb-4" />
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTransactions.slice(0, 30).map((t, idx) => (
                  <div key={idx} className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          t.signal === 'bullish' ? 'bg-green-500/20' :
                          t.signal === 'bearish' ? 'bg-red-500/20' : 'bg-gray-700'
                        }`}>
                          {t.signal === 'bullish' ? <TrendingUp className="w-5 h-5 text-green-400" /> :
                           t.signal === 'bearish' ? <TrendingDown className="w-5 h-5 text-red-400" /> :
                           <DollarSign className="w-5 h-5 text-gray-400" />}
                        </span>
                        <div>
                          <Link href={`/stock/${t.symbol}`} className="font-bold text-blue-400 hover:text-blue-300">
                            {t.symbol}
                          </Link>
                          <span className="text-gray-500 text-sm ml-2">{t.name}</span>
                        </div>
                      </div>
                      <span className="text-gray-500 text-sm">{t.date}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-gray-400 text-sm">{t.insiderName}</span>
                        <span className="text-gray-600 text-sm ml-1">({t.title})</span>
                      </div>
                      <div className="text-right">
                        <span className={`font-semibold ${t.transactionType.toLowerCase().includes('buy') ? 'text-green-400' : 'text-red-400'}`}>
                          {t.transactionType.toUpperCase()}
                        </span>
                        <div className="text-sm text-gray-400">
                          {t.shares.toLocaleString()} shares @ ${t.price.toFixed(2)}
                        </div>
                        <div className="text-sm font-medium">{formatValue(t.value)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Cluster Alerts */}
            <div className="bg-gray-900/50 rounded-xl p-5 border border-gray-800">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-400" />
                Cluster Alerts
              </h3>
              <p className="text-gray-500 text-sm mb-4">
                Multiple insiders buying/selling within 30 days
              </p>
              <div className="space-y-3">
                {data?.clusters.slice(0, 8).map((c, i) => (
                  <div key={i} className="p-3 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <Link href={`/stock/${c.symbol}`} className="font-bold text-blue-400">
                        {c.symbol}
                      </Link>
                      <span className={`text-sm px-2 py-0.5 rounded ${
                        c.netActivity > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {c.signal}
                      </span>
                    </div>
                    <div className="text-sm text-gray-400">
                      {c.transactions} transactions by {c.insiders.length} insiders
                    </div>
                  </div>
                ))}
                {(!data?.clusters || data.clusters.length === 0) && (
                  <p className="text-gray-500 text-sm">No cluster activity detected</p>
                )}
              </div>
            </div>

            {/* Notable Transactions */}
            <div className="bg-gray-900/50 rounded-xl p-5 border border-gray-800">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-400" />
                High Value Trades
              </h3>
              <div className="space-y-3">
                {data?.notable?.slice(0, 6).map((t, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Link href={`/stock/${t.symbol}`} className="font-medium text-blue-400">
                      {t.symbol}
                    </Link>
                    <span className={t.signal === 'bullish' ? 'text-green-400' : 'text-red-400'}>
                      {formatValue(t.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Insight */}
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
              <h4 className="font-semibold text-emerald-400 mb-2">💡 Why Track Insiders?</h4>
              <p className="text-sm text-gray-300">
                Corporate insiders know their companies best. When multiple executives buy, it often signals confidence. Cluster buying is especially significant.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-6 right-6">
        <Link href="/" className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg shadow-lg">
          Back to Market Oracle
        </Link>
      </div>
    </div>
  );
}
