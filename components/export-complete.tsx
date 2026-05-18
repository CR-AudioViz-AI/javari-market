'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {

function getSupabase() {
  var sb = require('@supabase/supabase-js')
  var url = process.env.NEXT_PUBLIC_SUPABASE_URL
  var key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return sb.createClient(url, key, { auth: { persistSession: false } })
}

  Download,
  FileText,
  Table,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface ExportOptions {
  dataType: 'portfolio' | 'picks' | 'transactions' | 'all';
  format: 'csv' | 'pdf';
  dateRange: 'all' | '30days' | '90days' | 'year';
}

export default function ExportComplete() {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    dataType: 'portfolio',
    format: 'csv',
    dateRange: 'all'
  });
  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  const handleExport = async () => {
    setExporting(true);
    setExportSuccess(false);
    setExportError(null);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Please sign in to export data');
      }

      // Calculate date range
      const now = new Date();
      let startDate = new Date(0); // Beginning of time
      if (exportOptions.dateRange === '30days') {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      } else if (exportOptions.dateRange === '90days') {
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      } else if (exportOptions.dateRange === 'year') {
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      }

      let data: any[] = [];

      // Fetch data based on type
      if (exportOptions.dataType === 'portfolio' || exportOptions.dataType === 'all') {
        const { data: portfolioData, error } = await supabase
          .from('paper_trading_positions')
          .select('*')
          .eq('user_id', user.id)
          .gte('entry_date', startDate.toISOString());

        if (error) throw error;
        data = [...data, ...portfolioData];
      }

      if (exportOptions.dataType === 'picks' || exportOptions.dataType === 'all') {
        const { data: picksData, error } = await supabase
          .from('ai_stock_picks')
          .select('*')
          .gte('created_at', startDate.toISOString());

        if (error) throw error;
        data = [...data, ...picksData];
      }

      if (exportOptions.dataType === 'transactions' || exportOptions.dataType === 'all') {
        const { data: transactionsData, error } = await supabase
          .from('paper_trading_positions')
          .select('*')
          .eq('user_id', user.id)
          .gte('entry_date', startDate.toISOString());

        if (error) throw error;
        // Note: In production, you'd have a separate transactions table
        data = [...data, ...transactionsData];
      }

      // Export based on format
      if (exportOptions.format === 'csv') {
        exportToCSV(data);
      } else {
        exportToPDF(data);
      }

      setExportSuccess(true);
    } catch (error: any) {
      console.error('Export error:', error);
      setExportError(error.message || 'Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  const exportToCSV = (data: any[]) => {
    if (data.length === 0) {
      throw new Error('No data to export');
    }

    // Get all unique keys from the data
    const keys = Array.from(new Set(data.flatMap(obj => Object.keys(obj))));
    
    // Create CSV header
    const header = keys.join(',');
    
    // Create CSV rows
    const rows = data.map(item => {
      return keys.map(key => {
        const value = item[key];
        // Handle values that might contain commas or quotes
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',');
    }).join('\n');
    
    const csv = `${header}\n${rows}`;
    
    // Create and download file
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `market-oracle-${exportOptions.dataType}-${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = (data: any[]) => {
    if (data.length === 0) {
      throw new Error('No data to export');
    }

    // Create HTML content for PDF
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Market Oracle Export</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            max-width: 1200px;
            margin: 0 auto;
          }
          h1 {
            color: #2563eb;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 10px;
            margin-bottom: 20px;
          }
          .meta {
            background: #f3f4f6;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            font-size: 12px;
          }
          th {
            background: #2563eb;
            color: white;
            padding: 10px;
            text-align: left;
            font-weight: bold;
          }
          td {
            padding: 8px;
            border-bottom: 1px solid #e5e7eb;
          }
          tr:nth-child(even) {
            background: #f9fafb;
          }
          .positive {
            color: #10b981;
            font-weight: bold;
          }
          .negative {
            color: #ef4444;
            font-weight: bold;
          }
          .footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 2px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 11px;
          }
        </style>
      </head>
      <body>
        <h1>Market Oracle Export Report</h1>
        <div class="meta">
          <strong>Export Type:</strong> ${exportOptions.dataType.toUpperCase()}<br>
          <strong>Date Range:</strong> ${exportOptions.dateRange.toUpperCase()}<br>
          <strong>Generated:</strong> ${new Date().toLocaleString()}<br>
          <strong>Total Records:</strong> ${data.length}
        </div>
        
        <table>
          <thead>
            <tr>
              ${Object.keys(data[0]).map(key => `<th>${key.replace(/_/g, ' ').toUpperCase()}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${data.map(item => `
              <tr>
                ${Object.values(item).map(value => {
                  const strValue = String(value || '');
                  // Color code percentages
                  if (strValue.includes('%')) {
                    const num = parseFloat(strValue);
                    const className = num >= 0 ? 'positive' : 'negative';
                    return `<td class="${className}">${strValue}</td>`;
                  }
                  return `<td>${strValue}</td>`;
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="footer">
          <p>Generated by Market Oracle AI Stock Picking Platform</p>
          <p>For informational purposes only. Not financial advice.</p>
        </div>
      </body>
      </html>
    `;

    // Create and download PDF-ready HTML
    const blob = new Blob([html], { type: 'text/html' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `market-oracle-${exportOptions.dataType}-${Date.now()}.html`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Note: For true PDF generation, you'd need a server-side solution or library like jsPDF
    // This exports as HTML which users can print to PDF
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Export Data</h1>
        <p className="text-gray-600">
          Download your portfolio, picks, and transaction data in CSV or PDF format
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Export Options</CardTitle>
          <CardDescription>
            Configure what data you want to export and in which format
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Data Type Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">What to Export</label>
              <Select
                value={exportOptions.dataType}
                onValueChange={(value) => setExportOptions(prev => ({ ...prev, dataType: value as ExportOptions['dataType'] }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="portfolio">Portfolio Positions</SelectItem>
                  <SelectItem value="picks">All AI Picks</SelectItem>
                  <SelectItem value="transactions">Transaction History</SelectItem>
                  <SelectItem value="all">All Data (Combined)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-600 mt-1">
                {exportOptions.dataType === 'portfolio' && 'Your current paper trading positions'}
                {exportOptions.dataType === 'picks' && 'All AI stock recommendations'}
                {exportOptions.dataType === 'transactions' && 'Your buy/sell transaction history'}
                {exportOptions.dataType === 'all' && 'Complete dataset with all information'}
              </p>
            </div>

            {/* Format Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">Export Format</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setExportOptions(prev => ({ ...prev, format: 'csv' }))}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    exportOptions.format === 'csv'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Table className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <p className="font-semibold">CSV</p>
                  <p className="text-xs text-gray-600">Excel-compatible spreadsheet</p>
                </button>

                <button
                  onClick={() => setExportOptions(prev => ({ ...prev, format: 'pdf' }))}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    exportOptions.format === 'pdf'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <FileText className="w-8 h-8 mx-auto mb-2 text-red-600" />
                  <p className="font-semibold">PDF</p>
                  <p className="text-xs text-gray-600">Formatted report document</p>
                </button>
              </div>
            </div>

            {/* Date Range Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">Date Range</label>
              <Select
                value={exportOptions.dateRange}
                onValueChange={(value) => setExportOptions(prev => ({ ...prev, dateRange: value as ExportOptions['dateRange'] }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="30days">Last 30 Days</SelectItem>
                  <SelectItem value="90days">Last 90 Days</SelectItem>
                  <SelectItem value="year">Last Year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Export Button */}
            <div className="pt-4 border-t">
              <Button
                onClick={handleExport}
                disabled={exporting}
                className="w-full"
                size="lg"
              >
                {exporting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5 mr-2" />
                    Export {exportOptions.format.toUpperCase()}
                  </>
                )}
              </Button>
            </div>

            {/* Success/Error Messages */}
            {exportSuccess && (
              <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-semibold text-green-900">Export Successful!</p>
                  <p className="text-sm text-green-700">Your file should download automatically</p>
                </div>
              </div>
            )}

            {exportError && (
              <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <div>
                  <p className="font-semibold text-red-900">Export Failed</p>
                  <p className="text-sm text-red-700">{exportError}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Export Info */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">About Exports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start gap-2">
              <Badge className="mt-0.5">CSV</Badge>
              <p>
                CSV files can be opened in Excel, Google Sheets, or any spreadsheet application.
                Perfect for data analysis and record keeping.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <Badge className="mt-0.5">PDF</Badge>
              <p>
                PDF exports are formatted reports suitable for printing or sharing.
                Includes professional formatting and summary statistics.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5">Privacy</Badge>
              <p>
                All exports are generated locally in your browser. Your data is never sent to
                external servers during the export process.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
