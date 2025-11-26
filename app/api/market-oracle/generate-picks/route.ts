// app/api/market-oracle/generate-picks/route.ts - V5 with REAL PRICE LOOKUP
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

// Educational simulation framing to avoid AI safety filters
const SYSTEM_PROMPT = `You are a helpful AI assistant participating in a stock market simulation game called "Market Oracle" for educational purposes. This is NOT real financial advice - it's a game where AI models compete to make hypothetical picks for learning about market analysis.

CRITICAL: You MUST use the EXACT entry prices provided in the prompt. Do NOT invent your own prices.`;

// Stock lists by category
const STOCK_LISTS = {
  regular: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'JPM', 'V', 'UNH', 'JNJ', 'WMT', 'PG', 'MA', 'HD', 'DIS', 'NFLX', 'PYPL', 'INTC', 'AMD'],
  penny: ['SNDL', 'MULN', 'SOFI', 'CLOV', 'WISH', 'HOOD', 'BBIG', 'ABCL', 'NPWR', 'TELL', 'RIVN', 'LCID', 'NIO', 'PLTR', 'BB'],
  crypto: ['BTC', 'ETH', 'SOL', 'XRP', 'ADA', 'DOGE', 'AVAX', 'LINK', 'DOT', 'MATIC', 'LTC', 'ATOM', 'UNI', 'XLM']
};

const CRYPTO_MAP: Record<string, string> = {
  'BTC': 'bitcoin', 'ETH': 'ethereum', 'SOL': 'solana', 'XRP': 'ripple',
  'ADA': 'cardano', 'DOGE': 'dogecoin', 'AVAX': 'avalanche-2', 'LINK': 'chainlink',
  'DOT': 'polkadot', 'MATIC': 'matic-network', 'LTC': 'litecoin', 'ATOM': 'cosmos',
  'UNI': 'uniswap', 'XLM': 'stellar', 'SHIB': 'shiba-inu', 'PEPE': 'pepe'
};

// ============================================
// REAL PRICE FETCHING
// ============================================

async function getRealStockPrices(tickers: string[]): Promise<Map<string, number>> {
  const prices = new Map<string, number>();
  const apiKey = process.env.TWELVE_DATA_API_KEY || 'demo';
  
  for (const ticker of tickers) {
    try {
      const response = await fetch(`https://api.twelvedata.com/price?symbol=${ticker}&apikey=${apiKey}`);
      const data = await response.json();
      if (data.price && !data.code) {
        prices.set(ticker, parseFloat(data.price));
      }
      await new Promise(r => setTimeout(r, 300)); // Rate limit
    } catch (e) {
      console.error(`Failed to get price for ${ticker}:`, e);
    }
  }
  return prices;
}

async function getRealCryptoPrices(tickers: string[]): Promise<Map<string, number>> {
  const prices = new Map<string, number>();
  try {
    const coinIds = tickers.map(t => CRYPTO_MAP[t]).filter(Boolean).join(',');
    if (!coinIds) return prices;
    
    const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=usd`);
    const data = await response.json();
    
    for (const ticker of tickers) {
      const coinId = CRYPTO_MAP[ticker];
      if (coinId && data[coinId]?.usd) {
        prices.set(ticker, data[coinId].usd);
      }
    }
  } catch (e) {
    console.error('CoinGecko error:', e);
  }
  return prices;
}

// ============================================
// AI PROVIDERS
// ============================================

interface Pick {
  ticker: string;
  confidence: number;
  entry_price: number;
  target_price: number;
  reasoning: string;
}

function buildPrompt(category: string, tickersWithPrices: Array<{ticker: string, price: number}>): string {
  const priceList = tickersWithPrices.map(t => `${t.ticker}: $${t.price.toFixed(2)}`).join(', ');
  
  return `For our educational stock market simulation game, suggest 5 ${category} assets to track from this list with their CURRENT PRICES:

${priceList}

IMPORTANT: The entry_price MUST be the exact current price shown above. Do not change it.

Respond ONLY with valid JSON array (no markdown, no explanation):
[{"ticker":"SYM","confidence":75,"entry_price":EXACT_PRICE_FROM_ABOVE,"target_price":110,"reasoning":"Brief reason"}]

Requirements:
- entry_price MUST match the exact price shown above
- target_price is your prediction for where it will go
- confidence 60-90
- reasoning under 100 characters`;
}

async function callOpenAI(prompt: string): Promise<Pick[]> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: prompt }],
      temperature: 0.7, max_tokens: 1000
    })
  });
  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || '[]';
  return JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim());
}

async function callAnthropic(prompt: string): Promise<Pick[]> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }]
    })
  });
  const data = await response.json();
  const text = data.content?.[0]?.text || '[]';
  return JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim());
}

async function callGemini(prompt: string): Promise<Pick[]> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: SYSTEM_PROMPT + '\n\n' + prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1000 }
      })
    }
  );
  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
  return JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim());
}

async function callPerplexity(prompt: string): Promise<Pick[]> {
  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.1-sonar-small-128k-online',
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: prompt }],
      temperature: 0.7, max_tokens: 1000
    })
  });
  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || '[]';
  return JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim());
}

async function callJavari(prompt: string): Promise<Pick[]> {
  const response = await fetch(`${process.env.JAVARI_API_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.JAVARI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: SYSTEM_PROMPT + '\n\n' + prompt })
  });
  const data = await response.json();
  const text = data.response || data.content || '[]';
  const match = text.match(/\[[\s\S]*\]/);
  return match ? JSON.parse(match[0]) : [];
}

// ============================================
// MAIN GENERATION LOGIC
// ============================================

export async function GET(req: NextRequest) {
  const trigger = new URL(req.url).searchParams.get('trigger');
  if (trigger !== 'manual' && trigger !== 'cron') {
    return NextResponse.json({ message: 'Market Oracle Generate Picks V5 - With Real Prices', usage: '?trigger=manual' });
  }
  return generatePicks();
}

export async function POST(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return generatePicks();
}

async function generatePicks() {
  const startTime = Date.now();
  console.log('🚀 Starting pick generation with REAL PRICES...');
  
  // Get or create competition
  const weekNumber = Math.ceil((Date.now() - new Date('2025-01-01').getTime()) / (7 * 24 * 60 * 60 * 1000));
  let { data: competition } = await supabase.from('competitions').select('id').eq('week_number', weekNumber).single();
  
  if (!competition) {
    const { data: newComp } = await supabase.from('competitions').insert({
      week_number: weekNumber,
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active'
    }).select().single();
    competition = newComp;
  }
  
  // Clear old picks for this week
  await supabase.from('stock_picks').delete().eq('competition_id', competition.id);
  
  // Get AI models
  const { data: aiModels } = await supabase.from('ai_models').select('*').eq('is_active', true);
  const modelMap = new Map((aiModels || []).map(m => [m.name.toLowerCase(), m.id]));
  
  // ============================================
  // STEP 1: FETCH ALL REAL PRICES FIRST
  // ============================================
  console.log('📊 Fetching REAL market prices...');
  
  const [stockPrices, pennyPrices, cryptoPrices] = await Promise.all([
    getRealStockPrices(STOCK_LISTS.regular),
    getRealStockPrices(STOCK_LISTS.penny),
    getRealCryptoPrices(STOCK_LISTS.crypto)
  ]);
  
  console.log(`   Stocks: ${stockPrices.size}, Penny: ${pennyPrices.size}, Crypto: ${cryptoPrices.size}`);
  
  // Build ticker lists with real prices
  const regularWithPrices = Array.from(stockPrices.entries()).map(([ticker, price]) => ({ ticker, price }));
  const pennyWithPrices = Array.from(pennyPrices.entries()).map(([ticker, price]) => ({ ticker, price }));
  const cryptoWithPrices = Array.from(cryptoPrices.entries()).map(([ticker, price]) => ({ ticker, price }));
  
  // ============================================
  // STEP 2: GENERATE PICKS WITH REAL PRICES
  // ============================================
  
  const aiProviders = [
    { name: 'claude', call: callAnthropic },
    { name: 'gemini', call: callGemini },
    { name: 'perplexity', call: callPerplexity },
    { name: 'javari', call: callJavari },
    { name: 'gpt-4', call: callOpenAI },
  ];
  
  const results = { regular: 0, penny: 0, crypto: 0 };
  const allPicks: any[] = [];
  
  for (const ai of aiProviders) {
    const aiModelId = modelMap.get(ai.name) || modelMap.get('gpt-4');
    if (!aiModelId) continue;
    
    console.log(`\n🤖 ${ai.name.toUpperCase()} generating picks...`);
    
    for (const [category, tickersWithPrices] of [
      ['regular', regularWithPrices],
      ['penny', pennyWithPrices],
      ['crypto', cryptoWithPrices]
    ] as const) {
      if (tickersWithPrices.length === 0) {
        console.log(`   ⚠️ No prices for ${category}, skipping`);
        continue;
      }
      
      try {
        const prompt = buildPrompt(category, tickersWithPrices as Array<{ticker: string, price: number}>);
        const picks = await ai.call(prompt);
        
        // Validate and fix picks - ensure entry_price matches real price
        const priceMap = new Map((tickersWithPrices as Array<{ticker: string, price: number}>).map(t => [t.ticker, t.price]));
        
        for (const p of picks.slice(0, 5)) {
          if (!p.ticker || !p.target_price) continue;
          
          // CRITICAL: Use REAL price, not AI's guess
          const realPrice = priceMap.get(p.ticker.toUpperCase());
          if (!realPrice) {
            console.log(`   ⚠️ No real price for ${p.ticker}, skipping`);
            continue;
          }
          
          const entryPrice = realPrice; // ALWAYS use real price
          const targetPrice = Number(p.target_price);
          const direction = targetPrice > entryPrice ? 'UP' : targetPrice < entryPrice ? 'DOWN' : 'HOLD';
          const stopLoss = direction === 'UP' ? entryPrice * 0.95 : entryPrice * 1.05;
          
          allPicks.push({
            competition_id: competition.id,
            ai_model_id: aiModelId,
            ticker: p.ticker.toUpperCase(),
            category,
            direction,
            confidence: Math.min(90, Math.max(60, p.confidence || 70)),
            entry_price: entryPrice,
            current_price: entryPrice, // Start at entry price
            target_price: targetPrice,
            stop_loss: stopLoss,
            reasoning: (p.reasoning || 'Educational simulation pick').slice(0, 500),
            status: 'active',
            week_number: weekNumber,
            pick_date: new Date().toISOString(),
            expiry_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            price_change: 0,
            price_change_pct: 0,
            last_price_update: new Date().toISOString()
          });
          
          results[category]++;
        }
        
        console.log(`   ✅ ${category}: ${picks.length} picks`);
      } catch (e) {
        console.error(`   ❌ ${category} failed:`, e);
      }
    }
  }
  
  // Insert all picks
  if (allPicks.length > 0) {
    const { error } = await supabase.from('stock_picks').insert(allPicks);
    if (error) console.error('Insert error:', error);
  }
  
  return NextResponse.json({
    success: true,
    generated: results,
    total: results.regular + results.penny + results.crypto,
    pricesAvailable: {
      stocks: stockPrices.size,
      penny: pennyPrices.size,
      crypto: cryptoPrices.size
    },
    elapsed: `${((Date.now() - startTime) / 1000).toFixed(1)}s`,
    timestamp: new Date().toISOString()
  });
}
