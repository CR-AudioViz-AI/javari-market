// lib/supabase.ts
// CR AudioViz AI - Market Oracle Database & Price Functions
// TIMESTAMP: 2025-12-20 08:35 EST
// FIX: Added missing exports - supabase, getCompetitionLeaderboard, getRecentWinners, createSupabaseBrowserClient

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Export the supabase client directly for backward compatibility
export const supabase = createClientComponentClient();

// Export function to create browser client (for AuthProvider compatibility)
export function createSupabaseBrowserClient() {
  return createClientComponentClient();
}

// Asset Types
export type AssetType = 'stock' | 'penny_stock' | 'crypto';

// Interfaces
export interface AIModel {
  id: string;
  name: string;
  displayName: string; display_name: string;
  provider: string;
  color: string;
  description?: string;
  strengths?: string[];
  isActive: boolean; is_active: boolean;
}

export interface StockInfo {
  symbol: string;
  name: string;
  exchange: string;
  sector?: string;
  industry?: string;
  assetType?: AssetType;
}

export interface CryptoInfo {
  symbol: string;
  name: string;
  exchange: string;
}

export interface StockPick {
  id: string;
  assetType: AssetType; asset_type: AssetType;
  aiModelId: string; ai_model_id: string;
  aiModel?: AIModel; ai_model?: AIModel;
  symbol: string; ticker: string;
  companyName: string; company_name: string;
  sector: string;
  direction: 'UP' | 'DOWN' | 'HOLD';
  confidence: number;
  entryPrice: number; entry_price: number;
  targetPrice: number; target_price: number;
  stopLoss: number; stop_loss: number;
  timeframe: string; thesis: string; reasoning: string;
  keyBullishFactors: string[]; key_bullish_factors: string[];
  keyBearishFactors: string[]; key_bearish_factors: string[];
  risks: string[]; catalysts: string[];
  status: 'active' | 'closed' | 'expired';
  actualExitPrice?: number; actual_exit_price?: number;
  actualReturn?: number; actual_return?: number;
  closedAt?: string; closed_at?: string;
  createdAt: string; created_at: string;
  updatedAt: string; updated_at: string;
  current_price?: number; currentPrice?: number;
  price_change_percent?: number; priceChangePercent?: number;
  ai_display_name: string;
  ai_color: string;
}

export interface AIStatistics {
  aiModelId: string; displayName: string; color: string;
  totalPicks: number; winningPicks: number; losingPicks: number;
  winRate: number; avgConfidence: number; avgReturn: number;
  totalProfitLossPercent: number;
  bestPick?: StockPick; worstPick?: StockPick;
  recentStreak: number; streakType: 'winning' | 'losing' | 'none';
}

export interface OverallStats {
  totalPicks: number; activePicks: number; closedPicks: number;
  winRate: number; avgConfidence: number;
  totalProfitLoss: number; topAI: string;
  bestPick: StockPick | null; worstPick: StockPick | null;
}

// Competition Leaderboard Interface
export interface CompetitionLeaderboard {
  rank: number;
  aiModelId: string;
  displayName: string;
  color: string;
  totalPicks: number;
  wins: number;
  losses: number;
  winRate: number;
  totalReturn: number;
  avgReturn: number;
  bestPick?: { symbol: string; return: number };
  streak: number;
  streakType: 'winning' | 'losing' | 'none';
  badges: string[];
}

// Recent Winner Interface
export interface RecentWinner {
  id: string;
  symbol: string;
  companyName: string;
  aiModelId: string;
  aiDisplayName: string;
  aiColor: string;
  actualReturn: number;
  closedAt: string;
  direction: 'UP' | 'DOWN' | 'HOLD';
}

export const AI_MODELS = {
  GPT4: { id: 'gpt4', name: 'GPT-4', color: '#10b981' },
  CLAUDE: { id: 'claude', name: 'Claude', color: '#8b5cf6' },
  GEMINI: { id: 'gemini', name: 'Gemini', color: '#3b82f6' },
  PERPLEXITY: { id: 'perplexity', name: 'Perplexity', color: '#06b6d4' },
};

// Price cache to reduce API calls
const priceCache: Map<string, { price: number; timestamp: number }> = new Map();
const PRICE_CACHE_TTL = 60000; // 1 minute

// Fetch current price for a symbol
async function fetchCurrentPrice(symbol: string): Promise<number | null> {
  const cached = priceCache.get(symbol);
  if (cached && Date.now() - cached.timestamp < PRICE_CACHE_TTL) {
    return cached.price;
  }

  try {
    // Try Alpha Vantage
    const apiKey = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_KEY || process.env.ALPHA_VANTAGE_API_KEY;
    if (apiKey) {
      const res = await fetch(
        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`,
        { next: { revalidate: 60 } }
      );
      const data = await res.json();
      const price = parseFloat(data['Global Quote']?.['05. price']);
      if (!isNaN(price) && price > 0) {
        priceCache.set(symbol, { price, timestamp: Date.now() });
        return price;
      }
    }
  } catch (e) {
    console.error(`Price fetch error for ${symbol}:`, e);
  }
  return null;
}

// Normalize pick from database
function normalizePick(pick: Record<string, unknown>): StockPick {
  const aiModel = (pick.ai_models || pick.aiModel || pick.ai_model) as AIModel | undefined;
  const aiDisplayName = aiModel?.display_name || aiModel?.displayName || aiModel?.name || 'AI';
  const aiColor = aiModel?.color || '#6366f1';
  const symbolValue = (pick.symbol || pick.ticker || '') as string;
  const assetTypeValue = (pick.asset_type || pick.assetType || 'stock') as AssetType;
  
  return {
    id: pick.id as string,
    assetType: assetTypeValue, asset_type: assetTypeValue,
    aiModelId: (pick.ai_model_id || pick.aiModelId || '') as string, ai_model_id: (pick.ai_model_id || pick.aiModelId || '') as string,
    aiModel: aiModel, ai_model: aiModel,
    symbol: symbolValue, ticker: symbolValue,
    companyName: (pick.company_name || pick.companyName || symbolValue) as string, company_name: (pick.company_name || pick.companyName || symbolValue) as string,
    sector: (pick.sector || 'Unknown') as string,
    direction: (pick.direction || 'HOLD') as 'UP' | 'DOWN' | 'HOLD',
    confidence: (pick.confidence || 0) as number,
    entryPrice: (pick.entry_price || pick.entryPrice || 0) as number, entry_price: (pick.entry_price || pick.entryPrice || 0) as number,
    targetPrice: (pick.target_price || pick.targetPrice || 0) as number, target_price: (pick.target_price || pick.targetPrice || 0) as number,
    stopLoss: (pick.stop_loss || pick.stopLoss || 0) as number, stop_loss: (pick.stop_loss || pick.stopLoss || 0) as number,
    timeframe: (pick.timeframe || '1-3 months') as string, thesis: (pick.thesis || '') as string, reasoning: (pick.reasoning || '') as string,
    keyBullishFactors: (pick.key_bullish_factors || pick.keyBullishFactors || []) as string[], key_bullish_factors: (pick.key_bullish_factors || pick.keyBullishFactors || []) as string[],
    keyBearishFactors: (pick.key_bearish_factors || pick.keyBearishFactors || []) as string[], key_bearish_factors: (pick.key_bearish_factors || pick.keyBearishFactors || []) as string[],
    risks: (pick.risks || []) as string[], catalysts: (pick.catalysts || []) as string[],
    status: (pick.status || 'active') as 'active' | 'closed' | 'expired',
    actualExitPrice: pick.actual_exit_price as number | undefined, actual_exit_price: pick.actual_exit_price as number | undefined,
    actualReturn: pick.actual_return as number | undefined, actual_return: pick.actual_return as number | undefined,
    closedAt: pick.closed_at as string | undefined, closed_at: pick.closed_at as string | undefined,
    createdAt: (pick.created_at || pick.createdAt || new Date().toISOString()) as string, created_at: (pick.created_at || pick.createdAt || new Date().toISOString()) as string,
    updatedAt: (pick.updated_at || pick.updatedAt || new Date().toISOString()) as string, updated_at: (pick.updated_at || pick.updatedAt || new Date().toISOString()) as string,
    current_price: (pick.current_price || pick.currentPrice || null) as number | undefined, currentPrice: (pick.current_price || pick.currentPrice || null) as number | undefined,
    price_change_percent: (pick.price_change_percent || pick.priceChangePercent || null) as number | undefined, priceChangePercent: (pick.price_change_percent || pick.priceChangePercent || null) as number | undefined,
    ai_display_name: aiDisplayName,
    ai_color: aiColor
  };
}

export async function getAIModels(): Promise<AIModel[]> {
  try {
    const { data } = await supabase.from('ai_models').select('*').eq('is_active', true).order('display_name');
    if (data?.length) return data.map(m => ({ id: m.id, name: m.name, displayName: m.display_name, display_name: m.display_name, provider: m.provider, color: m.color, description: m.description, strengths: m.strengths || [], isActive: m.is_active, is_active: m.is_active }));
  } catch (e) {
    console.error('Error fetching AI models:', e);
  }
  return [
    { id: 'gpt4', name: 'gpt4', displayName: 'GPT-4', display_name: 'GPT-4', provider: 'openai', color: '#10b981', isActive: true, is_active: true },
    { id: 'claude', name: 'claude', displayName: 'Claude', display_name: 'Claude', provider: 'anthropic', color: '#8b5cf6', isActive: true, is_active: true },
    { id: 'gemini', name: 'gemini', displayName: 'Gemini', display_name: 'Gemini', provider: 'google', color: '#3b82f6', isActive: true, is_active: true },
    { id: 'perplexity', name: 'perplexity', displayName: 'Perplexity', display_name: 'Perplexity', provider: 'perplexity', color: '#06b6d4', isActive: true, is_active: true }
  ];
}

export async function getPicks(filters?: { aiModelId?: string; symbol?: string; status?: string; direction?: string; assetType?: AssetType; limit?: number }): Promise<StockPick[]> {
  try {
    let query = supabase.from('ai_stock_picks').select('*, ai_models(*)');
    if (filters?.aiModelId) query = query.eq('ai_model_id', filters.aiModelId);
    if (filters?.symbol) query = query.eq('symbol', filters.symbol.toUpperCase());
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.direction) query = query.eq('direction', filters.direction);
    if (filters?.assetType) query = query.eq('asset_type', filters.assetType);
    query = query.order('created_at', { ascending: false });
    if (filters?.limit) query = query.limit(filters.limit);
    
    const { data, error } = await query;
    if (error) {
      console.error('getPicks error:', error);
      // Fallback to stock_picks table
      let fallbackQuery = supabase.from('stock_picks').select('*, ai_models(*)');
      if (filters?.aiModelId) fallbackQuery = fallbackQuery.eq('ai_model_id', filters.aiModelId);
      if (filters?.symbol) fallbackQuery = fallbackQuery.eq('symbol', filters.symbol.toUpperCase());
      if (filters?.status) fallbackQuery = fallbackQuery.eq('status', filters.status);
      if (filters?.direction) fallbackQuery = fallbackQuery.eq('direction', filters.direction);
      if (filters?.assetType) fallbackQuery = fallbackQuery.eq('asset_type', filters.assetType);
      fallbackQuery = fallbackQuery.order('created_at', { ascending: false });
      if (filters?.limit) fallbackQuery = fallbackQuery.limit(filters.limit);
      const fallbackResult = await fallbackQuery;
      if (fallbackResult.data) {
        return enrichPicksWithPrices(fallbackResult.data.map(normalizePick));
      }
      return [];
    }
    
    // Enrich picks with current prices
    const picks = (data || []).map(normalizePick);
    return enrichPicksWithPrices(picks);
  } catch (e) { 
    console.error('Error in getPicks:', e); 
    return []; 
  }
}

// Enrich picks with current prices and calculate price change
async function enrichPicksWithPrices(picks: StockPick[]): Promise<StockPick[]> {
  const uniqueSymbols = [...new Set(picks.map(p => p.symbol))];
  const priceMap = new Map<string, number>();
  
  // Fetch prices for all unique symbols (batch)
  await Promise.all(
    uniqueSymbols.slice(0, 10).map(async (symbol) => { // Limit to 10 to avoid rate limits
      const price = await fetchCurrentPrice(symbol);
      if (price) priceMap.set(symbol, price);
    })
  );
  
  // Enrich picks with fetched prices
  return picks.map(pick => {
    const currentPrice = priceMap.get(pick.symbol) || pick.current_price || pick.entry_price;
    const entryPrice = pick.entry_price || pick.entryPrice || 0;
    const priceChange = entryPrice > 0 ? ((currentPrice - entryPrice) / entryPrice) * 100 : 0;
    
    return {
      ...pick,
      current_price: currentPrice,
      currentPrice: currentPrice,
      price_change_percent: priceChange,
      priceChangePercent: priceChange
    };
  });
}

export async function getStockPicks(filters?: { aiModelId?: string; status?: string; limit?: number }): Promise<StockPick[]> { return getPicks({ ...filters, assetType: 'stock' as AssetType }); }
export async function getPennyStockPicks(filters?: { aiModelId?: string; status?: string; limit?: number }): Promise<StockPick[]> { return getPicks({ ...filters, assetType: 'penny_stock' as AssetType }); }
export async function getCryptoPicks(filters?: { aiModelId?: string; status?: string; limit?: number }): Promise<StockPick[]> { return getPicks({ ...filters, assetType: 'crypto' }); }
export async function getAllStockPicks(): Promise<StockPick[]> { return getPicks(); }

export async function getAIStatistics(assetType?: AssetType): Promise<AIStatistics[]> {
  const models = await getAIModels();
  const picks = assetType ? await getPicks({ status: 'closed', assetType }) : await getPicks({ status: 'closed' });
  return models.map(model => {
    const modelPicks = picks.filter(p => (p.aiModelId || p.ai_model_id) === model.id);
    const winningPicks = modelPicks.filter(p => ((p.actualReturn || p.actual_return) || 0) > 0);
    const losingPicks = modelPicks.filter(p => ((p.actualReturn || p.actual_return) || 0) < 0);
    const totalReturn = modelPicks.reduce((sum, p) => sum + ((p.actualReturn || p.actual_return) || 0), 0);
    const avgReturn = modelPicks.length > 0 ? totalReturn / modelPicks.length : 0;
    const avgConfidence = modelPicks.length > 0 ? modelPicks.reduce((sum, p) => sum + p.confidence, 0) / modelPicks.length : 0;
    let streak = 0, streakType: 'winning' | 'losing' | 'none' = 'none';
    const sortedPicks = [...modelPicks].sort((a, b) => new Date(b.createdAt || b.created_at || '').getTime() - new Date(a.createdAt || a.created_at || '').getTime());
    for (const pick of sortedPicks) {
      const isWin = ((pick.actualReturn || pick.actual_return) || 0) > 0;
      if (streak === 0) { streakType = isWin ? 'winning' : 'losing'; streak = 1; }
      else if ((isWin && streakType === 'winning') || (!isWin && streakType === 'losing')) streak++;
      else break;
    }
    return { aiModelId: model.id, displayName: model.displayName || model.display_name || model.name, color: model.color, totalPicks: modelPicks.length, winningPicks: winningPicks.length, losingPicks: losingPicks.length, winRate: modelPicks.length > 0 ? (winningPicks.length / modelPicks.length) * 100 : 0, avgConfidence: Math.round(avgConfidence), avgReturn, totalProfitLossPercent: totalReturn, bestPick: [...modelPicks].sort((a, b) => ((b.actualReturn || b.actual_return) || 0) - ((a.actualReturn || a.actual_return) || 0))[0], worstPick: [...modelPicks].sort((a, b) => ((a.actualReturn || a.actual_return) || 0) - ((b.actualReturn || b.actual_return) || 0))[0], recentStreak: streak, streakType };
  }).sort((a, b) => b.totalProfitLossPercent - a.totalProfitLossPercent);
}

export async function getOverallStats(): Promise<OverallStats> {
  const allPicks = await getPicks();
  const closedPicks = allPicks.filter(p => p.status === 'closed');
  const activePicks = allPicks.filter(p => p.status === 'active');
  const winningPicks = closedPicks.filter(p => ((p.actualReturn || p.actual_return) || 0) > 0);
  const totalReturn = closedPicks.reduce((sum, p) => sum + ((p.actualReturn || p.actual_return) || 0), 0);
  const avgConfidence = allPicks.length > 0 ? allPicks.reduce((sum, p) => sum + p.confidence, 0) / allPicks.length : 0;
  const stats = await getAIStatistics();
  const topAIModel = stats.length > 0 ? stats[0] : null;
  const sortedByReturn = [...closedPicks].sort((a, b) => ((b.actualReturn || b.actual_return) || 0) - ((a.actualReturn || a.actual_return) || 0));
  return {
    totalPicks: allPicks.length, activePicks: activePicks.length, closedPicks: closedPicks.length,
    winRate: closedPicks.length > 0 ? (winningPicks.length / closedPicks.length) * 100 : 0,
    avgConfidence: Math.round(avgConfidence), totalProfitLoss: totalReturn,
    topAI: topAIModel?.displayName || 'N/A',
    bestPick: sortedByReturn[0] || null, worstPick: sortedByReturn[sortedByReturn.length - 1] || null
  };
}

// NEW FUNCTION: Get Competition Leaderboard
export async function getCompetitionLeaderboard(assetType?: AssetType): Promise<CompetitionLeaderboard[]> {
  const stats = await getAIStatistics(assetType);
  
  return stats.map((stat, index) => {
    // Determine badges based on performance
    const badges: string[] = [];
    if (index === 0) badges.push('🏆 Champion');
    if (stat.winRate >= 70) badges.push('🎯 Sharpshooter');
    if (stat.recentStreak >= 5) badges.push('🔥 On Fire');
    if (stat.avgReturn >= 10) badges.push('💰 Big Winner');
    if (stat.totalPicks >= 50) badges.push('📊 Veteran');
    
    return {
      rank: index + 1,
      aiModelId: stat.aiModelId,
      displayName: stat.displayName,
      color: stat.color,
      totalPicks: stat.totalPicks,
      wins: stat.winningPicks,
      losses: stat.losingPicks,
      winRate: stat.winRate,
      totalReturn: stat.totalProfitLossPercent,
      avgReturn: stat.avgReturn,
      bestPick: stat.bestPick ? { 
        symbol: stat.bestPick.symbol, 
        return: stat.bestPick.actualReturn || stat.bestPick.actual_return || 0 
      } : undefined,
      streak: stat.recentStreak,
      streakType: stat.streakType,
      badges
    };
  });
}

// NEW FUNCTION: Get Recent Winners (closed picks with positive returns)
export async function getRecentWinners(limit: number = 10): Promise<RecentWinner[]> {
  try {
    const { data, error } = await supabase
      .from('ai_stock_picks')
      .select('*, ai_models(*)')
      .eq('status', 'closed')
      .gt('actual_return', 0)
      .order('closed_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      // Fallback to stock_picks table
      const { data: fallbackData } = await supabase
        .from('stock_picks')
        .select('*, ai_models(*)')
        .eq('status', 'closed')
        .gt('actual_return', 0)
        .order('closed_at', { ascending: false })
        .limit(limit);
      
      if (fallbackData?.length) {
        return fallbackData.map(pick => ({
          id: pick.id,
          symbol: pick.symbol || pick.ticker,
          companyName: pick.company_name || pick.companyName || pick.symbol,
          aiModelId: pick.ai_model_id,
          aiDisplayName: pick.ai_models?.display_name || pick.ai_models?.name || 'AI',
          aiColor: pick.ai_models?.color || '#6366f1',
          actualReturn: pick.actual_return || 0,
          closedAt: pick.closed_at || new Date().toISOString(),
          direction: pick.direction || 'UP'
        }));
      }
      return [];
    }
    
    return (data || []).map(pick => ({
      id: pick.id,
      symbol: pick.symbol || pick.ticker,
      companyName: pick.company_name || pick.companyName || pick.symbol,
      aiModelId: pick.ai_model_id,
      aiDisplayName: pick.ai_models?.display_name || pick.ai_models?.name || 'AI',
      aiColor: pick.ai_models?.color || '#6366f1',
      actualReturn: pick.actual_return || 0,
      closedAt: pick.closed_at || new Date().toISOString(),
      direction: pick.direction || 'UP'
    }));
  } catch (e) {
    console.error('Error in getRecentWinners:', e);
    return [];
  }
}

export async function searchStocks(query: string): Promise<StockInfo[]> {
  if (!query || query.length < 1) return [];
  const upper = query.toUpperCase(), lower = query.toLowerCase();
  try { 
    const { data } = await supabase.from('stocks').select('symbol, name, exchange, sector, industry').or(`symbol.ilike.%${upper}%,name.ilike.%${lower}%`).limit(20); 
    if (data?.length) return data; 
  } catch (e) {
    console.error('Error searching stocks:', e);
  }
  return [
    { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', sector: 'Technology', assetType: 'stock' as AssetType },
    { symbol: 'MSFT', name: 'Microsoft', exchange: 'NASDAQ', sector: 'Technology', assetType: 'stock' as AssetType },
    { symbol: 'NVDA', name: 'NVIDIA', exchange: 'NASDAQ', sector: 'Technology', assetType: 'stock' as AssetType },
    { symbol: 'GOOGL', name: 'Alphabet', exchange: 'NASDAQ', sector: 'Technology', assetType: 'stock' as AssetType },
    { symbol: 'AMZN', name: 'Amazon', exchange: 'NASDAQ', sector: 'Consumer Cyclical', assetType: 'stock' as AssetType },
    { symbol: 'TSLA', name: 'Tesla', exchange: 'NASDAQ', sector: 'Automotive', assetType: 'stock' as AssetType }
  ].filter(s => s.symbol.includes(upper) || s.name.toLowerCase().includes(lower));
}

export async function searchCrypto(query: string): Promise<CryptoInfo[]> {
  if (!query || query.length < 1) return [];
  const upper = query.toUpperCase(), lower = query.toLowerCase();
  return [
    { symbol: 'BTC', name: 'Bitcoin', exchange: 'Crypto' },
    { symbol: 'ETH', name: 'Ethereum', exchange: 'Crypto' },
    { symbol: 'SOL', name: 'Solana', exchange: 'Crypto' },
    { symbol: 'XRP', name: 'Ripple', exchange: 'Crypto' },
    { symbol: 'DOGE', name: 'Dogecoin', exchange: 'Crypto' }
  ].filter(c => c.symbol.includes(upper) || c.name.toLowerCase().includes(lower));
}

export async function searchPennyStocks(query: string): Promise<StockInfo[]> {
  if (!query || query.length < 1) return [];
  const upper = query.toUpperCase(), lower = query.toLowerCase();
  return [
    { symbol: 'SNDL', name: 'Sundial Growers', exchange: 'NASDAQ', sector: 'Healthcare', assetType: 'penny_stock' as AssetType },
    { symbol: 'NAKD', name: 'Naked Brands', exchange: 'NASDAQ', sector: 'Retail', assetType: 'penny_stock' as AssetType },
    { symbol: 'CTRM', name: 'Castor Maritime', exchange: 'NASDAQ', sector: 'Shipping', assetType: 'penny_stock' as AssetType }
  ].filter(s => s.symbol.includes(upper) || s.name.toLowerCase().includes(lower));
}

export async function getHotPicks(limit: number = 10, assetType?: AssetType): Promise<StockPick[]> { return getPicks({ status: 'active', limit, assetType }); }
export async function getHotStocks(limit: number = 10): Promise<StockPick[]> { return getHotPicks(limit, 'stock'); }
export async function getHotPennyStocks(limit: number = 10): Promise<StockPick[]> { return getHotPicks(limit, 'penny_stock'); }
export async function getHotCrypto(limit: number = 10): Promise<StockPick[]> { return getHotPicks(limit, 'crypto'); }

export async function savePick(pick: Partial<StockPick>): Promise<StockPick | null> {
  try {
    const { data, error } = await supabase.from('ai_stock_picks').insert({ 
      ai_model_id: pick.aiModelId || pick.ai_model_id, 
      asset_type: pick.assetType || pick.asset_type || 'stock', 
      symbol: (pick.symbol || pick.ticker || '').toUpperCase(), 
      company_name: pick.companyName || pick.company_name, 
      sector: pick.sector, 
      direction: pick.direction, 
      confidence: pick.confidence, 
      entry_price: pick.entryPrice || pick.entry_price, 
      target_price: pick.targetPrice || pick.target_price, 
      stop_loss: pick.stopLoss || pick.stop_loss, 
      timeframe: pick.timeframe, 
      thesis: pick.thesis, 
      reasoning: pick.reasoning, 
      key_bullish_factors: pick.keyBullishFactors || pick.key_bullish_factors, 
      key_bearish_factors: pick.keyBearishFactors || pick.key_bearish_factors, 
      risks: pick.risks, 
      catalysts: pick.catalysts, 
      status: 'active' 
    }).select().single();
    if (error) { console.error('Error:', error); return null; }
    return data ? normalizePick(data) : null;
  } catch (e) { console.error('Error in savePick:', e); return null; }
}
