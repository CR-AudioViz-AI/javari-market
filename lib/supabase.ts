import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database
export type StockPick = {
  id: string
  battle_id: string
  ai_model_id: string
  ai_name: string
  symbol: string
  entry_price: number
  target_price: number
  confidence_score: number
  reasoning: string
  status: 'OPEN' | 'CLOSED'
  pick_date: string
  created_at: string
}

export type AIModel = {
  id: string
  ai_name: string
  display_name: string
  provider: string
  is_active: boolean
  color_primary: string
  color_secondary: string
}

// Fetch all stock picks
export async function getAllStockPicks() {
  const { data, error } = await supabase
    .from('stock_picks')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data as StockPick[]
}

// Fetch stock picks by AI
export async function getStockPicksByAI(aiName: string) {
  const { data, error } = await supabase
    .from('stock_picks')
    .select('*')
    .eq('ai_name', aiName)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data as StockPick[]
}

// Fetch AI models
export async function getAIModels() {
  const { data, error } = await supabase
    .from('ai_models')
    .select('*')
    .eq('is_active', true)
    .order('display_name')
  
  if (error) throw error
  return data as AIModel[]
}

// Get hot picks (consensus picks)
export async function getHotPicks() {
  const picks = await getAllStockPicks()
  
  // Group by symbol
  const symbolMap = new Map<string, StockPick[]>()
  picks.forEach(pick => {
    if (!symbolMap.has(pick.symbol)) {
      symbolMap.set(pick.symbol, [])
    }
    symbolMap.get(pick.symbol)!.push(pick)
  })
  
  // Find stocks picked by 3+ AIs
  const hotPicks = Array.from(symbolMap.entries())
    .filter(([_, picks]) => picks.length >= 3)
    .map(([symbol, picks]) => ({
      symbol,
      picks,
      consensus: picks.length,
      avgConfidence: picks.reduce((sum, p) => sum + p.confidence_score, 0) / picks.length,
      aiNames: picks.map(p => p.ai_name)
    }))
    .sort((a, b) => b.consensus - a.consensus)
  
  return hotPicks
}

// Calculate AI statistics
export async function getAIStatistics() {
  const picks = await getAllStockPicks()
  
  const stats = new Map<string, {
    totalPicks: number
    avgConfidence: number
    openPicks: number
    closedPicks: number
  }>()
  
  picks.forEach(pick => {
    if (!stats.has(pick.ai_name)) {
      stats.set(pick.ai_name, {
        totalPicks: 0,
        avgConfidence: 0,
        openPicks: 0,
        closedPicks: 0
      })
    }
    
    const aiStats = stats.get(pick.ai_name)!
    aiStats.totalPicks++
    aiStats.avgConfidence += pick.confidence_score
    if (pick.status === 'OPEN') aiStats.openPicks++
    else aiStats.closedPicks++
  })
  
  // Calculate averages
  stats.forEach(stat => {
    stat.avgConfidence = stat.avgConfidence / stat.totalPicks
  })
  
  return Array.from(stats.entries()).map(([aiName, stat]) => ({
    aiName,
    ...stat
  }))
}
