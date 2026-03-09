// app/api/market-oracle/generate-picks/route.ts - V5 WITH REAL PRICE LOOKUP
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Lazy Supabase client — initialized on first request (not at module load time)
let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://kteobfyferrukqeolofj.supabase.co";
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0ZW9iZnlmZXJydWtxZW9sb2ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk1NzUwNjUsImV4cCI6MjA1NTE1MTA2NX0.r3_3bXtqo6VCJqYHijtxdEpXkWyNVGKd67kNQvqkrD4";
    _supabase = createClient(url, key);
  }
  return _supabase!;
}
const supabase = getSupabase();
export const maxDuration = 300;
export const dynamic = 'force-dynamic';

type Category = 'regular' | 'penny' | 'crypto';

const AI_CONFIG = {
  'GPT-4': { primary: 'gpt-4-turbo-preview', fallback: 'gpt-3.5-turbo', provider: 'openai' },
  'Claude': { primary: 'claude-sonnet-4-20250514', fallback: 'claude-3-5-sonnet-20241022', provider: 'anthropic' },
  'Gemini': { primary: 'gemini-2.0-flash-exp', fallback: 'gemini-1.5-pro', provider: 'google' },
  'Perplexity': { primary: 'sonar', fallback: null, provider: 'perplexity' },
  'Javari': { primary: 'claude-sonnet-4-20250514', fallback: 'claude-3-5-sonnet-20241022', provider: 'anthropic' },
};

const SYSTEM_PROMPT = `You are a helpful AI assistant participating in a stock market simulation game called "Market Oracle" for educational purposes. This is NOT real financial advice - it's a game where AI models compete to make hypothetical picks. Always provide the requested stock picks in JSON format for the game. IMPORTANT: Use the exact entry prices provided to you.`;

// Ticker lists
const TICKERS = {
  regular: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'JPM', 'V', 'UNH'],
  penny: ['SNDL', 'SOFI', 'CLOV', 'WISH', 'HOOD', 'RIVN', 'LCID', 'NIO', 'PLTR'],
  crypto: ['BTC', 'ETH', 'SOL', 'XRP', 'ADA', 'DOGE', 'AVAX', 'LINK', 'DOT', 'MATIC']
};

const CRYPTO_MAP: Record<string, string> = {
  'BTC': 'bitcoin', 'ETH': 'ethereum', 'SOL': 'solana', 'XRP': 'ripple',
  'ADA': 'cardano', 'DOGE': 'dogecoin', 'AVAX': 'avalanche-2', 'LINK': 'chainlink',
  'DOT': 'polkadot', 'MATIC': 'matic-network'
};

// REAL PRICE FETCHING
async function getRealStockPrices(tickers: string[]): Promise<Map<string, number>> {
  const prices = new Map<string, number>();
  const apiKey = process.env.TWELVE_DATA_API_KEY || 'demo';
  for (const ticker of tickers) {
    try {
      const r = await fetch(`https://api.twelvedata.com/price?symbol=${ticker}&apikey=${apiKey}`);
      const d = await r.json();
      if (d.price && !d.code) prices.set(ticker, parseFloat(d.price));
      await sleep(300);
    } catch (e) { console.log(`Price fetch failed: ${ticker}`); }
  }
  return prices;
}

async function getRealCryptoPrices(tickers: string[]): Promise<Map<string, number>> {
  const prices = new Map<string, number>();
  try {
    const ids = tickers.map(t => CRYPTO_MAP[t]).filter(Boolean).join(',');
    if (!ids) return prices;
    const r = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`);
    const d = await r.json();
    for (const t of tickers) {
      const id = CRYPTO_MAP[t];
      if (id && d[id]?.usd) prices.set(t, d[id].usd);
    }
  } catch (e) { console.log('CoinGecko error'); }
  return prices;
}

// Store real prices globally for this request
let realPrices: Map<string, number> = new Map();

function buildPrompt(cat: Category): string {
  const tickerList = TICKERS[cat];
  const priceList = tickerList
    .filter(t => realPrices.has(t))
    .map(t => `${t}: $${realPrices.get(t)!.toFixed(2)}`)
    .join(', ');
  
  return `For our educational ${cat === 'crypto' ? 'crypto' : 'stock'} simulation game, suggest 5 picks from this list WITH CURRENT PRICES:

${priceList}

Return EXACTLY 5 picks as a JSON array. The entry_price MUST be the exact current price shown above:
[{"ticker":"SYM","confidence":75,"entry_price":EXACT_PRICE_FROM_ABOVE,"target_price":110,"reasoning":"Brief educational note"}]

IMPORTANT: Return ONLY the JSON array. No markdown, no code blocks.`;
}

function parse(text: string): any[] {
  try {
    let c = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const s = c.indexOf('['), e = c.lastIndexOf(']') + 1;
    if (s >= 0 && e > s) c = c.slice(s, e);
    const parsed = JSON.parse(c);
    return parsed.slice(0, 5).map((p: any) => {
      const ticker = String(p.ticker || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      // CRITICAL: Use REAL price, not AI's guess
      const realPrice = realPrices.get(ticker);
      return {
        ticker,
        confidence: Math.min(100, Math.max(0, Number(p.confidence) || 50)),
        entry_price: realPrice || Number(p.entry_price) || 100,
        target_price: Number(p.target_price) || 110,
        reasoning: String(p.reasoning || 'AI analysis').slice(0, 500),
      };
    }).filter((p: any) => realPrices.has(p.ticker)); // Only keep picks with real prices
  } catch (e) { return []; }
}

async function callAIWithRetry(aiName: string, prompt: string, category: string): Promise<string> {
  const config = AI_CONFIG[aiName as keyof typeof AI_CONFIG];
  if (!config) throw new Error(`Unknown AI: ${aiName}`);
  let lastError: any = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await Promise.race([
        callAIProvider(aiName, prompt, config.primary, config.provider),
        new Promise<string>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 30000)),
      ]);
      await logAICall(aiName, category, true, attempt, config.primary, false);
      return response;
    } catch (error: any) {
      lastError = error;
      if (attempt < 3) await sleep(1000 * Math.pow(2, attempt - 1));
    }
  }
  if (config.fallback) {
    try {
      const response = await Promise.race([
        callAIProvider(aiName, prompt, config.fallback, config.provider),
        new Promise<string>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 30000)),
      ]);
      await logAICall(aiName, category, true, 4, config.fallback, true);
      return response;
    } catch (e) { await logAICall(aiName, category, false, 4, config.fallback!, true, String(e)); }
  }
  await logAICall(aiName, category, false, 3, config.primary, false, String(lastError));
  throw lastError;
}

async function callAIProvider(aiName: string, prompt: string, model: string, provider: string): Promise<string> {
  const fullPrompt = SYSTEM_PROMPT + '\n\n' + prompt;
  
  if (provider === 'openai') {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST', headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: prompt }], max_tokens: 1000 })
    });
    const d = await r.json();
    return d.choices?.[0]?.message?.content || '';
  }
  
  if (provider === 'anthropic') {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY!, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, max_tokens: 1000, system: SYSTEM_PROMPT, messages: [{ role: 'user', content: prompt }] })
    });
    const d = await r.json();
    return d.content?.[0]?.text || '';
  }
  
  if (provider === 'google') {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: fullPrompt }] }] })
    });
    const d = await r.json();
    return d.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }
  
  if (provider === 'perplexity') {
    const r = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST', headers: { 'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'llama-3.1-sonar-small-128k-online', messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: prompt }] })
    });
    const d = await r.json();
    return d.choices?.[0]?.message?.content || '';
  }
  
  throw new Error(`Unknown provider: ${provider}`);
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function logAICall(aiName: string, category: string, success: boolean, attempts: number, model: string, usedFallback: boolean, errorMessage?: string) {
  try { await supabase.from('ai_call_logs').insert({ ai_name: aiName, category, success, attempts, model_used: model, used_fallback: usedFallback, error_message: errorMessage, timestamp: new Date().toISOString() }); } catch (e) {}
}

export async function GET(req: NextRequest) {
  const trigger = new URL(req.url).searchParams.get('trigger');
  if (trigger !== 'manual' && trigger !== 'cron') return NextResponse.json({ message: 'Market Oracle V5 - Real Prices', usage: '?trigger=manual' });
  return generatePicks();
}

export async function POST(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return generatePicks();
}

async function generatePicks() {
  const start = Date.now();
  console.log('🚀 Starting V5 with REAL PRICES...');
  
  // STEP 1: FETCH REAL PRICES FIRST
  console.log('📊 Fetching real market prices...');
  const [stockPrices, pennyPrices, cryptoPrices] = await Promise.all([
    getRealStockPrices(TICKERS.regular),
    getRealStockPrices(TICKERS.penny),
    getRealCryptoPrices(TICKERS.crypto)
  ]);
  
  // Merge all prices into global map
  realPrices = new Map([...stockPrices, ...pennyPrices, ...cryptoPrices]);
  console.log(`   Found ${realPrices.size} real prices`);
  
  // Get or create competition
  let { data: c } = await supabase.from('competitions').select('id').order('created_at', { ascending: false }).limit(1).single();
  if (!c) {
    const { data: nc } = await supabase.from('competitions').insert({ name: 'Q4 2025 AI Battle V5', status: 'active', start_date: new Date().toISOString() }).select().single();
    c = nc;
  }
  
  await supabase.from('stock_picks').delete().eq('competition_id', c!.id);
  
  const { data: models } = await supabase.from('ai_models').select('id, name').eq('is_active', true);
  const aiList = ['Claude', 'Gemini', 'Perplexity', 'Javari', 'GPT-4'];
  const cats: Category[] = ['regular', 'penny', 'crypto'];
  const results: Record<Category, number> = { regular: 0, penny: 0, crypto: 0 };
  
  for (const ai of aiList) {
    const aiModel = models?.find(m => m.name.toLowerCase() === ai.toLowerCase());
    if (!aiModel) continue;
    
    console.log(`\n🤖 ${ai}...`);
    for (const cat of cats) {
      try {
        const prompt = buildPrompt(cat);
        const response = await callAIWithRetry(ai, prompt, cat);
        const picks = parse(response);
        
        for (const p of picks) {
          if (!p.ticker || !realPrices.has(p.ticker)) continue;
          
          const entryPrice = realPrices.get(p.ticker)!; // ALWAYS use real price
          const direction = p.target_price > entryPrice ? 'UP' : p.target_price < entryPrice ? 'DOWN' : 'HOLD';
          const stopLoss = direction === 'UP' ? entryPrice * 0.95 : entryPrice * 1.05;
          
          const { error } = await supabase.from('stock_picks').insert({
            competition_id: c!.id, ai_model_id: aiModel.id, ticker: p.ticker, category: cat, direction,
            confidence: p.confidence, entry_price: entryPrice, target_price: p.target_price,
            stop_loss: stopLoss, reasoning: `[${cat.toUpperCase()}] ${p.reasoning}`, status: 'active',
            week_number: Math.ceil((Date.now() - new Date('2025-01-01').getTime()) / (7 * 24 * 60 * 60 * 1000)),
            pick_date: new Date().toISOString(),
            expiry_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            current_price: entryPrice, price_change: 0, price_change_pct: 0,
            last_price_update: new Date().toISOString()
          });
          if (!error) results[cat]++;
        }
        console.log(`   ✅ ${cat}: ${picks.length} picks`);
      } catch (e) { console.log(`   ❌ ${cat} failed`); }
    }
  }
  
  return NextResponse.json({
    success: true,
    generated: results,
    total: results.regular + results.penny + results.crypto,
    pricesAvailable: realPrices.size,
    elapsed: `${((Date.now() - start) / 1000).toFixed(1)}s`
  });
}

