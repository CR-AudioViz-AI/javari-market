// app/api/cron/auto-picks/route.ts — javari-market
// Runs daily at market open to generate AI picks automatically
// Triggered by Vercel cron: weekdays at 9:35 AM ET
// CR AudioViz AI · May 2026
import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

const FINNHUB = process.env.FINNHUB_API_KEY || ''
const GROQ = process.env.GROQ_API_KEY || ''
const OR = process.env.OPENROUTER_API_KEY || ''

function getSupabase() {
  const { createClient } = require('@supabase/supabase-js')
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

const WATCH_UNIVERSE = [
  'AAPL','MSFT','NVDA','GOOGL','AMZN','META','TSLA','BRK-B','JPM','V',
  'WMT','JNJ','XOM','PG','MA','HD','CVX','MRK','ABBV','LLY',
  'SPY','QQQ','IWM','DIA','GLD','SLV','TLT','VTI'
]

async function getMarketContext(): Promise<string> {
  // Fetch live prices for universe
  try {
    const symbols = WATCH_UNIVERSE.slice(0, 15).join(',')
    const res = await fetch(
      `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols}&fields=symbol,regularMarketPrice,regularMarketChangePercent,regularMarketVolume,marketCap`,
      { headers: { 'User-Agent': 'JavariMarket/2.0' } }
    )
    if (!res.ok) throw new Error('Yahoo unavailable')
    const data = await res.json() as any
    const quotes = data?.quoteResponse?.result || []
    const lines = quotes.map((q: any) =>
      `${q.symbol}: $${q.regularMarketPrice?.toFixed(2)} (${q.regularMarketChangePercent >= 0 ? '+' : ''}${q.regularMarketChangePercent?.toFixed(2)}%)`
    )
    return lines.join('\n')
  } catch {
    return 'Live market data temporarily unavailable'
  }
}

async function generatePicksWithAI(context: string): Promise<any[]> {
  const prompt = `You are a quantitative analyst. Based on today's live market data:

${context}

Generate 5 specific stock picks for today. For each pick provide:
- symbol (ticker)
- action: BUY, SELL, or HOLD
- confidence: 60-95
- target_price (number, realistic 30-day target based on today's price)
- stop_loss (number, 5-10% below current for buys)
- thesis (1-2 sentences, specific and actionable)
- risk: LOW, MEDIUM, or HIGH

Respond ONLY with valid JSON array. No preamble. Example:
[{"symbol":"AAPL","action":"BUY","confidence":78,"target_price":200,"stop_loss":175,"thesis":"Breaking above 52-week resistance on volume.","risk":"MEDIUM"}]`

  for (const [url, headers, body] of [
    ['https://api.groq.com/openai/v1/chat/completions',
     { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ}` },
     JSON.stringify({ model: 'llama-3.3-70b-versatile', max_tokens: 800, temperature: 0.3, messages: [{ role: 'user', content: prompt }] })],
    ['https://openrouter.ai/api/v1/chat/completions',
     { 'Content-Type': 'application/json', Authorization: `Bearer ${OR}`, 'HTTP-Referer': 'https://craudiovizai.com' },
     JSON.stringify({ model: 'deepseek/deepseek-v4-flash:free', max_tokens: 800, temperature: 0.3, messages: [{ role: 'user', content: prompt }] })],
  ] as any[]) {
    if (!headers.Authorization.includes('undefined') && !headers.Authorization.endsWith(' ')) {
      try {
        const res = await fetch(url, { method: 'POST', headers, body })
        if (!res.ok) continue
        const data = await res.json() as any
        const text = data.choices?.[0]?.message?.content || ''
        const jsonMatch = text.match(/\[[\s\S]+\]/)
        if (jsonMatch) return JSON.parse(jsonMatch[0])
      } catch { continue }
    }
  }
  return []
}

export async function GET() {
  const supabase = getSupabase()
  if (!supabase) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })

  const context = await getMarketContext()
  const picks = await generatePicksWithAI(context)

  if (picks.length === 0) {
    return NextResponse.json({ message: 'No picks generated', context }, { status: 200 })
  }

  // Save to Supabase
  const rows = picks.map((p: any) => ({
    symbol: p.symbol,
    action: p.action,
    confidence: p.confidence,
    target_price: p.target_price,
    stop_loss: p.stop_loss,
    thesis: p.thesis,
    risk_level: p.risk,
    generated_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    source: 'javari-ai-auto',
    market_context: context.slice(0, 500),
  }))

  const { error } = await supabase.from('ai_picks').upsert(rows, { onConflict: 'symbol,generated_at' })

  return NextResponse.json({
    success: true,
    picks_generated: picks.length,
    picks,
    error: error?.message,
    timestamp: new Date().toISOString(),
  })
}
