'use client';

import Link from 'next/link';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Eye } from 'lucide-react';
import type { StockPick } from '@/lib/supabase';

interface PickCardProps {
  pick: StockPick;
  variant?: 'default' | 'compact' | 'expanded';
  showAI?: boolean;
  showReasoning?: boolean;
}

/**
 * PickCard Component
 * 
 * Displays a stock pick with:
 * - Entry Price (what AI recommended)
 * - Current Price (with ↑ or ↓ trend indicator)
 * - Target Price (AI's prediction)
 * 
 * This component is used across all pages for consistent display.
 */
export function PickCard({ 
  pick, 
  variant = 'default',
  showAI = true,
  showReasoning = true 
}: PickCardProps) {
  const priceChange = pick.price_change_percent || 0;
  const isUp = priceChange >= 0;
  const hasCurrentPrice = pick.current_price !== null;
  
  // Calculate progress toward target
  const progressToTarget = hasCurrentPrice && pick.target_price && pick.entry_price
    ? Math.min(100, Math.max(0, ((pick.current_price! - pick.entry_price) / (pick.target_price - pick.entry_price)) * 100))
    : 0;

  if (variant === 'compact') {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 hover:border-gray-600 transition-all">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div 
              className="w-8 h-8 rounded flex items-center justify-center text-white font-bold text-xs"
              style={{ backgroundColor: pick.ai_color || '#6366f1' }}
            >
              {pick.ticker.slice(0, 2)}
            </div>
            <div>
              <span className="font-bold text-white">{pick.ticker}</span>
              {showAI && <span className="text-xs text-gray-500 ml-2">{pick.ai_display_name}</span>}
            </div>
          </div>
          <div className={`flex items-center gap-1 text-sm font-medium ${
            isUp ? 'text-emerald-400' : 'text-red-400'
          }`}>
            {isUp ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            {Math.abs(priceChange).toFixed(1)}%
          </div>
        </div>
        
        {/* Entry | Current (↑↓) | Target */}
        <div className="grid grid-cols-3 gap-1 text-center">
          <PriceBox label="Entry" value={pick.entry_price} variant="neutral" />
          <PriceBox 
            label="Current" 
            value={pick.current_price ?? null} 
            variant={isUp ? 'up' : 'down'} 
            showTrend={true}
            isUp={isUp}
          />
          <PriceBox label="Target" value={pick.target_price} variant="target" />
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 hover:border-gray-600 transition-all hover:shadow-lg group">
      {/* Header: Ticker + AI + Confidence */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
            style={{ backgroundColor: pick.ai_color || '#6366f1' }}
          >
            {pick.ticker.slice(0, 2)}
          </div>
          <div>
            <h3 className="font-bold text-white text-lg">{pick.ticker}</h3>
            {showAI && <p className="text-xs text-gray-400">{pick.ai_display_name}</p>}
          </div>
        </div>
        <div className="text-right">
          <div className={`flex items-center gap-1 text-sm font-medium ${
            isUp ? 'text-emerald-400' : 'text-red-400'
          }`}>
            {isUp ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            {Math.abs(priceChange).toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500">
            {pick.confidence}% conf
          </div>
        </div>
      </div>
      
      {/* Price Display: Entry | Current (↑↓) | Target */}
      <div className="grid grid-cols-3 gap-2 mb-3 text-center">
        <PriceBox label="Entry" value={pick.entry_price} variant="neutral" size="md" />
        <PriceBox 
          label="Current" 
          value={pick.current_price ?? null} 
          variant={isUp ? 'up' : 'down'} 
          showTrend={true}
          isUp={isUp}
          size="md"
        />
        <PriceBox label="Target" value={pick.target_price} variant="target" size="md" />
      </div>
      
      {/* Progress to Target */}
      <div className="mb-3">
        <div className="flex justify-between text-[10px] text-gray-500 mb-1">
          <span>Progress to Target</span>
          <span>{progressToTarget.toFixed(0)}%</span>
        </div>
        <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all ${
              progressToTarget >= 100 ? 'bg-emerald-500' : 
              progressToTarget >= 50 ? 'bg-cyan-500' : 
              progressToTarget >= 0 ? 'bg-blue-500' : 'bg-red-500'
            }`}
            style={{ width: `${Math.max(0, progressToTarget)}%` }}
          />
        </div>
      </div>
      
      {/* Direction + Status */}
      <div className="flex items-center justify-between">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
          pick.direction === 'UP' 
            ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-800/50'
            : pick.direction === 'DOWN'
            ? 'bg-red-900/50 text-red-400 border border-red-800/50'
            : 'bg-gray-700 text-gray-400'
        }`}>
          {pick.direction === 'UP' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {pick.direction}
        </span>
        <span className={`px-2 py-0.5 rounded text-xs ${
          pick.status === 'active' ? 'bg-yellow-900/50 text-yellow-400' :
          pick.status === 'closed' && (pick.actual_return ?? 0) > 0 ? 'bg-emerald-900/50 text-emerald-400' :
          pick.status === 'closed' && (pick.actual_return ?? 0) <= 0 ? 'bg-red-900/50 text-red-400' :
          'bg-gray-700 text-gray-400'
        }`}>
          {pick.status === 'active' ? 'ACTIVE' : 
           pick.status === 'closed' ? ((pick.actual_return ?? 0) > 0 ? 'WON' : 'LOST') : 
           pick.status?.toUpperCase() || 'PENDING'}
        </span>
      </div>
      
      {/* View Details Link */}
      {showReasoning && (
        <Link 
          href={`/stock/${pick.ticker}`}
          className="mt-3 flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-cyan-400 transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          View AI Reasoning
        </Link>
      )}
    </div>
  );
}

// Price Box subcomponent
function PriceBox({ 
  label, 
  value, 
  variant, 
  showTrend = false,
  isUp = true,
  size = 'sm'
}: { 
  label: string;
  value: number | null;
  variant: 'neutral' | 'up' | 'down' | 'target';
  showTrend?: boolean;
  isUp?: boolean;
  size?: 'sm' | 'md';
}) {
  const bgClasses = {
    neutral: 'bg-gray-900/50',
    up: 'bg-emerald-900/40 border border-emerald-800/50',
    down: 'bg-red-900/40 border border-red-800/50',
    target: 'bg-gray-900/50',
  };
  
  const textClasses = {
    neutral: 'text-gray-300',
    up: 'text-emerald-400',
    down: 'text-red-400',
    target: 'text-cyan-400',
  };
  
  const sizeClasses = {
    sm: { container: 'py-1.5 px-1', label: 'text-[9px]', value: 'text-xs' },
    md: { container: 'py-2 px-1', label: 'text-[10px]', value: 'text-sm' },
  };
  
  return (
    <div className={`rounded-lg ${bgClasses[variant]} ${sizeClasses[size].container}`}>
      <div className={`${sizeClasses[size].label} text-gray-500 uppercase tracking-wide mb-0.5 flex items-center justify-center gap-0.5`}>
        {label}
        {showTrend && (
          isUp 
            ? <TrendingUp className="w-2.5 h-2.5 text-emerald-400" />
            : <TrendingDown className="w-2.5 h-2.5 text-red-400" />
        )}
      </div>
      <div className={`${sizeClasses[size].value} font-bold ${textClasses[variant]}`}>
        {value !== null ? `$${value.toFixed(2)}` : '—'}
      </div>
    </div>
  );
}

// Mini version for lists
export function PickCardMini({ pick }: { pick: StockPick }) {
  const priceChange = pick.price_change_percent || 0;
  const isUp = priceChange >= 0;
  
  return (
    <div className="flex items-center gap-3 p-2 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors">
      <div 
        className="w-8 h-8 rounded flex items-center justify-center text-white text-xs font-bold"
        style={{ backgroundColor: pick.ai_color }}
      >
        {pick.ticker.slice(0, 2)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-white truncate">{pick.ticker}</div>
        <div className="text-xs text-gray-500 flex items-center gap-2">
          <span>${pick.entry_price?.toFixed(2)}</span>
          <span>→</span>
          <span className={isUp ? 'text-emerald-400' : 'text-red-400'}>
            ${pick.current_price?.toFixed(2) || '—'}
            {isUp ? ' ↑' : ' ↓'}
          </span>
          <span>→</span>
          <span className="text-cyan-400">${pick.target_price?.toFixed(2)}</span>
        </div>
      </div>
      <div className={`font-bold ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
        {isUp ? '+' : ''}{priceChange.toFixed(1)}%
      </div>
    </div>
  );
}

export default PickCard;


