'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, Star } from 'lucide-react'
import { getAllStockPicks } from '@/lib/supabase'
import { formatCurrency, calculateGainPercentage, formatPercentage, getAIColor } from '@/lib/utils'

export function StockScreener() {
  const [picks, setPicks] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [filters, setFilters] = useState({
    minGain: 0,
    maxGain: 1000,
    minConfidence: 0,
    maxConfidence: 100,
    minPrice: 0,
    maxPrice: 1000,
    aiModels: [] as string[]
  })

  useEffect(() => {
    loadPicks()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [filters, picks])

  async function loadPicks() {
    const data = await getAllStockPicks()
    setPicks(data)
  }

  function applyFilters() {
    let result = [...picks]

    // Gain filter
    result = result.filter(p => {
      const gain = calculateGainPercentage(p.entry_price, p.target_price)
      return gain >= filters.minGain && gain <= filters.maxGain
    })

    // Confidence filter
    result = result.filter(p => 
      p.confidence >= filters.minConfidence && 
      p.confidence <= filters.maxConfidence
    )

    // Price filter
    result = result.filter(p => 
      p.entry_price >= filters.minPrice && 
      p.entry_price <= filters.maxPrice
    )

    // AI filter
    if (filters.aiModels.length > 0) {
      result = result.filter(p => filters.aiModels.includes(p.ai_display_name))
    }

    setFiltered(result)
  }

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
        <div className="flex items-center gap-3 mb-6">
          <Filter className="w-6 h-6 text-brand-cyan" />
          <h3 className="text-xl font-bold">Stock Screener</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Potential Gain Range */}
          <div>
            <label className="text-sm text-slate-400 mb-2 block">Potential Gain Range</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={filters.minGain}
                onChange={(e) => setFilters({...filters, minGain: parseFloat(e.target.value)})}
                placeholder="Min %"
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
              />
              <input
                type="number"
                value={filters.maxGain}
                onChange={(e) => setFilters({...filters, maxGain: parseFloat(e.target.value)})}
                placeholder="Max %"
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
              />
            </div>
          </div>

          {/* Confidence Range */}
          <div>
            <label className="text-sm text-slate-400 mb-2 block">Confidence Score</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={filters.minConfidence}
                onChange={(e) => setFilters({...filters, minConfidence: parseFloat(e.target.value)})}
                placeholder="Min %"
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
              />
              <input
                type="number"
                value={filters.maxConfidence}
                onChange={(e) => setFilters({...filters, maxConfidence: parseFloat(e.target.value)})}
                placeholder="Max %"
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
              />
            </div>
          </div>

          {/* Price Range */}
          <div>
            <label className="text-sm text-slate-400 mb-2 block">Entry Price Range</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={filters.minPrice}
                onChange={(e) => setFilters({...filters, minPrice: parseFloat(e.target.value)})}
                placeholder="Min $"
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
              />
              <input
                type="number"
                value={filters.maxPrice}
                onChange={(e) => setFilters({...filters, maxPrice: parseFloat(e.target.value)})}
                placeholder="Max $"
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
              />
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-slate-400">
            Found <span className="text-brand-cyan font-bold">{filtered.length}</span> stocks matching your criteria
          </p>
          <button
            onClick={() => setFilters({
              minGain: 0, maxGain: 1000, minConfidence: 0, maxConfidence: 100,
              minPrice: 0, maxPrice: 1000, aiModels: []
            })}
            className="text-sm text-brand-cyan hover:underline"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.slice(0, 12).map(pick => {
          const gain = calculateGainPercentage(pick.entry_price, pick.target_price)
          const colors = getAIColor(pick.ai_display_name)

          return (
            <div key={pick.id} className="bg-slate-900/50 rounded-lg p-4 border border-slate-800 hover:border-brand-cyan/50 transition-all">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xl font-bold">{pick.symbol}</h4>
                <div className="px-2 py-1 rounded text-xs" style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}>
                  {pick.ai_display_name}
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Potential:</span>
                  <span className="font-bold text-green-400">{formatPercentage(gain)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Confidence:</span>
                  <span className="font-bold">{pick.confidence}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Entry:</span>
                  <span className="font-semibold">{formatCurrency(pick.entry_price)}</span>
                </div>
              </div>
              <button className="w-full mt-3 bg-gradient-to-r from-brand-cyan to-blue-500 hover:opacity-90 text-white font-bold py-2 rounded-lg text-sm">
                <Star className="w-4 h-4 inline mr-1" />
                Add to Watchlist
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}


