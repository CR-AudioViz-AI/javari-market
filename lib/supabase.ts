import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database
export type StockPick = {
  id: string
  competition_id: string
  ai_model_id: string
  ticker: string
  pick_date: string
  week_number: number
  direction: 'UP' | 'DOWN' | 'HOLD'
  confidence: number
  entry_price: number
  target_price: number
  stop_loss: number
  reasoning: string
  current_price: number | null
  price_change_percent: number | null
  status: 'active' | 'won' | 'lost' | 'expired'
  result: string | null
  profit_loss: number | null
  points_earned: number | null
  expiry_date: string
  closed_at: string | null
  created_at: string
  updated_at: string
  // Joined field
  ai_name?: string
}

export type AIModel = {
  id: string
  name: string
  display_name: string
  provider: string
  model_id: string
  description: string
  color: string
  is_active: boolean
  total_picks: number
  total_wins: number
  total_losses: number
  win_rate: number
  total_profit_loss: number
  created_at: string
}

// Fetch all stock picks with AI name
export async function getAllStockPicks() {
  const { data, error } = await supabase
    .from('stock_picks')
    .select(`
      *,
      ai_models (name, display_name, color)
    `)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching picks:', error)
    return []
  }
  
  // Map to include ai_name for backward compatibility
  return (data || []).map(pick => ({
    ...pick,
    ai_name: pick.ai_models?.display_name || pick.ai_models?.name || 'Unknown',
    symbol: pick.ticker, // backward compatibility
    confidence_score: pick.confidence, // backward compatibility
  }))
}

// Fetch stock picks by AI
export async function getStockPicksByAI(aiName: string) {
  const { data: aiModel } = await supabase
    .from('ai_models')
    .select('id')
    .eq('name', aiName)
    .single()
  
  if (!aiModel) return []
  
  const { data, error } = await supabase
    .from('stock_picks')
    .select(`*, ai_models (name, display_name, color)`)
    .eq('ai_model_id', aiModel.id)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching picks by AI:', error)
    return []
  }
  
  return (data || []).map(pick => ({
    ...pick,
    ai_name: pick.ai_models?.display_name || aiName,
    symbol: pick.ticker,
    confidence_score: pick.confidence,
  }))
}

// Fetch stock picks with optional filters
export async function getStockPicks(filters?: { symbol?: string; aiName?: string; status?: string }) {
  let query = supabase
    .from('stock_picks')
    .select(`*, ai_models (name, display_name, color)`)
  
  if (filters?.symbol) {
    query = query.eq('ticker', filters.symbol.toUpperCase())
  }
  
  if (filters?.status) {
    query = query.eq('status', filters.status)
  }
  
  query = query.order('created_at', { ascending: false })
  
  const { data, error } = await query
  
  if (error) {
    console.error('Error fetching picks:', error)
    return []
  }
  
  let result = (data || []).map(pick => ({
    ...pick,
    ai_name: pick.ai_models?.display_name || 'Unknown',
    symbol: pick.ticker,
    confidence_score: pick.confidence,
  }))
  
  // Filter by AI name if specified
  if (filters?.aiName) {
    result = result.filter(p => p.ai_name.toLowerCase().includes(filters.aiName!.toLowerCase()))
  }
  
  return result
}

// Fetch AI models
export async function getAIModels() {
  const { data, error } = await supabase
    .from('ai_models')
    .select('*')
    .eq('is_active', true)
    .order('display_name')
  
  if (error) {
    console.error('Error fetching AI models:', error)
    return []
  }
  
  return data as AIModel[]
}

// Get hot picks (consensus picks)
export async function getHotPicks() {
  const picks = await getAllStockPicks()
  
  // Group by ticker
  const tickerMap = new Map<string, typeof picks>()
  picks.forEach(pick => {
    const ticker = pick.ticker || pick.symbol
    if (!tickerMap.has(ticker)) {
      tickerMap.set(ticker, [])
    }
    tickerMap.get(ticker)!.push(pick)
  })
  
  // Find stocks picked by 2+ AIs
  const hotPicks = Array.from(tickerMap.entries())
    .filter(([_, picks]) => picks.length >= 2)
    .map(([ticker, picks]) => ({
      symbol: ticker,
      ticker,
      picks,
      consensus: picks.length,
      avgConfidence: picks.reduce((sum, p) => sum + (p.confidence || p.confidence_score || 0), 0) / picks.length,
      aiNames: picks.map(p => p.ai_name)
    }))
    .sort((a, b) => b.consensus - a.consensus)
  
  return hotPicks
}

// Calculate AI statistics
export async function getAIStatistics() {
  const { data: aiModels, error } = await supabase
    .from('ai_models')
    .select('*')
    .eq('is_active', true)
  
  if (error) {
    console.error('Error fetching AI stats:', error)
    return []
  }
  
  return (aiModels || []).map(ai => ({
    aiName: ai.display_name || ai.name,
    totalPicks: ai.total_picks || 0,
    avgConfidence: 75, // Default
    openPicks: 0,
    closedPicks: ai.total_wins + ai.total_losses,
    winRate: ai.win_rate || 0,
    totalWins: ai.total_wins || 0,
    totalLosses: ai.total_losses || 0,
    color: ai.color,
  }))
}
