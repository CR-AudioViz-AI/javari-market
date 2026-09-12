'use client';

const EXAMPLES = [
  'The Fed cuts rates by 50 basis points',
  'NVIDIA misses earnings expectations',
  'Oil rises above $120 a barrel',
];

import { useState } from 'react';
import Link from 'next/link';
import { Zap, TrendingUp, TrendingDown, Loader2, BarChart3, Building2, AlertTriangle, Play } from 'lucide-react';

interface SimulationResult {
  scenario: string;
  probability: number;
  marketImpact: { sp500: { change: number; reasoning: string }; nasdaq: { change: number; reasoning: string }; bonds: { change: number; reasoning: string }; gold: { change: number; reasoning: string }; };
  sectorImpacts: Array<{ sector: string; impact: string; magnitude: number }>;
  stockPicks: Array<{ symbol: string; action: string; expectedMove: number }>;
  timeline: string;
  confidence: number;
}

const scenarios = [
  { id: 'fed_rate_cut', name: 'Fed Rate Cut', icon: '📉', description: 'Federal Reserve cuts rates by 25bp' },
  { id: 'fed_rate_hike', name: 'Fed Rate Hike', icon: '📈', description: 'Federal Reserve raises rates by 25bp' },
  { id: 'recession', name: 'Recession', icon: '🔻', description: 'NBER declares US recession' },
  { id: 'inflation_spike', name: 'Inflation Spike', icon: '🔥', description: 'CPI surges above expectations' },
  { id: 'tech_crash', name: 'Tech Crash', icon: '💥', description: 'Major tech stocks drop 20%' },
  { id: 'oil_shock', name: 'Oil Shock', icon: '🛢️', description: 'Oil spikes to $150/barrel' },
  { id: 'ai_breakthrough', name: 'AI Breakthrough', icon: '🤖', description: 'Major AI advancement announced' },
];

export default function SimulatorPage() {
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [customScenario, setCustomScenario] = useState('');
  const [result, setResult] = useState<{ simulation: SimulationResult; scenarioName: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function runSimulation() {
    setLoading(true); setResult(null);
    try {
      const url = customScenario ? `/api/simulator?custom=${encodeURIComponent(customScenario)}` : `/api/simulator?scenario=${selectedScenario}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) setResult(json);
    } catch (error) { console.error(error); }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="relative overflow-hidden bg-gradient-to-br from-orange-900/20 via-red-900/10 to-gray-950">
        <div className="absolute inset-0"><div className="absolute top-20 right-10 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" /></div>
        <div className="relative max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">What-If Simulator</h1>
              <p className="text-gray-400">AI-powered market scenario analysis</p>
            </div>
          </div>

          {/* Scenario Selection */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Select a Scenario</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {scenarios.map(s => (
                <button key={s.id} onClick={() => { setSelectedScenario(s.id); setCustomScenario(''); }}
                  className={`p-4 rounded-xl border transition-all text-center ${selectedScenario === s.id ? 'bg-orange-500/20 border-orange-500' : 'bg-gray-900/50 border-gray-800 hover:border-gray-600'}`}>
                  <div className="text-2xl mb-2">{s.icon}</div>
                  <div className="text-sm font-medium">{s.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Scenario */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Or Create Your Own</h3>
            <input type="text" value={customScenario} onChange={(e) => { setCustomScenario(e.target.value); setSelectedScenario(null); }}
              placeholder="E.g., Apple announces $100B stock buyback, China bans iPhone sales..."
              className="w-full px-4 py-4 bg-gray-900/50 border border-gray-700 rounded-xl focus:border-orange-500 focus:outline-none" />
          </div>
            {/* 2026-09-12: opened as an empty box with no way in. */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs text-gray-400">Try one:</span>
              {EXAMPLES.map((ex) => (
                <button key={ex} type="button" onClick={() => setCustomScenario(ex)}
                  className="inline-flex min-h-[2.75rem] items-center rounded-lg px-3 text-left text-sm text-gray-200 ring-1 ring-white/15 hover:bg-white/5">
                  {ex}
                </button>
              ))}
            </div>

          {/* Run Button */}
          <button onClick={runSimulation} disabled={loading || (!selectedScenario && !customScenario)}
            className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2 mx-auto">
            {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Simulating...</> : <><Play className="w-5 h-5" /> Run Simulation</>}
          </button>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800 mb-8">
            <h2 className="text-2xl font-bold mb-2">{result.scenarioName}</h2>
            <p className="text-gray-400 mb-4">{result.simulation.scenario}</p>
            <div className="flex items-center gap-4">
              <span className="text-gray-400">Confidence:</span>
              <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500" style={{ width: `${result.simulation.confidence}%` }} />
              </div>
              <span className="font-bold">{result.simulation.confidence}%</span>
            </div>
          </div>

          {/* Market Impact */}
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5" /> Market Impact</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {Object.entries(result.simulation.marketImpact).map(([key, val]) => (
              <div key={key} className="bg-gray-900/50 rounded-xl p-5 border border-gray-800">
                <div className="text-gray-400 text-sm capitalize mb-1">{key.replace('sp500', 'S&P 500')}</div>
                <div className={`text-3xl font-bold ${val.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {val.change >= 0 ? '+' : ''}{val.change.toFixed(1)}%
                </div>
                <p className="text-xs text-gray-500 mt-2">{val.reasoning}</p>
              </div>
            ))}
          </div>

          {/* Sector Impacts */}
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Building2 className="w-5 h-5" /> Sector Impacts</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
            {result.simulation.sectorImpacts?.map((s, i) => (
              <div key={i} className={`rounded-xl p-4 border ${s.impact === 'positive' ? 'bg-green-500/10 border-green-500/30' : s.impact === 'negative' ? 'bg-red-500/10 border-red-500/30' : 'bg-gray-800 border-gray-700'}`}>
                <div className="font-semibold">{s.sector}</div>
                <div className="flex items-center gap-2 mt-1">
                  {s.impact === 'positive' ? <TrendingUp className="w-4 h-4 text-green-400" /> : s.impact === 'negative' ? <TrendingDown className="w-4 h-4 text-red-400" /> : null}
                  <span className={s.impact === 'positive' ? 'text-green-400' : s.impact === 'negative' ? 'text-red-400' : 'text-gray-400'}>{s.impact}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Stock Picks */}
          <h3 className="text-xl font-bold mb-4">AI Stock Picks for This Scenario</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
            {result.simulation.stockPicks?.map((p, i) => (
              <div key={i} className={`rounded-xl p-4 border ${p.action === 'buy' ? 'bg-green-500/10 border-green-500/30' : p.action === 'sell' ? 'bg-red-500/10 border-red-500/30' : 'bg-gray-800 border-gray-700'}`}>
                <div className="font-bold text-lg">{p.symbol}</div>
                <div className={`text-sm font-semibold ${p.action === 'buy' ? 'text-green-400' : p.action === 'sell' ? 'text-red-400' : 'text-gray-400'}`}>{p.action.toUpperCase()}</div>
                <div className={p.expectedMove >= 0 ? 'text-green-400' : 'text-red-400'}>{p.expectedMove >= 0 ? '+' : ''}{p.expectedMove}%</div>
              </div>
            ))}
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-center text-yellow-400 text-sm">
            <AlertTriangle className="w-4 h-4 inline mr-2" />
            Simulated scenario for educational purposes. Actual market reactions may differ significantly.
          </div>
        </div>
      )}

      <div className="fixed bottom-6 right-6">
        <Link href="/" className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg shadow-lg">Back to Market Oracle</Link>
      </div>
    </div>
  );
}
