'use client'

import { useState, useEffect } from 'react'
import {
  Activity, TrendingUp, TrendingDown, Zap, Globe, MessageSquare,
  Twitter, Newspaper, BarChart2, PieChart, RefreshCw, AlertCircle,
  ThumbsUp, ThumbsDown, Minus, Eye, Bell, Filter, ChevronRight
} from 'lucide-react'

interface SentimentSource {
  id: string
  name: string
  icon: React.ReactNode
  sentiment: number // -100 to 100
  volume: number
  trend: 'up' | 'down' | 'stable'
  lastUpdate: string
}

interface MarketMood {
  overall: number
  fearGreed: number
  volatility: number
  momentum: number
}

interface TrendingTopic {
  id: string
  topic: string
  sentiment: 'positive' | 'negative' | 'neutral'
  mentions: number
  change: number
}

const SENTIMENT_SOURCES: SentimentSource[] = [
  { id: '1', name: 'Social Media', icon: <Twitter className="w-5 h-5" />, sentiment: 65, volume: 125000, trend: 'up', lastUpdate: '2m ago' },
  { id: '2', name: 'News Headlines', icon: <Newspaper className="w-5 h-5" />, sentiment: 45, volume: 8500, trend: 'stable', lastUpdate: '5m ago' },
  { id: '3', name: 'Reddit/Forums', icon: <MessageSquare className="w-5 h-5" />, sentiment: 72, volume: 45000, trend: 'up', lastUpdate: '1m ago' },
  { id: '4', name: 'Analyst Reports', icon: <BarChart2 className="w-5 h-5" />, sentiment: 58, volume: 350, trend: 'up', lastUpdate: '1h ago' },
  { id: '5', name: 'Options Flow', icon: <Activity className="w-5 h-5" />, sentiment: 55, volume: 2500000, trend: 'down', lastUpdate: '30s ago' },
]

const TRENDING_TOPICS: TrendingTopic[] = [
  { id: '1', topic: 'NVDA Earnings', sentiment: 'positive', mentions: 45200, change: 125 },
  { id: '2', topic: 'Fed Rate Decision', sentiment: 'neutral', mentions: 38500, change: 45 },
  { id: '3', topic: 'AI Chip Shortage', sentiment: 'negative', mentions: 22100, change: -15 },
  { id: '4', topic: 'Bitcoin ETF', sentiment: 'positive', mentions: 89000, change: 250 },
  { id: '5', topic: 'Tech Layoffs', sentiment: 'negative', mentions: 15600, change: -8 },
  { id: '6', topic: 'EV Market Growth', sentiment: 'positive', mentions: 12300, change: 32 },
]

export default function MarketSentimentRadar() {
  const [sources, setSources] = useState<SentimentSource[]>(SENTIMENT_SOURCES)
  const [trending, setTrending] = useState<TrendingTopic[]>(TRENDING_TOPICS)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h')

  const marketMood: MarketMood = {
    overall: Math.round(sources.reduce((sum, s) => sum + s.sentiment, 0) / sources.length),
    fearGreed: 62,
    volatility: 35,
    momentum: 58
  }

  const getMoodLabel = (score: number) => {
    if (score >= 75) return { label: 'Extreme Greed', color: 'text-green-400' }
    if (score >= 55) return { label: 'Greed', color: 'text-green-400' }
    if (score >= 45) return { label: 'Neutral', color: 'text-yellow-400' }
    if (score >= 25) return { label: 'Fear', color: 'text-red-400' }
    return { label: 'Extreme Fear', color: 'text-red-400' }
  }

  const mood = getMoodLabel(marketMood.fearGreed)

  const refreshData = async () => {
    setIsRefreshing(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsRefreshing(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-900 rounded-xl border border-gray-700 p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Market Sentiment Radar</h1>
              <p className="text-sm text-gray-400">Real-time sentiment analysis across sources</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
              {['1h', '24h', '7d', '30d'].map(tf => (
                <button
                  key={tf}
                  onClick={() => setSelectedTimeframe(tf)}
                  className={`px-3 py-1.5 rounded text-sm ${
                    selectedTimeframe === tf ? 'bg-orange-600 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
            <button
              onClick={refreshData}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 rounded-lg"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Market Mood Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 rounded-xl border border-gray-700 p-4">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <Globe className="w-4 h-4" />
            <span className="text-sm">Overall Sentiment</span>
          </div>
          <p className="text-3xl font-bold">{marketMood.overall}</p>
          <p className={`text-sm ${marketMood.overall >= 50 ? 'text-green-400' : 'text-red-400'}`}>
            {marketMood.overall >= 50 ? 'Bullish' : 'Bearish'}
          </p>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-700 p-4">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <Activity className="w-4 h-4" />
            <span className="text-sm">Fear & Greed</span>
          </div>
          <p className={`text-3xl font-bold ${mood.color}`}>{marketMood.fearGreed}</p>
          <p className={`text-sm ${mood.color}`}>{mood.label}</p>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-700 p-4">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <Zap className="w-4 h-4" />
            <span className="text-sm">Volatility Index</span>
          </div>
          <p className="text-3xl font-bold text-yellow-400">{marketMood.volatility}</p>
          <p className="text-sm text-yellow-400">Moderate</p>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-700 p-4">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm">Momentum</span>
          </div>
          <p className="text-3xl font-bold text-green-400">{marketMood.momentum}</p>
          <p className="text-sm text-green-400">Positive</p>
        </div>
      </div>

      {/* Sentiment Sources */}
      <div className="bg-gray-900 rounded-xl border border-gray-700">
        <div className="p-4 border-b border-gray-700">
          <h3 className="font-semibold">Sentiment by Source</h3>
        </div>
        <div className="p-4 space-y-4">
          {sources.map(source => (
            <div key={source.id} className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                source.sentiment >= 50 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              }`}>
                {source.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">{source.name}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${source.sentiment >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                      {source.sentiment}
                    </span>
                    {source.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-400" />}
                    {source.trend === 'down' && <TrendingDown className="w-4 h-4 text-red-400" />}
                    {source.trend === 'stable' && <Minus className="w-4 h-4 text-gray-400" />}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${source.sentiment >= 50 ? 'bg-green-500' : 'bg-red-500'}`}
                      style={{ width: `${source.sentiment}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">{source.volume.toLocaleString()} signals</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trending Topics */}
      <div className="bg-gray-900 rounded-xl border border-gray-700">
        <div className="p-4 border-b border-gray-700">
          <h3 className="font-semibold">Trending Topics</h3>
        </div>
        <div className="divide-y divide-gray-800">
          {trending.map(topic => (
            <div key={topic.id} className="p-4 flex items-center justify-between hover:bg-gray-800/50">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  topic.sentiment === 'positive' ? 'bg-green-500/20' : 
                  topic.sentiment === 'negative' ? 'bg-red-500/20' : 'bg-gray-500/20'
                }`}>
                  {topic.sentiment === 'positive' && <ThumbsUp className="w-4 h-4 text-green-400" />}
                  {topic.sentiment === 'negative' && <ThumbsDown className="w-4 h-4 text-red-400" />}
                  {topic.sentiment === 'neutral' && <Minus className="w-4 h-4 text-gray-400" />}
                </div>
                <div>
                  <p className="font-medium">{topic.topic}</p>
                  <p className="text-sm text-gray-400">{topic.mentions.toLocaleString()} mentions</p>
                </div>
              </div>
              <div className={`flex items-center gap-1 ${topic.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {topic.change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <span>{topic.change >= 0 ? '+' : ''}{topic.change}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
