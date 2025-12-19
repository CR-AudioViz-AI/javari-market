'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, TrendingUp, TrendingDown, Activity, DollarSign } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line
} from 'recharts';

interface AIPerformance {
  ai_name: string;
  total_picks: number;
  winning_picks: number;
  losing_picks: number;
  average_return: number;
  total_votes: number;
  win_rate: number;
  rank: number;
}

interface RecentActivity {
  id: string;
  ai_name: string;
  ticker: string;
  action: string;
  price: number;
  timestamp: string;
  current_price?: number;
  performance?: number;
}

export default function DashboardComplete() {
  const [aiPerformance, setAiPerformance] = useState<AIPerformance[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [marketStats, setMarketStats] = useState({
    totalPicks: 0,
    activeTrades: 0,
    avgReturn: 0,
    topPerformer: ''
  });
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load AI performance data
      const { data: picks, error: picksError } = await supabase
        .from('ai_stock_picks')
        .select('*')
        .order('created_at', { ascending: false });

      if (picksError) throw picksError;

      // Calculate AI performance metrics
      const aiStats: { [key: string]: AIPerformance } = {};
      
      picks?.forEach((pick) => {
        if (!aiStats[pick.ai_display_name]) {
          aiStats[pick.ai_display_name] = {
            ai_name: pick.ai_display_name,
            total_picks: 0,
            winning_picks: 0,
            losing_picks: 0,
            average_return: 0,
            total_votes: 0,
            win_rate: 0,
            rank: 0
          };
        }

        aiStats[pick.ai_display_name].total_picks++;
        
        // Calculate performance based on current price vs pick price
        if (pick.current_price && pick.price) {
          const performance = ((pick.current_price - pick.price) / pick.price) * 100;
          if (performance > 0) {
            aiStats[pick.ai_display_name].winning_picks++;
          } else if (performance < 0) {
            aiStats[pick.ai_display_name].losing_picks++;
          }
          aiStats[pick.ai_display_name].average_return += performance;
        }

        // Add votes
        const upvotes = parseInt(pick.upvotes) || 0;
        const downvotes = parseInt(pick.downvotes) || 0;
        aiStats[pick.ai_display_name].total_votes += upvotes + downvotes;
      });

      // Calculate averages and rank
      const performanceArray = Object.values(aiStats).map(ai => ({
        ...ai,
        average_return: ai.total_picks > 0 ? ai.average_return / ai.total_picks : 0,
        win_rate: ai.total_picks > 0 ? (ai.winning_picks / ai.total_picks) * 100 : 0
      }));

      performanceArray.sort((a, b) => b.average_return - a.average_return);
      performanceArray.forEach((ai, index) => {
        ai.rank = index + 1;
      });

      setAiPerformance(performanceArray);

      // Load recent activity (last 10 picks with price updates)
      const recentPicks = picks?.slice(0, 10).map(pick => ({
        id: pick.id,
        ai_name: pick.ai_display_name,
        ticker: pick.ticker,
        action: 'BUY',
        price: pick.price,
        current_price: pick.current_price,
        timestamp: pick.created_at,
        performance: pick.current_price && pick.price 
          ? ((pick.current_price - pick.price) / pick.price) * 100 
          : 0
      })) || [];

      setRecentActivity(recentPicks);

      // Calculate market stats
      const totalPicks = picks?.length || 0;
      const activeTrades = picks?.filter(p => p.current_price).length || 0;
      const avgReturn = performanceArray.length > 0
        ? performanceArray.reduce((sum, ai) => sum + ai.average_return, 0) / performanceArray.length
        : 0;
      const topPerformer = performanceArray.length > 0 ? performanceArray[0].ai_display_name : '';

      setMarketStats({
        totalPicks,
        activeTrades,
        avgReturn,
        topPerformer
      });

      setLoading(false);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setLoading(false);
    }
  };

  const getAIColor = (aiName: string) => {
    const colors: { [key: string]: string } = {
      'Perplexity': '#20808d',
      'ChatGPT': '#10a37f',
      'Claude': '#cc785c',
      'Gemini': '#4285f4',
      'Grok': '#1da1f2'
    };
    return colors[aiName] || '#666666';
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Badge className="bg-yellow-500">🥇 #1</Badge>;
    if (rank === 2) return <Badge className="bg-gray-400">🥈 #2</Badge>;
    if (rank === 3) return <Badge className="bg-orange-600">🥉 #3</Badge>;
    return <Badge variant="outline">#{rank}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Activity className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading AI Battle Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total AI Picks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{marketStats.totalPicks}</div>
            <p className="text-xs text-gray-500 mt-1">Across all AIs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Active Trades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{marketStats.activeTrades}</div>
            <p className="text-xs text-gray-500 mt-1">With live pricing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Average Return</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${marketStats.avgReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {marketStats.avgReturn >= 0 ? '+' : ''}{marketStats.avgReturn.toFixed(2)}%
            </div>
            <p className="text-xs text-gray-500 mt-1">Portfolio average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Top Performer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: getAIColor(marketStats.topPerformer) }}>
              {marketStats.topPerformer || 'TBD'}
            </div>
            <div className="flex items-center gap-1 mt-1">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <p className="text-xs text-gray-500">Leading AI</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Leaderboard Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            AI Performance Leaderboard
          </CardTitle>
          <CardDescription>
            Real-time rankings based on average return percentage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={aiPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="ai_name" />
              <YAxis label={{ value: 'Avg Return %', angle: -90, position: 'insideLeft' }} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-4 border rounded-lg shadow-lg">
                        <p className="font-bold" style={{ color: getAIColor(data.ai_display_name) }}>
                          {data.ai_display_name}
                        </p>
                        <p className="text-sm">Avg Return: {data.average_return.toFixed(2)}%</p>
                        <p className="text-sm">Win Rate: {data.win_rate.toFixed(1)}%</p>
                        <p className="text-sm">Total Picks: {data.total_picks}</p>
                        <p className="text-sm">Winning: {data.winning_picks} | Losing: {data.losing_picks}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              <Bar
                dataKey="average_return"
                fill="#8884d8"
                name="Average Return %"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Win Rate Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Win Rate Comparison</CardTitle>
          <CardDescription>Percentage of winning picks per AI</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={aiPerformance} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} label={{ value: 'Win Rate %', position: 'insideBottom', offset: -5 }} />
              <YAxis type="category" dataKey="ai_name" width={100} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-3 border rounded-lg shadow-lg">
                        <p className="font-bold">{data.ai_display_name}</p>
                        <p className="text-sm">Win Rate: {data.win_rate.toFixed(1)}%</p>
                        <p className="text-sm text-green-600">Winners: {data.winning_picks}</p>
                        <p className="text-sm text-red-600">Losers: {data.losing_picks}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="win_rate" fill="#10b981" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* AI Rankings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed AI Rankings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Rank</th>
                  <th className="text-left py-3 px-4">AI</th>
                  <th className="text-right py-3 px-4">Avg Return</th>
                  <th className="text-right py-3 px-4">Win Rate</th>
                  <th className="text-right py-3 px-4">Total Picks</th>
                  <th className="text-right py-3 px-4">Winners</th>
                  <th className="text-right py-3 px-4">Losers</th>
                  <th className="text-right py-3 px-4">Community Votes</th>
                </tr>
              </thead>
              <tbody>
                {aiPerformance.map((ai) => (
                  <tr key={ai.ai_display_name} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{getRankBadge(ai.rank)}</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold" style={{ color: getAIColor(ai.ai_display_name) }}>
                        {ai.ai_display_name}
                      </span>
                    </td>
                    <td className={`text-right py-3 px-4 font-bold ${ai.average_return >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {ai.average_return >= 0 ? '+' : ''}{ai.average_return.toFixed(2)}%
                    </td>
                    <td className="text-right py-3 px-4">{ai.win_rate.toFixed(1)}%</td>
                    <td className="text-right py-3 px-4">{ai.total_picks}</td>
                    <td className="text-right py-3 px-4 text-green-600">{ai.winning_picks}</td>
                    <td className="text-right py-3 px-4 text-red-600">{ai.losing_picks}</td>
                    <td className="text-right py-3 px-4">{ai.total_votes.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent AI Picks & Performance</CardTitle>
          <CardDescription>Latest 10 stock picks with live price updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" 
                       style={{ backgroundColor: getAIColor(activity.ai_display_name) + '20' }}>
                    <span className="font-bold text-sm" style={{ color: getAIColor(activity.ai_display_name) }}>
                      {activity.ai_display_name.substring(0, 2)}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold">{activity.ticker}</p>
                    <p className="text-sm text-gray-600">{activity.ai_display_name} picked at ${activity.price.toFixed(2)}</p>
                  </div>
                </div>
                <div className="text-right">
                  {activity.current_price && (
                    <>
                      <p className="font-semibold">${activity.current_price.toFixed(2)}</p>
                      <div className={`flex items-center gap-1 text-sm ${activity.performance && activity.performance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {activity.performance && activity.performance >= 0 ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        <span>{activity.performance && activity.performance >= 0 ? '+' : ''}{activity.performance?.toFixed(2)}%</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

