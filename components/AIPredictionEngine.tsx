'use client'

import { useState, useEffect } from 'react'
import {
  Brain, TrendingUp, TrendingDown, Zap, Target, Activity,
  BarChart3, LineChart, PieChart, RefreshCw, Clock, Star,
  AlertTriangle, CheckCircle, XCircle, ArrowUpRight, ArrowDownRight,
  Sparkles, Eye, Bell, Filter, ChevronRight, Info
} from 'lucide-react'

interface Prediction {
  id: string
  symbol: string
  name: string
  currentPrice: number
  predictedPrice: number
  predictedChange: number
  confidence: number
  timeframe: '1D' | '1W' | '1M' | '3M'
  signals: string[]
  aiModel: string
  sentiment: 'bullish' | 'bearish' | 'neutral'
  riskLevel: 'low' | 'medium' | 'high'
  updatedAt: string
}

interface ModelPerformance {
  name: string
  accuracy: number
  totalPredictions: number
  winRate: number
  avgReturn: number
}

const DEMO_PREDICTIONS: Prediction[] = [
  {
    id: '1', symbol: 'NVDA', name: 'NVIDIA Corp', currentPrice: 495.22, predictedPrice: 545.00,
    predictedChange: 10.05, confidence: 87, timeframe: '1M', signals: ['Strong momentum', 'AI sector growth', 'Earnings beat'],
    aiModel: 'GPT-4 Turbo', sentiment: 'bullish', riskLevel: 'medium', updatedAt: new Date().toISOString()
  },
  {
    id: '2', symbol: 'AAPL', name: 'Apple Inc', currentPrice: 193.15, predictedPrice: 205.00,
    predictedChange: 6.13, confidence: 82, timeframe: '1M', signals: ['iPhone demand', 'Services growth', 'Buyback program'],
    aiModel: 'Claude 3.5', sentiment: 'bullish', riskLevel: 'low', updatedAt: new Date().toISOString()
  },
  {
    id: '3', symbol: 'TSLA', name: 'Tesla Inc', currentPrice: 248.50, predictedPrice: 225.00,
    predictedChange: -9.46, confidence: 72, timeframe: '1M', signals: ['Price competition', 'Margin pressure', 'EV slowdown'],
    aiModel: 'Gemini Pro', sentiment: 'bearish', riskLevel: 'high', updatedAt: new Date().toISOString()
  },
  {
    id: '4', symbol: 'MSFT', name: 'Microsoft Corp', currentPrice: 375.28, predictedPrice: 410.00,
    predictedChange: 9.25, confidence: 89, timeframe: '1M', signals: ['Azure growth', 'Copilot adoption', 'Enterprise AI'],
    aiModel: 'GPT-4 Turbo', sentiment: 'bullish', riskLevel: 'low', updatedAt: new Date().toISOString()
  },
  {
    id: '5', symbol: 'BTC', name: 'Bitcoin', currentPrice: 42850, predictedPrice: 52000,
    predictedChange: 21.35, confidence: 75, timeframe: '3M', signals: ['ETF approval', 'Halving cycle', 'Institutional flow'],
    aiModel: 'Claude 3.5', sentiment: 'bullish', riskLevel: 'high', updatedAt: new Date().toISOString()
  },
]

const AI_MODELS: ModelPerformance[] = [
  { name: 'GPT-4 Turbo', accuracy: 78.5, totalPredictions: 1250, winRate: 72.3, avgReturn: 8.4 },
  { name: 'Claude 3.5', accuracy: 81.2, totalPredictions: 980, winRate: 75.1, avgReturn: 9.2 },
  { name: 'Gemini Pro', accuracy: 74.8, totalPredictions: 850, winRate: 68.9, avgReturn: 6.8 },
  { name: 'Ensemble', accuracy: 85.3, totalPredictions: 2100, winRate: 79.4, avgReturn: 11.5 },
]

export default function AIPredictionEngine() {
  const [predictions, setPredictions] = useState<Prediction[]>(DEMO_PREDICTIONS)
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('1M')
  const [selectedSentiment, setSelectedSentiment] = useState<string>('all')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showModelStats, setShowModelStats] = useState(false)

  const refreshPredictions = async () => {
    setIsRefreshing(true)
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsRefreshing(false)
  }

  const filteredPredictions = predictions.filter(p => {
    if (selectedTimeframe !== 'all' && p.timeframe !== selectedTimeframe) return false
    if (selectedSentiment !== 'all' && p.sentiment !== selectedSentiment) return false
    return true
  })

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return 'text-green-400 bg-green-500/20'
      case 'bearish': return 'text-red-400 bg-red-500/20'
      default: return 'text-gray-400 bg-gray-500/20'
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-400'
      case 'medium': return 'text-yellow-400'
      case 'high': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-900 rounded-xl border border-gray-700 p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">AI Prediction Engine</h1>
              <p className="text-sm text-gray-400">Multi-model consensus predictions</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowModelStats(!showModelStats)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg"
            >
              <BarChart3 className="w-4 h-4" />
              Model Stats
            </button>
            <button
              onClick={refreshPredictions}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 rounded-lg"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Model Performance Stats */}
      {showModelStats && (
        <div className="bg-gray-900 rounded-xl border border-gray-700 p-4">
          <h3 className="font-semibold mb-4">AI Model Performance</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {AI_MODELS.map(model => (
              <div key={model.name} className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Brain className="w-4 h-4 text-cyan-400" />
                  <span className="font-medium text-sm">{model.name}</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Accuracy</span>
                    <span className="text-cyan-400 font-medium">{model.accuracy}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Win Rate</span>
                    <span className="text-green-400">{model.winRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Avg Return</span>
                    <span className="text-green-400">+{model.avgReturn}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Predictions</span>
                    <span>{model.totalPredictions.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
          {['1D', '1W', '1M', '3M', 'all'].map(tf => (
            <button
              key={tf}
              onClick={() => setSelectedTimeframe(tf)}
              className={`px-3 py-1.5 rounded text-sm ${
                selectedTimeframe === tf ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {tf === 'all' ? 'All' : tf}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
          {['all', 'bullish', 'bearish', 'neutral'].map(s => (
            <button
              key={s}
              onClick={() => setSelectedSentiment(s)}
              className={`px-3 py-1.5 rounded text-sm capitalize ${
                selectedSentiment === s ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Predictions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredPredictions.map(prediction => (
          <div key={prediction.id} className="bg-gray-900 rounded-xl border border-gray-700 p-4 hover:border-cyan-500/50 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  prediction.sentiment === 'bullish' ? 'bg-green-500/20' : prediction.sentiment === 'bearish' ? 'bg-red-500/20' : 'bg-gray-500/20'
                }`}>
                  {prediction.sentiment === 'bullish' ? (
                    <TrendingUp className="w-6 h-6 text-green-400" />
                  ) : prediction.sentiment === 'bearish' ? (
                    <TrendingDown className="w-6 h-6 text-red-400" />
                  ) : (
                    <Activity className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg">{prediction.symbol}</span>
                    <span className={`px-2 py-0.5 text-xs rounded capitalize ${getSentimentColor(prediction.sentiment)}`}>
                      {prediction.sentiment}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">{prediction.name}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1">
                  <Brain className="w-3 h-3 text-cyan-400" />
                  <span className="text-xs text-gray-400">{prediction.aiModel}</span>
                </div>
                <span className="text-xs text-gray-500">{prediction.timeframe}</span>
              </div>
            </div>

            {/* Price Prediction */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Current</p>
                <p className="font-medium">${prediction.currentPrice.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Target</p>
                <p className={`font-medium ${prediction.predictedChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${prediction.predictedPrice.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Change</p>
                <p className={`font-medium flex items-center gap-1 ${prediction.predictedChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {prediction.predictedChange >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  {prediction.predictedChange >= 0 ? '+' : ''}{prediction.predictedChange.toFixed(2)}%
                </p>
              </div>
            </div>

            {/* Confidence & Risk */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-400">Confidence</span>
                  <span className="text-xs font-medium">{prediction.confidence}%</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                    style={{ width: `${prediction.confidence}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-1">
                <AlertTriangle className={`w-4 h-4 ${getRiskColor(prediction.riskLevel)}`} />
                <span className={`text-sm capitalize ${getRiskColor(prediction.riskLevel)}`}>{prediction.riskLevel}</span>
              </div>
            </div>

            {/* Signals */}
            <div className="flex flex-wrap gap-1">
              {prediction.signals.map((signal, i) => (
                <span key={i} className="px-2 py-1 bg-gray-800 text-xs text-gray-300 rounded">
                  {signal}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
