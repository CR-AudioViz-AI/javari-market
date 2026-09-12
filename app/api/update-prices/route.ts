import { rateLimit } from '@/lib/api/rate-limit';
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { urlSegment } from '@craudioviz/platform-sdk/lib/egress-guard';

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes max

async function fetchStockPrice(symbol: string): Promise<number | null> {
  try {
    // Use Yahoo Finance query API (free, no key needed)
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${urlSegment(symbol, /^[A-Za-z0-9.\-]{1,12}$/)}?interval=1m&range=1d`
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    })
    
    if (!response.ok) return null
    
    const data = await response.json()
    const result = data?.chart?.result?.[0]
    const currentPrice = result?.meta?.regularMarketPrice
    
    return currentPrice ? parseFloat(currentPrice) : null
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error)
    return null
  }
}

export async function GET(request: Request) {
  const limited = rateLimit(request);
  if (limited) return limited;

  try {
    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam) : 50
    
    console.log(`🔄 Updating prices for up to ${limit} stocks...`)
    
    // Get stocks that need price updates (oldest first, or all if never updated)
    const { data: picks, error: fetchError } = await supabase
      .from('stock_picks')
      .select('id, symbol, entry_price, current_price, price_updated_at')
      .order('price_updated_at', { ascending: true, nullsFirst: true })
      .limit(limit)
    
    if (fetchError) {
      console.error('Error fetching picks:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch picks' }, { status: 500 })
    }
    
    if (!picks || picks.length === 0) {
      return NextResponse.json({ 
        message: 'No picks to update',
        updated: 0,
        failed: 0
      })
    }
    
    console.log(`📊 Found ${picks.length} picks to update`)
    
    const updates: Array<Record<string, unknown>> = []
    let successCount = 0
    let failCount = 0
    
    // Fetch prices in batches to avoid rate limiting
    for (const pick of picks) {
      const currentPrice = await fetchStockPrice(pick.symbol)
      
      if (currentPrice && currentPrice > 0) {
        const priceChange = ((currentPrice - pick.entry_price) / pick.entry_price) * 100
        
        updates.push({
          id: pick.id,
          symbol: pick.symbol,
          current_price: currentPrice,
          price_change_percent: parseFloat(priceChange.toFixed(2)),
          price_updated_at: new Date().toISOString()
        })
        
        successCount++
      } else {
        console.log(`⚠️  Could not fetch price for ${pick.symbol}`)
        failCount++
      }
      
      // Small delay to avoid rate limiting (100ms between requests)
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    // Update prices in database
    if (updates.length > 0) {
      console.log(`💾 Updating ${updates.length} prices in database...`)
      
      for (const update of updates) {
        const { error: updateError } = await supabase
          .from('stock_picks')
          .update({
            current_price: update.current_price,
            price_change_percent: update.price_change_percent,
            price_updated_at: update.price_updated_at
          })
          .eq('id', update.id)
        
        if (updateError) {
          console.error(`Error updating ${update.symbol}:`, updateError)
        }
      }
    }
    
    console.log(`✅ Price update complete: ${successCount} success, ${failCount} failed`)
    
    return NextResponse.json({
      message: 'Price update complete',
      updated: successCount,
      failed: failCount,
      total: picks.length,
      timestamp: new Date().toISOString(),
      disclaimer: 'Prices are delayed approximately 15 minutes'
    })
    
  } catch (error) {
    console.error('Error in price update:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Optional: Add POST method to trigger specific symbol updates
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { symbols } = body
    
    if (!symbols || !Array.isArray(symbols)) {
      return NextResponse.json({ error: 'Symbols array required' }, { status: 400 })
    }
    
    const updates: Array<Record<string, unknown>> = []
    
    for (const symbol of symbols) {
      const currentPrice = await fetchStockPrice(symbol)
      
      if (currentPrice && currentPrice > 0) {
        const { data: pick } = await supabase
          .from('stock_picks')
          .select('id, entry_price')
          .eq('symbol', symbol)
          .single()
        
        if (pick) {
          const priceChange = ((currentPrice - pick.entry_price) / pick.entry_price) * 100
          
          await supabase
            .from('stock_picks')
            .update({
              current_price: currentPrice,
              price_change_percent: parseFloat(priceChange.toFixed(2)),
              price_updated_at: new Date().toISOString()
            })
            .eq('id', pick.id)
          
          updates.push({ symbol, price: currentPrice })
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    return NextResponse.json({
      message: 'Specific symbols updated',
      updated: updates,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to update specific symbols',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
