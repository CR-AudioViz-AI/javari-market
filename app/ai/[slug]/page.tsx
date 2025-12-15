// app/ai/[slug]/page.tsx
// AI Model Profile Page - Shows individual AI performance and picks

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Target,
  Award,
  BarChart3,
  ArrowLeft,
  Zap,
  Bot,
  Sparkles,
  Clock,
  CheckCircle2,
  XCircle,
  MinusCircle
} from 'lucide-react';

interface AIPick {
  id: string;
  symbol: string;
  company_name: string;
  sector: string;
  direction: 'UP' | 'DOWN' | 'HOLD';
  confidence: number;
  entry_price: number;
  target_price: number;
  stop_loss: number;
  thesis: string;
  full_reasoning: string;
  key_bullish_factors: string[];
  key_bearish_factors: string[];
  risks: string[];
  catalysts: string[];
  status: 'PENDING' | 'WIN' | 'LOSS';
  created_at: string;
}

interface AIProfile {
  id: string;
  name: string;
  slug: string;
  description: string;
  personality: string;
  icon: string;
  color: string;
  totalPicks: number;
  winRate: number;
  avgConfidence: number;
  bestSectors: string[];
  recentPicks: AIPick[];
}

const AI_PROFILES: Record<string, Partial<AIProfile>> = {
  'gpt4': {
    name: 'GPT-4',
    slug: 'gpt4',
    description: 'OpenAI\'s most advanced reasoning model. Excels at deep analysis and nuanced market interpretation.',
    personality: 'Conservative and thorough. Tends toward HOLD recommendations with detailed risk analysis.',
    icon: 'Brain',
    color: 'emerald',
  },
  'claude': {
    name: 'Claude',
    slug: 'claude',
    description: 'Anthropic\'s balanced AI assistant. Strong at identifying risks and providing clear explanations.',
    personality: 'Balanced and risk-aware. Provides comprehensive analysis with clear reasoning.',
    icon: 'Bot',
    color: 'purple',
  },
  'gemini': {
    name: 'Gemini',
    slug: 'gemini',
    description: 'Google\'s multimodal AI. Focuses on technical patterns and price action analysis.',
    personality: 'Technical and pattern-focused. Strong on chart analysis and price targets.',
    icon: 'Sparkles',
    color: 'blue',
  },
  'perplexity': {
    name: 'Perplexity',
    slug: 'perplexity',
    description: 'Real-time web-connected AI. Incorporates breaking news and live market sentiment.',
    personality: 'News-driven and aggressive. Quick to react to market events and sentiment shifts.',
    icon: 'Zap',
    color: 'cyan',
  },
  'javari': {
    name: 'Javari AI',
    slug: 'javari',
    description: 'CR AudioViz AI\'s proprietary consensus engine. Synthesizes all AI predictions into unified verdicts.',
    personality: 'Consensus-driven. Weights each AI based on historical accuracy and sector performance.',
    icon: 'Target',
    color: 'amber',
  },
  'globalmacro_ai': {
    name: 'GlobalMacro AI',
    slug: 'globalmacro_ai',
    description: 'Specialized in macroeconomic analysis and global market trends.',
    personality: 'Big-picture focused. Analyzes monetary policy, geopolitics, and cross-market correlations.',
    icon: 'BarChart3',
    color: 'orange',
  },
  'techvanguard_ai': {
    name: 'TechVanguard AI',
    slug: 'techvanguard_ai',
    description: 'Technology sector specialist with deep understanding of tech valuations and trends.',
    personality: 'Growth-oriented. Strong on tech fundamentals and innovation cycles.',
    icon: 'Zap',
    color: 'violet',
  },
  'swingtrader_x': {
    name: 'SwingTrader X',
    slug: 'swingtrader_x',
    description: 'Short-term swing trading specialist focused on technical setups.',
    personality: 'Active trader mindset. Identifies momentum plays and reversal patterns.',
    icon: 'TrendingUp',
    color: 'green',
  },
  'dividendking': {
    name: 'DividendKing',
    slug: 'dividendking',
    description: 'Income-focused AI specializing in dividend stocks and yield analysis.',
    personality: 'Value and income focused. Prioritizes dividend safety and growth.',
    icon: 'Award',
    color: 'yellow',
  },
  'cryptoquantum': {
    name: 'CryptoQuantum',
    slug: 'cryptoquantum',
    description: 'Cryptocurrency and blockchain specialist with quantitative analysis.',
    personality: 'Crypto-native thinking. Analyzes on-chain metrics and market cycles.',
    icon: 'Sparkles',
    color: 'pink',
  },
  'valuehunter_pro': {
    name: 'ValueHunter Pro',
    slug: 'valuehunter_pro',
    description: 'Deep value investor AI seeking undervalued opportunities.',
    personality: 'Contrarian value approach. Looks for margin of safety and catalysts.',
    icon: 'Target',
    color: 'teal',
  },
};

const IconComponent = ({ name, className }: { name: string; className?: string }) => {
  const icons: Record<string, React.ElementType> = {
    Brain, TrendingUp, TrendingDown, Target, Award, BarChart3, Zap, Bot, Sparkles
  };
  const Icon = icons[name] || Brain;
  return <Icon className={className} />;
};

export default function AIProfilePage() {
  const params = useParams();
  const slug = params.slug as string;
  const [profile, setProfile] = useState<AIProfile | null>(null);
  const [picks, setPicks] = useState<AIPick[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPick, setExpandedPick] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      
      // Get base profile info
      const baseProfile = AI_PROFILES[slug] || AI_PROFILES['gpt4'];
      
      // Fetch picks from API
      try {
        const res = await fetch(`/api/ai-picks/generate?ai=${slug}&limit=20`);
        const data = await res.json();
        
        if (data.success && data.picks) {
          setPicks(data.picks);
          
          // Calculate stats
          const resolved = data.picks.filter((p: AIPick) => p.status !== 'PENDING');
          const wins = resolved.filter((p: AIPick) => p.status === 'WIN').length;
          const winRate = resolved.length > 0 ? (wins / resolved.length) * 100 : 0;
          const avgConf = data.picks.reduce((a: number, p: AIPick) => a + p.confidence, 0) / (data.picks.length || 1);
          
          setProfile({
            ...baseProfile,
            id: slug,
            totalPicks: data.picks.length,
            winRate,
            avgConfidence: avgConf,
            bestSectors: ['Technology', 'Finance'],
            recentPicks: data.picks.slice(0, 5),
          } as AIProfile);
        }
      } catch (err) {
        console.error('Failed to load AI profile:', err);
      }
      
      setLoading(false);
    };
    
    loadProfile();
  }, [slug]);

  const colorClasses: Record<string, string> = {
    emerald: 'from-emerald-500 to-emerald-600 text-emerald-400 bg-emerald-500/20 border-emerald-500/30',
    purple: 'from-purple-500 to-purple-600 text-purple-400 bg-purple-500/20 border-purple-500/30',
    blue: 'from-blue-500 to-blue-600 text-blue-400 bg-blue-500/20 border-blue-500/30',
    cyan: 'from-cyan-500 to-cyan-600 text-cyan-400 bg-cyan-500/20 border-cyan-500/30',
    amber: 'from-amber-500 to-amber-600 text-amber-400 bg-amber-500/20 border-amber-500/30',
    orange: 'from-orange-500 to-orange-600 text-orange-400 bg-orange-500/20 border-orange-500/30',
    violet: 'from-violet-500 to-violet-600 text-violet-400 bg-violet-500/20 border-violet-500/30',
    green: 'from-green-500 to-green-600 text-green-400 bg-green-500/20 border-green-500/30',
    yellow: 'from-yellow-500 to-yellow-600 text-yellow-400 bg-yellow-500/20 border-yellow-500/30',
    pink: 'from-pink-500 to-pink-600 text-pink-400 bg-pink-500/20 border-pink-500/30',
    teal: 'from-teal-500 to-teal-600 text-teal-400 bg-teal-500/20 border-teal-500/30',
  };

  const baseProfile = AI_PROFILES[slug] || AI_PROFILES['gpt4'];
  const colors = colorClasses[baseProfile.color || 'emerald'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Link href="/battle" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to AI Battle
          </Link>
          
          <div className="flex items-start gap-6">
            <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${colors.split(' ')[0]} ${colors.split(' ')[1]} flex items-center justify-center`}>
              <IconComponent name={baseProfile.icon || 'Brain'} className="w-10 h-10 text-white" />
            </div>
            
            <div className="flex-1">
              <h1 className="text-3xl font-bold">{baseProfile.name}</h1>
              <p className="text-gray-400 mt-1">{baseProfile.description}</p>
              <p className="text-sm text-gray-500 mt-2 italic">"{baseProfile.personality}"</p>
            </div>
            
            {/* Stats */}
            <div className="flex gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold">{profile?.totalPicks || 0}</div>
                <div className="text-gray-500 text-sm">Total Picks</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{(profile?.winRate || 0).toFixed(1)}%</div>
                <div className="text-gray-500 text-sm">Win Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-400">{(profile?.avgConfidence || 0).toFixed(0)}%</div>
                <div className="text-gray-500 text-sm">Avg Confidence</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Picks List */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-xl font-bold mb-6">Recent Picks</h2>
        
        {picks.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No picks found for this AI model yet.
          </div>
        ) : (
          <div className="space-y-4">
            {picks.map((pick) => (
              <div
                key={pick.id}
                className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden"
              >
                {/* Pick Header - Clickable */}
                <button
                  onClick={() => setExpandedPick(expandedPick === pick.id ? null : pick.id)}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-800/50 transition"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold ${
                      pick.direction === 'UP' ? 'bg-green-500/20 text-green-400' :
                      pick.direction === 'DOWN' ? 'bg-red-500/20 text-red-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {pick.symbol.slice(0, 2)}
                    </div>
                    <div className="text-left">
                      <div className="font-bold">{pick.symbol}</div>
                      <div className="text-sm text-gray-500">{pick.company_name}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className={`flex items-center gap-1 font-semibold ${
                      pick.direction === 'UP' ? 'text-green-400' :
                      pick.direction === 'DOWN' ? 'text-red-400' :
                      'text-yellow-400'
                    }`}>
                      {pick.direction === 'UP' ? <TrendingUp className="w-4 h-4" /> :
                       pick.direction === 'DOWN' ? <TrendingDown className="w-4 h-4" /> :
                       <MinusCircle className="w-4 h-4" />}
                      {pick.direction}
                    </div>
                    <div className="text-gray-400">{pick.confidence}%</div>
                    <div className={`px-2 py-1 rounded text-xs ${
                      pick.status === 'WIN' ? 'bg-green-500/20 text-green-400' :
                      pick.status === 'LOSS' ? 'bg-red-500/20 text-red-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {pick.status}
                    </div>
                  </div>
                </button>
                
                {/* Expanded Details */}
                {expandedPick === pick.id && (
                  <div className="border-t border-gray-800 p-6 space-y-6">
                    {/* Thesis */}
                    <div>
                      <h4 className="font-semibold text-amber-400 mb-2">Thesis</h4>
                      <p className="text-gray-300">{pick.thesis}</p>
                    </div>
                    
                    {/* Full Reasoning */}
                    <div>
                      <h4 className="font-semibold text-amber-400 mb-2">Full Analysis</h4>
                      <p className="text-gray-300 whitespace-pre-wrap">{pick.full_reasoning}</p>
                    </div>
                    
                    {/* Price Targets */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-gray-800 rounded-lg p-4 text-center">
                        <div className="text-sm text-gray-500">Entry</div>
                        <div className="text-xl font-bold">${pick.entry_price?.toFixed(2)}</div>
                      </div>
                      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
                        <div className="text-sm text-green-400">Target</div>
                        <div className="text-xl font-bold text-green-400">${pick.target_price?.toFixed(2)}</div>
                      </div>
                      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-center">
                        <div className="text-sm text-red-400">Stop Loss</div>
                        <div className="text-xl font-bold text-red-400">${pick.stop_loss?.toFixed(2)}</div>
                      </div>
                    </div>
                    
                    {/* Bullish/Bearish Factors */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-green-400 mb-2 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" /> Bullish Factors
                        </h4>
                        <ul className="space-y-1">
                          {pick.key_bullish_factors?.map((f, i) => (
                            <li key={i} className="text-gray-300 text-sm flex items-start gap-2">
                              <span className="text-green-400 mt-1">•</span> {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-red-400 mb-2 flex items-center gap-2">
                          <XCircle className="w-4 h-4" /> Bearish Factors
                        </h4>
                        <ul className="space-y-1">
                          {pick.key_bearish_factors?.map((f, i) => (
                            <li key={i} className="text-gray-300 text-sm flex items-start gap-2">
                              <span className="text-red-400 mt-1">•</span> {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    
                    {/* Risks & Catalysts */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-orange-400 mb-2">Risks</h4>
                        <ul className="space-y-1">
                          {pick.risks?.map((r, i) => (
                            <li key={i} className="text-gray-300 text-sm flex items-start gap-2">
                              <span className="text-orange-400 mt-1">⚠</span> {r}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-blue-400 mb-2">Catalysts</h4>
                        <ul className="space-y-1">
                          {pick.catalysts?.map((c, i) => (
                            <li key={i} className="text-gray-300 text-sm flex items-start gap-2">
                              <span className="text-blue-400 mt-1">★</span> {c}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    
                    {/* Timestamp */}
                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                      <Clock className="w-4 h-4" />
                      {new Date(pick.created_at).toLocaleString()}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
