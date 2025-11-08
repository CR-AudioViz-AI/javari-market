'use client'

import { useState } from 'react'
import { Calendar as CalendarIcon, AlertCircle, Star } from 'lucide-react'

export function EconomicCalendar() {
  const events = [
    {
      date: '2025-11-10',
      time: '8:30 AM EST',
      event: 'CPI Report',
      impact: 'high',
      forecast: '3.2%',
      previous: '3.1%'
    },
    {
      date: '2025-11-12',
      time: '2:00 PM EST',
      event: 'Fed Interest Rate Decision',
      impact: 'high',
      forecast: '5.25%',
      previous: '5.25%'
    },
    {
      date: '2025-11-13',
      time: '10:00 AM EST',
      event: 'Retail Sales',
      impact: 'medium',
      forecast: '0.5%',
      previous: '0.3%'
    },
    {
      date: '2025-11-14',
      time: '8:30 AM EST',
      event: 'Jobless Claims',
      impact: 'medium',
      forecast: '220K',
      previous: '218K'
    },
    {
      date: '2025-11-15',
      time: '9:45 AM EST',
      event: 'PMI Manufacturing',
      impact: 'low',
      forecast: '49.8',
      previous: '49.5'
    }
  ]

  return (
    <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
      <div className="flex items-center gap-3 mb-6">
        <CalendarIcon className="w-6 h-6 text-brand-cyan" />
        <h3 className="text-xl font-bold">Economic Calendar</h3>
      </div>

      <div className="space-y-3">
        {events.map((event, i) => (
          <div key={i} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold">{event.event}</h4>
                  {event.impact === 'high' && (
                    <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      HIGH IMPACT
                    </span>
                  )}
                  {event.impact === 'medium' && (
                    <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded font-semibold">
                      MEDIUM
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-400">
                  <span>{new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                  <span>•</span>
                  <span>{event.time}</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-400">Forecast</p>
                <p className="font-semibold">{event.forecast}</p>
              </div>
              <div>
                <p className="text-slate-400">Previous</p>
                <p className="font-semibold">{event.previous}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-sm">
        <p className="text-blue-400">💡 High-impact events can cause significant market volatility. Plan your trades accordingly.</p>
      </div>
    </div>
  )
}
