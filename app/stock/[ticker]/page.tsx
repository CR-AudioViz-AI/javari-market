// app/stock/[ticker]/page.tsx
// Stock Detail Page - Shows ALL AI analyses with individual reasoning

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  TrendingUp, TrendingDown, MinusCircle, Brain, Bot, Sparkles, Zap,
  Target, Shield, AlertTriangle, Rocket, ExternalLink, RefreshCw,
  ChevronDown, ChevronUp, Building2, DollarSign, BarChart3, Clock,
  CheckCircle, XCircle, ArrowLeft
} from 'lucide-react';

interface FactorAssessment {
  factorId: string;
  factorName: string;
  value: string;
  interpretation: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  confidence: number;
  reasoning: string;
}

interface Pick {
  id: string;
  ai_model: string;
  symbol: string;
  company_name: string;
  sector: string;
  direction: 'UP' | 'DOWN' | 'HOLD';
  confidence: number;
  timeframe: string;
  entry_price: number;
  target_price: number;
  stop_loss: number;
  thesis: string;
  full_reasoning: string;
  factor_assessments: FactorAssessment[];
  key_bullish_factors: string[];
  key_bearish_factors: string[];
  risks: string[];
  catalysts: string[];
  created_at: string;
  status: string;
}

interface Consensus {
  id: string;
  symbol: string;
  direction: string;
  ai_combination: string[];
  consensus_strength: number;
  javari_confidence: number;
  javari_reasoning: string;
  created_at: string;
}

const AI_INFO: Record<string, { name: string; color: string; icon: JSX.Element; personality: string }> = {
  gpt4: { 
    name: 'GPT-4', 
    color: 'emerald', 
    icon: <Brain className="w-5 h-5" />,
    personality: 'Conservative & Thorough - Deep reasoning with high precision'
  },
  claude: { 
    name: 'Claude', 
    color: 'purple', 
    icon: <Bot className="w-5 h-5" />,
    personality: 'Balanced & Risk-Aware - Clear explanations with risk focus'
  },
  gemini: { 
    name: 'Gemini', 
    color: 'blue', 
    icon: <Sparkles className="w-5 h-5" />,
    personality: 'Technical & Pattern-Focused - Chart patterns and price targets'
  },
  perplexity: { 
    name: 'Perplexity', 
    color: 'cyan', 
    icon: <Zap className="w-5 h-5" />,
    personality: 'Real-Time & News-Driven - Breaking news and sentiment'
  },
};

const DirectionBadge = ({ direction, size = 'md' }: { direction: string; size?: 'sm' | 'md' | 'lg' }) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base font-semibold'
  };
  
  if (direction === 'UP') {
    return (
      <span className={`inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-400 rounded-full ${sizeClasses[size]}`}>
        <TrendingUp className="w-4 h-4" /> UP
      </span>
    );
  }
  if (direction === 'DOWN') {
    return (
      <span className={`inline-flex items-center gap-1 bg-red-500/20 text-red-400 rounded-full ${sizeClasses[size]}`}>
        <TrendingDown className="w-4 h-4" /> DOWN
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1 bg-yellow-500/20 text-yellow-400 rounded-full ${sizeClasses[size]}`}>
      <MinusCircle className="w-4 h-4" /> HOLD
    </span>
  );
};

export default function StockDetailPage() {
  const params = useParams();
  const ticker = (params.ticker as string)?.toUpperCase();
  
  const [picks, setPicks] = useState<Pick[]>([]);
  const [consensus, setConsensus] = useState<Consensus | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [expandedAI, setExpandedAI] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (ticker) {
      fetchPicks();
    }
  }, [ticker]);

  const fetchPicks = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/ai-picks/generate?symbol=${ticker}&limit=10`);
      const data = await res.json();
      
      if (data.success && data.picks) {
        // Get most recent pick from each AI
        const latestByAI: Record<string, Pick> = {};
        for (const pick of data.picks) {
          if (!latestByAI[pick.ai_model] || 
              new Date(pick.created_at) > new Date(latestByAI[pick.ai_model].created_at)) {
            latestByAI[pick.ai_model] = pick;
          }
        }
        setPicks(Object.values(latestByAI));
      }
      
      // Get consensus
      const consensusRes = await fetch(`/api/consensus?symbol=${ticker}`);
      const consensusData = await consensusRes.json();
      if (consensusData.success && consensusData.consensus) {
        setConsensus(consensusData.consensus);
      }
    } catch (err) {
      console.error('Failed to fetch picks:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateNewAnalysis = async () => {
    setGenerating(true);
    setError('');
    try {
      const res = await fetch('/api/ai-picks/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: ticker })
      });
      const data = await res.json();
      
      if (data.success) {
        setPicks(data.picks || []);
        setConsensus(data.consensus || null);
      } else {
        setError(data.error || 'Failed to generate analysis');
      }
    } catch (err) {
      setError('Failed to generate analysis');
    } finally {
      setGenerating(false);
    }
  };

  const toggleExpand = (aiModel: string) => {
    setExpandedAI(expandedAI === aiModel ? null : aiModel);
  };

  if (!ticker) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400">Invalid stock ticker</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <Link href="/ai-picks" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                {ticker}
                {picks[0]?.company_name && (
                  <span className="text-lg text-gray-400 font-normal">
                    {picks[0].company_name}
                  </span>
                )}
              </h1>
              {picks[0]?.sector && (
                <p className="text-gray-400 flex items-center gap-2 mt-1">
                  <Building2 className="w-4 h-4" /> {picks[0].sector}
                </p>
              )}
            </div>
            
            <button
              onClick={generateNewAnalysis}
              disabled={generating}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${generating ? 'animate-spin' : ''}`} />
              {generating ? 'Analyzing...' : 'Get Fresh Analysis'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6 text-red-400">
            {error}
          </div>
        )}

        {/* Javari Consensus Card */}
        {consensus && (
          <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-2xl p-6 mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <Target className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Javari Consensus</h2>
                <p className="text-gray-400">Multi-AI weighted verdict</p>
              </div>
              <div className="ml-auto">
                <DirectionBadge direction={consensus.direction} size="lg" />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-gray-800/50 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Confidence</p>
                <p className="text-2xl font-bold text-amber-400">{consensus.javari_confidence}%</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Consensus Strength</p>
                <p className="text-2xl font-bold text-white">{(consensus.consensus_strength * 100).toFixed(0)}%</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <p className="text-gray-400 text-sm">AIs Agree</p>
                <p className="text-2xl font-bold text-white">{consensus.ai_combination?.length || 0}/4</p>
              </div>
            </div>
            
            <p className="text-gray-300">{consensus.javari_reasoning}</p>
          </div>
        )}

        {/* Individual AI Analyses */}
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Brain className="w-6 h-6 text-amber-400" />
          Individual AI Analyses
        </h2>

        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading analyses...</p>
          </div>
        ) : picks.length === 0 ? (
          <div className="bg-gray-800/50 rounded-xl p-12 text-center">
            <Brain className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No Analysis Yet</h3>
            <p className="text-gray-400 mb-6">Click the button above to generate a fresh AI analysis for {ticker}</p>
            <button
              onClick={generateNewAnalysis}
              disabled={generating}
              className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-6 py-3 rounded-lg font-medium"
            >
              Generate Analysis
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {picks.map((pick) => {
              const ai = AI_INFO[pick.ai_model] || { name: pick.ai_model, color: 'gray', icon: <Bot className="w-5 h-5" />, personality: 'AI Analyst' };
              const isExpanded = expandedAI === pick.ai_model;
              
              return (
                <div 
                  key={pick.id} 
                  className={`bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden transition-all ${isExpanded ? 'ring-2 ring-amber-500/50' : ''}`}
                >
                  {/* Header - Always visible */}
                  <button
                    onClick={() => toggleExpand(pick.ai_model)}
                    className="w-full p-6 flex items-center gap-4 text-left hover:bg-gray-800/80 transition"
                  >
                    <div className={`w-12 h-12 rounded-xl bg-${ai.color}-500/20 flex items-center justify-center text-${ai.color}-400`}>
                      {ai.icon}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white">{ai.name}</h3>
                      <p className="text-gray-400 text-sm">{ai.personality}</p>
                    </div>
                    
                    <DirectionBadge direction={pick.direction} />
                    
                    <div className="text-right mr-4">
                      <p className="text-2xl font-bold text-white">{pick.confidence}%</p>
                      <p className="text-gray-400 text-sm">Confidence</p>
                    </div>
                    
                    {isExpanded ? (
                      <ChevronUp className="w-6 h-6 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-6 h-6 text-gray-400" />
                    )}
                  </button>
                  
                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t border-gray-700 p-6">
                      {/* Price Targets */}
                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="bg-gray-900 rounded-lg p-4">
                          <p className="text-gray-400 text-sm">Entry Price</p>
                          <p className="text-xl font-bold text-white">${pick.entry_price?.toFixed(2)}</p>
                        </div>
                        <div className="bg-gray-900 rounded-lg p-4">
                          <p className="text-gray-400 text-sm">Target Price</p>
                          <p className="text-xl font-bold text-emerald-400">${pick.target_price?.toFixed(2)}</p>
                        </div>
                        <div className="bg-gray-900 rounded-lg p-4">
                          <p className="text-gray-400 text-sm">Stop Loss</p>
                          <p className="text-xl font-bold text-red-400">${pick.stop_loss?.toFixed(2)}</p>
                        </div>
                      </div>
                      
                      {/* Thesis */}
                      <div className="mb-6">
                        <h4 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                          <Target className="w-5 h-5 text-amber-400" /> Thesis
                        </h4>
                        <p className="text-gray-300 bg-gray-900 rounded-lg p-4">{pick.thesis}</p>
                      </div>
                      
                      {/* Full Reasoning */}
                      <div className="mb-6">
                        <h4 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                          <Brain className="w-5 h-5 text-amber-400" /> Full Reasoning
                        </h4>
                        <div className="text-gray-300 bg-gray-900 rounded-lg p-4 whitespace-pre-wrap">
                          {pick.full_reasoning}
                        </div>
                      </div>
                      
                      {/* Bullish & Bearish Factors */}
                      <div className="grid md:grid-cols-2 gap-4 mb-6">
                        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-4">
                          <h4 className="text-emerald-400 font-semibold mb-3 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5" /> Bullish Factors
                          </h4>
                          <ul className="space-y-2">
                            {pick.key_bullish_factors?.map((factor, i) => (
                              <li key={i} className="text-gray-300 flex items-start gap-2">
                                <span className="text-emerald-400 mt-1">•</span> {factor}
                              </li>
                            ))}
                            {(!pick.key_bullish_factors || pick.key_bullish_factors.length === 0) && (
                              <li className="text-gray-500">None identified</li>
                            )}
                          </ul>
                        </div>
                        
                        <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4">
                          <h4 className="text-red-400 font-semibold mb-3 flex items-center gap-2">
                            <XCircle className="w-5 h-5" /> Bearish Factors
                          </h4>
                          <ul className="space-y-2">
                            {pick.key_bearish_factors?.map((factor, i) => (
                              <li key={i} className="text-gray-300 flex items-start gap-2">
                                <span className="text-red-400 mt-1">•</span> {factor}
                              </li>
                            ))}
                            {(!pick.key_bearish_factors || pick.key_bearish_factors.length === 0) && (
                              <li className="text-gray-500">None identified</li>
                            )}
                          </ul>
                        </div>
                      </div>
                      
                      {/* Risks & Catalysts */}
                      <div className="grid md:grid-cols-2 gap-4 mb-6">
                        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-4">
                          <h4 className="text-yellow-400 font-semibold mb-3 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" /> Risks
                          </h4>
                          <ul className="space-y-2">
                            {pick.risks?.map((risk, i) => (
                              <li key={i} className="text-gray-300 flex items-start gap-2">
                                <span className="text-yellow-400 mt-1">•</span> {risk}
                              </li>
                            ))}
                            {(!pick.risks || pick.risks.length === 0) && (
                              <li className="text-gray-500">None identified</li>
                            )}
                          </ul>
                        </div>
                        
                        <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-lg p-4">
                          <h4 className="text-cyan-400 font-semibold mb-3 flex items-center gap-2">
                            <Rocket className="w-5 h-5" /> Catalysts
                          </h4>
                          <ul className="space-y-2">
                            {pick.catalysts?.map((catalyst, i) => (
                              <li key={i} className="text-gray-300 flex items-start gap-2">
                                <span className="text-cyan-400 mt-1">•</span> {catalyst}
                              </li>
                            ))}
                            {(!pick.catalysts || pick.catalysts.length === 0) && (
                              <li className="text-gray-500">None identified</li>
                            )}
                          </ul>
                        </div>
                      </div>
                      
                      {/* Factor Assessments */}
                      {pick.factor_assessments && pick.factor_assessments.length > 0 && (
                        <div>
                          <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-amber-400" /> Factor Analysis
                          </h4>
                          <div className="grid md:grid-cols-2 gap-3">
                            {pick.factor_assessments.map((factor, i) => (
                              <div key={i} className="bg-gray-900 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-white font-medium">{factor.factorName}</span>
                                  <span className={`text-sm px-2 py-0.5 rounded ${
                                    factor.interpretation === 'BULLISH' ? 'bg-emerald-500/20 text-emerald-400' :
                                    factor.interpretation === 'BEARISH' ? 'bg-red-500/20 text-red-400' :
                                    'bg-yellow-500/20 text-yellow-400'
                                  }`}>
                                    {factor.interpretation}
                                  </span>
                                </div>
                                <p className="text-gray-400 text-sm">Value: {factor.value}</p>
                                <p className="text-gray-500 text-sm mt-1">{factor.reasoning}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Timestamp */}
                      <div className="mt-6 pt-4 border-t border-gray-700 flex items-center gap-2 text-gray-500 text-sm">
                        <Clock className="w-4 h-4" />
                        Analysis generated: {new Date(pick.created_at).toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
