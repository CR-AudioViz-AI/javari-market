'use client'

import { useEffect, useState } from 'react'
import { Sparkles, Search, Download } from 'lucide-react'
import { getAllStockPicks, type StockPick } from '@/lib/supabase'
import { formatCurrency, calculateGainPercentage, formatPercentage, getAIColor, formatDate } from '@/lib/utils'

export default function InsightsPage() {
  const [picks, setPicks] = useState<StockPick[]>([])
  const [filteredPicks, setFilteredPicks] = useState<StockPick[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAI, setSelectedAI] = useState('all')
  const [sortBy, setSortBy] = useState('date')

  useEffect(() => {
    loadPicks()
  }, [])

  useEffect(() => {
    applyFiltersAndSort()
  }, [picks, searchTerm, selectedAI, sortBy])

  async function loadPicks() {
    try {
      const data = await getAllStockPicks()
      setPicks(data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  function applyFiltersAndSort() {
    let filtered = [...picks]

    if (searchTerm) {
      filtered = filtered.filter(p => 
        (p.symbol || p.ticker || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.reasoning || "").toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedAI !== 'all') {
      filtered = filtered.filter(p => p.ai_name?.toLowerCase() === selectedAI)
    }

    if (sortBy === 'date') {
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    } else if (sortBy === 'confidence') {
      filtered.sort((a, b) => (b.confidence_score || 0) - a.confidence_score)
    } else if (sortBy === 'symbol') {
      filtered.sort((a, b) => (a.symbol || "").localeCompare((b.symbol || "")))
    }

    setFilteredPicks(filtered)
  }

  function exportToCSV() {
    const csv = [
      ['AI', 'Symbol', 'Entry', 'Target', 'Confidence', 'Date', 'Reasoning'].join(','),
      ...filteredPicks.map(p => [
        p.ai_name,
        p.symbol,
        p.entry_price,
        p.target_price,
        p.confidence_score,
        formatDate(p.created_at),
        `"${p.reasoning.replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'market-oracle-insights.csv'
    a.click()
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]"><div className="spinner"></div></div>
  }

  const uniqueAIs = Array.from(new Set(picks.map(p => p.ai_name)))

  return (
    <div className="space-y-8">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-4 flex items-center justify-center gap-4">
          <Sparkles className="w-12 h-12 text-brand-cyan" />
          <span className="gradient-text">AI Insights</span>
        </h1>
        <p className="text-xl text-slate-300">Browse all {picks.length} AI stock picks with advanced filtering</p>
      </div>

      <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by symbol or reasoning..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-brand-cyan"
              />
            </div>
          </div>

          <select
            value={selectedAI}
            onChange={(e) => setSelectedAI(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white"
          >
            <option value="all">All AIs</option>
            {uniqueAIs.map(ai => (
              <option key={ai} value={ai.toLowerCase()}>{ai}</option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white"
          >
            <option value="date">Newest First</option>
            <option value="confidence">Highest Confidence</option>
            <option value="symbol">Symbol (A-Z)</option>
          </select>

          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-lg font-semibold flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        <div className="mt-4 text-sm text-slate-400">
          Showing {filteredPicks.length} of {picks.length} picks
        </div>
      </div>

      <div className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800/50 border-b border-slate-700">
              <tr>
                <th className="text-left p-4 font-semibold">AI</th>
                <th className="text-left p-4 font-semibold">Symbol</th>
                <th className="text-left p-4 font-semibold">Entry</th>
                <th className="text-left p-4 font-semibold">Target</th>
                <th className="text-left p-4 font-semibold">Potential</th>
                <th className="text-left p-4 font-semibold">Confidence</th>
                <th className="text-left p-4 font-semibold">Date</th>
                <th className="text-left p-4 font-semibold">Reasoning</th>
              </tr>
            </thead>
            <tbody>
              {filteredPicks.map(pick => {
                const colors = getAIColor(pick.ai_name)
                const gain = calculateGainPercentage(pick.entry_price, pick.target_price)
                
                return (
                  <tr key={pick.id} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}></div>
                        <span className="font-semibold">{pick.ai_name}</span>
                      </div>
                    </td>
                    <td className="p-4 font-bold">{pick.symbol}</td>
                    <td className="p-4">{formatCurrency(pick.entry_price)}</td>
                    <td className="p-4 text-green-400">{formatCurrency(pick.target_price)}</td>
                    <td className="p-4">
                      <span className={gain >= 0 ? 'text-green-400' : 'text-red-400'}>
                        {formatPercentage(gain)}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-slate-700 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full"
                            style={{ width: `${pick.confidence_score}%` }}
                          ></div>
                        </div>
                        <span className="text-sm">{pick.confidence_score}%</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-400 text-sm">{formatDate(pick.created_at)}</td>
                    <td className="p-4 max-w-md">
                      <p className="text-sm text-slate-400 line-clamp-2">{pick.reasoning}</p>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
