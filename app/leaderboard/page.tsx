// app/leaderboard/page.tsx
// Market Oracle AI Leaderboard Page
// Created: December 23, 2025

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { 
  Trophy, Medal, Award, TrendingUp, TrendingDown,
  Target, Zap, Brain, Crown, RefreshCw, ChevronRight
} from 'lucide-react';

interface AIPerformance {
  model: string;
  displayName: string;
  totalPicks: number;
  correctPicks: number;
  accuracy: number;
  avgReturn: number;
  streak: number;
  tier: string;
}

interface LeaderboardData {
  success: boolean;
  leaderboard: AIPerformance[];
  stats: {
    totalPicks: number;
    avgAccuracy: number;
    bestPerformer: string;
  };
  updated_at: string;
}

const tierColors: Record<string, string> = {
  large: 'bg-purple-500/20 text-purple-300 border-purple-500/50',
  medium: 'bg-blue-500/20 text-blue-300 border-blue-500/50',
  small: 'bg-green-500/20 text-green-300 border-green-500/50',
  meta: 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-300 border-yellow-500/50',
};

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1: return <Trophy className="w-6 h-6 text-yellow-400" />;
    case 2: return <Medal className="w-6 h-6 text-gray-400" />;
    case 3: return <Award className="w-6 h-6 text-amber-600" />;
    default: return <span className="text-gray-500 font-bold">#{rank}</span>;
  }
};

export default function LeaderboardPage() {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/leaderboard');
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-96">
            <RefreshCw className="w-12 h-12 animate-spin text-purple-500" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-6">
        <div className="max-w-6xl mx-auto text-center py-20">
          <p className="text-red-400">{error || 'Unable to load leaderboard'}</p>
          <Button onClick={fetchLeaderboard} className="mt-4">
            <RefreshCw className="w-4 h-4 mr-2" /> Retry
          </Button>
        </div>
      </div>
    );
  }

  const { leaderboard, stats } = data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white flex items-center gap-3">
              <Trophy className="w-10 h-10 text-yellow-400" />
              AI Leaderboard
            </h1>
            <p className="text-gray-400 mt-2">
              Tracking performance across {stats.totalPicks} predictions
            </p>
          </div>
          <Button onClick={fetchLeaderboard} variant="outline" className="border-purple-500/50">
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gray-800/50 border-purple-500/30">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-purple-500/20 rounded-xl">
                <Target className="w-8 h-8 text-purple-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Average Accuracy</p>
                <p className="text-3xl font-bold text-white">{stats.avgAccuracy.toFixed(1)}%</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800/50 border-yellow-500/30">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-yellow-500/20 rounded-xl">
                <Crown className="w-8 h-8 text-yellow-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Top Performer</p>
                <p className="text-2xl font-bold text-white">{stats.bestPerformer}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800/50 border-green-500/30">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-green-500/20 rounded-xl">
                <Zap className="w-8 h-8 text-green-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total Predictions</p>
                <p className="text-3xl font-bold text-white">{stats.totalPicks.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Leaderboard Table */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-400" />
              AI Model Rankings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {leaderboard.map((ai, index) => (
                <div
                  key={ai.model}
                  className={`flex items-center justify-between p-4 rounded-xl bg-gray-900/50 border ${
                    index === 0 ? 'border-yellow-500/50 bg-yellow-500/5' :
                    index === 1 ? 'border-gray-400/50 bg-gray-400/5' :
                    index === 2 ? 'border-amber-600/50 bg-amber-600/5' :
                    'border-gray-700'
                  }`}
                >
                  {/* Rank & Name */}
                  <div className="flex items-center gap-4">
                    <div className="w-10 flex justify-center">
                      {getRankIcon(index + 1)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-lg">{ai.displayName}</span>
                        <Badge className={tierColors[ai.tier] || 'bg-gray-500/20'}>
                          {ai.tier}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">
                        {ai.correctPicks}/{ai.totalPicks} correct predictions
                      </p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-8">
                    {/* Accuracy */}
                    <div className="text-right">
                      <p className="text-xs text-gray-500 uppercase">Accuracy</p>
                      <p className={`text-xl font-bold ${
                        ai.accuracy >= 60 ? 'text-green-400' :
                        ai.accuracy >= 50 ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {ai.accuracy.toFixed(1)}%
                      </p>
                    </div>

                    {/* Avg Return */}
                    <div className="text-right">
                      <p className="text-xs text-gray-500 uppercase">Avg Return</p>
                      <p className={`text-xl font-bold flex items-center gap-1 ${
                        ai.avgReturn >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {ai.avgReturn >= 0 ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        {ai.avgReturn >= 0 ? '+' : ''}{ai.avgReturn.toFixed(2)}%
                      </p>
                    </div>

                    {/* Streak */}
                    <div className="text-right min-w-[80px]">
                      <p className="text-xs text-gray-500 uppercase">Streak</p>
                      <p className="text-xl font-bold text-orange-400">
                        🔥 {ai.streak}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/ai-picks">
            <Card className="bg-gray-800/50 border-gray-700 hover:border-cyan-500/50 transition-all cursor-pointer">
              <CardContent className="p-6 flex items-center justify-between">
                <span className="text-white font-medium">View AI Picks</span>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </CardContent>
            </Card>
          </Link>
          <Link href="/battle">
            <Card className="bg-gray-800/50 border-gray-700 hover:border-purple-500/50 transition-all cursor-pointer">
              <CardContent className="p-6 flex items-center justify-between">
                <span className="text-white font-medium">AI Battle Arena</span>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </CardContent>
            </Card>
          </Link>
          <Link href="/competition">
            <Card className="bg-gray-800/50 border-gray-700 hover:border-yellow-500/50 transition-all cursor-pointer">
              <CardContent className="p-6 flex items-center justify-between">
                <span className="text-white font-medium">Competition Mode</span>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm">
          <p>Last updated: {new Date(data.updated_at).toLocaleString()}</p>
          <p className="mt-1">
            Part of the{' '}
            <a href="https://craudiovizai.com" className="text-cyan-400 hover:underline">
              CR AudioViz AI
            </a>{' '}
            ecosystem
          </p>
        </div>
      </div>
    </div>
  );
}
