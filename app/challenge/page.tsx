// app/challenge/page.tsx
// 90-DAY CHALLENGE PAGE - Investor Ready UI
// Created: December 12, 2025 - CR AudioViz AI

'use client';

import { useState, useEffect } from 'react';
import { 
  Trophy, TrendingUp, Target, Calendar, Award, Users, 
  DollarSign, ArrowUp, ArrowDown, Flame, Star, Medal,
  ChevronRight, Clock, Zap, Shield, Gift
} from 'lucide-react';

interface Milestone {
  day: number;
  name: string;
  reward: number;
  requirement: string;
  achieved: boolean;
  available: boolean;
}

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  profiles: { display_name: string; avatar_url: string } | null;
  total_return_percent: number;
  total_trades: number;
  milestones_achieved: string[];
  prize: { credits: number; badge: string } | null;
}

interface Enrollment {
  id: string;
  current_balance: number;
  starting_balance: number;
  total_return_percent: number;
  total_trades: number;
  winning_trades: number;
  current_day: number;
  milestones_achieved: string[];
  start_date: string;
  end_date: string;
}

export default function ChallengePage() {
  const [enrolled, setEnrolled] = useState(false);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    loadChallengeData();
  }, []);

  async function loadChallengeData() {
    try {
      // Load challenge status
      const statusRes = await fetch('/api/challenge?action=status');
      const statusData = await statusRes.json();
      setEnrolled(statusData.enrolled);
      setEnrollment(statusData.enrollment);

      // Load leaderboard
      const lbRes = await fetch('/api/challenge?action=leaderboard');
      const lbData = await lbRes.json();
      setLeaderboard(lbData.leaderboard || []);

      // Load milestones
      const msRes = await fetch('/api/challenge?action=milestones');
      const msData = await msRes.json();
      setMilestones(msData.milestones || []);
    } catch (error) {
      console.error('Failed to load challenge data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleEnroll() {
    setEnrolling(true);
    try {
      const res = await fetch('/api/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'enroll', userId: 'demo-user' })
      });
      const data = await res.json();
      if (data.success) {
        setEnrolled(true);
        setEnrollment(data.enrollment);
        loadChallengeData();
      }
    } catch (error) {
      console.error('Enrollment failed:', error);
    } finally {
      setEnrolling(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/50 to-slate-900" />
        
        <div className="relative max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-purple-500/20 border border-purple-500/30 rounded-full px-4 py-2 mb-6">
              <Flame className="w-5 h-5 text-orange-400 animate-pulse" />
              <span className="text-purple-200 font-medium">Limited Time Challenge</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black text-white mb-6">
              90-Day
              <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-orange-400 bg-clip-text text-transparent"> Challenge</span>
            </h1>
            
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              Compete against elite AI models, build your portfolio, and win up to 
              <span className="text-green-400 font-bold"> 5,000 credits</span>. 
              Follow the best AI picks and climb the leaderboard!
            </p>

            {!enrolled ? (
              <button
                onClick={handleEnroll}
                disabled={enrolling}
                className="group relative inline-flex items-center gap-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-4 px-8 rounded-xl text-lg shadow-lg shadow-purple-500/25 transition-all duration-300 hover:scale-105 disabled:opacity-50"
              >
                {enrolling ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <Trophy className="w-6 h-6" />
                    Start Challenge - $10,000 Virtual
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            ) : (
              <div className="inline-flex items-center gap-2 bg-green-500/20 border border-green-500/30 rounded-full px-6 py-3">
                <Shield className="w-5 h-5 text-green-400" />
                <span className="text-green-300 font-medium">You're Enrolled! Day {enrollment?.current_day}/90</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      {enrolled && enrollment && (
        <div className="max-w-7xl mx-auto px-4 -mt-8 mb-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon={<DollarSign className="w-6 h-6" />}
              label="Current Balance"
              value={`$${enrollment.current_balance.toLocaleString()}`}
              change={enrollment.total_return_percent}
              color="green"
            />
            <StatCard
              icon={<TrendingUp className="w-6 h-6" />}
              label="Total Return"
              value={`${enrollment.total_return_percent >= 0 ? '+' : ''}${enrollment.total_return_percent.toFixed(2)}%`}
              color={enrollment.total_return_percent >= 0 ? 'green' : 'red'}
            />
            <StatCard
              icon={<Target className="w-6 h-6" />}
              label="Win Rate"
              value={enrollment.total_trades > 0 
                ? `${((enrollment.winning_trades / enrollment.total_trades) * 100).toFixed(0)}%`
                : '0%'
              }
              subtext={`${enrollment.winning_trades}/${enrollment.total_trades} trades`}
              color="blue"
            />
            <StatCard
              icon={<Calendar className="w-6 h-6" />}
              label="Days Remaining"
              value={`${90 - enrollment.current_day}`}
              subtext={`Day ${enrollment.current_day} of 90`}
              color="purple"
            />
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="max-w-7xl mx-auto px-4 pb-16">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Leaderboard */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 px-6 py-4 border-b border-slate-700/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Trophy className="w-6 h-6 text-yellow-400" />
                    <h2 className="text-xl font-bold text-white">Leaderboard</h2>
                  </div>
                  <span className="text-sm text-gray-400">{leaderboard.length} participants</span>
                </div>
              </div>

              <div className="divide-y divide-slate-700/50">
                {leaderboard.slice(0, 10).map((entry, index) => (
                  <div 
                    key={entry.user_id}
                    className={`flex items-center gap-4 px-6 py-4 hover:bg-slate-700/30 transition-colors ${
                      index < 3 ? 'bg-gradient-to-r from-yellow-500/5 to-transparent' : ''
                    }`}
                  >
                    <div className="flex-shrink-0 w-10 text-center">
                      {index === 0 ? (
                        <Medal className="w-8 h-8 text-yellow-400 mx-auto" />
                      ) : index === 1 ? (
                        <Medal className="w-8 h-8 text-gray-300 mx-auto" />
                      ) : index === 2 ? (
                        <Medal className="w-8 h-8 text-amber-600 mx-auto" />
                      ) : (
                        <span className="text-lg font-bold text-gray-500">#{entry.rank}</span>
                      )}
                    </div>

                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                        {entry.profiles?.display_name?.charAt(0) || 'U'}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">
                        {entry.profiles?.display_name || `Trader #${entry.user_id.slice(-4)}`}
                      </p>
                      <p className="text-sm text-gray-400">
                        {entry.total_trades} trades • {entry.milestones_achieved?.length || 0} milestones
                      </p>
                    </div>

                    <div className="text-right">
                      <p className={`font-bold text-lg ${
                        entry.total_return_percent >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {entry.total_return_percent >= 0 ? '+' : ''}{entry.total_return_percent.toFixed(2)}%
                      </p>
                      {entry.prize && (
                        <p className="text-xs text-yellow-400">{entry.prize.badge}</p>
                      )}
                    </div>
                  </div>
                ))}

                {leaderboard.length === 0 && (
                  <div className="px-6 py-12 text-center">
                    <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">Be the first to join the challenge!</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Milestones & Prizes */}
          <div className="space-y-6">
            {/* Prize Pool */}
            <div className="bg-gradient-to-br from-yellow-500/20 via-orange-500/10 to-red-500/20 backdrop-blur border border-yellow-500/30 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Gift className="w-6 h-6 text-yellow-400" />
                <h3 className="text-lg font-bold text-white">Prize Pool</h3>
              </div>
              <div className="space-y-3">
                <PrizeRow rank="1st" credits={5000} badge="Gold Champion" highlight />
                <PrizeRow rank="2nd" credits={2500} badge="Silver Medalist" />
                <PrizeRow rank="3rd" credits={1000} badge="Bronze Winner" />
                <PrizeRow rank="Top 10" credits={500} badge="Top 10 Finisher" />
              </div>
            </div>

            {/* Milestones */}
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Star className="w-6 h-6 text-purple-400" />
                <h3 className="text-lg font-bold text-white">Milestones</h3>
              </div>
              <div className="space-y-3">
                {milestones.map((milestone) => (
                  <MilestoneRow key={milestone.name} milestone={milestone} />
                ))}
              </div>
            </div>

            {/* Rules */}
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-6 h-6 text-blue-400" />
                <h3 className="text-lg font-bold text-white">Challenge Rules</h3>
              </div>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-start gap-2">
                  <Zap className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <span>Start with $10,000 virtual balance</span>
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <span>Maximum 10 open positions</span>
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <span>Max 25% of balance per trade</span>
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <span>Follow AI recommendations or pick your own</span>
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <span>Rankings updated daily at market close</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-components
function StatCard({ icon, label, value, change, subtext, color }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  change?: number;
  subtext?: string;
  color: 'green' | 'red' | 'blue' | 'purple';
}) {
  const colors = {
    green: 'from-green-500/20 to-emerald-500/10 border-green-500/30',
    red: 'from-red-500/20 to-rose-500/10 border-red-500/30',
    blue: 'from-blue-500/20 to-cyan-500/10 border-blue-500/30',
    purple: 'from-purple-500/20 to-pink-500/10 border-purple-500/30'
  };

  const iconColors = {
    green: 'text-green-400',
    red: 'text-red-400',
    blue: 'text-blue-400',
    purple: 'text-purple-400'
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color]} backdrop-blur border rounded-xl p-4`}>
      <div className={`${iconColors[color]} mb-2`}>{icon}</div>
      <p className="text-sm text-gray-400">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      {change !== undefined && (
        <div className={`flex items-center gap-1 text-sm ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {change >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
          <span>{Math.abs(change).toFixed(2)}%</span>
        </div>
      )}
      {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
    </div>
  );
}

function PrizeRow({ rank, credits, badge, highlight }: {
  rank: string;
  credits: number;
  badge: string;
  highlight?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between p-3 rounded-lg ${
      highlight ? 'bg-yellow-500/20 border border-yellow-500/30' : 'bg-slate-700/30'
    }`}>
      <div>
        <p className={`font-bold ${highlight ? 'text-yellow-400' : 'text-white'}`}>{rank}</p>
        <p className="text-xs text-gray-400">{badge}</p>
      </div>
      <div className="flex items-center gap-1 text-green-400 font-bold">
        <Zap className="w-4 h-4" />
        {credits.toLocaleString()}
      </div>
    </div>
  );
}

function MilestoneRow({ milestone }: { milestone: Milestone }) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg ${
      milestone.achieved 
        ? 'bg-green-500/20 border border-green-500/30' 
        : milestone.available 
          ? 'bg-slate-700/30 border border-slate-600/30' 
          : 'bg-slate-800/30 opacity-50'
    }`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
        milestone.achieved ? 'bg-green-500' : 'bg-slate-700'
      }`}>
        {milestone.achieved ? (
          <Award className="w-4 h-4 text-white" />
        ) : (
          <span className="text-xs text-gray-400">{milestone.day}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${
          milestone.achieved ? 'text-green-400' : 'text-white'
        }`}>
          {milestone.name}
        </p>
        <p className="text-xs text-gray-500">Day {milestone.day}</p>
      </div>
      <div className="flex items-center gap-1 text-yellow-400 text-sm font-medium">
        <Zap className="w-3 h-3" />
        +{milestone.reward}
      </div>
    </div>
  );
}
