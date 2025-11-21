'use client'

import { useState } from 'react'
import { Shield, AlertTriangle, CheckCircle, DollarSign } from 'lucide-react'

export function RiskCalculator() {
  const [portfolioValue, setPortfolioValue] = useState(10000)
  const [riskPercent, setRiskPercent] = useState(2)
  const [entryPrice, setEntryPrice] = useState(0)
  const [stopLoss, setStopLoss] = useState(0)

  const riskAmount = (portfolioValue * riskPercent) / 100
  const riskPerShare = entryPrice - stopLoss
  const positionSize = riskPerShare > 0 ? Math.floor(riskAmount / riskPerShare) : 0
  const totalInvestment = positionSize * entryPrice
  const riskLevel = riskPercent <= 1 ? 'conservative' : riskPercent <= 2 ? 'moderate' : 'aggressive'

  return (
    <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-6 h-6 text-brand-cyan" />
        <h3 className="text-xl font-bold">Smart Risk Calculator</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="text-sm text-slate-400 mb-2 block">Portfolio Value</label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="number"
              value={portfolioValue}
              onChange={(e) => setPortfolioValue(parseFloat(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white"
            />
          </div>
        </div>

        <div>
          <label className="text-sm text-slate-400 mb-2 block">Risk Per Trade (%)</label>
          <input
            type="number"
            value={riskPercent}
            onChange={(e) => setRiskPercent(parseFloat(e.target.value))}
            step="0.5"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white"
          />
          <p className="text-xs text-slate-500 mt-1">Recommended: 1-2%</p>
        </div>

        <div>
          <label className="text-sm text-slate-400 mb-2 block">Entry Price</label>
          <input
            type="number"
            value={entryPrice}
            onChange={(e) => setEntryPrice(parseFloat(e.target.value))}
            step="0.01"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white"
          />
        </div>

        <div>
          <label className="text-sm text-slate-400 mb-2 block">Stop Loss Price</label>
          <input
            type="number"
            value={stopLoss}
            onChange={(e) => setStopLoss(parseFloat(e.target.value))}
            step="0.01"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white"
          />
        </div>
      </div>

      {/* Results */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <p className="text-slate-400 text-sm mb-1">Position Size</p>
            <p className="text-3xl font-bold text-brand-cyan">{positionSize} shares</p>
          </div>
          <div>
            <p className="text-slate-400 text-sm mb-1">Total Investment</p>
            <p className="text-3xl font-bold text-white">${totalInvestment.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-slate-400 text-sm mb-1">Max Risk</p>
            <p className="text-3xl font-bold text-red-400">${riskAmount.toFixed(2)}</p>
          </div>
        </div>

        <div className={`p-4 rounded-lg flex items-center gap-3 ${
          riskLevel === 'conservative' ? 'bg-green-500/20 border border-green-500/30' :
          riskLevel === 'moderate' ? 'bg-yellow-500/20 border border-yellow-500/30' :
          'bg-red-500/20 border border-red-500/30'
        }`}>
          {riskLevel === 'conservative' ? <CheckCircle className="w-5 h-5 text-green-400" /> :
           riskLevel === 'moderate' ? <AlertTriangle className="w-5 h-5 text-yellow-400" /> :
           <AlertTriangle className="w-5 h-5 text-red-400" />}
          <div>
            <p className="font-semibold capitalize">{riskLevel} Risk Profile</p>
            <p className="text-sm text-slate-300">
              {riskLevel === 'conservative' ? 'Excellent! You\'re protecting your capital.' :
               riskLevel === 'moderate' ? 'Good balance of risk and reward.' :
               'High risk! Consider reducing position size.'}
            </p>
          </div>
        </div>
      </div>

      {/* Pro Tips */}
      <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <p className="text-sm font-semibold text-blue-400 mb-2">💡 Pro Tips:</p>
        <ul className="text-sm text-slate-300 space-y-1">
          <li>• Never risk more than 2% of your portfolio on a single trade</li>
          <li>• Always set stop losses before entering a position</li>
          <li>• Size your positions based on risk, not emotion</li>
          <li>• Diversify across multiple stocks to reduce portfolio risk</li>
        </ul>
      </div>
    </div>
  )
}
