'use client'

import { useState } from 'react'
import { Calculator, DollarSign, Calendar } from 'lucide-react'

export function TaxCalculator() {
  const [gains, setGains] = useState(0)
  const [holdingPeriod, setHoldingPeriod] = useState<'short' | 'long'>('short')
  const [income, setIncome] = useState(75000)
  const [filingStatus, setFilingStatus] = useState<'single' | 'married'>('single')

  // Simplified tax brackets (2024)
  const getTaxRate = () => {
    if (holdingPeriod === 'long') {
      if (filingStatus === 'single') {
        if (income <= 44625) return 0
        if (income <= 492300) return 15
        return 20
      } else {
        if (income <= 89250) return 0
        if (income <= 553850) return 15
        return 20
      }
    } else {
      if (filingStatus === 'single') {
        if (income <= 11000) return 10
        if (income <= 44725) return 12
        if (income <= 95375) return 22
        if (income <= 182100) return 24
        if (income <= 231250) return 32
        if (income <= 578125) return 35
        return 37
      } else {
        if (income <= 22000) return 10
        if (income <= 89075) return 12
        if (income <= 190750) return 22
        if (income <= 364200) return 24
        if (income <= 462500) return 32
        if (income <= 693750) return 35
        return 37
      }
    }
  }

  const taxRate = getTaxRate()
  const taxOwed = gains * (taxRate / 100)
  const afterTax = gains - taxOwed

  return (
    <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
      <div className="flex items-center gap-3 mb-6">
        <Calculator className="w-6 h-6 text-green-400" />
        <h3 className="text-xl font-bold">Capital Gains Tax Calculator</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="text-sm text-slate-400 mb-2 block">Total Gains/Losses</label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="number"
              value={gains}
              onChange={(e) => setGains(parseFloat(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white"
            />
          </div>
        </div>

        <div>
          <label className="text-sm text-slate-400 mb-2 block">Annual Income</label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="number"
              value={income}
              onChange={(e) => setIncome(parseFloat(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white"
            />
          </div>
        </div>

        <div>
          <label className="text-sm text-slate-400 mb-2 block">Holding Period</label>
          <select
            value={holdingPeriod}
            onChange={(e) => setHoldingPeriod(e.target.value as 'short' | 'long')}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white"
          >
            <option value="short">Short-Term (&lt;1 year)</option>
            <option value="long">Long-Term (1+ years)</option>
          </select>
        </div>

        <div>
          <label className="text-sm text-slate-400 mb-2 block">Filing Status</label>
          <select
            value={filingStatus}
            onChange={(e) => setFilingStatus(e.target.value as 'single' | 'married')}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white"
          >
            <option value="single">Single</option>
            <option value="married">Married Filing Jointly</option>
          </select>
        </div>
      </div>

      {/* Results */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-slate-400 text-sm mb-1">Tax Rate</p>
            <p className="text-3xl font-bold text-red-400">{taxRate}%</p>
            <p className="text-xs text-slate-500 mt-1">{holdingPeriod === 'long' ? 'Long-term' : 'Short-term'}</p>
          </div>
          <div>
            <p className="text-slate-400 text-sm mb-1">Estimated Tax Owed</p>
            <p className="text-3xl font-bold text-red-400">${taxOwed.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-slate-400 text-sm mb-1">After-Tax Profit</p>
            <p className="text-3xl font-bold text-green-400">${afterTax.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <p className="text-sm font-semibold text-blue-400 mb-2">💡 Tax Optimization Tips:</p>
        <ul className="text-sm text-slate-300 space-y-1">
          <li>• Hold investments for 1+ year to qualify for lower long-term capital gains rates</li>
          <li>• Consider tax-loss harvesting to offset gains</li>
          <li>• Contribute to tax-advantaged accounts (IRA, 401k)</li>
          <li>• Consult a tax professional for personalized advice</li>
        </ul>
      </div>
    </div>
  )
}
