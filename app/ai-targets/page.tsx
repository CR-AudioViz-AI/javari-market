'use client';

// Symbols the models are currently holding. Static so the page needs no data to render.
const SUGGESTED = ['NVDA', 'META', 'AMD', 'AAPL', 'MSFT'];

import { useState } from 'react';
import Link from 'next/link';
import { Target, Brain, TrendingUp, TrendingDown, AlertTriangle, Loader2, Search, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

interface PriceTarget {
  model: string;
  modelId: string;
  tier: string;
  target30Day: number;
  target90Day: number;
  target12Month: number;
  recommendation: string;
  confidence: number;
  reasoning: string;
  keyFactors: string[];
  risks: string[];
  upside30Day: number;
  upside12Month: number;
}

interface TargetData {
  stock: { symbol: string; name: string; currentPrice: number; changePercent: number; high52Week: number; low52Week: number; marketCap: number; pe: number; };
  consensus: { target30Day: number; target90Day: number; target12Month: number; upside30Day: number; upside12Month: number; recommendation: string; confidence: number; modelsAgree: number; };
  topFactors: Array<{ factor: string; mentionedBy: number }>;
  topRisks: Array<{ risk: string; mentionedBy: number }>;
  aiTargets: PriceTarget[];
}

const tierColors: Record<string, string> = { large: 'bg-purple-500/20 text-purple-400', medium: 'bg-blue-500/20 text-blue-400', small: 'bg-gray-500/20 text-gray-400' };
const recColors: Record<string, string> = { strong_buy: 'bg-green-500', buy: 'bg-green-400/80', hold: 'bg-yellow-500 text-black', sell: 'bg-red-400/80', strong_sell: 'bg-red-500' };

export default function AITargetsPage() {
  const [symbol, setSymbol] = useState('');
  const [data, setData] = useState<TargetData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedModel, setExpandedModel] = useState<string | null>(null);

  async function fetchTargets() {
    if (!symbol.trim()) return;
    setLoading(true); setError(''); setData(null);
    try {
      const res = await fetch(`/api/price-targets?symbol=${symbol.toUpperCase()}`);
      const json = await res.json();
      if (json.success) setData(json);
      else setError(json.error || 'Failed to fetch price targets');
    } catch { setError('Network error'); }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-900/20 via-indigo-900/10 to-gray-950">
        <div className="absolute inset-0"><div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl" /></div>
        <div className="relative max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
              <Target className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-indigo-500 bg-clip-text text-transparent">AI Price Targets</h1>
              <p className="text-gray-400">Multi-AI consensus: GPT-4, Claude, Gemini & Llama</p>
            </div>
          </div>
          <div className="max-w-xl mx-auto mb-8">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="text" value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} onKeyDown={(e) => e.key === 'Enter' && fetchTargets()} placeholder="Enter symbol (AAPL, TSLA...)" className="w-full pl-12 pr-4 py-4 bg-gray-900/50 border border-gray-700 rounded-xl focus:border-purple-500 focus:outline-none text-lg" />
              </div>
              {/* 2026-09-12: the page opened blank with only a search box, so it read as
                  broken. These are the symbols the contest is holding right now. */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-xs text-gray-400">Try:</span>
                {SUGGESTED.map((sym) => (
                  <button key={sym} type="button" onClick={() => { setSymbol(sym); setTimeout(fetchTargets, 0); }}
                    className="inline-flex min-h-[2.75rem] items-center rounded-lg px-3 text-sm text-gray-200 ring-1 ring-white/15 hover:bg-white/5">
                    {sym}
                  </button>
                ))}
              </div>
              <button onClick={fetchTargets} disabled={loading || !symbol.trim()} className="px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl font-semibold disabled:opacity-50 flex items-center gap-2">
                {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing...</> : <><Sparkles className="w-5 h-5" /> Get Targets</>}
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-4 justify-center">
              {['AAPL', 'TSLA', 'NVDA', 'MSFT', 'META', 'GOOGL', 'AMZN'].map(s => (
                <button key={s} onClick={() => setSymbol(s)} className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm">{s}</button>
              ))}
            </div>
          </div>
          {error && <div className="max-w-xl mx-auto bg-red-500/20 border border-red-500/30 rounded-xl p-4 text-center text-red-400">{error}</div>}
        </div>
      </div>

      {data && (
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Stock Header */}
          <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800 mb-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div><h2 className="text-3xl font-bold">{data.stock.symbol}</h2><p className="text-gray-400">{data.stock.name}</p></div>
              <div className="text-right">
                <div className="text-3xl font-bold">${data.stock.currentPrice.toFixed(2)}</div>
                <div className={data.stock.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}>{data.stock.changePercent >= 0 ? '+' : ''}{data.stock.changePercent.toFixed(2)}%</div>
              </div>
            </div>
          </div>

          {/* Consensus */}
          <div className="bg-gradient-to-br from-purple-900/30 to-indigo-900/30 rounded-2xl p-8 border border-purple-500/20 mb-8">
            <div className="flex items-center gap-2 mb-6"><Brain className="w-6 h-6 text-purple-400" /><h3 className="text-xl font-bold">AI Consensus</h3><span className="text-sm text-gray-400">({data.consensus.modelsAgree} models)</span></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
              <div className="text-center">
                <div className="text-gray-400 text-sm mb-1">30-Day Target</div>
                <div className="text-3xl font-bold">${data.consensus.target30Day.toFixed(2)}</div>
                <div className={data.consensus.upside30Day >= 0 ? 'text-green-400' : 'text-red-400'}>{data.consensus.upside30Day >= 0 ? '+' : ''}{data.consensus.upside30Day.toFixed(1)}%</div>
              </div>
              <div className="text-center">
                <div className="text-gray-400 text-sm mb-1">90-Day Target</div>
                <div className="text-3xl font-bold">${data.consensus.target90Day.toFixed(2)}</div>
              </div>
              <div className="text-center">
                <div className="text-gray-400 text-sm mb-1">12-Month Target</div>
                <div className="text-3xl font-bold">${data.consensus.target12Month.toFixed(2)}</div>
                <div className={data.consensus.upside12Month >= 0 ? 'text-green-400' : 'text-red-400'}>{data.consensus.upside12Month >= 0 ? '+' : ''}{data.consensus.upside12Month.toFixed(1)}%</div>
              </div>
              <div className="text-center">
                <div className="text-gray-400 text-sm mb-1">Rating</div>
                <div className={`inline-block px-4 py-2 rounded-lg font-bold ${recColors[data.consensus.recommendation] || 'bg-gray-700'}`}>
                  {data.consensus.recommendation.replace('_', ' ').toUpperCase()}
                </div>
                <div className="text-gray-400 text-sm mt-1">{data.consensus.confidence}% confidence</div>
              </div>
            </div>
          </div>

          {/* Individual AI Targets */}
          <h3 className="text-xl font-bold mb-4">Individual AI Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {data.aiTargets.map((target) => (
              <div key={target.modelId} className="bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden">
                <button onClick={() => setExpandedModel(expandedModel === target.modelId ? null : target.modelId)} className="w-full p-5 flex items-center justify-between hover:bg-gray-800/50">
                  <div className="flex items-center gap-3">
                    <div className={`px-3 py-1 rounded-lg text-sm font-medium ${tierColors[target.tier]}`}>{target.tier.toUpperCase()}</div>
                    <span className="font-semibold">{target.model}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-bold">${target.target12Month.toFixed(2)}</div>
                      <div className={`text-sm ${target.upside12Month >= 0 ? 'text-green-400' : 'text-red-400'}`}>{target.upside12Month >= 0 ? '+' : ''}{target.upside12Month.toFixed(1)}%</div>
                    </div>
                    {expandedModel === target.modelId ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </button>
                {expandedModel === target.modelId && (
                  <div className="px-5 pb-5 border-t border-gray-800 pt-4">
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div><span className="text-gray-400 text-sm">30-Day</span><div className="font-semibold">${target.target30Day.toFixed(2)}</div></div>
                      <div><span className="text-gray-400 text-sm">90-Day</span><div className="font-semibold">${target.target90Day.toFixed(2)}</div></div>
                      <div><span className="text-gray-400 text-sm">12-Month</span><div className="font-semibold">${target.target12Month.toFixed(2)}</div></div>
                    </div>
                    <p className="text-gray-300 text-sm mb-4">{target.reasoning}</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-green-400 text-sm font-semibold mb-2">Key Factors</h4>
                        <ul className="text-sm text-gray-400 space-y-1">
                          {target.keyFactors?.map((f, i) => <li key={i}>• {f}</li>)}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-red-400 text-sm font-semibold mb-2">Risks</h4>
                        <ul className="text-sm text-gray-400 space-y-1">
                          {target.risks?.map((r, i) => <li key={i}>• {r}</li>)}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Factors & Risks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
              <h4 className="flex items-center gap-2 text-green-400 font-semibold mb-4"><TrendingUp className="w-5 h-5" /> Top Bullish Factors</h4>
              {data.topFactors?.map((f, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                  <span className="text-gray-300">{f.factor}</span>
                  <span className="text-gray-500 text-sm">{f.mentionedBy} AI{f.mentionedBy > 1 ? 's' : ''}</span>
                </div>
              ))}
            </div>
            <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
              <h4 className="flex items-center gap-2 text-red-400 font-semibold mb-4"><AlertTriangle className="w-5 h-5" /> Key Risks</h4>
              {data.topRisks?.map((r, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                  <span className="text-gray-300">{r.risk}</span>
                  <span className="text-gray-500 text-sm">{r.mentionedBy} AI{r.mentionedBy > 1 ? 's' : ''}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-center text-yellow-400 text-sm">
            ⚠️ AI-generated price targets are for informational purposes only. Not financial advice. Always do your own research.
          </div>
        </div>
      )}

      <div className="fixed bottom-6 right-6">
        <Link href="/" className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg shadow-lg">Back to Market Oracle</Link>
      </div>
    </div>
  );
}
