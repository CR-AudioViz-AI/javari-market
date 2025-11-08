'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { TrendingUp, TrendingDown, Target, Sparkles, ChevronDown, ChevronUp, Zap, Award, Swords } from 'lucide-react'
import { getAllStockPicks, getAIStatistics, getHotPicks, type StockPick } from '@/lib/supabase'
import { formatCurrency, calculateGainPercentage, formatPercentage, getAIColor, formatTimeAgo } from '@/lib/utils'
import { AdvancedAnalytics } from '@/components/AdvancedAnalytics'
import { StockScreener } from '@/components/StockScreener'
import { AIPerformanceHeatMap } from '@/components/AIPerformanceHeatMap'
import { AchievementSystem } from '@/components/AchievementSystem'
import { RealTimePriceTracker } from '@/components/RealTimePriceTracker'

export default function DashboardPage() {
  const [picks, setPicks] = useState<StockPick[]>([])
  const [filteredPicks, setFilteredPicks] = useState<StockPick[]>([])
  const [hotPicks, setHotPicks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)
  const [stats, setStats] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState('overview')
  
  const [selectedAI, setSelectedAI] = useState<string>('all')
  const [selectedConfidence, setSelectedConfidence] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('date')

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    applyFiltersAndSort()
  }, [picks, selectedAI, selectedConfidence, sortBy])

  async function loadData() {
    try {
      const [picksData, statsData, hotPicksData] = await Promise.all([
        getAllStockPicks(),
        getAIStatistics(),
        getHotPicks()
      ])
      setPicks(picksData)
      setStats(statsData)
      setHotPicks(hotPicksData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  function applyFiltersAndSort() {
    let filtered = [...picks]

    if (selectedAI !== 'all') {
      filtered = filtered.filter(p => p.ai_name.toLowerCase() === selectedAI)
    }

    if (selectedConfidence !== 'all') {
      if (selectedConfidence === 'high') {
        filtered = filtered.filter(p => p.confidence_score >= 80)
      } else if (selectedConfidence === 'medium') {
        filtered = filtered.filter(p => p.confidence_score >= 60 && p.confidence_score < 80)
      } else if (selectedConfidence === 'low') {
        filtered = filtered.filter(p => p.confidence_score < 60)
      }
    }

    if (sortBy === 'date') {
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    } else if (sortBy === 'confidence') {
      filtered.sort((a, b) => b.confidence_score - a.confidence_score)
    } else if (sortBy === 'gains') {
      filtered.sort((a, b) => {
        const gainsA = calculateGainPercentage(a.entry_price, a.target_price)
        const gainsB = calculateGainPercentage(b.entry_price, b.target_price)
        return gainsB - gainsA
      })
    } else if (sortBy === 'symbol') {
      filtered.sort((a, b) => a.symbol.localeCompare(b.symbol))
    }

    setFilteredPicks(filtered)
  }

  const displayedPicks = showAll ? filteredPicks : filteredPicks.slice(0, 12)
  const totalPicks = picks.length
  const activeAIs = new Set(picks.map(p => p.ai_name)).size
  const avgConfidence = picks.length > 0
    ? picks.reduce((sum, p) => sum + p.confidence_score, 0) / picks.length
    : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-slate-400">Loading Market Oracle...</p>
        </div>
      </div>
    )
  }

  const topSymbols = picks.slice(0, 6).map(p => p.symbol)

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-4">
          <span className="gradient-text">Market Oracle</span>
        </h1>
        <p className="text-xl text-slate-300 max-w-3xl mx-auto">
          5 AI models battle to pick the best penny stocks. Watch, learn, and compete with {totalPicks} real predictions.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/battle">
          <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-xl p-6 border border-red-500/30 hover:border-red-500/50 transition-all cursor-pointer card-hover">
            <div className="flex items-center gap-4">
              <Swords className="w-12 h-12 text-red-400" />
              <div>
                <h3 className="text-xl font-bold">AI Battle Royale</h3>
                <p className="text-sm text-slate-400">See which AI is winning</p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/hot-picks">
          <div className="bg-gradient-to-r from-orange-500/20 to-yellow-500/20 rounded-xl p-6 border border-orange-500/30 hover:border-orange-500/50 transition-all cursor-pointer card-hover">
            <div className="flex items-center gap-4">
              <Target className="w-12 h-12 text-orange-400" />
              <div>
                <h3 className="text-xl font-bold">Hot Picks</h3>
                <p className="text-sm text-slate-400">{hotPicks.length} consensus picks</p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/paper-trading">
          <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl p-6 border border-green-500/30 hover:border-green-500/50 transition-all cursor-pointer card-hover">
            <div className="flex items-center gap-4">
              <Zap className="w-12 h-12 text-green-400" />
              <div>
                <h3 className="text-xl font-bold">Paper Trading</h3>
                <p className="text-sm text-slate-400">Practice with $10,000</p>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Tab Navigation */}
      <div className="bg-slate-900/50 rounded-xl p-2 border border-slate-800 flex gap-2 overflow-x-auto">
        {[
          { id: 'overview', name: 'Overview', icon: TrendingUp },
          { id: 'analytics', name: 'Analytics', icon: Sparkles },
          { id: 'screener', name: 'Screener', icon: Target },
          { id: 'heatmap', name: 'Heat Map', icon: Award },
          { id: 'achievements', name: 'Achievements', icon: Trophy }
        ].map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-brand-cyan to-blue-500 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.name}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-brand-cyan/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm mb-1">Total AI Picks</p>
                  <p className="text-4xl font-bold text-brand-cyan">{totalPicks}</p>
                </div>
                <Target className="w-12 h-12 text-brand-cyan opacity-50" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-brand-navy/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm mb-1">Active AIs</p>
                  <p className="text-4xl font-bold text-white">{activeAIs}</p>
                </div>
                <Sparkles className="w-12 h-12 text-brand-navy opacity-50" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-green-500/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm mb-1">Avg Confidence</p>
                  <p className="text-4xl font-bold text-green-400">{avgConfidence.toFixed(1)}%</p>
                </div>
                <TrendingUp className="w-12 h-12 text-green-400 opacity-50" />
              </div>
            </div>
          </div>

          {/* Real-Time Price Tracker */}
          <RealTimePriceTracker symbols={topSymbols} />

          {/* AI Leaderboard */}
          <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-cyan" />
              AI Leaderboard
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {stats.map((ai) => {
                const colors = getAIColor(ai.aiName)
                return (
                  <div
                    key={ai.aiName}
                    className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 hover:border-slate-600 transition-all card-hover"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}
                      ></div>
                      <span className="font-semibold">{ai.aiName}</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Picks:</span>
                        <span className="font-semibold">{ai.totalPicks}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Confidence:</span>
                        <span className="font-semibold text-green-400">{ai.avgConfidence.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Filters & Sort */}
          <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
            <div className="flex flex-wrap gap-4 items-center">
              <div>
                <label className="text-sm text-slate-400 block mb-2">Filter by AI</label>
                <select
                  value={selectedAI}
                  onChange={(e) => setSelectedAI(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white"
                >
                  <option value="all">All AIs</option>
                  {stats.map(ai => (
                    <option key={ai.aiName} value={ai.aiName.toLowerCase()}>{ai.aiName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm text-slate-400 block mb-2">Filter by Confidence</label>
                <select
                  value={selectedConfidence}
                  onChange={(e) => setSelectedConfidence(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white"
                >
                  <option value="all">All Levels</option>
                  <option value="high">High (80%+)</option>
                  <option value="medium">Medium (60-79%)</option>
                  <option value="low">Low (&lt;60%)</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-slate-400 block mb-2">Sort by</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white"
                >
                  <option value="date">Newest First</option>
                  <option value="confidence">Highest Confidence</option>
                  <option value="gains">Highest Potential Gains</option>
                  <option value="symbol">Symbol (A-Z)</option>
                </select>
              </div>

              <div className="ml-auto">
                <p className="text-sm text-slate-400">
                  Showing {displayedPicks.length} of {filteredPicks.length} picks
                </p>
              </div>
            </div>
          </div>

          {/* Stock Picks Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedPicks.map((pick) => {
              const potentialGain = calculateGainPercentage(pick.entry_price, pick.target_price)
              const colors = getAIColor(pick.ai_name)
              
              return (
                <div
                  key={pick.id}
                  className="bg-slate-900/50 rounded-xl p-6 border border-slate-800 hover:border-slate-700 transition-all card-hover"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-white">{pick.symbol}</h3>
                      <p className="text-xs text-slate-400">{formatTimeAgo(pick.created_at)}</p>
                    </div>
                    <div
                      className="px-3 py-1 rounded-full text-xs font-semibold"
                      style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}
                    >
                      {pick.ai_name}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Entry Price</p>
                      <p className="text-lg font-semibold">{formatCurrency(pick.entry_price)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Target Price</p>
                      <p className="text-lg font-semibold text-green-400">{formatCurrency(pick.target_price)}</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-slate-400">Potential Gain</span>
                      <span className={`text-sm font-bold ${potentialGain >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatPercentage(potentialGain)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-slate-400">Confidence</span>
                      <span className="text-sm font-semibold">{pick.confidence_score}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          pick.confidence_score >= 80 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                          pick.confidence_score >= 60 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                          'bg-gradient-to-r from-red-500 to-pink-500'
                        }`}
                        style={{ width: `${pick.confidence_score}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="text-xs text-slate-400 bg-slate-800/30 rounded-lg p-3 mb-4 line-clamp-2">
                    {pick.reasoning}
                  </div>

                  <button className="w-full bg-gradient-to-r from-brand-cyan to-blue-500 hover:from-brand-cyan/80 hover:to-blue-500/80 text-white font-bold py-3 rounded-lg transition-all">
                    Add to Watchlist ⭐
                  </button>
                </div>
              )
            })}
          </div>

          {/* Show All / Show Less Toggle */}
          {filteredPicks.length > 12 && (
            <div className="text-center">
              {!showAll ? (
                <button
                  onClick={() => setShowAll(true)}
                  className="px-8 py-4 bg-gradient-to-r from-brand-cyan to-blue-500 hover:from-brand-cyan/80 hover:to-blue-500/80 text-white font-bold rounded-xl transition-all text-lg inline-flex items-center gap-2"
                >
                  Show All {filteredPicks.length} Picks
                  <ChevronDown className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={() => { setShowAll(false); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                  className="px-8 py-4 bg-slate-800 hover:bg-slate-700 border border-brand-cyan/30 text-brand-cyan font-bold rounded-xl transition-all inline-flex items-center gap-2"
                >
                  Show Less
                  <ChevronUp className="w-5 h-5" />
                </button>
              )}
            </div>
          )}

          {/* Bottom CTA */}
          <div className="mt-12 bg-gradient-to-r from-brand-cyan/10 via-brand-red/10 to-brand-navy/10 rounded-xl p-8 border border-brand-cyan/30 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Start Trading?</h2>
            <p className="text-slate-300 mb-6">Practice with $10,000 virtual money. Zero risk. Real experience.</p>
            <Link href="/paper-trading">
              <button className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold rounded-xl text-lg transition-all">
                Start Paper Trading 💰
              </button>
            </Link>
          </div>
        </>
      )}

      {activeTab === 'analytics' && <AdvancedAnalytics />}
      {activeTab === 'screener' && <StockScreener />}
      {activeTab === 'heatmap' && <AIPerformanceHeatMap />}
      {activeTab === 'achievements' && <AchievementSystem />}
    </div>
  )
}

import { Trophy } from 'lucide-react'
