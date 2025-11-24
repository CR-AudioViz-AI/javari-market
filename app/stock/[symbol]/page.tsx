'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  TrendingUp, TrendingDown, Target, Sparkles, ArrowLeft, 
  Star, Bell, Share2, AlertCircle, Eye, Calendar,
  Award, Zap, Shield, Activity
} from 'lucide-react'
import { getStockPicks, type StockPick } from '@/lib/supabase'
import { formatCurrency, calculateGainPercentage, formatPercentage, getAIColor, formatTimeAgo } from '@/lib/utils'

interface StockPrice {
  price: number
  change: number
  changePercent: number
  previousClose: number
  open: number
  dayHigh: number
  dayLow: number
  volume: number
  marketCap: string
  error?: string
}

export default function StockDetailPage() {
  const params = useParams()
  const router = useRouter()
  const symbol = params.symbol as string
  
  const [picks, setPicks] = useState<StockPick[]>([])
  const [price, setPrice] = useState<StockPrice | null>(null)
  const [loading, setLoading] = useState(true)
  const [priceLoading, setPriceLoading] = useState(true)

  useEffect(() => {
    if (symbol) {
      loadStockData()
      loadPrice()
      // Refresh price every 30 seconds
      const interval = setInterval(loadPrice, 30000)
      return () => clearInterval(interval)
    }
  }, [symbol])

  async function loadStockData() {
    try {
      const data = await getStockPicks({ symbol: symbol.toUpperCase() })
      setPicks(data)
    } catch (error) {
      console.error('Error loading stock data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadPrice() {
    try {
      setPriceLoading(true)
      const response = await fetch(`/api/stock-price?symbol=${symbol}`)
      const data = await response.json()
      
      if (data.error) {
        setPrice({ ...data, price: 0, change: 0, changePercent: 0, previousClose: 0, open: 0, dayHigh: 0, dayLow: 0, volume: 0, marketCap: 'N/A' })
      } else {
        setPrice(data)
      }
    } catch (error) {
      console.error('Error loading price:', error)
      setPrice({ price: 0, change: 0, changePercent: 0, previousClose: 0, open: 0, dayHigh: 0, dayLow: 0, volume: 0, marketCap: 'N/A', error: 'Failed to load price' })
    } finally {
      setPriceLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-slate-400">Loading {symbol}...</p>
        </div>
      </div>
    )
  }

  if (picks.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <button onClick={() => router.back()} className="flex items-center text-brand-cyan mb-6 hover:underline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </button>
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-slate-500" />
          <h2 className="text-2xl font-bold mb-2">No AI Predictions Found</h2>
          <p className="text-slate-400 mb-6">We don't have any AI analysis for {symbol.toUpperCase()} yet.</p>
          <Link href="/">
            <button className="px-6 py-3 bg-gradient-to-r from-brand-cyan to-blue-500 hover:from-brand-cyan/80 hover:to-blue-500/80 text-white font-bold rounded-lg transition">
              View All Picks
            </button>
          </Link>
        </div>
      </div>
    )
  }

  const latestPick = picks[0]
  const avgConfidence = picks.reduce((sum, p) => sum + (p.confidence_score || 0), 0) / picks.length
  const avgTargetPrice = picks.reduce((sum, p) => sum + (p.target_price || 0), 0) / picks.length
  const consensusBullish = picks.filter(p => (p.target_price || 0) > (p.entry_price || 0)).length > picks.length / 2
  const uniqueAIs = new Set(picks.map(p => p.ai_name || 'Unknown')).size

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <button onClick={() => router.back()} className="flex items-center text-brand-cyan mb-6 hover:underline group">
        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
        Back to Dashboard
      </button>

      {/* Header Section */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 border border-brand-cyan/20 shadow-xl mb-8">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          {/* Left: Stock Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <h1 className="text-4xl font-bold">{symbol.toUpperCase()}</h1>
              {consensusBullish ? (
                <TrendingUp className="w-8 h-8 text-green-500" />
              ) : (
                <TrendingDown className="w-8 h-8 text-red-500" />
              )}
            </div>
            
            <div className="flex items-baseline gap-4 mb-6">
              {priceLoading ? (
                <div className="text-4xl font-bold text-slate-400">Loading...</div>
              ) : price?.error ? (
                <div className="text-2xl text-slate-400">Price unavailable</div>
              ) : (
                <>
                  <div className="text-5xl font-bold">{formatCurrency(price?.price || 0)}</div>
                  <div className={`flex items-center text-xl ${(price?.change || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {(price?.change || 0) >= 0 ? <TrendingUp className="w-5 h-5 mr-1" /> : <TrendingDown className="w-5 h-5 mr-1" />}
                    {formatCurrency(Math.abs(price?.change || 0))} ({formatPercentage(price?.changePercent || 0)})
                  </div>
                </>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-slate-400">Previous Close</div>
                <div className="font-semibold">{formatCurrency(price?.previousClose || 0)}</div>
              </div>
              <div>
                <div className="text-slate-400">Day Range</div>
                <div className="font-semibold">{formatCurrency(price?.dayLow || 0)} - {formatCurrency(price?.dayHigh || 0)}</div>
              </div>
              <div>
                <div className="text-slate-400">Volume</div>
                <div className="font-semibold">{(price?.volume || 0).toLocaleString()}</div>
              </div>
              <div>
                <div className="text-slate-400">Market Cap</div>
                <div className="font-semibold">{price?.marketCap || 'N/A'}</div>
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex lg:flex-col gap-3">
            <button className="flex-1 lg:flex-none px-6 py-3 bg-gradient-to-r from-brand-cyan to-blue-500 hover:from-brand-cyan/80 hover:to-blue-500/80 text-white font-bold rounded-lg transition flex items-center justify-center gap-2">
              <Star className="w-5 h-5" />
              Add to Watchlist
            </button>
            <button className="px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-brand-cyan/30 text-brand-cyan font-bold rounded-lg transition flex items-center justify-center gap-2">
              <Bell className="w-5 h-5" />
              Alert
            </button>
            <button className="px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-brand-cyan/30 text-brand-cyan font-bold rounded-lg transition flex items-center justify-center gap-2">
              <Share2 className="w-5 h-5" />
              Share
            </button>
          </div>
        </div>
      </div>

      {/* AI Consensus */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-5 h-5 text-brand-cyan" />
            <div className="text-sm text-slate-400">AI Consensus</div>
          </div>
          <div className={`text-2xl font-bold ${consensusBullish ? 'text-green-500' : 'text-red-500'}`}>
            {consensusBullish ? 'BULLISH' : 'BEARISH'}
          </div>
          <div className="text-xs text-slate-400 mt-1">{uniqueAIs} AIs agree</div>
        </div>

        <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Target className="w-5 h-5 text-purple-500" />
            <div className="text-sm text-slate-400">Avg Target Price</div>
          </div>
          <div className="text-2xl font-bold">{formatCurrency(avgTargetPrice)}</div>
          <div className="text-xs text-green-500 mt-1">
            {formatPercentage(calculateGainPercentage(price?.price || 0, avgTargetPrice))} upside
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Award className="w-5 h-5 text-yellow-500" />
            <div className="text-sm text-slate-400">Avg Confidence</div>
          </div>
          <div className="text-2xl font-bold">{avgConfidence.toFixed(0)}%</div>
          <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
            <div 
              className={`h-full rounded-full ${
                avgConfidence >= 80 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                avgConfidence >= 60 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                'bg-gradient-to-r from-red-500 to-pink-500'
              }`}
              style={{ width: `${avgConfidence}%` }}
            />
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Eye className="w-5 h-5 text-brand-red" />
            <div className="text-sm text-slate-400">Total Predictions</div>
          </div>
          <div className="text-2xl font-bold">{picks.length}</div>
          <div className="text-xs text-slate-400 mt-1">from {uniqueAIs} different AIs</div>
        </div>
      </div>

      {/* All AI Predictions */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-brand-cyan" />
          AI Predictions
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {picks.map((pick) => {
            const gainPercent = calculateGainPercentage((pick.entry_price || 0), (pick.target_price || 0))
            
            return (
              <div key={pick.id} className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-6 border border-slate-700 hover:border-brand-cyan/50 transition-all">
                {/* AI Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg"
                      style={{ background: getAIColor(String(pick.ai_name || 'Unknown')).primary }}
                    >
                      {((pick.ai_name || 'U')).charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold">{pick.ai_name || 'Unknown'}</div>
                      <div className="text-xs text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatTimeAgo(pick.created_at)}
                      </div>
                    </div>
                  </div>
                  
                  <div className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1 ${
                    (pick.target_price || 0) > (pick.entry_price || 0) 
                      ? 'bg-green-500/20 text-green-500' 
                      : 'bg-red-500/20 text-red-500'
                  }`}>
                    {(pick.target_price || 0) > (pick.entry_price || 0) ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    {((pick.target_price || 0) > (pick.entry_price || 0) ? 'BULLISH' : 'BEARISH')}
                  </div>
                </div>

                {/* Price Targets */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <div className="text-xs text-slate-400 mb-1">Entry</div>
                    <div className="font-bold text-brand-cyan">{formatCurrency(pick.entry_price || 0)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 mb-1">Target</div>
                    <div className="font-bold text-green-500">{formatCurrency(pick.target_price || 0)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 mb-1">Upside</div>
                    <div className="font-bold text-purple-500">{formatPercentage(gainPercent)}</div>
                  </div>
                </div>

                {/* Confidence */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span>Confidence</span>
                    <span className="font-bold text-white">{(pick.confidence_score || 0)}%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        (pick.confidence_score || 0) >= 80 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                        (pick.confidence_score || 0) >= 60 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                        'bg-gradient-to-r from-red-500 to-pink-500'
                      }`}
                      style={{ width: `${(pick.confidence_score || 0)}%` }}
                    />
                  </div>
                </div>

                {/* Reasoning */}
                <div className="text-sm text-slate-300 bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  {pick.reasoning}
                </div>

              </div>
            )
          })}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/paper-trading">
          <button className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold rounded-xl transition flex items-center justify-center gap-2">
            <Zap className="w-5 h-5" />
            Paper Trade {symbol.toUpperCase()}
          </button>
        </Link>
        
        <Link href="/charts">
          <button className="w-full px-6 py-4 bg-slate-800 hover:bg-slate-700 border border-brand-cyan/30 text-brand-cyan font-bold rounded-xl transition flex items-center justify-center gap-2">
            <Activity className="w-5 h-5" />
            View Charts
          </button>
        </Link>
        
        <Link href="/">
          <button className="w-full px-6 py-4 bg-slate-800 hover:bg-slate-700 border border-brand-cyan/30 text-white font-bold rounded-xl transition">
            View All Picks
          </button>
        </Link>
      </div>
    </div>
  )
}



