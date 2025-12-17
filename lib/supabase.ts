// ============================================================================
// MARKET ORACLE - COMPLETE SUPABASE CLIENT
// ALL exports restored + centralized auth
// Fixed: 2025-12-17 11:44 EST
// ============================================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Centralized Supabase configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kteobfyferrukqeolofj.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0ZW9iZnlmZXJydWtxZW9sb2ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxOTcyNjYsImV4cCI6MjA3NzU1NzI2Nn0.uy-jlF_z6qVb8qogsNyGDLHqT4HhmdRhLrW7zPv3qhY';

// Standard client for general use
export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Browser client for auth (SSR-safe singleton pattern)
let browserClient: SupabaseClient | null = null;

export function createSupabaseBrowserClient(): SupabaseClient {
  if (typeof window === 'undefined') {
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  if (!browserClient) {
    browserClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
  }
  return browserClient;
}

// Server client for API routes
export function createSupabaseServerClient(): SupabaseClient {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    console.warn('SUPABASE_SERVICE_ROLE_KEY not set, using anon key');
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return createClient(SUPABASE_URL, serviceKey);
}

export { SUPABASE_URL, SUPABASE_ANON_KEY };

// ============================================================================
// TYPES
// ============================================================================

export interface AIModel {
  id: string;
  name: string;
  displayName: string;
  provider: string;
  color: string;
  description: string;
  strengths: string[];
  isActive: boolean;
}

export interface StockPick {
  id: string;
  aiModelId: string;
  aiModel?: AIModel;
  symbol: string;
  companyName: string;
  sector: string;
  direction: 'UP' | 'DOWN' | 'HOLD';
  confidence: number;
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
  timeframe: string;
  thesis: string;
  reasoning: string;
  keyBullishFactors: string[];
  keyBearishFactors: string[];
  risks: string[];
  catalysts: string[];
  status: 'active' | 'closed' | 'expired';
  actualExitPrice?: number;
  actualReturn?: number;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
  // Additional fields for price tracking
  current_price?: number;
  price_change_percent?: number;
}

export interface AIStatistics {
  aiModelId: string;
  displayName: string;
  color: string;
  totalPicks: number;
  winningPicks: number;
  losingPicks: number;
  winRate: number;
  avgConfidence: number;
  avgReturn: number;
  totalProfitLossPercent: number;
  bestPick?: StockPick;
  worstPick?: StockPick;
  recentStreak: number;
  streakType: 'winning' | 'losing' | 'none';
}

export interface StockInfo {
  symbol: string;
  name: string;
  exchange: string;
  sector?: string;
  industry?: string;
}

export interface OverallStats {
  totalPicks: number;
  activePicks: number;
  closedPicks: number;
  overallWinRate: number;
  totalReturn: number;
  avgConfidence: number;
  bestAI: string;
  worstAI: string;
}

// ============================================================================
// AI MODEL CONFIGURATION
// ============================================================================

export const AI_MODELS: AIModel[] = [
  {
    id: 'gpt4',
    name: 'gpt4',
    displayName: 'GPT-4',
    provider: 'OpenAI',
    color: '#10B981',
    description: 'Conservative, thorough analysis with deep reasoning',
    strengths: ['Fundamental Analysis', 'Risk Assessment', 'Long-term Outlook'],
    isActive: true
  },
  {
    id: 'claude',
    name: 'claude',
    displayName: 'Claude',
    provider: 'Anthropic',
    color: '#F59E0B',
    description: 'Balanced analysis with strong risk awareness',
    strengths: ['Risk Analysis', 'Market Context', 'Balanced View'],
    isActive: true
  },
  {
    id: 'gemini',
    name: 'gemini',
    displayName: 'Gemini',
    provider: 'Google',
    color: '#3B82F6',
    description: 'Technical patterns and price target focus',
    strengths: ['Technical Analysis', 'Price Targets', 'Pattern Recognition'],
    isActive: true
  },
  {
    id: 'perplexity',
    name: 'perplexity',
    displayName: 'Perplexity',
    provider: 'Perplexity AI',
    color: '#8B5CF6',
    description: 'Real-time web data and breaking news integration',
    strengths: ['Real-time Data', 'News Analysis', 'Catalyst Identification'],
    isActive: true
  }
];

// ============================================================================
// CORE DATA FUNCTIONS
// ============================================================================

/**
 * Get all AI models
 */
export async function getAIModels(): Promise<AIModel[]> {
  try {
    const { data, error } = await supabase
      .from('ai_models')
      .select('*')
      .eq('is_active', true)
      .order('display_name');
    
    if (data && data.length > 0) {
      return data.map(m => ({
        id: m.id,
        name: m.name,
        displayName: m.display_name,
        provider: m.provider,
        color: m.color,
        description: m.description,
        strengths: m.strengths || [],
        isActive: m.is_active
      }));
    }
  } catch (e) {
    console.log('Using in-memory AI models');
  }
  return AI_MODELS;
}

/**
 * Get stock picks with optional filters
 */
export async function getPicks(filters?: {
  aiModelId?: string;
  symbol?: string;
  status?: string;
  direction?: string;
  limit?: number;
}): Promise<StockPick[]> {
  try {
    let query = supabase
      .from('stock_picks')
      .select('*, ai_models(*)');
    
    if (filters?.aiModelId) {
      query = query.eq('ai_model_id', filters.aiModelId);
    }
    if (filters?.symbol) {
      query = query.eq('symbol', filters.symbol.toUpperCase());
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.direction) {
      query = query.eq('direction', filters.direction);
    }
    
    query = query.order('created_at', { ascending: false });
    
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching picks:', error);
      return [];
    }
    
    return (data || []).map(pick => ({
      id: pick.id,
      aiModelId: pick.ai_model_id,
      aiModel: pick.ai_models ? {
        id: pick.ai_models.id,
        name: pick.ai_models.name,
        displayName: pick.ai_models.display_name,
        provider: pick.ai_models.provider,
        color: pick.ai_models.color,
        description: pick.ai_models.description,
        strengths: pick.ai_models.strengths || [],
        isActive: pick.ai_models.is_active
      } : undefined,
      symbol: pick.symbol,
      companyName: pick.company_name || pick.symbol,
      sector: pick.sector || 'Unknown',
      direction: pick.direction,
      confidence: pick.confidence,
      entryPrice: pick.entry_price,
      targetPrice: pick.target_price,
      stopLoss: pick.stop_loss,
      timeframe: pick.timeframe || '1-3 months',
      thesis: pick.thesis || '',
      reasoning: pick.reasoning || '',
      keyBullishFactors: pick.key_bullish_factors || [],
      keyBearishFactors: pick.key_bearish_factors || [],
      risks: pick.risks || [],
      catalysts: pick.catalysts || [],
      status: pick.status || 'active',
      actualExitPrice: pick.actual_exit_price,
      actualReturn: pick.actual_return,
      closedAt: pick.closed_at,
      createdAt: pick.created_at,
      updatedAt: pick.updated_at,
      current_price: pick.current_price,
      price_change_percent: pick.price_change_percent
    }));
  } catch (e) {
    console.error('Error in getPicks:', e);
    return [];
  }
}

/**
 * Get ALL stock picks (alias for getPicks with no filters)
 */
export async function getAllStockPicks(): Promise<StockPick[]> {
  return getPicks();
}

/**
 * Get AI statistics for battle/leaderboard
 */
export async function getAIStatistics(): Promise<AIStatistics[]> {
  const models = await getAIModels();
  const picks = await getPicks({ status: 'closed' });
  
  return models.map(model => {
    const modelPicks = picks.filter(p => p.aiModelId === model.id);
    const winningPicks = modelPicks.filter(p => (p.actualReturn || 0) > 0);
    const losingPicks = modelPicks.filter(p => (p.actualReturn || 0) < 0);
    
    const totalReturn = modelPicks.reduce((sum, p) => sum + (p.actualReturn || 0), 0);
    const avgReturn = modelPicks.length > 0 ? totalReturn / modelPicks.length : 0;
    const avgConfidence = modelPicks.length > 0 
      ? modelPicks.reduce((sum, p) => sum + p.confidence, 0) / modelPicks.length 
      : 0;
    
    let streak = 0;
    let streakType: 'winning' | 'losing' | 'none' = 'none';
    const sortedPicks = [...modelPicks].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    for (const pick of sortedPicks) {
      const isWin = (pick.actualReturn || 0) > 0;
      if (streak === 0) {
        streakType = isWin ? 'winning' : 'losing';
        streak = 1;
      } else if ((isWin && streakType === 'winning') || (!isWin && streakType === 'losing')) {
        streak++;
      } else {
        break;
      }
    }
    
    return {
      aiModelId: model.id,
      displayName: model.displayName,
      color: model.color,
      totalPicks: modelPicks.length,
      winningPicks: winningPicks.length,
      losingPicks: losingPicks.length,
      winRate: modelPicks.length > 0 ? (winningPicks.length / modelPicks.length) * 100 : 0,
      avgConfidence: Math.round(avgConfidence),
      avgReturn: avgReturn,
      totalProfitLossPercent: totalReturn,
      bestPick: [...modelPicks].sort((a, b) => (b.actualReturn || 0) - (a.actualReturn || 0))[0],
      worstPick: [...modelPicks].sort((a, b) => (a.actualReturn || 0) - (b.actualReturn || 0))[0],
      recentStreak: streak,
      streakType
    };
  }).sort((a, b) => b.totalProfitLossPercent - a.totalProfitLossPercent);
}

/**
 * Get overall platform statistics
 */
export async function getOverallStats(): Promise<OverallStats> {
  const allPicks = await getPicks();
  const closedPicks = allPicks.filter(p => p.status === 'closed');
  const activePicks = allPicks.filter(p => p.status === 'active');
  
  const winningPicks = closedPicks.filter(p => (p.actualReturn || 0) > 0);
  const totalReturn = closedPicks.reduce((sum, p) => sum + (p.actualReturn || 0), 0);
  const avgConfidence = allPicks.length > 0 
    ? allPicks.reduce((sum, p) => sum + p.confidence, 0) / allPicks.length 
    : 0;
  
  // Find best/worst AI
  const stats = await getAIStatistics();
  const best = stats[0];
  const worst = stats[stats.length - 1];
  
  return {
    totalPicks: allPicks.length,
    activePicks: activePicks.length,
    closedPicks: closedPicks.length,
    overallWinRate: closedPicks.length > 0 ? (winningPicks.length / closedPicks.length) * 100 : 0,
    totalReturn: totalReturn,
    avgConfidence: Math.round(avgConfidence),
    bestAI: best?.displayName || 'N/A',
    worstAI: worst?.displayName || 'N/A'
  };
}

/**
 * Get recent winning picks
 */
export async function getRecentWinners(limit: number = 5): Promise<StockPick[]> {
  const closedPicks = await getPicks({ status: 'closed' });
  return closedPicks
    .filter(p => (p.actualReturn || 0) > 0)
    .sort((a, b) => new Date(b.closedAt || b.createdAt).getTime() - new Date(a.closedAt || a.createdAt).getTime())
    .slice(0, limit);
}

/**
 * Search stocks by symbol OR company name
 */
export async function searchStocks(query: string): Promise<StockInfo[]> {
  if (!query || query.length < 1) return [];
  
  const upperQuery = query.toUpperCase();
  const lowerQuery = query.toLowerCase();
  
  try {
    const { data, error } = await supabase
      .from('stocks')
      .select('symbol, name, exchange, sector, industry')
      .or(`symbol.ilike.%${upperQuery}%,name.ilike.%${lowerQuery}%`)
      .limit(20);
    
    if (data && data.length > 0) {
      return data;
    }
  } catch (e) {
    console.log('Using fallback stock search');
  }
  
  // Fallback common stocks
  const COMMON_STOCKS: StockInfo[] = [
    { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', sector: 'Technology' },
    { symbol: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ', sector: 'Technology' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', exchange: 'NASDAQ', sector: 'Technology' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', exchange: 'NASDAQ', sector: 'Consumer Cyclical' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ', sector: 'Technology' },
    { symbol: 'META', name: 'Meta Platforms Inc.', exchange: 'NASDAQ', sector: 'Technology' },
    { symbol: 'TSLA', name: 'Tesla Inc.', exchange: 'NASDAQ', sector: 'Consumer Cyclical' },
    { symbol: 'JPM', name: 'JPMorgan Chase & Co.', exchange: 'NYSE', sector: 'Financial' },
    { symbol: 'V', name: 'Visa Inc.', exchange: 'NYSE', sector: 'Financial' },
    { symbol: 'JNJ', name: 'Johnson & Johnson', exchange: 'NYSE', sector: 'Healthcare' },
    { symbol: 'WMT', name: 'Walmart Inc.', exchange: 'NYSE', sector: 'Consumer Defensive' },
    { symbol: 'PG', name: 'Procter & Gamble Co.', exchange: 'NYSE', sector: 'Consumer Defensive' },
    { symbol: 'MA', name: 'Mastercard Inc.', exchange: 'NYSE', sector: 'Financial' },
    { symbol: 'HD', name: 'Home Depot Inc.', exchange: 'NYSE', sector: 'Consumer Cyclical' },
    { symbol: 'CVX', name: 'Chevron Corporation', exchange: 'NYSE', sector: 'Energy' },
    { symbol: 'XOM', name: 'Exxon Mobil Corporation', exchange: 'NYSE', sector: 'Energy' },
    { symbol: 'LLY', name: 'Eli Lilly and Company', exchange: 'NYSE', sector: 'Healthcare' },
    { symbol: 'PFE', name: 'Pfizer Inc.', exchange: 'NYSE', sector: 'Healthcare' },
    { symbol: 'KO', name: 'Coca-Cola Company', exchange: 'NYSE', sector: 'Consumer Defensive' },
    { symbol: 'DIS', name: 'Walt Disney Company', exchange: 'NYSE', sector: 'Communication Services' },
    { symbol: 'NFLX', name: 'Netflix Inc.', exchange: 'NASDAQ', sector: 'Communication Services' },
    { symbol: 'AMD', name: 'Advanced Micro Devices', exchange: 'NASDAQ', sector: 'Technology' },
    { symbol: 'CRM', name: 'Salesforce Inc.', exchange: 'NYSE', sector: 'Technology' },
    { symbol: 'ADBE', name: 'Adobe Inc.', exchange: 'NASDAQ', sector: 'Technology' },
    { symbol: 'BA', name: 'Boeing Company', exchange: 'NYSE', sector: 'Industrials' },
    { symbol: 'NKE', name: 'Nike Inc.', exchange: 'NYSE', sector: 'Consumer Cyclical' },
    { symbol: 'MCD', name: "McDonald's Corporation", exchange: 'NYSE', sector: 'Consumer Cyclical' },
    { symbol: 'SBUX', name: 'Starbucks Corporation', exchange: 'NASDAQ', sector: 'Consumer Cyclical' },
  ];
  
  return COMMON_STOCKS.filter(stock => 
    stock.symbol.includes(upperQuery) || 
    stock.name.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get hot picks (trending/recent high-confidence picks)
 */
export async function getHotPicks(limit: number = 10): Promise<StockPick[]> {
  return getPicks({ status: 'active', limit });
}

/**
 * Save a new stock pick
 */
export async function savePick(pick: Omit<StockPick, 'id' | 'createdAt' | 'updatedAt'>): Promise<StockPick | null> {
  try {
    const { data, error } = await supabase
      .from('stock_picks')
      .insert({
        ai_model_id: pick.aiModelId,
        symbol: pick.symbol.toUpperCase(),
        company_name: pick.companyName,
        sector: pick.sector,
        direction: pick.direction,
        confidence: pick.confidence,
        entry_price: pick.entryPrice,
        target_price: pick.targetPrice,
        stop_loss: pick.stopLoss,
        timeframe: pick.timeframe,
        thesis: pick.thesis,
        reasoning: pick.reasoning,
        key_bullish_factors: pick.keyBullishFactors,
        key_bearish_factors: pick.keyBearishFactors,
        risks: pick.risks,
        catalysts: pick.catalysts,
        status: 'active'
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error saving pick:', error);
      return null;
    }
    
    return data ? {
      id: data.id,
      aiModelId: data.ai_model_id,
      symbol: data.symbol,
      companyName: data.company_name,
      sector: data.sector,
      direction: data.direction,
      confidence: data.confidence,
      entryPrice: data.entry_price,
      targetPrice: data.target_price,
      stopLoss: data.stop_loss,
      timeframe: data.timeframe,
      thesis: data.thesis,
      reasoning: data.reasoning,
      keyBullishFactors: data.key_bullish_factors || [],
      keyBearishFactors: data.key_bearish_factors || [],
      risks: data.risks || [],
      catalysts: data.catalysts || [],
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    } : null;
  } catch (e) {
    console.error('Error in savePick:', e);
    return null;
  }
}
