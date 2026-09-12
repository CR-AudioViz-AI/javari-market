'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, TrendingUp, TrendingDown, Clock, AlertTriangle, RefreshCw, ChevronRight } from 'lucide-react';

interface EarningsEvent {
  symbol: string;
  name: string;
  date: string;
  time: string;
  estimate?: number | null;
  epsEstimate?: number | null;
  actual: number | null;
  surprise: number | null;
  surprisePercent?: number | null;
  epsSurprisePercent?: number | null;
  status: 'upcoming' | 'reported';
  impact: 'high' | 'medium' | 'low';
}

interface EarningsData {
  calendar: Array<{ date: string; dayOfWeek: string; events: EarningsEvent[] }>;
  summary: { upcoming: number; reported: number; beatRate: number };
  notableUpcoming: EarningsEvent[];
  recentSurprises: EarningsEvent[];
}

export default function EarningsCalendarPage() {
  const [data, setData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'calendar' | 'list'>('calendar');

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch('/api/earnings');
      const json = await res.json();
      if (json.success) setData(json);
    } catch (error) { console.error('Error:', error); }
    setLoading(false);
  }

  const getImpactColor = (impact: string) => {
    if (impact === 'high') return 'bg-red-500/20 text-red-400 border-red-500/30';
    if (impact === 'medium') return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  const getSurpriseColor = (surprise: number | null) => {
    if (surprise === null) return 'text-gray-400';
    if (surprise > 5) return 'text-green-400';
    if (surprise > 0) return 'text-green-300';
    if (surprise < -5) return 'text-red-400';
    if (surprise < 0) return 'text-red-300';
    return 'text-gray-400';
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-amber-900/20 via-orange-900/10 to-gray-950">
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                  Earnings Calendar
                </h1>
                <p className="text-gray-400">Track earnings releases and beat/miss history</p>
              </div>
            </div>
            <button onClick={loadData} className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Stats */}
          {data && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
                <div className="text-gray-400 text-sm">Upcoming</div>
                <div className="text-3xl font-bold text-amber-400">{data.summary.upcoming}</div>
              </div>
              <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
                <div className="text-gray-400 text-sm">Reported</div>
                <div className="text-3xl font-bold">{data.summary.reported}</div>
              </div>
              <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
                <div className="text-gray-400 text-sm">Beat Rate</div>
                <div className={`text-3xl font-bold ${data.summary.beatRate > 60 ? 'text-green-400' : data.summary.beatRate < 40 ? 'text-red-400' : 'text-yellow-400'}`}>
                  {data.summary.beatRate}%
                </div>
              </div>
              <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
                <div className="text-gray-400 text-sm">This Week</div>
                <div className="text-3xl font-bold">{data.notableUpcoming?.length || 0}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar View */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold mb-4">📅 Earnings Schedule</h2>
            
            {loading ? (
              <div className="text-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-amber-400 mb-4" />
              </div>
            ) : (
              <div className="space-y-4">
                {data?.calendar.map(day => (
                  <div key={day.date} className="bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden">
                    <div className="bg-gray-800/50 px-4 py-3 flex items-center justify-between">
                      <div>
                        <span className="font-semibold">{day.dayOfWeek}</span>
                        <span className="text-gray-400 ml-2">{day.date}</span>
                      </div>
                      <span className="text-sm text-gray-400">{day.events.length} reports</span>
                    </div>
                    <div className="p-4 space-y-3">
                      {day.events.length === 0 ? (
                        <p className="text-gray-500 text-sm">No earnings scheduled</p>
                      ) : (
                        day.events.map((event, idx) => (
                          <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                            <div className="flex items-center gap-3">
                              <span className={`text-xs px-2 py-0.5 rounded border ${getImpactColor(event.impact)}`}>
                                {(event.impact ?? 'normal').toUpperCase()}
                              </span>
                              <Link href={`/stock/${event.symbol}`} className="font-semibold text-blue-400 hover:text-blue-300">
                                {event.symbol}
                              </Link>
                              <span className="text-gray-500 text-sm hidden md:inline">{event.name}</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {event.time}
                              </span>
                              {/* 2026-09-11: the API calls these epsSurprisePercent / epsEstimate
                                  and leaves them null for most events. The page read
                                  surprisePercent directly and crashed on the first null. */}
                              {(() => {
                                const surprise = event.surprisePercent ?? event.epsSurprisePercent;
                                return typeof surprise === 'number' ? (
                                  <span className={`text-sm font-medium ${getSurpriseColor(surprise)}`}>
                                    {surprise > 0 ? '+' : ''}{surprise.toFixed(1)}%{surprise > 0 ? ' Beat' : ' Miss'}
                                  </span>
                                ) : null;
                              })()}
                              {(() => {
                                const est = event.estimate ?? event.epsEstimate;
                                return typeof est === 'number' ? (
                                  <span className="text-sm text-gray-400">Est: ${est.toFixed(2)}</span>
                                ) : null;
                              })()}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Notable Upcoming */}
            <div className="bg-gray-900/50 rounded-xl p-5 border border-gray-800">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                High Impact This Week
              </h3>
              <div className="space-y-3">
                {data?.notableUpcoming?.slice(0, 8).map((e, i) => (
                  <Link key={i} href={`/stock/${e.symbol}`} className="flex items-center justify-between hover:bg-gray-800/50 p-2 rounded-lg -mx-2">
                    <div>
                      <span className="font-medium text-blue-400">{e.symbol}</span>
                      <span className="text-gray-500 text-sm ml-2">{e.date}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Recent Surprises */}
            <div className="bg-gray-900/50 rounded-xl p-5 border border-gray-800">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                Recent Surprises
              </h3>
              <div className="space-y-3">
                {data?.recentSurprises?.slice(0, 8).map((e, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Link href={`/stock/${e.symbol}`} className="font-medium text-blue-400 hover:text-blue-300">
                      {e.symbol}
                    </Link>
                    <span className={`text-sm font-medium ${getSurpriseColor(e.surprisePercent ?? e.epsSurprisePercent ?? null)}`}>
                      {(() => { const v = e.surprisePercent ?? e.epsSurprisePercent; return typeof v === 'number' ? `${v > 0 ? '+' : ''}${v.toFixed(1)}%` : '—'; })()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tip */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
              <h4 className="font-semibold text-amber-400 mb-2">💡 Trading Tip</h4>
              <p className="text-sm text-gray-300">
                High-impact earnings can move stocks 5-20% in either direction. Consider reducing position size or hedging before major reports.
              </p>
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
