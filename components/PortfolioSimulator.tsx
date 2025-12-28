'use client'

import { useState } from 'react'
import {
  Wallet, TrendingUp, TrendingDown, Plus, Minus, RefreshCw,
  Target, PieChart, BarChart3, DollarSign, Percent, Clock,
  ArrowUpRight, ArrowDownRight, Sparkles, AlertTriangle, Info
} from 'lucide-react'

interface Position {
  id: string
  symbol: string
  name: string
  shares: number
  avgCost: number
  currentPrice: number
  value: number
  gain: number
  gainPercent: number
  allocation: number
}

interface PortfolioStats {
  totalValue: number
  totalCost: number
  totalGain: number
  totalGainPercent: number
  dayChange: number
  dayChangePercent: number
}

const DEMO_POSITIONS: Position[] = [
  { id: '1', symbol: 'NVDA', name: 'NVIDIA', shares: 50, avgCost: 450, currentPrice: 495.22, value: 24761, gain: 2261, gainPercent: 10.05, allocation: 35 },
  { id: '2', symbol: 'AAPL', name: 'Apple', shares: 100, avgCost: 175, currentPrice: 193.15, value: 19315, gain: 1815, gainPercent: 10.37, allocation: 27 },
  { id: '3', symbol: 'MSFT', name: 'Microsoft', shares: 30, avgCost: 350, currentPrice: 375.28, value: 11258, gain: 758, gainPercent: 7.22, allocation: 16 },
  { id: '4', symbol: 'GOOGL', name: 'Alphabet', shares: 40, avgCost: 140, currentPrice: 141.80, value: 5672, gain: 72, gainPercent: 1.29, allocation: 8 },
  { id: '5', symbol: 'TSLA', name: 'Tesla', shares: 25, avgCost: 260, currentPrice: 248.50, value: 6212, gain: -288, gainPercent: -4.42, allocation: 9 },
  { id: '6', symbol: 'BTC', name: 'Bitcoin', shares: 0.1, avgCost: 40000, currentPrice: 42850, value: 4285, gain: 285, gainPercent: 7.13, allocation: 5 },
]

export default function PortfolioSimulator() {
  const [positions, setPositions] = useState<Position[]>(DEMO_POSITIONS)
  const [initialCapital, setInitialCapital] = useState(50000)
  const [showAddPosition, setShowAddPosition] = useState(false)
  const [simulationMode, setSimulationMode] = useState<'conservative' | 'moderate' | 'aggressive'>('moderate')

  const stats: PortfolioStats = {
    totalValue: positions.reduce((sum, p) => sum + p.value, 0),
    totalCost: positions.reduce((sum, p) => sum + (p.shares * p.avgCost), 0),
    totalGain: positions.reduce((sum, p) => sum + p.gain, 0),
    totalGainPercent: 0,
    dayChange: 1250.45,
    dayChangePercent: 1.78
  }
  stats.totalGainPercent = (stats.totalGain / stats.totalCost) * 100

  const projectedReturns = {
    conservative: { monthly: 0.5, yearly: 6, fiveYear: 34 },
    moderate: { monthly: 1.2, yearly: 15, fiveYear: 101 },
    aggressive: { monthly: 2.5, yearly: 35, fiveYear: 285 }
  }

  const currentProjection = projectedReturns[simulationMode]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-900 rounded-xl border border-gray-700 p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Portfolio Simulator</h1>
              <p className="text-sm text-gray-400">Track, analyze, and project your investments</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddPosition(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg"
          >
            <Plus className="w-4 h-4" />
            Add Position
          </button>
        </div>
      </div>

      {/* Portfolio Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 rounded-xl border border-gray-700 p-4">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <Wallet className="w-4 h-4" />
            <span className="text-sm">Total Value</span>
          </div>
          <p className="text-2xl font-bold">${stats.totalValue.toLocaleString()}</p>
          <p className={`text-sm flex items-center gap-1 ${stats.dayChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {stats.dayChange >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            ${Math.abs(stats.dayChange).toLocaleString()} ({stats.dayChangePercent}%) today
          </p>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-700 p-4">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm">Total Gain</span>
          </div>
          <p className={`text-2xl font-bold ${stats.totalGain >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {stats.totalGain >= 0 ? '+' : ''}${stats.totalGain.toLocaleString()}
          </p>
          <p className={`text-sm ${stats.totalGainPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {stats.totalGainPercent >= 0 ? '+' : ''}{stats.totalGainPercent.toFixed(2)}% all time
          </p>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-700 p-4">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <DollarSign className="w-4 h-4" />
            <span className="text-sm">Cost Basis</span>
          </div>
          <p className="text-2xl font-bold">${stats.totalCost.toLocaleString()}</p>
          <p className="text-sm text-gray-500">{positions.length} positions</p>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-700 p-4">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <Target className="w-4 h-4" />
            <span className="text-sm">1Y Projection</span>
          </div>
          <p className="text-2xl font-bold text-purple-400">
            ${Math.round(stats.totalValue * (1 + currentProjection.yearly / 100)).toLocaleString()}
          </p>
          <p className="text-sm text-purple-400">+{currentProjection.yearly}% ({simulationMode})</p>
        </div>
      </div>

      {/* Simulation Mode */}
      <div className="bg-gray-900 rounded-xl border border-gray-700 p-4">
        <h3 className="font-semibold mb-4">Growth Projection Mode</h3>
        <div className="grid grid-cols-3 gap-4">
          {(['conservative', 'moderate', 'aggressive'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setSimulationMode(mode)}
              className={`p-4 rounded-xl border text-left transition-all ${
                simulationMode === mode
                  ? 'bg-purple-500/20 border-purple-500'
                  : 'bg-gray-800 border-gray-700 hover:border-gray-600'
              }`}
            >
              <p className="font-medium capitalize mb-2">{mode}</p>
              <div className="space-y-1 text-sm">
                <p className="text-gray-400">Monthly: <span className="text-white">+{projectedReturns[mode].monthly}%</span></p>
                <p className="text-gray-400">Yearly: <span className="text-white">+{projectedReturns[mode].yearly}%</span></p>
                <p className="text-gray-400">5 Year: <span className="text-green-400">+{projectedReturns[mode].fiveYear}%</span></p>
              </div>
            </button>
          ))}
        </div>
        <div className="mt-4 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
          <div className="flex items-start gap-2">
            <Sparkles className="w-5 h-5 text-purple-400 mt-0.5" />
            <div>
              <p className="font-medium text-purple-300">AI-Powered Projection</p>
              <p className="text-sm text-gray-400">
                Based on {simulationMode} strategy, your portfolio could reach 
                <span className="text-purple-400 font-medium"> ${Math.round(stats.totalValue * (1 + currentProjection.fiveYear / 100)).toLocaleString()}</span> in 5 years.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Positions Table */}
      <div className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-700">
          <h3 className="font-semibold">Holdings</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800">
              <tr>
                <th className="text-left p-4 text-sm text-gray-400">Asset</th>
                <th className="text-right p-4 text-sm text-gray-400">Shares</th>
                <th className="text-right p-4 text-sm text-gray-400">Price</th>
                <th className="text-right p-4 text-sm text-gray-400">Value</th>
                <th className="text-right p-4 text-sm text-gray-400">Gain/Loss</th>
                <th className="text-right p-4 text-sm text-gray-400">Allocation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {positions.map(position => (
                <tr key={position.id} className="hover:bg-gray-800/50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        position.gainPercent >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'
                      }`}>
                        <span className="font-bold text-sm">{position.symbol.slice(0, 2)}</span>
                      </div>
                      <div>
                        <p className="font-medium">{position.symbol}</p>
                        <p className="text-sm text-gray-400">{position.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-right">{position.shares}</td>
                  <td className="p-4 text-right">${position.currentPrice.toLocaleString()}</td>
                  <td className="p-4 text-right font-medium">${position.value.toLocaleString()}</td>
                  <td className={`p-4 text-right ${position.gain >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    <p>{position.gain >= 0 ? '+' : ''}${position.gain.toLocaleString()}</p>
                    <p className="text-sm">{position.gainPercent >= 0 ? '+' : ''}{position.gainPercent.toFixed(2)}%</p>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full" style={{ width: `${position.allocation}%` }} />
                      </div>
                      <span className="text-sm">{position.allocation}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
