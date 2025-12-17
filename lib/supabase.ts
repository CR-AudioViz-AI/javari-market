// ============================================================================
// MARKET ORACLE - COMPLETE SUPABASE CLIENT
// Multi-Asset: Penny Stocks, Stocks, Crypto + Competition
// ALL exports + ALL aliases for backwards compatibility
// Fixed: 2025-12-17 12:10 EST
// ============================================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kteobfyferrukqeolofj.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0ZW9iZnlmZXJydWtxZW9sb2ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxOTcyNjYsImV4cCI6MjA3NzU1NzI2Nn0.uy-jlF_z6qVb8qogsNyGDLHqT4HhmdRhLrW7zPv3qhY';

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let browserClient: SupabaseClient | null = null;
export function createSupabaseBrowserClient(): SupabaseClient {
  if (typeof window === 'undefined') return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  if (!browserClient) {
    browserClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
  }
  return browserClient;
}

export function createSupabaseServerClient(): SupabaseClient {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return createClient(SUPABASE_URL, serviceKey);
}

export { SUPABASE_URL, SUPABASE_ANON_KEY };

export type AssetType = 'stock' | 'penny_stock' | 'crypto';
export const ASSET_TYPES = { STOCK: 'stock' as AssetType, PENNY_STOCK: 'penny_stock' as AssetType, CRYPTO: 'crypto' as AssetType };

export interface AIModel {
  id: string; name: string; displayName: string; display_name: string;
  provider: string; color: string; description: string; strengths: string[];
  isActive: boolean; is_active: boolean;
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

export interface StockInfo { symbol: string; name: string; exchange: string; sector?: string; industry?: string; assetType?: AssetType; }
export interface CryptoInfo { symbol: string; name: string; exchange: string; marketCap?: number; }

export interface OverallStats {
  totalPicks: number; activePicks: number; closedPicks: number;
  overallWinRate: number; totalReturn: number; avgConfidence: number;
  bestAI: string; worstAI: string;
  stockPicks: number; pennyStockPicks: number; cryptoPicks: number;
}

export interface CompetitionLeaderboard {
  aiModelId: string; displayName: string; color: string;
  totalPoints: number; stockPoints: number; pennyStockPoints: number; cryptoPoints: number;
  rank: number; previousRank?: number; streak: number;
}

export const AI_MODELS: AIModel[] = [
  { id: 'gpt4', name: 'gpt4', displayName: 'GPT-4', display_name: 'GPT-4', provider: 'OpenAI', color: '#10B981', description: 'Conservative analysis', strengths: ['Fundamental Analysis'], isActive: true, is_active: true },
  { id: 'claude', name: 'claude', displayName: 'Claude', display_name: 'Claude', provider: 'Anthropic', color: '#F59E0B', description: 'Balanced analysis', strengths: ['Risk Analysis'], isActive: true, is_active: true },
  { id: 'gemini', name: 'gemini', displayName: 'Gemini', display_name: 'Gemini', provider: 'Google', color: '#3B82F6', description: 'Technical patterns', strengths: ['Technical Analysis'], isActive: true, is_active: true },
  { id: 'perplexity', name: 'perplexity', displayName: 'Perplexity', display_name: 'Perplexity', provider: 'Perplexity AI', color: '#8B5CF6', description: 'Real-time data', strengths: ['News Analysis'], isActive: true, is_active: true }
];

function normalizePick(pick: any): StockPick {
  const aiModel = pick.ai_models || pick.aiModel || pick.ai_model;
  const aiDisplayName = aiModel?.display_name || aiModel?.displayName || aiModel?.name || '';
  const aiColor = aiModel?.color || '#6366f1';
  const symbolValue = pick.symbol || pick.ticker || '';
  const assetTypeValue = pick.asset_type || pick.assetType || 'stock';
  
  return {
    id: pick.id,
    assetType: assetTypeValue, asset_type: assetTypeValue,
    aiModelId: pick.ai_model_id || pick.aiModelId || '', ai_model_id: pick.ai_model_id || pick.aiModelId || '',
    aiModel: aiModel, ai_model: aiModel,
    symbol: symbolValue, ticker: symbolValue,
    companyName: pick.company_name || pick.companyName || symbolValue, company_name: pick.company_name || pick.companyName || symbolValue,
    sector: pick.sector || 'Unknown',
    direction: pick.direction || 'UP',
    confidence: pick.confidence || 0,
    entryPrice: pick.entry_price || pick.entryPrice || 0, entry_price: pick.entry_price || pick.entryPrice || 0,
    targetPrice: pick.target_price || pick.targetPrice || 0, target_price: pick.target_price || pick.targetPrice || 0,
    stopLoss: pick.stop_loss || pick.stopLoss || 0, stop_loss: pick.stop_loss || pick.stopLoss || 0,
    timeframe: pick.timeframe || '1-3 months', thesis: pick.thesis || '', reasoning: pick.reasoning || '',
    keyBullishFactors: pick.key_bullish_factors || pick.keyBullishFactors || [], key_bullish_factors: pick.key_bullish_factors || pick.keyBullishFactors || [],
    keyBearishFactors: pick.key_bearish_factors || pick.keyBearishFactors || [], key_bearish_factors: pick.key_bearish_factors || pick.keyBearishFactors || [],
    risks: pick.risks || [], catalysts: pick.catalysts || [],
    status: pick.status || 'active',
    actualExitPrice: pick.actual_exit_price || pick.actualExitPrice, actual_exit_price: pick.actual_exit_price || pick.actualExitPrice,
    actualReturn: pick.actual_return || pick.actualReturn, actual_return: pick.actual_return || pick.actualReturn,
    closedAt: pick.closed_at || pick.closedAt, closed_at: pick.closed_at || pick.closedAt,
    createdAt: pick.created_at || pick.createdAt || new Date().toISOString(), created_at: pick.created_at || pick.createdAt || new Date().toISOString(),
    updatedAt: pick.updated_at || pick.updatedAt || new Date().toISOString(), updated_at: pick.updated_at || pick.updatedAt || new Date().toISOString(),
    current_price: pick.current_price || pick.currentPrice, currentPrice: pick.current_price || pick.currentPrice,
    price_change_percent: pick.price_change_percent || pick.priceChangePercent, priceChangePercent: pick.price_change_percent || pick.priceChangePercent,
    ai_display_name: aiDisplayName,
    ai_color: aiColor
  };
}

export async function getAIModels(): Promise<AIModel[]> {
  try {
    const { data } = await supabase.from('ai_models').select('*').eq('is_active', true).order('display_name');
    if (data?.length) return data.map(m => ({ id: m.id, name: m.name, displayName: m.display_name, display_name: m.display_name, provider: m.provider, color: m.color, description: m.description, strengths: m.strengths || [], isActive: m.is_active, is_active: m.is_active }));
  } catch (e) { console.log('Using in-memory AI models'); }
  return AI_MODELS;
}

export async function getPicks(filters?: { aiModelId?: string; symbol?: string; status?: string; direction?: string; assetType?: AssetType; limit?: number }): Promise<StockPick[]> {
  try {
    let query = supabase.from('stock_picks').select('*, ai_models(*)');
    if (filters?.aiModelId) query = query.eq('ai_model_id', filters.aiModelId);
    if (filters?.symbol) query = query.eq('symbol', filters.symbol.toUpperCase());
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.direction) query = query.eq('direction', filters.direction);
    if (filters?.assetType) query = query.eq('asset_type', filters.assetType);
    query = query.order('created_at', { ascending: false });
    if (filters?.limit) query = query.limit(filters.limit);
    const { data, error } = await query;
    if (error) { console.error('Error:', error); return []; }
    return (data || []).map(normalizePick);
  } catch (e) { console.error('Error in getPicks:', e); return []; }
}

export async function getStockPicks(filters?: { aiModelId?: string; status?: string; limit?: number }): Promise<StockPick[]> { return getPicks({ ...filters, assetType: 'stock' }); }
export async function getPennyStockPicks(filters?: { aiModelId?: string; status?: string; limit?: number }): Promise<StockPick[]> { return getPicks({ ...filters, assetType: 'penny_stock' }); }
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
  return { totalPicks: allPicks.length, activePicks: activePicks.length, closedPicks: closedPicks.length, overallWinRate: closedPicks.length > 0 ? (winningPicks.length / closedPicks.length) * 100 : 0, totalReturn, avgConfidence: Math.round(avgConfidence), bestAI: stats[0]?.displayName || 'N/A', worstAI: stats[stats.length - 1]?.displayName || 'N/A', stockPicks: allPicks.filter(p => p.assetType === 'stock' || p.asset_type === 'stock').length, pennyStockPicks: allPicks.filter(p => p.assetType === 'penny_stock' || p.asset_type === 'penny_stock').length, cryptoPicks: allPicks.filter(p => p.assetType === 'crypto' || p.asset_type === 'crypto').length };
}

export async function getRecentWinners(limit: number = 5, assetType?: AssetType): Promise<StockPick[]> {
  const closedPicks = assetType ? await getPicks({ status: 'closed', assetType }) : await getPicks({ status: 'closed' });
  return closedPicks.filter(p => ((p.actualReturn || p.actual_return) || 0) > 0).sort((a, b) => new Date(b.closedAt || b.closed_at || b.createdAt || '').getTime() - new Date(a.closedAt || a.closed_at || a.createdAt || '').getTime()).slice(0, limit);
}

export async function getCompetitionLeaderboard(): Promise<CompetitionLeaderboard[]> {
  const models = await getAIModels();
  const [stockStats, pennyStats, cryptoStats] = await Promise.all([getAIStatistics('stock'), getAIStatistics('penny_stock'), getAIStatistics('crypto')]);
  const calcPoints = (stats?: AIStatistics) => { if (!stats || stats.totalPicks === 0) return 0; return stats.winRate * 0.4 + Math.max(0, stats.avgReturn * 10) * 0.4 + (stats.streakType === 'winning' ? stats.recentStreak * 5 : 0); };
  const leaderboard = models.map(model => {
    const stock = stockStats.find(s => s.aiModelId === model.id), penny = pennyStats.find(s => s.aiModelId === model.id), crypto = cryptoStats.find(s => s.aiModelId === model.id);
    const stockPoints = calcPoints(stock), pennyStockPoints = calcPoints(penny), cryptoPoints = calcPoints(crypto);
    return { aiModelId: model.id, displayName: model.displayName || model.display_name, color: model.color, totalPoints: stockPoints + pennyStockPoints + cryptoPoints, stockPoints, pennyStockPoints, cryptoPoints, rank: 0, streak: Math.max(stock?.streakType === 'winning' ? stock.recentStreak : 0, penny?.streakType === 'winning' ? penny.recentStreak : 0, crypto?.streakType === 'winning' ? crypto.recentStreak : 0) };
  });
  leaderboard.sort((a, b) => b.totalPoints - a.totalPoints);
  leaderboard.forEach((item, i) => { item.rank = i + 1; });
  return leaderboard;
}

export async function searchStocks(query: string): Promise<StockInfo[]> {
  if (!query || query.length < 1) return [];
  const upper = query.toUpperCase(), lower = query.toLowerCase();
  try { const { data } = await supabase.from('stocks').select('symbol, name, exchange, sector, industry').or(`symbol.ilike.%${upper}%,name.ilike.%${lower}%`).limit(20); if (data?.length) return data; } catch (e) {}
  return [{ symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', sector: 'Technology', assetType: 'stock' }, { symbol: 'MSFT', name: 'Microsoft', exchange: 'NASDAQ', sector: 'Technology', assetType: 'stock' }, { symbol: 'NVDA', name: 'NVIDIA', exchange: 'NASDAQ', sector: 'Technology', assetType: 'stock' }].filter(s => s.symbol.includes(upper) || s.name.toLowerCase().includes(lower));
}

export async function searchCrypto(query: string): Promise<CryptoInfo[]> {
  if (!query || query.length < 1) return [];
  const upper = query.toUpperCase(), lower = query.toLowerCase();
  return [{ symbol: 'BTC', name: 'Bitcoin', exchange: 'Crypto' }, { symbol: 'ETH', name: 'Ethereum', exchange: 'Crypto' }, { symbol: 'SOL', name: 'Solana', exchange: 'Crypto' }].filter(c => c.symbol.includes(upper) || c.name.toLowerCase().includes(lower));
}

export async function searchPennyStocks(query: string): Promise<StockInfo[]> {
  if (!query || query.length < 1) return [];
  const upper = query.toUpperCase(), lower = query.toLowerCase();
  return [{ symbol: 'SNDL', name: 'Sundial Growers', exchange: 'NASDAQ', sector: 'Healthcare', assetType: 'penny_stock' }].filter(s => s.symbol.includes(upper) || s.name.toLowerCase().includes(lower));
}

export async function getHotPicks(limit: number = 10, assetType?: AssetType): Promise<StockPick[]> { return getPicks({ status: 'active', limit, assetType }); }
export async function getHotStocks(limit: number = 10): Promise<StockPick[]> { return getHotPicks(limit, 'stock'); }
export async function getHotPennyStocks(limit: number = 10): Promise<StockPick[]> { return getHotPicks(limit, 'penny_stock'); }
export async function getHotCrypto(limit: number = 10): Promise<StockPick[]> { return getHotPicks(limit, 'crypto'); }

export async function savePick(pick: Partial<StockPick>): Promise<StockPick | null> {
  try {
    const { data, error } = await supabase.from('stock_picks').insert({ ai_model_id: pick.aiModelId || pick.ai_model_id, asset_type: pick.assetType || pick.asset_type || 'stock', symbol: (pick.symbol || pick.ticker || '').toUpperCase(), company_name: pick.companyName || pick.company_name, sector: pick.sector, direction: pick.direction, confidence: pick.confidence, entry_price: pick.entryPrice || pick.entry_price, target_price: pick.targetPrice || pick.target_price, stop_loss: pick.stopLoss || pick.stop_loss, timeframe: pick.timeframe, thesis: pick.thesis, reasoning: pick.reasoning, key_bullish_factors: pick.keyBullishFactors || pick.key_bullish_factors, key_bearish_factors: pick.keyBearishFactors || pick.key_bearish_factors, risks: pick.risks, catalysts: pick.catalysts, status: 'active' }).select().single();
    if (error) { console.error('Error:', error); return null; }
    return data ? normalizePick(data) : null;
  } catch (e) { console.error('Error in savePick:', e); return null; }
}
