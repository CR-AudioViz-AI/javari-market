'use client'

import { useState, useEffect } from 'react'
import { 
  TrendingUp, Bell, Brain, BarChart3, PieChart,
  Search, Star, DollarSign, Activity, Zap,
  ArrowUp, ArrowDown, Clock, Target, Sparkles
} from 'lucide-react'

// Import all new components
import PriceAlerts from '@/components/PriceAlerts'
import AIStockScoring from '@/components/AIStockScoring'

type ActiveTab = 'dashboard' | 'ai-picks' | 'alerts' | 'scoring' | 'portfolio' | 'watchlist'

interface StockPick {
  symbol: string
  name: string
  score: number
  signal: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell'
  currentPrice: number
  targetPrice: number
  upside: number
  confidence: number
  generatedAt: string
}

interface PortfolioPosition {
  symbol: string
  name: string
  shares: number
  avgCost: number
  currentPrice: number
  totalValue: number
  gain: number
  gainPercent: number
}

export default function MarketOraclePage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard')
  const [aiPicks, setAiPicks] = useState<StockPick[]>([])
  const [portfolio, setPortfolio] = useState<PortfolioPosition[]>([])
  const [watchlist, setWatchlist] = useState<string[]>(['AAPL', 'TSLA', 'NVDA', 'GOOGL', 'MSFT'])
  const [marketStatus, setMarketStatus] = useState<'open' | 'closed' | 'pre' | 'post'>('closed')
  const [userEmail, setUserEmail] = useState('roy@craudioviz.ai')

  // Market stats
  const [marketStats, setMarketStats] = useState({
    sp500: { value: 6023.45, change: 0.82 },
    nasdaq: { value: 19872.33, change: 1.24 },
    dow: { value: 43256.78, change: 0.45 },
    vix: { value: 14.23, change: -2.1 }
  })

  // Load AI picks
  useEffect(() => {
    // Demo AI picks
    const demoPicks: StockPick[] = [
      { symbol: 'NVDA', name: 'NVIDIA Corporation', score: 92, signal: 'strong_buy', currentPrice: 485.50, targetPrice: 580, upside: 19.5, confidence: 88, generatedAt: new Date().toISOString() },
      { symbol: 'META', name: 'Meta Platforms', score: 85, signal: 'buy', currentPrice: 512.30, targetPrice: 600, upside: 17.1, confidence: 82, generatedAt: new Date().toISOString() },
      { symbol: 'AMZN', name: 'Amazon.com', score: 78, signal: 'buy', currentPrice: 186.20, targetPrice: 220, upside: 18.2, confidence: 79, generatedAt: new Date().toISOString() },
      { symbol: 'GOOGL', name: 'Alphabet Inc', score: 74, signal: 'buy', currentPrice: 176.80, targetPrice: 200, upside: 13.1, confidence: 75, generatedAt: new Date().toISOString() },
      { symbol: 'MSFT', name: 'Microsoft', score: 71, signal: 'hold', currentPrice: 428.50, targetPrice: 470, upside: 9.7, confidence: 72, generatedAt: new Date().toISOString() },
    ]
    setAiPicks(demoPicks)
  }, [])

  // Load portfolio
  useEffect(() => {
    const saved = localStorage.getItem('marketOracle_portfolio')
    if (saved) {
      setPortfolio(JSON.parse(saved))
    } else {
      // Demo portfolio
      setPortfolio([
        { symbol: 'AAPL', name: 'Apple Inc', shares: 50, avgCost: 145.00, currentPrice: 192.50, totalValue: 9625, gain: 2375, gainPercent: 32.76 },
        { symbol: 'NVDA', name: 'NVIDIA', shares: 20, avgCost: 280.00, currentPrice: 485.50, totalValue: 9710, gain: 4110, gainPercent: 73.39 },
        { symbol: 'TSLA', name: 'Tesla', shares: 30, avgCost: 220.00, currentPrice: 248.80, totalValue: 7464, gain: 864, gainPercent: 13.09 },
      ])
    }
  }, [])

  const totalValue = portfolio.reduce((sum, p) => sum + p.totalValue, 0)
  const totalGain = portfolio.reduce((sum, p) => sum + p.gain, 0)
  const totalCost = portfolio.reduce((sum, p) => sum + (p.avgCost * p.shares), 0)
  const portfolioStats = {
    totalValue,
    totalGain,
    totalCost,
    totalGainPercent: totalCost > 0 ? ((totalGain / totalCost) * 100) : 0,
  }

  const getSignalColor = (signal: string) => {
    const colors: Record<string, string> = {
      'strong_buy': 'bg-green-500 text-white',
      'buy': 'bg-lime-500 text-white',
      'hold': 'bg-yellow-500 text-gray-900',
      'sell': 'bg-orange-500 text-white',
      'strong_sell': 'bg-red-500 text-white',
    }
    return colors[signal] || 'bg-gray-500 text-white'
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500'
    if (score >= 60) return 'text-lime-500'
    if (score >= 40) return 'text-yellow-500'
    return 'text-red-500'
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'ai-picks', label: 'AI Picks', icon: Sparkles },
    { id: 'scoring', label: 'Score Stocks', icon: Brain },
    { id: 'alerts', label: 'Price Alerts', icon: Bell },
    { id: 'portfolio', label: 'Portfolio', icon: PieChart },
    { id: 'watchlist', label: 'Watchlist', icon: Star },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Market Oracle</h1>
                <p className="text-sm text-gray-500">AI-Powered Stock Analysis</p>
              </div>
            </div>
            
            {/* Market Status */}
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
                marketStatus === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
              }`}>
                <div className={`w-2 h-2 rounded-full ${marketStatus === 'open' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                Market {marketStatus === 'open' ? 'Open' : 'Closed'}
              </div>
            </div>
          </div>

          {/* Market Tickers */}
          <div className="flex gap-6 mt-4 overflow-x-auto pb-2">
            {[
              { name: 'S&P 500', ...marketStats.sp500 },
              { name: 'NASDAQ', ...marketStats.nasdaq },
              { name: 'DOW', ...marketStats.dow },
              { name: 'VIX', ...marketStats.vix },
            ].map(index => (
              <div key={index.name} className="flex items-center gap-2 whitespace-nowrap">
                <span className="text-sm text-gray-500">{index.name}</span>
                <span className="font-medium text-gray-900 dark:text-white">{index.value.toLocaleString()}</span>
                <span className={`text-sm flex items-center ${index.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {index.change >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                  {Math.abs(index.change)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ActiveTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Portfolio Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm">
                <p className="text-sm text-gray-500">Portfolio Value</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${portfolioStats.totalValue.toLocaleString()}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm">
                <p className="text-sm text-gray-500">Total Gain/Loss</p>
                <p className={`text-2xl font-bold ${portfolioStats.totalGain >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {portfolioStats.totalGain >= 0 ? '+' : ''}${portfolioStats.totalGain.toLocaleString()}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm">
                <p className="text-sm text-gray-500">Return</p>
                <p className={`text-2xl font-bold ${portfolioStats.totalGainPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {portfolioStats.totalGainPercent >= 0 ? '+' : ''}{portfolioStats.totalGainPercent.toFixed(2)}%
                </p>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm">
                <p className="text-sm text-gray-500">Active Alerts</p>
                <p className="text-2xl font-bold text-amber-500">3</p>
              </div>
            </div>

            {/* AI Picks Preview */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm">
              <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-500" />
                  Today's AI Picks
                </h2>
                <button onClick={() => setActiveTab('ai-picks')} className="text-sm text-blue-600">View All</button>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {aiPicks.slice(0, 3).map(pick => (
                  <div key={pick.symbol} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`text-2xl font-bold ${getScoreColor(pick.score)}`}>{pick.score}</div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{pick.symbol}</p>
                        <p className="text-sm text-gray-500">{pick.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getSignalColor(pick.signal)}`}>
                        {pick.signal.replace('_', ' ').toUpperCase()}
                      </span>
                      <p className="text-sm text-green-500 mt-1">+{pick.upside}% upside</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* AI Picks Tab */}
        {activeTab === 'ai-picks' && (
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800">
              <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-500" />
                AI Stock Picks
              </h2>
              <p className="text-sm text-gray-500">Updated daily at market open</p>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              {aiPicks.map((pick, index) => (
                <div key={pick.symbol} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center font-bold text-gray-500">
                        #{index + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg text-gray-900 dark:text-white">{pick.symbol}</span>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getSignalColor(pick.signal)}`}>
                            {pick.signal.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">{pick.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-3xl font-bold ${getScoreColor(pick.score)}`}>{pick.score}</div>
                      <p className="text-xs text-gray-500">{pick.confidence}% confidence</p>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Current</p>
                      <p className="font-medium">${pick.currentPrice}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Target</p>
                      <p className="font-medium">${pick.targetPrice}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Upside</p>
                      <p className="font-medium text-green-500">+{pick.upside}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Scoring Tab */}
        {activeTab === 'scoring' && (
          <AIStockScoring 
            onScoreUpdate={(score) => console.log('Score updated:', score)}
          />
        )}

        {/* Price Alerts Tab */}
        {activeTab === 'alerts' && (
          <PriceAlerts 
            userEmail={userEmail}
            onAlertTriggered={(alert) => console.log('Alert triggered:', alert)}
          />
        )}

        {/* Portfolio Tab */}
        {activeTab === 'portfolio' && (
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800">
              <h2 className="font-semibold text-gray-900 dark:text-white">My Portfolio</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="text-left p-4 text-sm font-medium text-gray-500">Symbol</th>
                    <th className="text-right p-4 text-sm font-medium text-gray-500">Shares</th>
                    <th className="text-right p-4 text-sm font-medium text-gray-500">Avg Cost</th>
                    <th className="text-right p-4 text-sm font-medium text-gray-500">Current</th>
                    <th className="text-right p-4 text-sm font-medium text-gray-500">Value</th>
                    <th className="text-right p-4 text-sm font-medium text-gray-500">Gain/Loss</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {portfolio.map(position => (
                    <tr key={position.symbol} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="p-4">
                        <p className="font-medium text-gray-900 dark:text-white">{position.symbol}</p>
                        <p className="text-sm text-gray-500">{position.name}</p>
                      </td>
                      <td className="p-4 text-right">{position.shares}</td>
                      <td className="p-4 text-right">${position.avgCost.toFixed(2)}</td>
                      <td className="p-4 text-right">${position.currentPrice.toFixed(2)}</td>
                      <td className="p-4 text-right font-medium">${position.totalValue.toLocaleString()}</td>
                      <td className={`p-4 text-right font-medium ${position.gain >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {position.gain >= 0 ? '+' : ''}${position.gain.toLocaleString()}
                        <br />
                        <span className="text-sm">({position.gainPercent >= 0 ? '+' : ''}{position.gainPercent.toFixed(2)}%)</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Watchlist Tab */}
        {activeTab === 'watchlist' && (
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-4">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Watchlist</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {watchlist.map(symbol => (
                <div key={symbol} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="font-bold text-gray-900 dark:text-white">{symbol}</p>
                  <p className="text-sm text-gray-500">Click to analyze</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
