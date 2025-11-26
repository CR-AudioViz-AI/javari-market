// lib/supabase.ts - Market Oracle V3
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types
export type Category = 'regular' | 'penny' | 'crypto' | 'all';
export type Direction = 'UP' | 'DOWN' | 'HOLD';
export type PickStatus = 'active' | 'won' | 'lost' | 'expired';

export interface StockPick {
  id: string;
  competition_id: string;
  ai_model_id: string;
  ticker: string;
  symbol: string; // Alias
  category: Category;
  direction: Direction;
  confidence: number;
  confidence_score: number; // Alias
  entry_price: number;
  target_price: number;
  stop_loss: number;
  reasoning: string;
  current_price: number | null;
  price_change_percent: number | null;
  status: PickStatus;
  result: string | null;
  profit_loss: number | null;
  points_earned: number | null;
  week_number: number;
  pick_date: string;
  expiry_date: string;
  created_at: string;
  // Joined
  ai_name?: string;
  ai_color?: string;
}

export interface AIModel {
  id: string;
  name: string;
  display_name: string;
  provider: string;
  color: string;
  is_active: boolean;
  total_picks: number;
  total_wins: number;
  total_losses: number;
  win_rate: number;
  specialty?: string;
  tagline?: string;
}

export interface WeeklyStanding {
  id: string;
  week_number: number;
  ai_model_id: string;
  ai_name: string;
  category: Category;
  total_picks: number;
  winning_picks: number;
  losing_picks: number;
  win_rate: number;
  total_profit_loss: number;
  rank_position: number;
  points_earned: number;
}

// ============================================
// FETCH FUNCTIONS
// ============================================

// Get all picks with filters
export async function getPicks(filters?: {
  category?: Category;
  aiName?: string;
  status?: PickStatus;
  ticker?: string;
  weekNumber?: number;
  limit?: number;
}): Promise<StockPick[]> {
  try {
    let query = supabase
      .from('stock_picks')
      .select(`*, ai_models (name, display_name, color)`)
      .order('created_at', { ascending: false });
    
    if (filters?.category && filters.category !== 'all') {
      query = query.eq('category', filters.category);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.ticker) {
      query = query.eq('ticker', filters.ticker.toUpperCase());
    }
    if (filters?.weekNumber) {
      query = query.eq('week_number', filters.weekNumber);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    
    let result = (data || []).map(mapPick);
    
    if (filters?.aiName) {
      result = result.filter(p => p.ai_name?.toLowerCase().includes(filters.aiName!.toLowerCase()));
    }
    
    return result;
  } catch (e) {
    console.error('getPicks error:', e);
    return [];
  }
}

// Legacy function for backward compatibility
export async function getAllStockPicks(): Promise<StockPick[]> {
  return getPicks({ limit: 500 });
}

export async function getStockPicksByAI(aiName: string): Promise<StockPick[]> {
  return getPicks({ aiName, limit: 100 });
}

export async function getStockPicks(filters?: { symbol?: string; aiName?: string; status?: string }): Promise<StockPick[]> {
  return getPicks({
    ticker: filters?.symbol,
    aiName: filters?.aiName,
    status: filters?.status as PickStatus,
  });
}

// Get picks by category
export async function getPicksByCategory(category: Category): Promise<StockPick[]> {
  return getPicks({ category, limit: 200 });
}

// Get AI models
export async function getAIModels(): Promise<AIModel[]> {
  try {
    const { data, error } = await supabase
      .from('ai_models')
      .select('*')
      .eq('is_active', true)
      .order('display_name');
    
    if (error) throw error;
    return data || [];
  } catch (e) {
    console.error('getAIModels error:', e);
    return [];
  }
}

// Get hot/consensus picks
export async function getHotPicks(category?: Category): Promise<any[]> {
  try {
    const picks = await getPicks({ category, limit: 500 });
    
    const tickerMap = new Map<string, StockPick[]>();
    picks.forEach(pick => {
      if (!tickerMap.has(pick.ticker)) tickerMap.set(pick.ticker, []);
      tickerMap.get(pick.ticker)!.push(pick);
    });
    
    return Array.from(tickerMap.entries())
      .filter(([_, p]) => p.length >= 2)
      .map(([ticker, picks]) => ({
        ticker,
        symbol: ticker,
        category: picks[0].category,
        consensus: picks.length,
        aiNames: picks.map(p => p.ai_name),
        avgConfidence: picks.reduce((s, p) => s + p.confidence, 0) / picks.length,
        direction: picks.filter(p => p.direction === 'UP').length > picks.length / 2 ? 'UP' : 'DOWN',
        picks,
      }))
      .sort((a, b) => b.consensus - a.consensus);
  } catch (e) {
    console.error('getHotPicks error:', e);
    return [];
  }
}

// Get AI statistics
export async function getAIStatistics(category?: Category): Promise<any[]> {
  try {
    const { data: aiModels } = await supabase.from('ai_models').select('*').eq('is_active', true);
    const picks = await getPicks({ category, limit: 1000 });
    
    return (aiModels || []).map(ai => {
      const aiPicks = picks.filter(p => p.ai_model_id === ai.id);
      const wins = aiPicks.filter(p => p.status === 'won').length;
      const losses = aiPicks.filter(p => p.status === 'lost').length;
      const closed = wins + losses;
      
      return {
        id: ai.id,
        aiName: ai.display_name || ai.name,
        color: ai.color,
        totalPicks: aiPicks.length,
        openPicks: aiPicks.filter(p => p.status === 'active').length,
        closedPicks: closed,
        totalWins: wins,
        totalLosses: losses,
        winRate: closed > 0 ? (wins / closed) * 100 : 0,
        avgConfidence: aiPicks.length > 0 
          ? aiPicks.reduce((s, p) => s + p.confidence, 0) / aiPicks.length 
          : 0,
        totalProfitLoss: aiPicks.reduce((s, p) => s + (p.profit_loss || 0), 0),
        points: aiPicks.reduce((s, p) => s + (p.points_earned || 0), 0),
      };
    }).sort((a, b) => b.points - a.points);
  } catch (e) {
    console.error('getAIStatistics error:', e);
    return [];
  }
}

// Get leaderboard
export async function getLeaderboard(category: Category = 'all', weekNumber?: number): Promise<any[]> {
  const stats = await getAIStatistics(category === 'all' ? undefined : category);
  return stats.map((s, i) => ({ ...s, rank: i + 1 }));
}

// Get weekly winners
export async function getWeeklyWinners(weekNumber?: number): Promise<any[]> {
  try {
    const picks = await getPicks({ weekNumber, limit: 500 });
    const grouped = new Map<string, StockPick[]>();
    
    picks.forEach(pick => {
      const key = `${pick.ai_model_id}-${pick.category}`;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(pick);
    });
    
    const results: any[] = [];
    grouped.forEach((aiPicks, key) => {
      const wins = aiPicks.filter(p => p.status === 'won').length;
      const losses = aiPicks.filter(p => p.status === 'lost').length;
      results.push({
        ai_name: aiPicks[0].ai_name,
        category: aiPicks[0].category,
        total: aiPicks.length,
        wins,
        losses,
        winRate: (wins + losses) > 0 ? (wins / (wins + losses)) * 100 : 0,
        profit: aiPicks.reduce((s, p) => s + (p.profit_loss || 0), 0),
      });
    });
    
    return results.sort((a, b) => b.profit - a.profit);
  } catch (e) {
    console.error('getWeeklyWinners error:', e);
    return [];
  }
}

// Get performance over time for charts
export async function getPerformanceTimeline(aiModelId?: string): Promise<any[]> {
  try {
    const { data } = await supabase
      .from('stock_picks')
      .select('*, ai_models (name, display_name)')
      .eq('status', 'won')
      .or('status.eq.lost')
      .order('closed_at', { ascending: true });
    
    // Group by date and AI
    const timeline: any[] = [];
    const dailyMap = new Map<string, Map<string, { wins: number; losses: number; profit: number }>>();
    
    (data || []).forEach(pick => {
      const date = pick.closed_at?.split('T')[0] || pick.created_at.split('T')[0];
      const aiName = pick.ai_models?.display_name || 'Unknown';
      
      if (!dailyMap.has(date)) dailyMap.set(date, new Map());
      if (!dailyMap.get(date)!.has(aiName)) {
        dailyMap.get(date)!.set(aiName, { wins: 0, losses: 0, profit: 0 });
      }
      
      const stats = dailyMap.get(date)!.get(aiName)!;
      if (pick.status === 'won') stats.wins++;
      else stats.losses++;
      stats.profit += pick.profit_loss || 0;
    });
    
    dailyMap.forEach((aiMap, date) => {
      aiMap.forEach((stats, aiName) => {
        timeline.push({ date, aiName, ...stats });
      });
    });
    
    return timeline;
  } catch (e) {
    console.error('getPerformanceTimeline error:', e);
    return [];
  }
}

// Helper to map database row to frontend type
function mapPick(row: any): StockPick {
  return {
    ...row,
    symbol: row.ticker,
    confidence_score: row.confidence,
    price_change_percent: row.price_change_pct ?? row.price_change_percent ?? null,
    ai_name: row.ai_models?.display_name || row.ai_models?.name || 'Unknown',
    ai_color: row.ai_models?.color || '#6366f1',
  };
}

// Category stats
export async function getCategoryStats(): Promise<Record<Category, { total: number; winners: number; winRate: number }>> {
  const picks = await getPicks({ limit: 1000 });
  const stats: Record<string, { total: number; winners: number; winRate: number }> = {
    regular: { total: 0, winners: 0, winRate: 0 },
    penny: { total: 0, winners: 0, winRate: 0 },
    crypto: { total: 0, winners: 0, winRate: 0 },
  };
  
  picks.forEach(p => {
    if (stats[p.category]) {
      stats[p.category].total++;
      if (p.status === 'won') stats[p.category].winners++;
    }
  });
  
  Object.keys(stats).forEach(cat => {
    const s = stats[cat];
    const closed = picks.filter(p => p.category === cat && ['won', 'lost'].includes(p.status)).length;
    s.winRate = closed > 0 ? (s.winners / closed) * 100 : 0;
  });
  
  return stats as any;
}
