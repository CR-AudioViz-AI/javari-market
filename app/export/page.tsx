'use client';

import { useEffect, useState } from 'react';
import { 
  Download, FileText, Table, FileJson, FileSpreadsheet,
  Calendar, Filter, Check, HelpCircle, RefreshCw,
  TrendingUp, TrendingDown, Database, Copy, CheckCircle
} from 'lucide-react';
import { getPicks, getAIModels, type StockPick, type AIModel } from '@/lib/supabase';
import { JavariHelpButton } from '@/components/JavariWidget';

// Date range options
const DATE_RANGES = [
  { id: 'all', label: 'All Time', days: null },
  { id: '7d', label: 'Last 7 Days', days: 7 },
  { id: '30d', label: 'Last 30 Days', days: 30 },
  { id: '90d', label: 'Last 90 Days', days: 90 },
];

// Export format options
const EXPORT_FORMATS = [
  { id: 'csv', label: 'CSV', icon: Table, description: 'Comma-separated values for Excel/Sheets', extension: 'csv', mime: 'text/csv' },
  { id: 'json', label: 'JSON', icon: FileJson, description: 'Structured data for developers', extension: 'json', mime: 'application/json' },
  { id: 'tsv', label: 'TSV', icon: FileSpreadsheet, description: 'Tab-separated for easy pasting', extension: 'tsv', mime: 'text/tab-separated-values' },
];

export default function ExportPage() {
  const [picks, setPicks] = useState<StockPick[]>([]);
  const [aiModels, setAIModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Export options
  const [dateRange, setDateRange] = useState('all');
  const [selectedAI, setSelectedAI] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [includeReasoning, setIncludeReasoning] = useState(true);
  const [includeMetrics, setIncludeMetrics] = useState(true);
  
  // Load data
  useEffect(() => {
    loadData();
  }, []);
  
  async function loadData() {
    setLoading(true);
    try {
      const [picksData, modelsData] = await Promise.all([
        getPicks({ limit: 500 }),
        getAIModels(),
      ]);
      setPicks(picksData);
      setAIModels(modelsData);
    } catch (e) {
      console.error('Error:', e);
    }
    setLoading(false);
  }
  
  // Filter picks based on options
  const filteredPicks = picks.filter(pick => {
    // Date range filter
    if (dateRange !== 'all') {
      const range = DATE_RANGES.find(r => r.id === dateRange);
      if (range?.days) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - range.days);
        const pickDate = new Date(pick.pick_date || pick.created_at);
        if (pickDate < cutoff) return false;
      }
    }
    
    // AI filter
    if (selectedAI && pick.ai_model_id !== selectedAI) return false;
    
    // Category filter
    if (selectedCategory && pick.category !== selectedCategory) return false;
    
    return true;
  });
  
  // Generate export data
  const generateExportData = (format: string) => {
    const data = filteredPicks.map(pick => {
      const base: Record<string, any> = {
        ticker: pick.ticker,
        company: pick.company_name || '',
        ai_model: pick.ai_display_name || '',
        category: pick.category,
        direction: pick.direction,
        confidence: pick.confidence,
        entry_price: pick.entry_price,
        current_price: pick.current_price,
        target_price: pick.target_price,
        stop_loss: pick.stop_loss,
        change_percent: pick.price_change_percent?.toFixed(2) || '',
        status: pick.status,
        pick_date: pick.pick_date || pick.created_at,
      };
      
      if (includeReasoning) {
        base.reasoning = pick.reasoning_summary || pick.reasoning || '';
      }
      
      if (includeMetrics) {
        base.profit_loss_percent = pick.profit_loss_percent || '';
        base.points_earned = pick.points_earned || '';
        base.result = pick.result || '';
      }
      
      return base;
    });
    
    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    }
    
    if (format === 'csv' || format === 'tsv') {
      const separator = format === 'csv' ? ',' : '\t';
      const headers = Object.keys(data[0] || {});
      const rows = data.map(row => 
        headers.map(h => {
          const value = row[h]?.toString() || '';
          // Escape quotes and wrap in quotes if contains separator or quotes
          if (value.includes(separator) || value.includes('"') || value.includes('\n')) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(separator)
      );
      return [headers.join(separator), ...rows].join('\n');
    }
    
    return '';
  };
  
  // Download file
  const downloadExport = (format: typeof EXPORT_FORMATS[0]) => {
    setExporting(true);
    
    setTimeout(() => {
      const content = generateExportData(format.id);
      const blob = new Blob([content], { type: format.mime });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `market-oracle-picks-${new Date().toISOString().split('T')[0]}.${format.extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setExporting(false);
    }, 500);
  };
  
  // Copy to clipboard
  const copyToClipboard = async (format: string) => {
    const content = generateExportData(format);
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Copy failed:', e);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-3 flex items-center justify-center gap-3">
            <Download className="w-10 h-10 text-cyan-400" />
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Export Data
            </span>
            <JavariHelpButton topic="export data download" />
          </h1>
          <p className="text-gray-400">
            Download AI picks in CSV, JSON, or TSV format for analysis in your favorite tools.
          </p>
        </div>
        
        {/* Preview Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800 text-center">
            <div className="text-sm text-gray-400 mb-1">Total Available</div>
            <div className="text-2xl font-bold">{picks.length}</div>
          </div>
          <div className="bg-cyan-900/20 rounded-xl p-4 border border-cyan-800/30 text-center">
            <div className="text-sm text-gray-400 mb-1">After Filters</div>
            <div className="text-2xl font-bold text-cyan-400">{filteredPicks.length}</div>
          </div>
          <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800 text-center">
            <div className="text-sm text-gray-400 mb-1">AI Models</div>
            <div className="text-2xl font-bold">{aiModels.length}</div>
          </div>
        </div>
        
        {/* Filters */}
        <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800 mb-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Filter className="w-5 h-5 text-cyan-400" />
            Export Filters
          </h2>
          
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            {/* Date Range */}
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Date Range</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-cyan-500"
              >
                {DATE_RANGES.map(range => (
                  <option key={range.id} value={range.id}>{range.label}</option>
                ))}
              </select>
            </div>
            
            {/* AI Model */}
            <div>
              <label className="text-sm text-gray-400 mb-2 block">AI Model</label>
              <select
                value={selectedAI || ''}
                onChange={(e) => setSelectedAI(e.target.value || null)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-cyan-500"
              >
                <option value="">All AIs</option>
                {aiModels.map(ai => (
                  <option key={ai.id} value={ai.id}>{ai.display_name}</option>
                ))}
              </select>
            </div>
            
            {/* Category */}
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Category</label>
              <select
                value={selectedCategory || ''}
                onChange={(e) => setSelectedCategory(e.target.value || null)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-cyan-500"
              >
                <option value="">All Categories</option>
                <option value="regular">Stocks</option>
                <option value="penny">Penny Stocks</option>
                <option value="crypto">Crypto</option>
              </select>
            </div>
            
            {/* Options */}
            <div className="space-y-2">
              <label className="text-sm text-gray-400 mb-2 block">Include</label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeReasoning}
                  onChange={(e) => setIncludeReasoning(e.target.checked)}
                  className="w-4 h-4 rounded bg-gray-800 border-gray-700 text-cyan-500 focus:ring-cyan-500"
                />
                <span className="text-sm text-gray-300">AI Reasoning</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeMetrics}
                  onChange={(e) => setIncludeMetrics(e.target.checked)}
                  className="w-4 h-4 rounded bg-gray-800 border-gray-700 text-cyan-500 focus:ring-cyan-500"
                />
                <span className="text-sm text-gray-300">Performance Metrics</span>
              </label>
            </div>
          </div>
        </div>
        
        {/* Export Formats */}
        <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800 mb-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            Export Format
          </h2>
          
          <div className="grid gap-4">
            {EXPORT_FORMATS.map(format => (
              <div 
                key={format.id}
                className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-gray-700 hover:border-gray-600 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
                    <format.icon className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    <div className="font-semibold">{format.label}</div>
                    <div className="text-sm text-gray-400">{format.description}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => copyToClipboard(format.id)}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
                    title="Copy to clipboard"
                  >
                    {copied ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    Copy
                  </button>
                  <button
                    onClick={() => downloadExport(format)}
                    disabled={exporting || filteredPicks.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg font-medium transition-colors"
                  >
                    {exporting ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {filteredPicks.length === 0 && (
            <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-800/50 rounded-lg text-sm text-yellow-200">
              No picks match your current filters. Adjust filters to export data.
            </div>
          )}
        </div>
        
        {/* Preview */}
        <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Database className="w-5 h-5 text-cyan-400" />
            Data Preview
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-2 px-3 text-gray-400 font-medium">Ticker</th>
                  <th className="text-left py-2 px-3 text-gray-400 font-medium">AI</th>
                  <th className="text-left py-2 px-3 text-gray-400 font-medium">Entry</th>
                  <th className="text-left py-2 px-3 text-gray-400 font-medium">Current</th>
                  <th className="text-left py-2 px-3 text-gray-400 font-medium">Change</th>
                </tr>
              </thead>
              <tbody>
                {filteredPicks.slice(0, 5).map(pick => (
                  <tr key={pick.id} className="border-b border-gray-800/50">
                    <td className="py-2 px-3 font-medium">{pick.ticker}</td>
                    <td className="py-2 px-3 text-gray-400">{pick.ai_display_name}</td>
                    <td className="py-2 px-3">${pick.entry_price?.toFixed(2)}</td>
                    <td className="py-2 px-3">${pick.current_price?.toFixed(2) || '—'}</td>
                    <td className={`py-2 px-3 ${(pick.price_change_percent || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {(pick.price_change_percent || 0) >= 0 ? '+' : ''}{(pick.price_change_percent || 0).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredPicks.length > 5 && (
              <p className="text-sm text-gray-500 mt-2 text-center">
                ...and {filteredPicks.length - 5} more picks
              </p>
            )}
          </div>
        </div>
        
        {/* Help */}
        <div className="mt-8 bg-gray-900/50 rounded-xl p-6 border border-gray-800">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-cyan-400" />
            Export Tips
          </h3>
          <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-400">
            <div>
              <p className="font-medium text-white mb-2">CSV / TSV</p>
              <p>
                Best for Excel, Google Sheets, or any spreadsheet app. 
                CSV uses commas, TSV uses tabs as separators.
              </p>
            </div>
            <div>
              <p className="font-medium text-white mb-2">JSON</p>
              <p>
                Best for developers and data analysis tools like Python/R. 
                Includes full structured data with nested fields.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
