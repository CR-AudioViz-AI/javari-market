// app/stock/[symbol]/page.tsx
// Market Oracle - Comprehensive Stock Intelligence Page
// Created: December 22, 2025

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  TrendingUp, TrendingDown, Activity, AlertTriangle, 
  BarChart3, Users, Newspaper, Calendar, RefreshCw,
  ExternalLink, Building2, Globe, DollarSign
} from 'lucide-react';

interface StockData {
  symbol: string;
  timestamp: string;
  profile: {
    name: string;
    industry: string;
    sector: string | null;
    marketCap: number;
    logo: string;
    website: string;
    exchange: string;
  } | null;
  price: {
    current: number;
    change: number;
    changePercent: number;
    open: number;
    high: number;
    low: number;
    previousClose: number;
    volume: number;
    avgVolume: number;
  } | null;
  technicals: {
    rsi: number | null;
    rsiSignal: 'OVERSOLD' | 'NEUTRAL' | 'OVERBOUGHT';
    macd: {
      value: number;
      signal: number;
      histogram: number;
      trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    } | null;
    movingAverages: {
      sma50: number | null;
      sma200: number | null;
      priceVsSma50: 'ABOVE' | 'BELOW';
      priceVsSma200: 'ABOVE' | 'BELOW';
      goldenCross: boolean;
      deathCross: boolean;
    };
  };
  sentiment: {
    overall: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    score: number;
    news: { count: number; positive: number; negative: number };
    social: { reddit: number; twitter: number; trending: boolean };
    insiders: { signal: string; netBuying: boolean; recentTransactions: number };
    analysts: {
      consensus: string;
      score: number;
      totalAnalysts: number;
      distribution: {
        strongBuy: number;
        buy: number;
        hold: number;
        sell: number;
        strongSell: number;
      };
    } | null;
  };
  risk: {
    overallScore: number;
    riskLevel: string;
    factors: {
      volatility: number;
      liquidity: number;
      marketCap: number;
      newsVolatility: number;
      technicalRisk: number;
    };
    warnings: string[];
  };
  yearRange: {
    high: number;
    low: number;
    percentFromHigh: number;
    percentFromLow: number;
  };
  news: Array<{
    headline: string;
    summary: string;
    source: string;
    datetime: string;
    url: string;
  }>;
}

function formatNumber(num: number): string {
  if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
  return num.toFixed(2);
}

function formatPercent(num: number): string {
  const sign = num >= 0 ? '+' : '';
  return `${sign}${num.toFixed(2)}%`;
}

function getRiskColor(level: string): string {
  switch (level) {
    case 'LOW': return 'bg-green-500';
    case 'MODERATE': return 'bg-yellow-500';
    case 'HIGH': return 'bg-orange-500';
    case 'VERY_HIGH': return 'bg-red-500';
    case 'EXTREME': return 'bg-red-700';
    default: return 'bg-gray-500';
  }
}

function getSentimentColor(sentiment: string): string {
  switch (sentiment) {
    case 'BULLISH': return 'text-green-500';
    case 'BEARISH': return 'text-red-500';
    default: return 'text-yellow-500';
  }
}

export default function StockIntelligencePage({ 
  params 
}: { 
  params: { symbol: string } 
}) {
  const [data, setData] = useState<StockData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchSymbol, setSearchSymbol] = useState('');

  const fetchData = async (sym: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/stock/${sym.toUpperCase()}/intelligence`);
      if (!response.ok) {
        throw new Error('Stock not found');
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(params.symbol);
  }, [params.symbol]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchSymbol.trim()) {
      window.location.href = `/stock/${searchSymbol.toUpperCase()}`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-96">
            <RefreshCw className="w-12 h-12 animate-spin text-blue-500" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="bg-gray-800/50 border-red-500/50">
            <CardContent className="p-6 text-center">
              <AlertTriangle className="w-16 h-16 mx-auto text-red-500 mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Stock Not Found</h2>
              <p className="text-gray-400 mb-4">{error || 'Unable to load stock data'}</p>
              <form onSubmit={handleSearch} className="flex gap-2 max-w-md mx-auto">
                <Input
                  value={searchSymbol}
                  onChange={(e) => setSearchSymbol(e.target.value.toUpperCase())}
                  placeholder="Enter stock symbol..."
                  className="bg-gray-700 border-gray-600"
                />
                <Button type="submit">Search</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const priceChange = data.price?.change || 0;
  const isPositive = priceChange >= 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            {data.profile?.logo && (
              <img 
                src={data.profile.logo} 
                alt={data.profile.name} 
                className="w-16 h-16 rounded-xl bg-white p-1"
              />
            )}
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-white">{data.symbol}</h1>
                <Badge variant="outline" className="text-gray-400">
                  {data.profile?.exchange}
                </Badge>
              </div>
              <p className="text-gray-400">{data.profile?.name}</p>
              <p className="text-sm text-gray-500">{data.profile?.industry}</p>
            </div>
          </div>
          
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              value={searchSymbol}
              onChange={(e) => setSearchSymbol(e.target.value.toUpperCase())}
              placeholder="Search symbol..."
              className="w-32 bg-gray-800 border-gray-700"
            />
            <Button type="submit" variant="outline">
              Search
            </Button>
            <Button onClick={() => fetchData(data.symbol)} variant="outline">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </form>
        </div>

        {/* Price Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gray-800/50 border-gray-700 md:col-span-2">
            <CardContent className="p-6">
              <div className="flex items-baseline gap-4">
                <span className="text-5xl font-bold text-white">
                  ${data.price?.current.toFixed(2)}
                </span>
                <div className={`flex items-center gap-1 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                  {isPositive ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                  <span className="text-2xl font-semibold">
                    {formatPercent(data.price?.changePercent || 0)}
                  </span>
                  <span className="text-lg">
                    (${Math.abs(priceChange).toFixed(2)})
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-4 mt-6">
                <div>
                  <p className="text-gray-400 text-sm">Open</p>
                  <p className="text-white font-medium">${data.price?.open.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">High</p>
                  <p className="text-green-400 font-medium">${data.price?.high.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Low</p>
                  <p className="text-red-400 font-medium">${data.price?.low.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Prev Close</p>
                  <p className="text-white font-medium">${data.price?.previousClose.toFixed(2)}</p>
                </div>
              </div>

              {/* 52 Week Range */}
              <div className="mt-6">
                <p className="text-gray-400 text-sm mb-2">52 Week Range</p>
                <div className="relative h-2 bg-gray-700 rounded-full">
                  <div 
                    className="absolute h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full"
                    style={{ width: '100%' }}
                  />
                  <div 
                    className="absolute w-3 h-3 bg-white rounded-full -top-0.5 transform -translate-x-1/2"
                    style={{ 
                      left: `${((data.price?.current || 0) - data.yearRange.low) / 
                             (data.yearRange.high - data.yearRange.low) * 100}%` 
                    }}
                  />
                </div>
                <div className="flex justify-between mt-1 text-sm">
                  <span className="text-red-400">${data.yearRange.low.toFixed(2)}</span>
                  <span className="text-green-400">${data.yearRange.high.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Risk Card */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Risk Assessment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-4">
                <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${getRiskColor(data.risk.riskLevel)}`}>
                  <span className="text-2xl font-bold text-white">{data.risk.overallScore}</span>
                </div>
                <p className="text-white font-semibold mt-2">{data.risk.riskLevel}</p>
              </div>
              
              <div className="space-y-2">
                {Object.entries(data.risk.factors).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                    <span className="text-white">{value}</span>
                  </div>
                ))}
              </div>

              {data.risk.warnings.length > 0 && (
                <div className="mt-4 p-3 bg-red-500/20 rounded-lg">
                  {data.risk.warnings.map((warning, i) => (
                    <p key={i} className="text-red-400 text-sm">{warning}</p>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Technical Analysis & Sentiment */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Technical Analysis */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Technical Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* RSI */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-400">RSI (14)</span>
                  <span className={`font-medium ${
                    data.technicals.rsiSignal === 'OVERSOLD' ? 'text-green-500' :
                    data.technicals.rsiSignal === 'OVERBOUGHT' ? 'text-red-500' :
                    'text-yellow-500'
                  }`}>
                    {data.technicals.rsi?.toFixed(1) || 'N/A'} - {data.technicals.rsiSignal}
                  </span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full">
                  <div 
                    className={`h-full rounded-full ${
                      (data.technicals.rsi || 50) < 30 ? 'bg-green-500' :
                      (data.technicals.rsi || 50) > 70 ? 'bg-red-500' :
                      'bg-yellow-500'
                    }`}
                    style={{ width: `${data.technicals.rsi || 50}%` }}
                  />
                </div>
              </div>

              {/* MACD */}
              {data.technicals.macd && (
                <div className="flex justify-between">
                  <span className="text-gray-400">MACD</span>
                  <span className={`font-medium ${
                    data.technicals.macd.trend === 'BULLISH' ? 'text-green-500' :
                    data.technicals.macd.trend === 'BEARISH' ? 'text-red-500' :
                    'text-yellow-500'
                  }`}>
                    {data.technicals.macd.trend}
                  </span>
                </div>
              )}

              {/* Moving Averages */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-700/50 rounded-lg">
                  <p className="text-gray-400 text-sm">SMA 50</p>
                  <p className="text-white font-medium">
                    ${data.technicals.movingAverages.sma50?.toFixed(2) || 'N/A'}
                  </p>
                  <p className={`text-sm ${
                    data.technicals.movingAverages.priceVsSma50 === 'ABOVE' 
                      ? 'text-green-500' : 'text-red-500'
                  }`}>
                    Price {data.technicals.movingAverages.priceVsSma50}
                  </p>
                </div>
                <div className="p-3 bg-gray-700/50 rounded-lg">
                  <p className="text-gray-400 text-sm">SMA 200</p>
                  <p className="text-white font-medium">
                    ${data.technicals.movingAverages.sma200?.toFixed(2) || 'N/A'}
                  </p>
                  <p className={`text-sm ${
                    data.technicals.movingAverages.priceVsSma200 === 'ABOVE' 
                      ? 'text-green-500' : 'text-red-500'
                  }`}>
                    Price {data.technicals.movingAverages.priceVsSma200}
                  </p>
                </div>
              </div>

              {/* Golden/Death Cross */}
              {data.technicals.movingAverages.goldenCross && (
                <Badge className="bg-green-500/20 text-green-400">
                  🌟 Golden Cross - Bullish Signal
                </Badge>
              )}
              {data.technicals.movingAverages.deathCross && (
                <Badge className="bg-red-500/20 text-red-400">
                  💀 Death Cross - Bearish Signal
                </Badge>
              )}
            </CardContent>
          </Card>

          {/* Sentiment Analysis */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Sentiment Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Overall Sentiment */}
              <div className="text-center p-4 bg-gray-700/50 rounded-lg">
                <p className={`text-3xl font-bold ${getSentimentColor(data.sentiment.overall)}`}>
                  {data.sentiment.overall}
                </p>
                <p className="text-gray-400">Score: {data.sentiment.score}</p>
              </div>

              {/* News Sentiment */}
              <div>
                <p className="text-gray-400 mb-2">News Sentiment</p>
                <div className="flex gap-4">
                  <div className="flex-1 p-2 bg-green-500/20 rounded text-center">
                    <p className="text-green-400 font-bold">{data.sentiment.news.positive}</p>
                    <p className="text-xs text-gray-400">Positive</p>
                  </div>
                  <div className="flex-1 p-2 bg-red-500/20 rounded text-center">
                    <p className="text-red-400 font-bold">{data.sentiment.news.negative}</p>
                    <p className="text-xs text-gray-400">Negative</p>
                  </div>
                  <div className="flex-1 p-2 bg-gray-600/50 rounded text-center">
                    <p className="text-white font-bold">{data.sentiment.news.count}</p>
                    <p className="text-xs text-gray-400">Total</p>
                  </div>
                </div>
              </div>

              {/* Social Sentiment */}
              <div>
                <p className="text-gray-400 mb-2">Social Media</p>
                <div className="flex gap-4">
                  <div className="flex-1 p-2 bg-orange-500/20 rounded text-center">
                    <p className="text-orange-400 font-bold">{data.sentiment.social.reddit}</p>
                    <p className="text-xs text-gray-400">Reddit</p>
                  </div>
                  <div className="flex-1 p-2 bg-blue-500/20 rounded text-center">
                    <p className="text-blue-400 font-bold">{data.sentiment.social.twitter}</p>
                    <p className="text-xs text-gray-400">Twitter</p>
                  </div>
                </div>
                {data.sentiment.social.trending && (
                  <Badge className="mt-2 bg-purple-500/20 text-purple-400">
                    🔥 Trending on Social Media
                  </Badge>
                )}
              </div>

              {/* Analyst Ratings */}
              {data.sentiment.analysts && (
                <div>
                  <p className="text-gray-400 mb-2">Analyst Consensus</p>
                  <div className="flex items-center gap-2">
                    <Badge className={
                      data.sentiment.analysts.consensus.includes('BUY') 
                        ? 'bg-green-500' : 
                      data.sentiment.analysts.consensus.includes('SELL')
                        ? 'bg-red-500' : 'bg-yellow-500'
                    }>
                      {data.sentiment.analysts.consensus}
                    </Badge>
                    <span className="text-gray-400 text-sm">
                      ({data.sentiment.analysts.totalAnalysts} analysts)
                    </span>
                  </div>
                </div>
              )}

              {/* Insider Activity */}
              <div className="p-3 bg-gray-700/50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Insider Activity</span>
                  <Badge className={
                    data.sentiment.insiders.netBuying 
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  }>
                    {data.sentiment.insiders.netBuying ? 'Net Buying' : 'Net Selling'}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {data.sentiment.insiders.recentTransactions} recent transactions
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Company Info & News */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Company Info */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Company Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Market Cap</span>
                <span className="text-white font-medium">
                  ${formatNumber(data.profile?.marketCap || 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Sector</span>
                <span className="text-white">{data.profile?.sector || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Industry</span>
                <span className="text-white">{data.profile?.industry || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Exchange</span>
                <span className="text-white">{data.profile?.exchange || 'N/A'}</span>
              </div>
              {data.profile?.website && (
                <a 
                  href={data.profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-400 hover:text-blue-300"
                >
                  <Globe className="w-4 h-4" />
                  Visit Website
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </CardContent>
          </Card>

          {/* Recent News */}
          <Card className="bg-gray-800/50 border-gray-700 md:col-span-2">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Newspaper className="w-5 h-5" />
                Recent News
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {data.news.length > 0 ? data.news.map((article, i) => (
                  <a
                    key={i}
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <h4 className="text-white font-medium line-clamp-2">
                      {article.headline}
                    </h4>
                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-400">
                      <span>{article.source}</span>
                      <span>•</span>
                      <span>{new Date(article.datetime).toLocaleDateString()}</span>
                    </div>
                  </a>
                )) : (
                  <p className="text-gray-400 text-center py-4">No recent news available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
