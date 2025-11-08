'use client'

import { useState } from 'react'
import { Download, FileText, Table, Image } from 'lucide-react'

export default function ExportPage() {
  const [dateRange, setDateRange] = useState('all')
  const [includeReasoning, setIncludeReasoning] = useState(true)

  function exportCSV() {
    alert('Downloading CSV with all picks...')
  }

  function exportJSON() {
    alert('Downloading JSON with all picks...')
  }

  function exportPDF() {
    alert('Generating PDF report...')
  }

  return (
    <div className="space-y-8">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-4 flex items-center justify-center gap-4">
          <Download className="w-12 h-12 text-brand-cyan" />
          <span className="gradient-text">Export Data</span>
        </h1>
        <p className="text-xl text-slate-300">Download your AI stock picks in multiple formats</p>
      </div>

      <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
        <h3 className="text-xl font-bold mb-6">Export Options</h3>
        
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm text-slate-400 mb-2">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white"
            >
              <option value="all">All Time</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="reasoning"
              checked={includeReasoning}
              onChange={(e) => setIncludeReasoning(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="reasoning" className="text-sm text-slate-300">
              Include AI reasoning in export
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={exportCSV}
            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-3"
          >
            <Table className="w-6 h-6" />
            <div className="text-left">
              <div>Export CSV</div>
              <div className="text-xs opacity-80">Excel compatible</div>
            </div>
          </button>

          <button
            onClick={exportJSON}
            className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-3"
          >
            <FileText className="w-6 h-6" />
            <div className="text-left">
              <div>Export JSON</div>
              <div className="text-xs opacity-80">Developer friendly</div>
            </div>
          </button>

          <button
            onClick={exportPDF}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-3"
          >
            <Image className="w-6 h-6" />
            <div className="text-left">
              <div>Export PDF</div>
              <div className="text-xs opacity-80">Print ready</div>
            </div>
          </button>
        </div>
      </div>

      <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
        <h3 className="text-xl font-bold mb-4">What's Included</h3>
        <ul className="space-y-2 text-slate-300">
          <li className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-brand-cyan"></div>
            All AI stock picks with entry and target prices
          </li>
          <li className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-brand-cyan"></div>
            Confidence scores for each pick
          </li>
          <li className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-brand-cyan"></div>
            AI model attribution
          </li>
          <li className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-brand-cyan"></div>
            Pick dates and timestamps
          </li>
          <li className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-brand-cyan"></div>
            Detailed reasoning (if enabled)
          </li>
        </ul>
      </div>
    </div>
  )
}
