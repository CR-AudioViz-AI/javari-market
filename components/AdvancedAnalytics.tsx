'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, Target, Award, Zap, Brain, DollarSign } from 'lucide-react'
import { getAllStockPicks } from '@/lib/supabase'
import { calculateGainPercentage, getAIColor } from '@/lib/utils'

export function AdvancedAnalytics() {
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [])

  async function loadAnalytics() {
    try {
      const picks = await getAllStockPicks()
      
      // Calculate advanced metrics
      const aiPerformance = new Map()
      const sectorAnalysis = new Map()
      const timeAnalysis = new Map()
      
      picks.forEach(pick => {
        // AI Performance
        if (!aiPerformance.has(pick.ai_name)) {
          aiPerformance.set(pick.ai_name, {
            picks: [],
            avgGain: 0,
            avgConfidence: 0,
            highConfidencePicks: 0,
            sectors: new Set()
          })
        }
        
        const aiStats = aiPerformance.get(pick.ai_name)
        aiStats.picks.push(pick)
        aiStats.avgConfidence += pick.confidence
        if (pick.confidence >= 80) aiStats.highConfidencePicks++
        
        const gain = calculateGainPercentage(pick.entry_price, pick.target_price)
        aiStats.avgGain += gain
        
        // Time-based analysis
        const date = new Date(pick.created_at).toDateString()
        if (!timeAnalysis.has(date)) {
          timeAnalysis.set(date, { picks: 0, totalConfidence: 0 })
        }
        const timeStats = timeAnalysis.get(date)
        timeStats.picks++
        timeStats.totalConfidence += pick.confidence
      })
      
      // Calculate averages
      aiPerformance.forEach((stats, ai) => {
        stats.avgConfidence = stats.avgConfidence / stats.picks.length
        stats.avgGain = stats.avgGain / stats.picks.length
      })
      
      // Find best performers
      const sortedAIs = Array.from(aiPerformance.entries())
        .sort((a, b) => b[1].avgGain - a[1].avgGain)
      
      const topAI = sortedAIs[0]
      const mostConsistent = Array.from(aiPerformance.entries())
        .sort((a, b) => {
          const aVariance = Math.abs(b[1].avgConfidence - 75)
          const bVariance = Math.abs(a[1].avgConfidence - 75)
          return aVariance - bVariance
        })[0]
      
      // Calculate momentum
      const recentPicks = picks.slice(0, 20)
      const momentum = recentPicks.reduce((sum, p) => 
        sum + calculateGainPercentage(p.entry_price, p.target_price), 0
      ) / recentPicks.length
      
      setAnalytics({
        topAI: { name: topAI[0], stats: topAI[1] },
        mostConsistent: { name: mostConsistent[0], stats: mostConsistent[1] },
        momentum,
        totalPicks: picks.length,
        avgMarketGain: picks.reduce((sum, p) => 
          sum + calculateGainPercentage(p.entry_price, p.target_price), 0
        ) / picks.length,
        highConfidenceCount: picks.filter(p => p.confidence >= 80).length
      })
    } catch (error) {
      console.error('Analytics error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !analytics) {
    return <div className="animate-pulse bg-slate-800 rounded-xl h-64"></div>
  }

  const topColors = getAIColor(analytics.topAI.name)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Top Performer */}
        <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl p-6 border-2 border-yellow-500/50">
          <div className="flex items-center gap-3 mb-4">
            <Award className="w-8 h-8 text-yellow-400" />
            <div>
              <p className="text-sm text-slate-400">Top Performer</p>
              <h3 className="text-2xl font-bold">{analytics.topAI.name}</h3>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Avg Gain:</span>
              <span className="font-bold text-yellow-400">
                +{analytics.topAI.stats.avgGain.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Confidence:</span>
              <span className="font-bold">{analytics.topAI.stats.avgConfidence.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Total Picks:</span>
              <span className="font-bold">{analytics.topAI.stats.picks.length}</span>
            </div>
          </div>
        </div>

        {/* Market Momentum */}
        <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl p-6 border border-green-500/30">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-8 h-8 text-green-400" />
            <div>
              <p className="text-sm text-slate-400">Market Momentum</p>
              <h3 className="text-2xl font-bold text-green-400">
                {analytics.momentum > 0 ? 'BULLISH' : 'BEARISH'}
              </h3>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Recent Trend:</span>
              <span className="font-bold text-green-400">
                +{analytics.momentum.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Market Avg:</span>
              <span className="font-bold">+{analytics.avgMarketGain.toFixed(2)}%</span>
            </div>
          </div>
        </div>

        {/* Intelligence Score */}
        <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl p-6 border border-brand-cyan/30">
          <div className="flex items-center gap-3 mb-4">
            <Brain className="w-8 h-8 text-brand-cyan" />
            <div>
              <p className="text-sm text-slate-400">AI Intelligence Score</p>
              <h3 className="text-2xl font-bold text-brand-cyan">
                {((analytics.highConfidenceCount / analytics.totalPicks) * 100).toFixed(0)}/100
              </h3>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">High Confidence:</span>
              <span className="font-bold">{analytics.highConfidenceCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Quality Rate:</span>
              <span className="font-bold text-brand-cyan">
                {((analytics.highConfidenceCount / analytics.totalPicks) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Comparison Matrix */}
      <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
        <h3 className="text-xl font-bold mb-4">AI Comparison Matrix</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left p-3">AI Model</th>
                <th className="text-left p-3">Total Picks</th>
                <th className="text-left p-3">Avg Gain</th>
                <th className="text-left p-3">Avg Confidence</th>
                <th className="text-left p-3">High Conf %</th>
                <th className="text-left p-3">Risk Level</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-800 hover:bg-slate-800/30">
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    <span className="font-semibold">{analytics.topAI.name}</span>
                  </div>
                </td>
                <td className="p-3">{analytics.topAI.stats.picks.length}</td>
                <td className="p-3 text-green-400">+{analytics.topAI.stats.avgGain.toFixed(2)}%</td>
                <td className="p-3">{analytics.topAI.stats.avgConfidence.toFixed(1)}%</td>
                <td className="p-3">
                  {((analytics.topAI.stats.highConfidencePicks / analytics.topAI.stats.picks.length) * 100).toFixed(1)}%
                </td>
                <td className="p-3">
                  <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs">
                    MODERATE
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

