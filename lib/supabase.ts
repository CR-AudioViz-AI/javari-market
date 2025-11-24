import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types matching frontend expectations
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
  // Additional fields from new schema
  direction?: string
  stop_loss?: number
  current_price?: number
  profit_loss?: number
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

// Map database row to frontend format
function mapPickToFrontend(row: any): StockPick {
  return {
    id: row.id,
    battle_id: row.competition_id || row.battle_id || '',
    ai_model_id: row.ai_model_id || '',
    ai_name: row.ai_models?.display_name || row.ai_models?.name || row.ai_name || 'Unknown',
    symbol: row.ticker || row.symbol || '',
    entry_price: row.entry_price || 0,
    target_price: row.target_price || 0,
    confidence_score: row.confidence || row.confidence_score || 0,
    reasoning: row.reasoning || '',
    status: row.status === 'active' ? 'OPEN' : 'CLOSED',
    pick_date: row.pick_date || row.created_at || '',
    created_at: row.created_at || '',
    direction: row.direction,
    stop_loss: row.stop_loss,
    current_price: row.current_price,
    profit_loss: row.profit_loss,
  }
}

// Fetch all stock picks
export async function getAllStockPicks(): Promise<StockPick[]> {
  try {
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
    
    return (data || []).map(mapPickToFrontend)
  } catch (e) {
    console.error('Exception fetching picks:', e)
    return []
  }
}

// Fetch stock picks by AI
export async function getStockPicksByAI(aiName: string): Promise<StockPick[]> {
  try {
    // First get the AI model ID
    const { data: aiModel } = await supabase
      .from('ai_models')
      .select('id')
      .or(`name.eq.${aiName},display_name.eq.${aiName}`)
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
    
    return (data || []).map(mapPickToFrontend)
  } catch (e) {
    console.error('Exception:', e)
    return []
  }
}

// Fetch stock picks with filters
export async function getStockPicks(filters?: { symbol?: string; aiName?: string; status?: string }): Promise<StockPick[]> {
  try {
    let query = supabase
      .from('stock_picks')
      .select(`*, ai_models (name, display_name, color)`)
    
    if (filters?.symbol) {
      query = query.eq('ticker', filters.symbol.toUpperCase())
    }
    
    if (filters?.status) {
      const dbStatus = filters.status === 'OPEN' ? 'active' : filters.status.toLowerCase()
      query = query.eq('status', dbStatus)
    }
    
    query = query.order('created_at', { ascending: false })
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error fetching filtered picks:', error)
      return []
    }
    
    let result = (data || []).map(mapPickToFrontend)
    
    // Filter by AI name if specified (client-side since we need display_name)
    if (filters?.aiName) {
      result = result.filter(p => 
        p.ai_name.toLowerCase().includes(filters.aiName!.toLowerCase())
      )
    }
    
    return result
  } catch (e) {
    console.error('Exception:', e)
    return []
  }
}

// Fetch AI models
export async function getAIModels(): Promise<AIModel[]> {
  try {
    const { data, error } = await supabase
      .from('ai_models')
      .select('*')
      .eq('is_active', true)
      .order('display_name')
    
    if (error) {
      console.error('Error fetching AI models:', error)
      return []
    }
    
    return (data || []).map(row => ({
      id: row.id,
      ai_name: row.name,
      display_name: row.display_name,
      provider: row.provider,
      is_active: row.is_active,
      color_primary: row.color || '#6366f1',
      color_secondary: row.color || '#818cf8',
    }))
  } catch (e) {
    console.error('Exception:', e)
    return []
  }
}

// Get hot picks (consensus - stocks picked by multiple AIs)
export async function getHotPicks(): Promise<any[]> {
  try {
    const picks = await getAllStockPicks()
    
    // Group by symbol
    const symbolMap = new Map<string, StockPick[]>()
    picks.forEach(pick => {
      const sym = pick.symbol
      if (!sym) return
      if (!symbolMap.has(sym)) {
        symbolMap.set(sym, [])
      }
      symbolMap.get(sym)!.push(pick)
    })
    
    // Find stocks picked by 2+ AIs
    const hotPicks = Array.from(symbolMap.entries())
      .filter(([_, picks]) => picks.length >= 2)
      .map(([symbol, picks]) => ({
        symbol,
        picks,
        consensus: picks.length,
        avgConfidence: picks.reduce((sum, p) => sum + (p.confidence_score || 0), 0) / picks.length,
        aiNames: picks.map(p => p.ai_name),
      }))
      .sort((a, b) => b.consensus - a.consensus)
    
    return hotPicks
  } catch (e) {
    console.error('Exception:', e)
    return []
  }
}

// Get AI statistics
export async function getAIStatistics(): Promise<any[]> {
  try {
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
      avgConfidence: 75,
      openPicks: 0,
      closedPicks: (ai.total_wins || 0) + (ai.total_losses || 0),
      winRate: ai.win_rate || 0,
      totalWins: ai.total_wins || 0,
      totalLosses: ai.total_losses || 0,
      color: ai.color || '#6366f1',
    }))
  } catch (e) {
    console.error('Exception:', e)
    return []
  }
}
