'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Newspaper, TrendingUp, TrendingDown, Minus, RefreshCw, ExternalLink, Filter, Search, Clock } from 'lucide-react';

interface NewsArticle {
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
  sentiment: number;
  sentimentLabel: string;
  tickers: string[];
  keywords: string[];
}

interface NewsData {
  articles: NewsArticle[];
  trendingTickers: Array<{ ticker: string; mentions: number }>;
  trendingKeywords: Array<{ keyword: string; count: number }>;
  overallSentiment: { score: number; label: string };
  sourceBreakdown: Record<string, number>;
}

export default function NewsFeedPage() {
  const [data, setData] = useState<NewsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'bullish' | 'bearish'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { loadNews(); }, []);

  async function loadNews(query?: string) {
    setLoading(true);
    try {
      const url = query ? `/api/news?q=${encodeURIComponent(query)}` : '/api/news';
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) setData(json);
    } catch (error) { console.error('Error:', error); }
    setLoading(false);
  }

  const filteredArticles = data?.articles.filter(a => {
    if (filter === 'bullish') return a.sentiment > 0.2;
    if (filter === 'bearish') return a.sentiment < -0.2;
    return true;
  }) || [];

  const getSentimentColor = (sentiment: number) => {
    if (sentiment > 0.3) return 'text-green-400';
    if (sentiment > 0.1) return 'text-green-300';
    if (sentiment < -0.3) return 'text-red-400';
    if (sentiment < -0.1) return 'text-red-300';
    return 'text-gray-400';
  };

  const getSentimentIcon = (sentiment: number) => {
    if (sentiment > 0.1) return <TrendingUp className="w-4 h-4 text-green-400" />;
    if (sentiment < -0.1) return <TrendingDown className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-900/20 via-cyan-900/10 to-gray-950">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                <Newspaper className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent">
                  Market News Feed
                </h1>
                <p className="text-gray-400">Real-time news from 5 sources with AI sentiment analysis</p>
              </div>
            </div>
            <button onClick={() => loadNews()} className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-wrap gap-4 mb-8">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadNews(searchQuery)}
                placeholder="Search news (e.g., NVDA, Fed, earnings...)"
                className="w-full pl-12 pr-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="flex gap-2">
              {(['all', 'bullish', 'bearish'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-3 rounded-xl capitalize transition-colors ${
                    filter === f 
                      ? f === 'bullish' ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : f === 'bearish' ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {f === 'all' ? 'All News' : f}
                </button>
              ))}
            </div>
          </div>

          {/* Stats Bar */}
          {data && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
                <div className="text-gray-400 text-sm">Overall Sentiment</div>
                <div className={`text-2xl font-bold ${getSentimentColor(data.overallSentiment.score)}`}>
                  {data.overallSentiment.label}
                </div>
              </div>
              <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
                <div className="text-gray-400 text-sm">Articles</div>
                <div className="text-2xl font-bold">{data.articles.length}</div>
              </div>
              <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
                <div className="text-gray-400 text-sm">Top Ticker</div>
                <div className="text-2xl font-bold text-blue-400">
                  {data.trendingTickers[0]?.ticker || 'N/A'}
                </div>
              </div>
              <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
                <div className="text-gray-400 text-sm">Sources</div>
                <div className="text-2xl font-bold">{Object.keys(data.sourceBreakdown).length}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main News Feed */}
          <div className="lg:col-span-2 space-y-4">
            {loading ? (
              <div className="text-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-400 mb-4" />
                <p className="text-gray-400">Loading news...</p>
              </div>
            ) : filteredArticles.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                No articles found matching your criteria
              </div>
            ) : (
              filteredArticles.map((article, idx) => (
                <a
                  key={idx}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-gray-900/50 rounded-xl p-5 border border-gray-800 hover:border-gray-600 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <h3 className="font-semibold text-lg leading-tight hover:text-blue-400">
                      {article.title}
                    </h3>
                    <ExternalLink className="w-4 h-4 text-gray-500 flex-shrink-0 mt-1" />
                  </div>
                  
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                    {article.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">
                        {article.source}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(article.publishedAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getSentimentIcon(article.sentiment)}
                      <span className={`text-sm ${getSentimentColor(article.sentiment)}`}>
                        {article.sentimentLabel}
                      </span>
                    </div>
                  </div>
                  
                  {article.tickers.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {article.tickers.slice(0, 5).map(ticker => (
                        <span key={ticker} className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded">
                          ${ticker}
                        </span>
                      ))}
                    </div>
                  )}
                </a>
              ))
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Trending Tickers */}
            <div className="bg-gray-900/50 rounded-xl p-5 border border-gray-800">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                Trending Tickers
              </h3>
              <div className="space-y-2">
                {data?.trendingTickers.slice(0, 10).map((t, i) => (
                  <div key={t.ticker} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 text-sm w-4">{i + 1}</span>
                      <Link href={`/stock/${t.ticker}`} className="text-blue-400 hover:text-blue-300 font-medium">
                        ${t.ticker}
                      </Link>
                    </div>
                    <span className="text-gray-500 text-sm">{t.mentions} mentions</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Trending Keywords */}
            <div className="bg-gray-900/50 rounded-xl p-5 border border-gray-800">
              <h3 className="font-semibold mb-4">🔥 Hot Topics</h3>
              <div className="flex flex-wrap gap-2">
                {data?.trendingKeywords.slice(0, 12).map(k => (
                  <button
                    key={k.keyword}
                    onClick={() => { setSearchQuery(k.keyword); loadNews(k.keyword); }}
                    className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm"
                  >
                    {k.keyword}
                  </button>
                ))}
              </div>
            </div>

            {/* Source Breakdown */}
            <div className="bg-gray-900/50 rounded-xl p-5 border border-gray-800">
              <h3 className="font-semibold mb-4">📰 Sources</h3>
              <div className="space-y-2">
                {data && Object.entries(data.sourceBreakdown).map(([source, count]) => (
                  <div key={source} className="flex items-center justify-between">
                    <span className="text-gray-400">{source}</span>
                    <span className="text-gray-500">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-6 right-6">
        <Link href="/" className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg shadow-lg">
          Back to Market Oracle
        </Link>
      </div>
    </div>
  );
}
