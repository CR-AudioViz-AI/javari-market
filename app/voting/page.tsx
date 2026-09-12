'use client';

import { useEffect, useState, useMemo } from 'react';
import { 
  ThumbsUp, ThumbsDown, Users, TrendingUp, Trophy, 
  CheckCircle, HelpCircle, BarChart3, Sparkles, 
  Clock, Award, Target, Zap
} from 'lucide-react';
import { getPicks, getAIModels, type StockPick, type AIModel } from '@/lib/supabase';
import { JavariHelpButton } from '@/components/JavariWidget';

// Local storage keys
const VOTES_STORAGE_KEY = 'market-oracle-votes';
const POLL_VOTES_KEY = 'market-oracle-poll-votes';

interface Vote {
  pickId: string;
  type: 'up' | 'down';
  timestamp: number;
}

interface PollVote {
  pollId: string;
  option: string;
  timestamp: number;
}

// Get stored votes
function getStoredVotes(): Vote[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(VOTES_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveVotes(votes: Vote[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(VOTES_STORAGE_KEY, JSON.stringify(votes));
}

function getStoredPollVotes(): PollVote[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(POLL_VOTES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function savePollVotes(votes: PollVote[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(POLL_VOTES_KEY, JSON.stringify(votes));
}

// Poll definitions
const POLLS = [
  {
    id: 'best-ai-2025',
    question: 'Which AI do you think will have the best performance in 2025?',
    options: ['TechVanguard AI', 'ValueHunter Pro', 'SwingTrader X', 'DividendKing', 'CryptoQuantum', 'GlobalMacro AI'],
    icon: Trophy,
    color: 'yellow',
  },
  {
    id: 'best-category',
    question: 'Which category interests you the most?',
    options: ['Regular Stocks', 'Penny Stocks', 'Cryptocurrency'],
    icon: BarChart3,
    color: 'cyan',
  },
  {
    id: 'confidence-trust',
    question: 'How much do you trust high-confidence (90%+) AI picks?',
    options: ['Completely trust', 'Somewhat trust', 'Neutral', 'Skeptical', 'Never trust'],
    icon: Target,
    color: 'purple',
  },
];

// Pick voting card
function PickVoteCard({ 
  pick, 
  vote, 
  onVote 
}: { 
  pick: StockPick; 
  vote: 'up' | 'down' | null;
  onVote: (type: 'up' | 'down') => void;
}) {
  const priceChange = pick.price_change_percent || 0;
  const isUp = priceChange >= 0;

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 hover:border-gray-600 transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
            style={{ backgroundColor: pick.ai_color || '#6366f1' }}
          >
            {pick.ticker.slice(0, 2)}
          </div>
          <div>
            <h3 className="font-bold">{pick.ticker}</h3>
            <p className="text-xs text-gray-400">{pick.ai_display_name}</p>
          </div>
        </div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded text-sm font-medium ${
          isUp ? 'bg-emerald-900/30 text-emerald-400' : 'bg-red-900/30 text-red-400'
        }`}>
          {isUp ? <TrendingUp className="w-4 h-4" /> : <TrendingUp className="w-4 h-4 rotate-180" />}
          {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(1)}%
        </div>
      </div>
      
      {/* Price info */}
      <div className="flex justify-between text-sm text-gray-400 mb-4">
        <span>Entry: ${pick.entry_price?.toFixed(2)}</span>
        <span>Target: ${pick.target_price?.toFixed(2)}</span>
      </div>
      
      {/* Vote buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => onVote('up')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all ${
            vote === 'up'
              ? 'bg-emerald-600 text-white'
              : 'bg-gray-700 hover:bg-emerald-900/50 text-gray-300'
          }`}
        >
          <ThumbsUp className="w-4 h-4" />
          <span className="text-sm font-medium">Bullish</span>
        </button>
        <button
          onClick={() => onVote('down')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all ${
            vote === 'down'
              ? 'bg-red-600 text-white'
              : 'bg-gray-700 hover:bg-red-900/50 text-gray-300'
          }`}
        >
          <ThumbsDown className="w-4 h-4" />
          <span className="text-sm font-medium">Bearish</span>
        </button>
      </div>
    </div>
  );
}

// Poll component
function PollCard({ 
  poll, 
  userVote, 
  allVotes, 
  onVote 
}: { 
  poll: typeof POLLS[0];
  userVote: string | null;
  allVotes: PollVote[];
  onVote: (option: string) => void;
}) {
  // Calculate vote counts for this poll
  const voteCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    poll.options.forEach(opt => { counts[opt] = 0; });
    
    // 2026-09-12: removed invented "base votes for realism" - Math.floor(Math.random()
    // * 50) + 20 per option. It fabricated a crowd that did not exist, and because it
    // ran during render the server and browser produced different numbers, which is the
    // React hydration error this page threw on every load. Counts are now real votes only.
    
    // Add actual votes
    allVotes
      .filter(v => v.pollId === poll.id)
      .forEach(v => {
        if (counts[v.option] !== undefined) {
          counts[v.option]++;
        }
      });
    
    return counts;
  }, [poll, allVotes]);
  
  const totalVotes = Object.values(voteCounts).reduce((a, b) => a + b, 0);
  const Icon = poll.icon;

  return (
    <div className="bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden">
      <div className={`p-4 border-b border-gray-800 bg-${poll.color}-900/20`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 bg-${poll.color}-900/50 rounded-lg flex items-center justify-center`}>
            <Icon className={`w-5 h-5 text-${poll.color}-400`} />
          </div>
          <div>
            <h3 className="font-semibold">{poll.question}</h3>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Users className="w-3 h-3" />
              {totalVotes} votes
            </p>
          </div>
        </div>
      </div>
      
      <div className="p-4 space-y-2">
        {poll.options.map(option => {
          const votes = voteCounts[option] || 0;
          const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
          const isSelected = userVote === option;
          
          return (
            <button
              key={option}
              onClick={() => onVote(option)}
              disabled={!!userVote}
              className={`w-full relative overflow-hidden rounded-lg transition-all ${
                isSelected
                  ? `bg-${poll.color}-900/30 border border-${poll.color}-600/50`
                  : userVote
                  ? 'bg-gray-800/50 border border-gray-700'
                  : 'bg-gray-800/50 border border-gray-700 hover:border-gray-600'
              }`}
            >
              {/* Progress bar background */}
              {userVote && (
                <div 
                  className={`absolute inset-y-0 left-0 ${
                    isSelected ? `bg-${poll.color}-600/30` : 'bg-gray-700/50'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              )}
              
              <div className="relative flex items-center justify-between p-3">
                <div className="flex items-center gap-2">
                  {isSelected && <CheckCircle className={`w-4 h-4 text-${poll.color}-400`} />}
                  <span className={`text-sm ${isSelected ? 'font-medium' : ''}`}>{option}</span>
                </div>
                {userVote && (
                  <span className="text-sm text-gray-400">{percentage.toFixed(0)}%</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
      
      {userVote && (
        <div className={`p-3 bg-${poll.color}-900/10 border-t border-gray-800`}>
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            You voted for: <span className="font-medium text-gray-300">{userVote}</span>
          </p>
        </div>
      )}
    </div>
  );
}

export default function VotingPage() {
  const [picks, setPicks] = useState<StockPick[]>([]);
  const [loading, setLoading] = useState(true);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [pollVotes, setPollVotes] = useState<PollVote[]>([]);
  const [tab, setTab] = useState<'picks' | 'polls'>('polls');
  
  // Load data
  useEffect(() => {
    loadData();
    setVotes(getStoredVotes());
    setPollVotes(getStoredPollVotes());
  }, []);
  
  async function loadData() {
    setLoading(true);
    try {
      const data = await getPicks({ limit: 100 });
      setPicks(data);
    } catch (e) {
      console.error('Error:', e);
    }
    setLoading(false);
  }
  
  // Vote on pick
  const voteOnPick = (pickId: string, type: 'up' | 'down') => {
    const existing = votes.find(v => v.pickId === pickId);
    let updated: Vote[];
    
    if (existing?.type === type) {
      // Remove vote
      updated = votes.filter(v => v.pickId !== pickId);
    } else {
      // Add/change vote
      updated = [
        ...votes.filter(v => v.pickId !== pickId),
        { pickId, type, timestamp: Date.now() }
      ];
    }
    
    setVotes(updated);
    saveVotes(updated);
  };
  
  // Vote on poll
  const voteOnPoll = (pollId: string, option: string) => {
    const existing = pollVotes.find(v => v.pollId === pollId);
    if (existing) return; // Already voted
    
    const updated = [...pollVotes, { pollId, option, timestamp: Date.now() }];
    setPollVotes(updated);
    savePollVotes(updated);
  };
  
  // Get vote for pick
  const getPickVote = (pickId: string): 'up' | 'down' | null => {
    const vote = votes.find(v => v.pickId === pickId);
    return vote?.type || null;
  };
  
  // Get vote for poll
  const getPollVote = (pollId: string): string | null => {
    const vote = pollVotes.find(v => v.pollId === pollId);
    return vote?.option || null;
  };
  
  // Stats
  const stats = useMemo(() => {
    const bullish = votes.filter(v => v.type === 'up').length;
    const bearish = votes.filter(v => v.type === 'down').length;
    const pollsVoted = new Set(pollVotes.map(v => v.pollId)).size;
    
    return { bullish, bearish, total: votes.length, pollsVoted };
  }, [votes, pollVotes]);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-3 flex items-center justify-center gap-3">
            <ThumbsUp className="w-10 h-10 text-emerald-400" />
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent">
              Community Voting
            </span>
            <JavariHelpButton topic="voting polls how to vote" />
          </h1>
          <p className="text-gray-400">
            Vote on AI picks and community polls. Votes are saved in this browser only, and the counts shown are real votes - nothing is simulated.
          </p>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-emerald-900/20 rounded-xl p-4 border border-emerald-800/30 text-center">
            <div className="flex items-center justify-center gap-2 text-emerald-400 text-sm mb-1">
              <ThumbsUp className="w-4 h-4" />
              Bullish Votes
            </div>
            <div className="text-2xl font-bold text-emerald-400">{stats.bullish}</div>
          </div>
          <div className="bg-red-900/20 rounded-xl p-4 border border-red-800/30 text-center">
            <div className="flex items-center justify-center gap-2 text-red-400 text-sm mb-1">
              <ThumbsDown className="w-4 h-4" />
              Bearish Votes
            </div>
            <div className="text-2xl font-bold text-red-400">{stats.bearish}</div>
          </div>
          <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800 text-center">
            <div className="flex items-center justify-center gap-2 text-gray-400 text-sm mb-1">
              <BarChart3 className="w-4 h-4" />
              Total Pick Votes
            </div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </div>
          <div className="bg-cyan-900/20 rounded-xl p-4 border border-cyan-800/30 text-center">
            <div className="flex items-center justify-center gap-2 text-cyan-400 text-sm mb-1">
              <CheckCircle className="w-4 h-4" />
              Polls Voted
            </div>
            <div className="text-2xl font-bold text-cyan-400">{stats.pollsVoted}/{POLLS.length}</div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab('polls')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              tab === 'polls'
                ? 'bg-cyan-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Community Polls
          </button>
          <button
            onClick={() => setTab('picks')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              tab === 'picks'
                ? 'bg-cyan-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Vote on Picks
          </button>
        </div>
        
        {/* Content */}
        {tab === 'polls' ? (
          <div className="grid md:grid-cols-2 gap-6">
            {POLLS.map(poll => (
              <PollCard
                key={poll.id}
                poll={poll}
                userVote={getPollVote(poll.id)}
                allVotes={pollVotes}
                onVote={(option) => voteOnPoll(poll.id, option)}
              />
            ))}
          </div>
        ) : (
          <>
            {loading ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {picks.slice(0, 12).map(pick => (
                  <PickVoteCard
                    key={pick.id}
                    pick={pick}
                    vote={getPickVote(pick.id)}
                    onVote={(type) => voteOnPick(pick.id, type)}
                  />
                ))}
              </div>
            )}
            
            {picks.length > 12 && (
              <p className="text-center text-gray-500 text-sm mt-4">
                Showing 12 of {picks.length} picks
              </p>
            )}
          </>
        )}
        
        {/* Info */}
        <div className="mt-8 bg-gray-900/50 rounded-xl p-6 border border-gray-800">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-cyan-400" />
            About Voting
          </h3>
          <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-400">
            <div>
              <p className="font-medium text-white mb-2">Pick Voting</p>
              <p>
                Vote bullish or bearish on individual AI picks. Click again to remove your vote.
                See what the community thinks about each pick!
              </p>
            </div>
            <div>
              <p className="font-medium text-white mb-2">Community Polls</p>
              <p>
                Participate in polls about AI performance, categories, and more.
                Once you vote on a poll, you can see the results.
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-4 text-center">
            All votes are stored locally. This is a demo feature - votes are not shared with other users.
          </p>
        </div>
      </main>
    </div>
  );
}
