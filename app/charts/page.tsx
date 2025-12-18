'use client'

import { useEffect, useState } from 'react'
import { LineChart, TrendingUp } from 'lucide-react'
import { getAllStockPicks } from '@/lib/supabase'
import { getAIColor } from '@/lib/utils'

export default function ChartsPage() {
  const [picks, setPicks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const data = await getAllStockPicks()
      setPicks(data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]"><div className="spinner"></div></div>
  }

  const aiStats = picks.reduce((acc: any, pick) => {
    if (!acc[pick.ai_name]) {
      acc[pick.ai_name] = { total: 0, avgConfidence: 0, picks: [] }
    }
    acc[pick.ai_name].total++
    acc[pick.ai_name].avgConfidence += pick.confidence
    acc[pick.ai_name].picks.push(pick)
    return acc
  }, {})

  Object.keys(aiStats).forEach(ai => {
    aiStats[ai].avgConfidence = aiStats[ai].avgConfidence / aiStats[ai].total
  })

  return (
    <div className="space-y-8">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-4 flex items-center justify-center gap-4">
          <LineChart className="w-12 h-12 text-brand-cyan" />
          <span className="gradient-text">Charts</span>
        </h1>
        <p className="text-xl text-slate-300">Visualize AI performance and trends</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
          <h3 className="text-xl font-bold mb-6">Picks per AI</h3>
          <div className="space-y-4">
            {Object.entries(aiStats).map(([aiName, stats]: [string, any]) => {
              const colors = getAIColor(aiName)
              const percentage = (stats.total / picks.length * 100).toFixed(1)
              
              return (
                <div key={aiName}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}></div>
                      <span className="font-semibold">{aiName}</span>
                    </div>
                    <span className="text-sm text-slate-400">{stats.total} picks ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-3">
                    <div
                      className="h-3 rounded-full transition-all"
                      style={{ 
                        width: `${percentage}%`,
                        background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`
                      }}
                    ></div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
          <h3 className="text-xl font-bold mb-6">Average Confidence</h3>
          <div className="space-y-4">
            {Object.entries(aiStats)
              .sort(([, a]: any, [, b]: any) => b.avgConfidence - a.avgConfidence)
              .map(([aiName, stats]: [string, any]) => {
                const colors = getAIColor(aiName)
                
                return (
                  <div key={aiName}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}></div>
                        <span className="font-semibold">{aiName}</span>
                      </div>
                      <span className="text-sm text-green-400">{stats.avgConfidence.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all"
                        style={{ width: `${stats.avgConfidence}%` }}
                      ></div>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      </div>

      <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
        <h3 className="text-xl font-bold mb-6">Performance Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-brand-cyan mb-2">{picks.length}</p>
            <p className="text-slate-400">Total Picks</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-400 mb-2">
              {(picks.reduce((sum, p) => sum + p.confidence, 0) / picks.length).toFixed(1)}%
            </p>
            <p className="text-slate-400">Avg Confidence</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-white mb-2">{Object.keys(aiStats).length}</p>
            <p className="text-slate-400">Active AIs</p>
          </div>
        </div>
      </div>
    </div>
  )
}

