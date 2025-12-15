// app/ai/[slug]/page.tsx
// AI Model Profile Page - Shows AI performance and personality

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Brain, Bot, Sparkles, Zap, Target, TrendingUp, TrendingDown,
  MinusCircle, Award, BarChart3, Clock, ArrowLeft, RefreshCw,
  CheckCircle, XCircle, Percent, Trophy
} from 'lucide-react';

interface Pick {
  id: string;
  symbol: string;
  direction: string;
  confidence: number;
  status: string;
  created_at: string;
  target_price: number;
  entry_price: number;
}

interface AIStats {
  total_picks: number;
  wins: number;
  losses: number;
  pending: number;
  win_rate: number;
  avg_confidence: number;
}

interface AIProfile {
  name: string;
  fullName: string;
  provider: string;
  colorClass: string;
  bgClass: string;
  icon: JSX.Element;
  description: string;
  personality: string;
  strengths: string[];
  weaknesses: string[];
  bestFor: string[];
}

const AI_PROFILES: Record<string, AIProfile> = {
  gpt4: {
    name: 'GPT-4',
    fullName: 'GPT-4 Turbo',
    provider: 'OpenAI',
    colorClass: 'text-emerald-400',
    bgClass: 'bg-emerald-500/20',
    icon: <Brain className="w-8 h-8" />,
    description: 'OpenAI\'s most capable model with exceptional reasoning abilities.',
    personality: 'Conservative and methodical. Prefers HOLD unless there are clear signals.',
    strengths: ['Deep fundamental analysis', 'Complex reasoning', 'Risk-adjusted recommendations', 'Thorough due diligence'],
    weaknesses: ['Can be overly conservative', 'May miss momentum plays', 'Sometimes over-analyzes'],
    bestFor: ['Long-term investments', 'Risk-averse traders', 'Complex analysis']
  },
  claude: {
    name: 'Claude',
    fullName: 'Claude 3 Sonnet',
    provider: 'Anthropic',
    colorClass: 'text-purple-400',
    bgClass: 'bg-purple-500/20',
    icon: <Bot className="w-8 h-8" />,
    description: 'Anthropic\'s balanced AI with strong reasoning and risk awareness.',
    personality: 'Balanced and thoughtful. Clear explanations of upside and downside.',
    strengths: ['Clear reasoning', 'Balanced risk assessment', 'Excellent explanations', 'Edge case identification'],
    weaknesses: ['Sometimes too balanced', 'May weight risks too heavily'],
    bestFor: ['Understanding trade rationale', 'Risk management', 'Educational insights']
  },
  gemini: {
    name: 'Gemini',
    fullName: 'Gemini Pro',
    provider: 'Google',
    colorClass: 'text-blue-400',
    bgClass: 'bg-blue-500/20',
    icon: <Sparkles className="w-8 h-8" />,
    description: 'Google\'s AI with strong technical analysis capabilities.',
    personality: 'Technical and precise. Focus on chart patterns and indicators.',
    strengths: ['Technical analysis', 'Pattern recognition', 'Precise price targets', 'Quantitative metrics'],
    weaknesses: ['May underweight fundamentals', 'Can be too focused on technicals'],
    bestFor: ['Short-term trading', 'Technical traders', 'Price target analysis']
  },
  perplexity: {
    name: 'Perplexity',
    fullName: 'Perplexity Sonar',
    provider: 'Perplexity AI',
    colorClass: 'text-cyan-400',
    bgClass: 'bg-cyan-500/20',
    icon: <Zap className="w-8 h-8" />,
    description: 'Real-time AI with live web data for breaking news.',
    personality: 'Aggressive and news-driven. Quick reactions to market events.',
    strengths: ['Real-time news', 'Breaking catalysts', 'Sentiment analysis', 'Event-driven insights'],
    weaknesses: ['May overreact to news', 'Can be too aggressive', 'Short-term focused'],
    bestFor: ['News-driven trades', 'Momentum trading', 'Event catalysts']
  },
  globalmacro_ai: {
    name: 'GlobalMacro AI',
    fullName: 'GlobalMacro AI',
    provider: 'Market Oracle',
    colorClass: 'text-amber-400',
    bgClass: 'bg-amber-500/20',
    icon: <Target className="w-8 h-8" />,
    description: 'Macro-focused AI analyzing global economic trends.',
    personality: 'Big-picture thinker. Considers interest rates and global indicators.',
    strengths: ['Macro trend analysis', 'Economic cycle awareness', 'Cross-market correlation', 'Long-term perspective'],
    weaknesses: ['May miss stock-specific factors', 'Slower to react to company news'],
    bestFor: ['Macro-aware investing', 'Sector rotation', 'Economic cycle plays']
  }
};

const SLUG_ALIASES: Record<string, string> = {
  'globalmacro_ai': 'globalmacro_ai',
  'globalmacroai': 'globalmacro_ai',
  'techvanguard_ai': 'gpt4',
  'techvanguardai': 'gpt4',
  'cryptoquantum': 'gemini',
  'swingtrader_x': 'perplexity',
  'dividendking': 'claude',
  'valuehunter_pro': 'gpt4',
};

export default function AIProfilePage() {
  const params = useParams();
  const rawSlug = (params.slug as string)?.toLowerCase();
  const slug = SLUG_ALIASES[rawSlug] || rawSlug;
  
  const [stats, setStats] = useState<AIStats | null>(null);
  const [recentPicks, setRecentPicks] = useState<Pick[]>([]);
  const [loading, setLoading] = useState(true);

  const profile = AI_PROFILES[slug];

  useEffect(() => {
    if (slug) fetchData();
  }, [slug]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/ai-picks/generate?ai=${slug}&limit=20`);
      const data = await res.json();
      
      if (data.success && data.picks) {
        setRecentPicks(data.picks.slice(0, 10));
        const total = data.picks.length;
        const wins = data.picks.filter((p: Pick) => p.status === 'WIN').length;
        const losses = data.picks.filter((p: Pick) => p.status === 'LOSS').length;
        const pending = data.picks.filter((p: Pick) => p.status === 'PENDING').length;
        const avgConf = data.picks.reduce((sum: number, p: Pick) => sum + p.confidence, 0) / total;
        
        setStats({ total_picks: total, wins, losses, pending, win_rate: total > 0 ? (wins / (wins + losses)) * 100 || 0 : 0, avg_confidence: avgConf || 0 });
      }
    } catch (err) {
      console.error('Failed to fetch AI data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Brain className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">AI Not Found</h1>
          <p className="text-gray-400 mb-6">The AI model &quot;{rawSlug}&quot; doesn&apos;t exist.</p>
          <Link href="/ai-picks" className="text-amber-400 hover:text-amber-300">← Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <Link href="/ai-picks" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          
          <div className="flex items-center gap-6">
            <div className={`w-20 h-20 rounded-2xl ${profile.bgClass} flex items-center justify-center ${profile.colorClass}`}>
              {profile.icon}
            </div>
            <div>
              <h1 className="text-3xl font-bold">{profile.name}</h1>
              <p className="text-gray-400">{profile.fullName} • {profile.provider}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-gray-800/50 rounded-xl p-4"><p className="text-gray-400 text-sm">Total Picks</p><p className="text-2xl font-bold">{stats.total_picks}</p></div>
            <div className="bg-gray-800/50 rounded-xl p-4"><p className="text-gray-400 text-sm">Wins</p><p className="text-2xl font-bold text-emerald-400">{stats.wins}</p></div>
            <div className="bg-gray-800/50 rounded-xl p-4"><p className="text-gray-400 text-sm">Losses</p><p className="text-2xl font-bold text-red-400">{stats.losses}</p></div>
            <div className="bg-gray-800/50 rounded-xl p-4"><p className="text-gray-400 text-sm">Win Rate</p><p className="text-2xl font-bold text-amber-400">{stats.win_rate.toFixed(1)}%</p></div>
            <div className="bg-gray-800/50 rounded-xl p-4"><p className="text-gray-400 text-sm">Avg Confidence</p><p className="text-2xl font-bold">{stats.avg_confidence.toFixed(0)}%</p></div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-gray-800/50 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4">About {profile.name}</h2>
              <p className="text-gray-300 mb-4">{profile.description}</p>
              <p className="text-gray-400">{profile.personality}</p>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><CheckCircle className="w-5 h-5 text-emerald-400" /> Strengths</h2>
              <ul className="space-y-2">{profile.strengths.map((s, i) => <li key={i} className="text-gray-300 flex items-start gap-2"><span className="text-emerald-400 mt-1">•</span> {s}</li>)}</ul>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><XCircle className="w-5 h-5 text-red-400" /> Weaknesses</h2>
              <ul className="space-y-2">{profile.weaknesses.map((w, i) => <li key={i} className="text-gray-300 flex items-start gap-2"><span className="text-red-400 mt-1">•</span> {w}</li>)}</ul>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Target className="w-5 h-5 text-amber-400" /> Best For</h2>
              <ul className="space-y-2">{profile.bestFor.map((b, i) => <li key={i} className="text-gray-300 flex items-start gap-2"><span className="text-amber-400 mt-1">•</span> {b}</li>)}</ul>
            </div>
          </div>

          <div className="bg-gray-800/50 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-gray-400" /> Recent Picks</h2>
            {loading ? (
              <div className="text-center py-8"><RefreshCw className="w-6 h-6 text-gray-400 animate-spin mx-auto" /></div>
            ) : recentPicks.length > 0 ? (
              <div className="space-y-3">
                {recentPicks.map((pick) => (
                  <Link key={pick.id} href={`/stock/${pick.symbol}`} className="flex items-center justify-between p-3 bg-gray-900 rounded-lg hover:bg-gray-800 transition">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-white">{pick.symbol}</span>
                      {pick.direction === 'UP' && <span className="text-emerald-400 text-sm flex items-center gap-1"><TrendingUp className="w-4 h-4" /> UP</span>}
                      {pick.direction === 'DOWN' && <span className="text-red-400 text-sm flex items-center gap-1"><TrendingDown className="w-4 h-4" /> DOWN</span>}
                      {pick.direction === 'HOLD' && <span className="text-yellow-400 text-sm flex items-center gap-1"><MinusCircle className="w-4 h-4" /> HOLD</span>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400">{pick.confidence}%</span>
                      {pick.status === 'WIN' && <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-sm">WIN</span>}
                      {pick.status === 'LOSS' && <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded text-sm">LOSS</span>}
                      {pick.status === 'PENDING' && <span className="bg-gray-500/20 text-gray-400 px-2 py-0.5 rounded text-sm">PENDING</span>}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">No picks from this AI yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
