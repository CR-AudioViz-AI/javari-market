'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Gauge, TrendingUp, TrendingDown, Activity, RefreshCw, AlertTriangle, ArrowUp, ArrowDown } from 'lucide-react';

interface MoodIndicator {
  name: string;
  value: number;
  signal: string;
  weight: number;
  description: string;
}

interface MoodData {
  mood: {
    score: number;
    signal: string;
    label: string;
    emoji: string;
    color: string;
    implication: string;
    trend: string;
  };
  historical: {
    yesterday: number;
    weekAgo: number;
    monthAgo: number;
  };
  indicators: MoodIndicator[];
  insight: string;
}

export default function MoodGaugePage() {
  const [data, setData] = useState<MoodData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch('/api/mood');
      const json = await res.json();
      if (json.success) setData(json);
    } catch (error) { console.error('Error:', error); }
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Gauge className="w-16 h-16 text-yellow-400 animate-pulse" />
      </div>
    );
  }

  if (!data) return null;

  const getGaugeRotation = (score: number) => {
    return (score / 100) * 180 - 90;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-green-300';
    if (score >= 40) return 'text-yellow-400';
    if (score >= 20) return 'text-orange-400';
    return 'text-red-400';
  };

  const getGradient = (score: number) => {
    if (score >= 60) return 'from-green-500/20 to-emerald-500/10';
    if (score >= 40) return 'from-yellow-500/20 to-orange-500/10';
    return 'from-red-500/20 to-rose-500/10';
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Hero with Gauge */}
      <div className={`relative overflow-hidden bg-gradient-to-br ${getGradient(data.mood.score)} to-gray-950`}>
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-20" style={{ background: `radial-gradient(circle, ${data.mood.color} 0%, transparent 70%)` }} />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 py-16">
          <div className="flex items-center gap-4 mb-12">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center">
              <Gauge className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                Market Mood Gauge
              </h1>
              <p className="text-gray-400">Fear & Greed Index</p>
            </div>
          </div>

          {/* Main Gauge */}
          <div className="flex flex-col items-center mb-12">
            <div className="relative w-80 h-40 mb-4">
              {/* Gauge Background */}
              <svg viewBox="0 0 200 100" className="w-full h-full">
                {/* Background arc */}
                <path
                  d="M 10 100 A 90 90 0 0 1 190 100"
                  fill="none"
                  stroke="#374151"
                  strokeWidth="20"
                  strokeLinecap="round"
                />
                {/* Colored segments */}
                <path d="M 10 100 A 90 90 0 0 1 28 53" fill="none" stroke="#ef4444" strokeWidth="20" strokeLinecap="round" />
                <path d="M 28 53 A 90 90 0 0 1 64 23" fill="none" stroke="#f97316" strokeWidth="20" />
                <path d="M 64 23 A 90 90 0 0 1 136 23" fill="none" stroke="#eab308" strokeWidth="20" />
                <path d="M 136 23 A 90 90 0 0 1 172 53" fill="none" stroke="#84cc16" strokeWidth="20" />
                <path d="M 172 53 A 90 90 0 0 1 190 100" fill="none" stroke="#22c55e" strokeWidth="20" strokeLinecap="round" />
                
                {/* Needle */}
                <g transform={`rotate(${getGaugeRotation(data.mood.score)} 100 100)`}>
                  <line x1="100" y1="100" x2="100" y2="25" stroke="white" strokeWidth="4" strokeLinecap="round" />
                  <circle cx="100" cy="100" r="8" fill="white" />
                </g>
              </svg>
              
              {/* Labels */}
              <div className="absolute bottom-0 left-4 text-red-400 text-sm font-medium">
                Fear
              </div>
              <div className="absolute bottom-0 right-4 text-green-400 text-sm font-medium">
                Greed
              </div>
            </div>

            {/* Score Display */}
            <div className="text-center">
              <div className="text-6xl mb-2">{data.mood.emoji}</div>
              <div className={`text-6xl font-bold ${getScoreColor(data.mood.score)}`}>
                {data.mood.score}
              </div>
              <div className={`text-2xl font-semibold ${getScoreColor(data.mood.score)}`}>
                {data.mood.label}
              </div>
              <div className="flex items-center justify-center gap-2 mt-2 text-gray-400">
                {data.mood.trend === 'improving' ? (
                  <><ArrowUp className="w-4 h-4 text-green-400" /> Improving</>
                ) : data.mood.trend === 'deteriorating' ? (
                  <><ArrowDown className="w-4 h-4 text-red-400" /> Deteriorating</>
                ) : (
                  <><Activity className="w-4 h-4" /> Stable</>
                )}
              </div>
            </div>
          </div>

          {/* Insight */}
          <div className="max-w-2xl mx-auto text-center mb-8">
            <p className="text-lg text-gray-300">{data.insight}</p>
          </div>

          {/* Historical Comparison */}
          <div className="grid grid-cols-3 gap-4 max-w-xl mx-auto">
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="text-gray-400 text-sm mb-1">Yesterday</div>
              <div className={`text-2xl font-bold ${getScoreColor(data.historical.yesterday)}`}>
                {data.historical.yesterday}
              </div>
            </div>
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="text-gray-400 text-sm mb-1">Week Ago</div>
              <div className={`text-2xl font-bold ${getScoreColor(data.historical.weekAgo)}`}>
                {data.historical.weekAgo}
              </div>
            </div>
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="text-gray-400 text-sm mb-1">Month Ago</div>
              <div className={`text-2xl font-bold ${getScoreColor(data.historical.monthAgo)}`}>
                {data.historical.monthAgo}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Indicators */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold mb-6">What's Driving the Mood?</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.indicators.map((indicator, idx) => (
            <div key={idx} className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-5 border border-gray-800">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">{indicator.name}</h3>
                <div className={`px-2 py-1 rounded text-xs font-medium ${
                  indicator.signal.includes('greed') ? 'bg-green-500/20 text-green-400' :
                  indicator.signal.includes('fear') ? 'bg-red-500/20 text-red-400' :
                  'bg-gray-700 text-gray-400'
                }`}>
                  {indicator.signal.replace('_', ' ').toUpperCase()}
                </div>
              </div>
              
              {/* Mini gauge bar */}
              <div className="relative h-2 bg-gray-800 rounded-full mb-3 overflow-hidden">
                <div 
                  className={`absolute h-full rounded-full ${
                    indicator.value >= 60 ? 'bg-green-500' :
                    indicator.value >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${indicator.value}%` }}
                />
              </div>
              
              <div className="flex items-end justify-between">
                <span className={`text-2xl font-bold ${getScoreColor(indicator.value)}`}>
                  {Math.round(indicator.value)}
                </span>
                <span className="text-xs text-gray-500">Weight: {indicator.weight}%</span>
              </div>
              
              <p className="text-xs text-gray-500 mt-2">{indicator.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Trading Tips */}
      <div className="max-w-7xl mx-auto px-4 pb-16">
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl p-6 border border-blue-500/20">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            Investment Implication
          </h3>
          <p className="text-gray-300">{data.mood.implication}</p>
          
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Extreme Fear (0-20):</span>
              <span className="text-green-400 ml-2">Contrarian buy signal</span>
            </div>
            <div>
              <span className="text-gray-400">Extreme Greed (80-100):</span>
              <span className="text-red-400 ml-2">Consider taking profits</span>
            </div>
          </div>
        </div>
      </div>

      {/* Back button */}
      <div className="fixed bottom-6 right-6">
        <Link href="/" className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg shadow-lg">
          Back to Market Oracle
        </Link>
      </div>
    </div>
  );
}
