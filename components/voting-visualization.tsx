'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown, TrendingUp, Users } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';

interface VoteData {
  ticker: string;
  ai_name: string;
  upvotes: number;
  downvotes: number;
  total_votes: number;
  approval_rating: number;
  bullish_percentage: number;
  bearish_percentage: number;
}

interface VotingVisualizationProps {
  pickId?: string;
  ticker?: string;
}

export default function VotingVisualization({ pickId, ticker }: VotingVisualizationProps) {
  const [voteData, setVoteData] = useState<VoteData | null>(null);
  const [allVotes, setAllVotes] = useState<VoteData[]>([]);
  const [viewMode, setViewMode] = useState<'single' | 'all'>('single');
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    loadVoteData();
  }, [pickId, ticker]);

  const loadVoteData = async () => {
    try {
      if (pickId || ticker) {
        // Load specific pick vote data
        let query = supabase.from('ai_stock_picks').select('*');
        
        if (pickId) {
          query = query.eq('id', pickId);
        } else if (ticker) {
          query = query.eq('ticker', ticker);
        }

        const { data, error } = await query.single();
        
        if (error) throw error;

        if (data) {
          const upvotes = parseInt(data.upvotes) || 0;
          const downvotes = parseInt(data.downvotes) || 0;
          const total = upvotes + downvotes;
          
          setVoteData({
            ticker: data.ticker,
            ai_name: data.ai_name,
            upvotes,
            downvotes,
            total_votes: total,
            approval_rating: total > 0 ? (upvotes / total) * 100 : 50,
            bullish_percentage: total > 0 ? (upvotes / total) * 100 : 50,
            bearish_percentage: total > 0 ? (downvotes / total) * 100 : 50
          });
        }
      }

      // Load all picks for comparison view
      const { data: allPicks, error: allError } = await supabase
        .from('ai_stock_picks')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (allError) throw allError;

      const votesArray = allPicks?.map(pick => {
        const upvotes = parseInt(pick.upvotes) || 0;
        const downvotes = parseInt(pick.downvotes) || 0;
        const total = upvotes + downvotes;
        
        return {
          ticker: pick.ticker,
          ai_name: pick.ai_name,
          upvotes,
          downvotes,
          total_votes: total,
          approval_rating: total > 0 ? (upvotes / total) * 100 : 50,
          bullish_percentage: total > 0 ? (upvotes / total) * 100 : 50,
          bearish_percentage: total > 0 ? (downvotes / total) * 100 : 50
        };
      }) || [];

      setAllVotes(votesArray);
      setLoading(false);
    } catch (error) {
      console.error('Error loading vote data:', error);
      setLoading(false);
    }
  };

  const getSentimentColor = (percentage: number) => {
    if (percentage >= 70) return '#10b981'; // Strong bullish
    if (percentage >= 55) return '#6ee7b7'; // Bullish
    if (percentage >= 45) return '#fbbf24'; // Neutral
    if (percentage >= 30) return '#fb923c'; // Bearish
    return '#ef4444'; // Strong bearish
  };

  const getSentimentLabel = (percentage: number) => {
    if (percentage >= 70) return 'Strong Bullish';
    if (percentage >= 55) return 'Bullish';
    if (percentage >= 45) return 'Neutral';
    if (percentage >= 30) return 'Bearish';
    return 'Strong Bearish';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <Users className="w-8 h-8 animate-pulse mx-auto mb-2 text-blue-600" />
          <p className="text-sm text-gray-600">Loading vote data...</p>
        </div>
      </div>
    );
  }

  // Single pick view
  if (viewMode === 'single' && voteData) {
    const pieData = [
      { name: 'Bullish', value: voteData.upvotes, color: '#10b981' },
      { name: 'Bearish', value: voteData.downvotes, color: '#ef4444' }
    ];

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Community Sentiment: {voteData.ticker}
              </CardTitle>
              <CardDescription>
                {voteData.ai_name}'s pick • {voteData.total_votes.toLocaleString()} total votes
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode('all')}
            >
              View All Picks
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <div>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Stats */}
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Approval Rating</span>
                  <Badge style={{ backgroundColor: getSentimentColor(voteData.approval_rating) }}>
                    {getSentimentLabel(voteData.approval_rating)}
                  </Badge>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${voteData.approval_rating}%`,
                      backgroundColor: getSentimentColor(voteData.approval_rating)
                    }}
                  />
                </div>
                <div className="flex justify-between mt-1 text-xs text-gray-600">
                  <span>0%</span>
                  <span className="font-bold">{voteData.approval_rating.toFixed(1)}%</span>
                  <span>100%</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <ThumbsUp className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">Bullish</span>
                    </div>
                    <p className="text-2xl font-bold text-green-600">{voteData.upvotes.toLocaleString()}</p>
                    <p className="text-xs text-green-700 mt-1">{voteData.bullish_percentage.toFixed(1)}% of votes</p>
                  </CardContent>
                </Card>

                <Card className="bg-red-50 border-red-200">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <ThumbsDown className="w-4 h-4 text-red-600" />
                      <span className="text-sm font-medium text-red-800">Bearish</span>
                    </div>
                    <p className="text-2xl font-bold text-red-600">{voteData.downvotes.toLocaleString()}</p>
                    <p className="text-xs text-red-700 mt-1">{voteData.bearish_percentage.toFixed(1)}% of votes</p>
                  </CardContent>
                </Card>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600">
                  <strong>{voteData.total_votes.toLocaleString()}</strong> community members have voted on this pick
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // All picks comparison view
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Community Sentiment Across All Picks
            </CardTitle>
            <CardDescription>
              Approval ratings for the latest 20 AI stock picks
            </CardDescription>
          </div>
          {pickId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode('single')}
            >
              Back to Single Pick
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={allVotes}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="ticker" angle={-45} textAnchor="end" height={100} />
            <YAxis label={{ value: 'Approval %', angle: -90, position: 'insideLeft' }} domain={[0, 100]} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-4 border rounded-lg shadow-lg">
                      <p className="font-bold">{data.ticker}</p>
                      <p className="text-sm text-gray-600">{data.ai_name}</p>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm">
                          <span className="text-green-600">👍 {data.upvotes}</span>
                          {' / '}
                          <span className="text-red-600">👎 {data.downvotes}</span>
                        </p>
                        <p className="text-sm font-semibold">
                          Approval: {data.approval_rating.toFixed(1)}%
                        </p>
                        <Badge style={{ backgroundColor: getSentimentColor(data.approval_rating) }}>
                          {getSentimentLabel(data.approval_rating)}
                        </Badge>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar
              dataKey="approval_rating"
              fill="#8884d8"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>

        {/* Top Voted Picks */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4">Most Active Picks</h3>
          <div className="space-y-2">
            {allVotes
              .filter(v => v.total_votes > 0)
              .sort((a, b) => b.total_votes - a.total_votes)
              .slice(0, 5)
              .map((vote, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold">{vote.ticker}</p>
                    <p className="text-sm text-gray-600">{vote.ai_name}</p>
                  </div>
                  <div className="text-right">
                    <Badge style={{ backgroundColor: getSentimentColor(vote.approval_rating) }}>
                      {vote.approval_rating.toFixed(0)}%
                    </Badge>
                    <p className="text-xs text-gray-600 mt-1">{vote.total_votes} votes</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
