'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp, TrendingDown, Activity, DollarSign, Briefcase, Home,
  Factory, ShoppingCart, BarChart3, AlertTriangle, ArrowUpRight,
  ArrowDownRight, RefreshCw, Info, Gauge, Building2, Banknote
} from 'lucide-react';

interface EconomicIndicator {
  id: string;
  name: string;
  description: string;
  value: number | null;
  previousValue: number | null;
  change: number | null;
  changePercent: number | null;
  date: string;
  trend: 'up' | 'down' | 'stable';
  impact: 'bullish' | 'bearish' | 'neutral';
  category: string;
}

interface EconomicData {
  summary: {
    outlook: string;
    outlookScore: number;
    bullishIndicators: number;
    bearishIndicators: number;
  };
  highlights: Array<{
    title: string;
    value: string;
    insight: string;
    impact: string;
  }>;
  categories: Array<{
    name: string;
    indicators: EconomicIndicator[];
  }>;
}

const categoryIcons: Record<string, any> = {
  'Interest Rates': Banknote,
  'Inflation': TrendingUp,
  'Employment': Briefcase,
  'Growth': BarChart3,
  'Consumer': ShoppingCart,
  'Manufacturing': Factory,
  'Housing': Home,
  'Currency': DollarSign,
  'Volatility': Activity,
  'Monetary': Building2,
};

export default function EconomicDashboard() {
  const [data, setData] = useState<EconomicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch('/api/economic');
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (error) {
      console.error('Error loading economic data:', error);
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Gauge className="w-16 h-16 text-blue-400 animate-pulse mx-auto mb-4" />
          <p className="text-gray-400">Loading economic indicators...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <p className="text-gray-400">Failed to load economic data</p>
          <button onClick={loadData} className="mt-4 px-4 py-2 bg-blue-600 rounded-lg">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const outlookColor = data.summary.outlook === 'bullish' ? 'text-green-400' :
                       data.summary.outlook === 'bearish' ? 'text-red-400' : 'text-yellow-400';
  
  const outlookBg = data.summary.outlook === 'bullish' ? 'from-green-500/20' :
                    data.summary.outlook === 'bearish' ? 'from-red-500/20' : 'from-yellow-500/20';

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${outlookBg} via-transparent to-gray-950`} />
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <Gauge className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
                  Economic Dashboard
                </h1>
                <p className="text-gray-400">Federal Reserve Economic Data (FRED)</p>
              </div>
            </div>
            <button
              onClick={loadData}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>

          {/* Outlook Gauge */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="md:col-span-1 bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800">
              <h3 className="text-gray-400 text-sm mb-2">Market Outlook</h3>
              <div className="relative h-32 flex items-center justify-center">
                <div className="text-center">
                  <div className={`text-5xl font-bold ${outlookColor}`}>
                    {data.summary.outlookScore}
                  </div>
                  <div className={`text-lg font-semibold ${outlookColor} capitalize`}>
                    {data.summary.outlook}
                  </div>
                </div>
              </div>
              <div className="flex justify-between text-sm mt-4">
                <span className="text-green-400">
                  {data.summary.bullishIndicators} Bullish
                </span>
                <span className="text-red-400">
                  {data.summary.bearishIndicators} Bearish
                </span>
              </div>
            </div>

            {/* Key Highlights */}
            {data.highlights.slice(0, 3).map((highlight, idx) => (
              <div
                key={idx}
                className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800"
              >
                <h3 className="text-gray-400 text-sm mb-2">{highlight.title}</h3>
                <div className={`text-3xl font-bold mb-2 ${
                  highlight.impact === 'bullish' ? 'text-green-400' :
                  highlight.impact === 'bearish' ? 'text-red-400' : 'text-yellow-400'
                }`}>
                  {highlight.value}
                </div>
                <p className="text-gray-500 text-sm">{highlight.insight}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="max-w-7xl mx-auto px-4 mb-8">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            All Categories
          </button>
          {data.categories.map(cat => {
            const Icon = categoryIcons[cat.name] || BarChart3;
            return (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  selectedCategory === cat.name
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {cat.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Indicators Grid */}
      <div className="max-w-7xl mx-auto px-4 pb-16">
        {data.categories
          .filter(cat => selectedCategory === 'all' || cat.name === selectedCategory)
          .map(category => {
            const Icon = categoryIcons[category.name] || BarChart3;
            return (
              <div key={category.name} className="mb-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-blue-400" />
                  </div>
                  <h2 className="text-xl font-semibold">{category.name}</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {category.indicators.map(indicator => (
                    <div
                      key={indicator.id}
                      className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-5 border border-gray-800 hover:border-gray-700 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-white">{indicator.name}</h3>
                          <p className="text-xs text-gray-500">{indicator.id}</p>
                        </div>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          indicator.impact === 'bullish' ? 'bg-green-500/20 text-green-400' :
                          indicator.impact === 'bearish' ? 'bg-red-500/20 text-red-400' :
                          'bg-gray-700 text-gray-400'
                        }`}>
                          {indicator.trend === 'up' ? (
                            <ArrowUpRight className="w-4 h-4" />
                          ) : indicator.trend === 'down' ? (
                            <ArrowDownRight className="w-4 h-4" />
                          ) : (
                            <Activity className="w-4 h-4" />
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-end gap-3 mb-3">
                        <span className="text-2xl font-bold">
                          {indicator.value?.toFixed(2) || 'N/A'}
                        </span>
                        {indicator.change !== null && (
                          <span className={`text-sm ${
                            indicator.change > 0 ? 'text-green-400' : 
                            indicator.change < 0 ? 'text-red-400' : 'text-gray-400'
                          }`}>
                            {indicator.change > 0 ? '+' : ''}{indicator.change.toFixed(2)}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                        {indicator.description}
                      </p>
                      
                      <div className="text-xs text-gray-600">
                        Updated: {indicator.date}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
      </div>

      {/* Navigation */}
      <div className="fixed bottom-6 right-6">
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg shadow-lg transition-colors"
        >
          Back to Market Oracle
        </Link>
      </div>
    </div>
  );
}
