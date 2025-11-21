'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { getAllStockPicks } from '@/lib/supabase'
import { calculateGainPercentage, getAIColor } from '@/lib/utils'

export function AIPerformanceHeatMap() {
  const [heatmapData, setHeatmapData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadHeatmapData()
  }, [])

  async function loadHeatmapData() {
    try {
      const picks = await getAllStockPicks()
      const aiDateMap = new Map<string, Map<string, number>>()
      
      picks.forEach(pick => {
        const date = new Date(pick.created_at).toLocaleDateString()
        const gain = calculateGainPercentage(pick.entry_price, pick.target_price)
        
        if (!aiDateMap.has(pick.ai_name)) {
          aiDateMap.set(pick.ai_name, new Map())
        }
        
        const dateMap = aiDateMap.get(pick.ai_name)!
        if (!dateMap.has(date)) {
          dateMap.set(date, 0)
        }
        dateMap.set(date, dateMap.get(date)! + gain)
      })
      
      const dates = Array.from(
        new Set(picks.map(p => new Date(p.created_at).toLocaleDateString()))
      ).slice(0, 7).reverse()
      
      const data = Array.from(aiDateMap.entries()).map(([ai, dateMap]) => ({
        ai,
        dates: dates.map(date => ({ date, value: dateMap.get(date) || 0 }))
      }))
      
      setHeatmapData(data)
    } catch (error) {
      console.error('Heatmap error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="animate-pulse bg-slate-800 rounded-xl h-96"></div>

  const allValues = heatmapData.flatMap(ai => ai.dates.map((d: any) => d.value))
  const maxValue = Math.max(...allValues)
  const minValue = Math.min(...allValues)

  function getHeatColor(value: number) {
    if (value === 0) return 'bg-slate-800'
    const normalized = (value - minValue) / (maxValue - minValue)
    
    if (value > 0) {
      return value > maxValue * 0.7 ? 'bg-green-500' :
             value > maxValue * 0.4 ? 'bg-green-600' : 'bg-green-700'
    }
    return 'bg-red-700'
  }

  const dates = heatmapData[0]?.dates.map((d: any) => d.date) || []

  return (
    <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
      <h3 className="text-xl font-bold mb-6">AI Performance Heat Map</h3>
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          <div className="flex items-center mb-2">
            <div className="w-32 flex-shrink-0"></div>
            {dates.map(((date: string) => (
              <div key={date} className="w-24 text-center flex-shrink-0">
                <p className="text-xs text-slate-400">{date}</p>
              </div>
            ))}
          </div>
          {heatmapData.map(ai => {
            const colors = getAIColor(ai.ai)
            return (
              <div key={ai.ai} className="flex items-center mb-2">
                <div className="w-32 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}></div>
                    <span className="font-semibold text-sm">{ai.ai}</span>
                  </div>
                </div>
                {ai.dates.map((d: any) => (
                  <div key={d.date} className="w-24 h-16 flex-shrink-0 mx-0.5">
                    <div className={`w-full h-full rounded-lg ${getHeatColor(d.value)} flex items-center justify-center transition-all hover:scale-105 cursor-pointer`}>
                      <div className="text-center">
                        {d.value > 0 ? <TrendingUp className="w-4 h-4 mx-auto mb-1" /> : 
                         d.value < 0 ? <TrendingDown className="w-4 h-4 mx-auto mb-1" /> : null}
                        <p className="text-xs font-bold">{d.value > 0 ? '+' : ''}{d.value.toFixed(1)}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>
      <div className="mt-6 flex items-center justify-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span className="text-xs text-slate-400">Strong</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-700 rounded"></div>
          <span className="text-xs text-slate-400">Moderate</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-slate-800 rounded"></div>
          <span className="text-xs text-slate-400">No Data</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-700 rounded"></div>
          <span className="text-xs text-slate-400">Negative</span>
        </div>
      </div>
    </div>
  )
}

