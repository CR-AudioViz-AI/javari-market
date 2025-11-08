'use client'

import { useEffect, useState } from 'react'
import { Target, TrendingUp, Users } from 'lucide-react'
import { getAllStockPicks } from '@/lib/supabase'
import { getAIColor, formatPercentage, calculateGainPercentage } from '@/lib/utils'

export function AIConsensusTracker() {
  const [consensus, setConsensus] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadConsensus()
  }, [])

  async function loadConsensus() {
    try {
      const picks = await getAllStockPicks()
      
      // Group by symbol
      const symbolMap = new Map()
      picks.forEach(pick => {
        if (!symbolMap.has(pick.symbol)) {
          symbolMap.set(pick.symbol, [])
        }
        symbolMap.get(pick.symbol).push(pick)
      })

      // Calculate consensus strength
      const consensusData = Array.from(symbolMap.entries())
        .map(([symbol, picks]: [string, any]) => {
          const aiCount = picks.length
          const avgConfidence = picks.reduce((sum: number, p: any) => sum + p.confidence_score, 0) / picks.length
          const avgGain = picks.reduce((sum: number, p: any) => 
            sum + calculateGainPercentage(p.entry_price, p.target_price), 0) / picks.length
          
          const consensusScore = (aiCount * 20) + (avgConfidence * 0.5) + (avgGain * 2)
          
          return {
            symbol,
            aiCount,
            avgConfidence,
            avgGain,
            consensusScore,
            ais: picks.map((p: any) => p.ai_name)
          }
        })
        .filter(c => c.aiCount >= 2) // Only show stocks with 2+ AI picks
        .sort((a, b) => b.consensusScore - a.consensusScore)
        .slice(0, 10)

      setConsensus(consensusData)
    } catch (error) {
      console.error('Consensus error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="animate-pulse bg-slate-800 rounded-xl h-96"></div>
  }

  return (
    <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
      <div className="flex items-center gap-3 mb-6">
        <Target className="w-6 h-6 text-brand-cyan" />
        <h3 className="text-xl font-bold">AI Consensus Tracker</h3>
        <span className="text-xs text-slate-400">(Stocks picked by 2+ AIs)</span>
      </div>

      {consensus.length === 0 ? (
        <p className="text-center text-slate-400 py-8">No consensus picks found</p>
      ) : (
        <div className="space-y-3">
          {consensus.map((item, index) => (
            <div key={item.symbol} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 hover:border-brand-cyan/50 transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                    index === 1 ? 'bg-slate-400/20 text-slate-300' :
                    index === 2 ? 'bg-orange-600/20 text-orange-400' :
                    'bg-slate-700 text-slate-400'
                  }`}>
                    #{index + 1}
                  </div>
                  <div>
                    <h4 className="text-xl font-bold">{item.symbol}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Users className="w-3 h-3 text-slate-400" />
                      <span className="text-xs text-slate-400">{item.aiCount} AIs agree</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-400">{formatPercentage(item.avgGain)}</p>
                  <p className="text-xs text-slate-400">Avg Potential</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                {item.ais.map((ai: string) => {
                  const colors = getAIColor(ai)
                  return (
                    <div
                      key={ai}
                      className="px-2 py-1 rounded text-xs font-semibold"
                      style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}
                    >
                      {ai}
                    </div>
                  )
                })}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-400">Avg Confidence</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 bg-slate-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full"
                        style={{ width: `${item.avgConfidence}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold">{item.avgConfidence.toFixed(0)}%</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Consensus Score</p>
                  <p className="text-lg font-bold text-brand-cyan mt-1">{item.consensusScore.toFixed(0)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-sm">
        <p className="text-blue-400">💡 When multiple AIs agree on a stock, it often indicates stronger conviction. Use this as additional confirmation.</p>
      </div>
    </div>
  )
}
