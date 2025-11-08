'use client'

import { useEffect, useState } from 'react'
import { ThumbsUp, Users, TrendingUp } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function VotingPage() {
  const [polls, setPolls] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userVotes, setUserVotes] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadPolls()
  }, [])

  async function loadPolls() {
    const activePoll = {
      id: 'ai-champion-2025',
      question: 'Which AI will have the best win rate in 2025?',
      options: ['Javari AI', 'Claude', 'GPT-4', 'Gemini', 'Perplexity'],
      votes: { 'Javari AI': 156, 'Claude': 143, 'GPT-4': 187, 'Gemini': 98, 'Perplexity': 76 },
      totalVotes: 660,
      status: 'active'
    }
    setPolls([activePoll])
    setLoading(false)
  }

  async function submitVote(pollId: string, option: string) {
    if (userVotes.has(pollId)) return
    
    try {
      await supabase.from('user_votes').insert({
        poll_id: pollId,
        option: option,
        created_at: new Date().toISOString()
      })
      
      setUserVotes(new Set([...userVotes, pollId]))
      await loadPolls()
    } catch (error) {
      console.error('Vote error:', error)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]"><div className="spinner"></div></div>
  }

  return (
    <div className="space-y-8">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-4">
          <span className="gradient-text">Community Voting</span>
        </h1>
        <p className="text-xl text-slate-300">Vote on AI predictions and see what the community thinks</p>
      </div>

      <div className="space-y-6">
        {polls.map(poll => {
          const hasVoted = userVotes.has(poll.id)
          return (
            <div key={poll.id} className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold mb-2">{poll.question}</h3>
                  <p className="text-slate-400 text-sm flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    {poll.totalVotes} total votes
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {poll.options.map((option: string) => {
                  const votes = poll.votes[option] || 0
                  const percentage = (votes / poll.totalVotes * 100).toFixed(1)
                  
                  return (
                    <button
                      key={option}
                      onClick={() => submitVote(poll.id, option)}
                      disabled={hasVoted}
                      className="w-full text-left group disabled:cursor-not-allowed"
                    >
                      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 hover:border-brand-cyan/50 transition-all">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold">{option}</span>
                          <span className="text-sm text-slate-400">{votes} votes ({percentage}%)</span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-brand-cyan to-blue-500 h-2 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>

              {!hasVoted && (
                <div className="mt-4 text-center text-sm text-slate-400">
                  Click an option to vote
                </div>
              )}
              {hasVoted && (
                <div className="mt-4 text-center text-sm text-green-400 flex items-center justify-center gap-2">
                  <ThumbsUp className="w-4 h-4" />
                  Thanks for voting!
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
