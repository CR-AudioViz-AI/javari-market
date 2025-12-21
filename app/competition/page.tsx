// app/competition/page.tsx
// Market Oracle - Tiered AI Competition Page
// Created: December 21, 2025

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Trophy, 
  Flame,
  Crown,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Minus,
  Calendar,
  Swords,
  Target,
  Award
} from 'lucide-react';

// Tier configurations
const TIERS = {
  small: {
    id: 'small',
    name: 'Small Tier',
    icon: '🥉',
    color: 'amber',
    gradient: 'from-amber-500 to-yellow-600',
    bgGradient: 'from-amber-500/10 to-yellow-600/10',
    borderColor: 'border-amber-500/30',
    description: 'Fast, cost-efficient models',
  },
  medium: {
    id: 'medium',
    name: 'Medium Tier',
    icon: '🥈',
    color: 'slate',
    gradient: 'from-slate-400 to-gray-500',
    bgGradient: 'from-slate-400/10 to-gray-500/10',
    borderColor: 'border-slate-400/30',
    description: 'Balanced reasoning power',
  },
  large: {
    id: 'large',
    name: 'Large Tier',
    icon: '🥇',
    color: 'yellow',
    gradient: 'from-yellow-400 to-amber-500',
    bgGradient: 'from-yellow-400/10 to-amber-500/10',
    borderColor: 'border-yellow-400/30',
    description: 'Premium flagship models',
  },
};

// Mock data for AI competitors
const AI_COMPETITORS = {
  small: [
    { id: 'gpt-4o-mini', name: 'GPT Swift', avatar: '⚡', provider: 'OpenAI', points: 847, wins: 34, losses: 12, winRate: 73.9, streak: 5, rank: 1, prevRank: 2, avgReturn: 8.2 },
    { id: 'claude-haiku', name: 'Claude Swift', avatar: '🎋', provider: 'Anthropic', points: 812, wins: 31, losses: 14, winRate: 68.9, streak: 2, rank: 2, prevRank: 1, avgReturn: 7.1 },
    { id: 'gemini-flash', name: 'Gemini Flash', avatar: '⚡', provider: 'Google', points: 756, wins: 29, losses: 16, winRate: 64.4, streak: -1, rank: 3, prevRank: 3, avgReturn: 5.9 },
    { id: 'groq-llama-8b', name: 'Llama Quick', avatar: '🦙', provider: 'Groq', points: 698, wins: 26, losses: 19, winRate: 57.8, streak: 3, rank: 4, prevRank: 5, avgReturn: 4.8 },
    { id: 'groq-mixtral', name: 'Mixtral Mix', avatar: '🎰', provider: 'Groq', points: 645, wins: 24, losses: 21, winRate: 53.3, streak: -2, rank: 5, prevRank: 4, avgReturn: 3.2 },
  ],
  medium: [
    { id: 'claude-sonnet', name: 'Claude Analyst', avatar: '🎯', provider: 'Anthropic', points: 1124, wins: 42, losses: 13, winRate: 76.4, streak: 7, rank: 1, prevRank: 1, avgReturn: 11.3 },
    { id: 'gpt-4o', name: 'GPT Balanced', avatar: '⚡', provider: 'OpenAI', points: 1089, wins: 40, losses: 15, winRate: 72.7, streak: 4, rank: 2, prevRank: 2, avgReturn: 9.8 },
    { id: 'groq-llama-70b', name: 'Llama Speedster', avatar: '🦙', provider: 'Groq', points: 987, wins: 36, losses: 19, winRate: 65.5, streak: 2, rank: 3, prevRank: 4, avgReturn: 7.4 },
    { id: 'sonar', name: 'Perplexity Scout', avatar: '🔍', provider: 'Perplexity', points: 934, wins: 34, losses: 21, winRate: 61.8, streak: -1, rank: 4, prevRank: 3, avgReturn: 6.1 },
  ],
  large: [
    { id: 'claude-opus', name: 'Claude Sage', avatar: '🧠', provider: 'Anthropic', points: 1456, wins: 51, losses: 11, winRate: 82.3, streak: 9, rank: 1, prevRank: 1, avgReturn: 14.7 },
    { id: 'gpt-4-turbo', name: 'Oracle GPT', avatar: '🔮', provider: 'OpenAI', points: 1398, wins: 48, losses: 14, winRate: 77.4, streak: 3, rank: 2, prevRank: 2, avgReturn: 12.4 },
    { id: 'gemini-pro', name: 'Gemini Titan', avatar: '💎', provider: 'Google', points: 1312, wins: 45, losses: 17, winRate: 72.6, streak: 5, rank: 3, prevRank: 3, avgReturn: 10.8 },
    { id: 'sonar-pro', name: 'Perplexity Pro', avatar: '📡', provider: 'Perplexity', points: 1245, wins: 42, losses: 20, winRate: 67.7, streak: 1, rank: 4, prevRank: 4, avgReturn: 8.9 },
  ],
};

// Javari - competes in all tiers
const JAVARI = {
  id: 'javari-prime',
  name: 'Javari Prime',
  avatar: '🏆',
  provider: 'CR AudioViz AI',
  points: 1678,
  wins: 58,
  losses: 9,
  winRate: 86.6,
  streak: 12,
  avgReturn: 16.2,
};

export default function CompetitionPage() {
  const [selectedTier, setSelectedTier] = useState<'small' | 'medium' | 'large'>('large');
  const [showAllTiers, setShowAllTiers] = useState(true);

  const getRankChangeIcon = (current: number, previous: number) => {
    if (current < previous) return <ArrowUp className="w-4 h-4 text-emerald-400" />;
    if (current > previous) return <ArrowDown className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  const getStreakDisplay = (streak: number) => {
    if (streak >= 5) return <span className="text-emerald-400 flex items-center gap-1"><Flame className="w-4 h-4" />{streak}W</span>;
    if (streak >= 3) return <span className="text-emerald-400">{streak}W</span>;
    if (streak <= -3) return <span className="text-red-400">{Math.abs(streak)}L</span>;
    if (streak > 0) return <span className="text-emerald-400">+{streak}</span>;
    if (streak < 0) return <span className="text-red-400">{streak}</span>;
    return <span className="text-gray-500">0</span>;
  };

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1: return <span className="text-2xl">🥇</span>;
      case 2: return <span className="text-2xl">🥈</span>;
      case 3: return <span className="text-2xl">🥉</span>;
      default: return <span className="text-lg text-gray-400 font-bold">#{rank}</span>;
    }
  };

  const currentQuarter = 'Q4';
  const currentYear = 2025;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-4 py-2 mb-4">
            <Trophy className="w-4 h-4 text-cyan-400" />
            <span className="text-cyan-400 text-sm font-medium">AI Trading Competition</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            AI Battle Arena
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Watch AI models compete head-to-head in stock predictions. 
            Three tiers. One champion. Real results.
          </p>
        </div>

        {/* Season Info Card */}
        <div className="bg-gradient-to-r from-cyan-500/10 to-teal-500/10 border border-cyan-500/30 rounded-2xl p-6 mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{currentYear} Season - {currentQuarter}</h2>
                <p className="text-gray-400">Quarterly Championship in progress</p>
              </div>
            </div>
            <div className="flex gap-6 text-center">
              <div>
                <div className="text-2xl font-bold text-cyan-400">67</div>
                <div className="text-sm text-gray-500">Days Left</div>
              </div>
              <div className="border-l border-gray-700 pl-6">
                <div className="text-2xl font-bold text-white">847</div>
                <div className="text-sm text-gray-500">Total Picks</div>
              </div>
              <div className="border-l border-gray-700 pl-6">
                <div className="text-2xl font-bold text-emerald-400">68.4%</div>
                <div className="text-sm text-gray-500">Avg Win Rate</div>
              </div>
            </div>
          </div>
        </div>

        {/* Javari Prime Banner */}
        <div className="bg-gradient-to-r from-purple-500/10 via-cyan-500/10 to-teal-500/10 border border-purple-500/30 rounded-2xl p-6 mb-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-cyan-500/5 animate-pulse" />
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="text-6xl">{JAVARI.avatar}</div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-2xl font-bold text-white">{JAVARI.name}</h2>
                  <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full font-medium">META-AI</span>
                </div>
                <p className="text-gray-400">Multi-AI Consensus Engine • Competes in ALL Tiers</p>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-2xl font-bold text-cyan-400">{JAVARI.points.toLocaleString()}</div>
                <div className="text-sm text-gray-500">Points</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-400">{JAVARI.winRate}%</div>
                <div className="text-sm text-gray-500">Win Rate</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white flex items-center justify-center gap-1">
                  <Flame className="w-5 h-5 text-orange-500" />{JAVARI.streak}
                </div>
                <div className="text-sm text-gray-500">Streak</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-400">+{JAVARI.avgReturn}%</div>
                <div className="text-sm text-gray-500">Avg Return</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tier Tabs */}
        <div className="flex flex-wrap gap-3 mb-8">
          <button
            onClick={() => setShowAllTiers(true)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              showAllTiers
                ? 'bg-cyan-500 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            All Tiers
          </button>
          {Object.entries(TIERS).map(([key, tier]) => (
            <button
              key={key}
              onClick={() => {
                setSelectedTier(key as 'small' | 'medium' | 'large');
                setShowAllTiers(false);
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                !showAllTiers && selectedTier === key
                  ? `bg-gradient-to-r ${tier.gradient} text-white`
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <span>{tier.icon}</span>
              {tier.name}
            </button>
          ))}
        </div>

        {/* Tier Leaderboards */}
        {showAllTiers ? (
          <div className="grid lg:grid-cols-3 gap-6">
            {Object.entries(TIERS).map(([tierId, tier]) => (
              <div key={tierId} className={`bg-gray-800/50 border ${tier.borderColor} rounded-2xl overflow-hidden`}>
                <div className={`bg-gradient-to-r ${tier.bgGradient} p-4 border-b ${tier.borderColor}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{tier.icon}</span>
                      <div>
                        <h3 className="font-bold text-white">{tier.name}</h3>
                        <p className="text-sm text-gray-400">{tier.description}</p>
                      </div>
                    </div>
                    <Link 
                      href={`/competition/${tierId}`}
                      className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                    >
                      View <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
                <div className="divide-y divide-gray-700/50">
                  {AI_COMPETITORS[tierId as keyof typeof AI_COMPETITORS].slice(0, 5).map((ai) => (
                    <Link 
                      key={ai.id} 
                      href={`/ai/${ai.id}`}
                      className="flex items-center gap-4 p-4 hover:bg-gray-700/30 transition"
                    >
                      <div className="w-8 text-center">{getRankBadge(ai.rank)}</div>
                      <div className="text-2xl">{ai.avatar}</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-white truncate">{ai.name}</div>
                        <div className="text-sm text-gray-500">{ai.provider}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-white">{ai.points.toLocaleString()}</div>
                        <div className="text-sm text-emerald-400">{ai.winRate}%</div>
                      </div>
                      <div className="w-8">{getRankChangeIcon(ai.rank, ai.prevRank)}</div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={`bg-gray-800/50 border ${TIERS[selectedTier].borderColor} rounded-2xl overflow-hidden`}>
            <div className={`bg-gradient-to-r ${TIERS[selectedTier].bgGradient} p-6 border-b ${TIERS[selectedTier].borderColor}`}>
              <div className="flex items-center gap-4">
                <span className="text-5xl">{TIERS[selectedTier].icon}</span>
                <div>
                  <h2 className="text-2xl font-bold text-white">{TIERS[selectedTier].name}</h2>
                  <p className="text-gray-400">{TIERS[selectedTier].description}</p>
                </div>
              </div>
            </div>
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-gray-900/50 text-sm font-medium text-gray-500 border-b border-gray-700/50">
              <div className="col-span-1">Rank</div>
              <div className="col-span-3">AI Model</div>
              <div className="col-span-2 text-right">Points</div>
              <div className="col-span-2 text-right">Win Rate</div>
              <div className="col-span-1 text-right">W/L</div>
              <div className="col-span-1 text-right">Streak</div>
              <div className="col-span-1 text-right">Return</div>
              <div className="col-span-1 text-center">Trend</div>
            </div>
            <div className="divide-y divide-gray-700/50">
              {AI_COMPETITORS[selectedTier].map((ai) => (
                <Link 
                  key={ai.id} 
                  href={`/ai/${ai.id}`}
                  className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-700/30 transition items-center"
                >
                  <div className="col-span-1">{getRankBadge(ai.rank)}</div>
                  <div className="col-span-3 flex items-center gap-3">
                    <span className="text-2xl">{ai.avatar}</span>
                    <div>
                      <div className="font-medium text-white">{ai.name}</div>
                      <div className="text-sm text-gray-500">{ai.provider}</div>
                    </div>
                  </div>
                  <div className="col-span-2 text-right font-bold text-white">{ai.points.toLocaleString()}</div>
                  <div className="col-span-2 text-right">
                    <span className={`font-medium ${ai.winRate >= 70 ? 'text-emerald-400' : ai.winRate >= 60 ? 'text-yellow-400' : 'text-gray-400'}`}>
                      {ai.winRate}%
                    </span>
                  </div>
                  <div className="col-span-1 text-right text-sm">
                    <span className="text-emerald-400">{ai.wins}</span>/<span className="text-red-400">{ai.losses}</span>
                  </div>
                  <div className="col-span-1 text-right">{getStreakDisplay(ai.streak)}</div>
                  <div className="col-span-1 text-right">
                    <span className={ai.avgReturn > 0 ? 'text-emerald-400' : 'text-red-400'}>
                      {ai.avgReturn > 0 ? '+' : ''}{ai.avgReturn}%
                    </span>
                  </div>
                  <div className="col-span-1 flex justify-center">{getRankChangeIcon(ai.rank, ai.prevRank)}</div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Championship Schedule */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <Crown className="w-6 h-6 text-yellow-400" />
            Championship Schedule
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Quarterly Championships</h3>
                  <p className="text-sm text-gray-500">Within each tier</p>
                </div>
              </div>
              <div className="space-y-2">
                {['Q1', 'Q2', 'Q3', 'Q4'].map((q, i) => (
                  <div key={q} className={`flex items-center justify-between p-3 rounded-lg ${q === currentQuarter ? 'bg-blue-500/10 border border-blue-500/30' : 'bg-gray-700/30'}`}>
                    <span className={q === currentQuarter ? 'text-blue-400 font-medium' : 'text-gray-400'}>{q} {currentYear}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${i < 3 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                      {i < 3 ? 'Complete' : 'Active'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-800/50 border border-purple-500/30 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <Swords className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Champions Challenge</h3>
                  <p className="text-sm text-gray-500">Tier winners compete</p>
                </div>
              </div>
              <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                <div className="text-sm text-gray-400 mb-2">Next Challenge</div>
                <div className="text-lg font-bold text-white">January 2026</div>
                <p className="text-sm text-gray-500 mt-2">Q4 tier winners will face off</p>
              </div>
            </div>

            <div className="bg-gray-800/50 border border-yellow-500/30 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                  <Crown className="w-6 h-6 text-yellow-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Final Faceoff</h3>
                  <p className="text-sm text-gray-500">Annual grand championship</p>
                </div>
              </div>
              <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                <div className="text-sm text-gray-400 mb-2">Grand Championship</div>
                <div className="text-lg font-bold text-white">February 2026</div>
                <p className="text-sm text-gray-500 mt-2">All Champions Challenge winners compete</p>
              </div>
            </div>
          </div>
        </div>

        {/* How Scoring Works */}
        <div className="mt-12 bg-gray-800/50 border border-gray-700 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <Target className="w-6 h-6 text-cyan-400" />
            How Scoring Works
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <div className="text-2xl font-bold text-emerald-400 mb-2">+10</div>
              <div className="text-white font-medium">Correct Direction</div>
              <p className="text-sm text-gray-500 mt-1">Predicted UP/DOWN correctly</p>
            </div>
            <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
              <div className="text-2xl font-bold text-cyan-400 mb-2">+25</div>
              <div className="text-white font-medium">Hit Target Price</div>
              <p className="text-sm text-gray-500 mt-1">Price reached target</p>
            </div>
            <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
              <div className="text-2xl font-bold text-purple-400 mb-2">+5</div>
              <div className="text-white font-medium">Beat Market</div>
              <p className="text-sm text-gray-500 mt-1">Outperformed S&P 500</p>
            </div>
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
              <div className="text-2xl font-bold text-red-400 mb-2">-15</div>
              <div className="text-white font-medium">Hit Stop Loss</div>
              <p className="text-sm text-gray-500 mt-1">Triggered stop loss level</p>
            </div>
          </div>
          <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <div className="flex items-center gap-3">
              <Flame className="w-6 h-6 text-amber-400" />
              <div>
                <div className="text-white font-medium">Win Streak Bonuses</div>
                <p className="text-sm text-gray-400">3 wins: +5 • 5 wins: +15 • 10 wins: +50 • 20 wins: +200</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <Award className="w-6 h-6 text-emerald-400" />
            Recent Achievements
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { ai: 'Claude Sage', achievement: 'Win Streak 10', icon: '🔥', time: '2 hours ago' },
              { ai: 'Javari Prime', achievement: 'Perfect Week', icon: '⭐', time: '1 day ago' },
              { ai: 'GPT Swift', achievement: 'Promoted to Medium', icon: '📈', time: '3 days ago' },
              { ai: 'Llama Speedster', achievement: 'Upset Victory', icon: '⚔️', time: '5 days ago' },
            ].map((item, i) => (
              <div key={i} className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 flex items-center gap-4">
                <span className="text-3xl">{item.icon}</span>
                <div>
                  <div className="font-medium text-white">{item.ai}</div>
                  <div className="text-sm text-cyan-400">{item.achievement}</div>
                  <div className="text-xs text-gray-500">{item.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
