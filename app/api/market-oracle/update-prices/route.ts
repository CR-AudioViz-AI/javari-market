// app/api/market-oracle/update-prices/route.ts - LIVE PRICES V4
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
export const maxDuration = 180;
export const dynamic = 'force-dynamic';

const CRYPTO_MAP: Record<string, string> = {
  'BTC': 'bitcoin', 'ETH': 'ethereum', 'SOL': 'solana', 'AVAX': 'avalanche-2',
  'MATIC': 'matic-network', 'LINK': 'chainlink', 'XRP': 'ripple', 'DOGE': 'dogecoin',
  'ADA': 'cardano', 'DOT': 'polkadot', 'SHIB': 'shiba-inu', 'LTC': 'litecoin',
  'UNI': 'uniswap', 'ATOM': 'cosmos', 'XLM': 'stellar', 'PEPE': 'pepe',
};

async function getStockPrice(ticker: string, apiKey: string): Promise<number | null> {
  try {
    const url = `https://api.twelvedata.com/price?symbol=${ticker}&apikey=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    if (data.code === 400 || data.status === 'error') {
      console.log(`[${ticker}] Not found on Twelve Data`);
      return null;
    }
    return data.price ? parseFloat(data.price) : null;
  } catch (error) {
    console.error(`Error fetching ${ticker}:`, error);
    return null;
  }
}

async function getCryptoPrices(tickers: string[]): Promise<Map<string, number>> {
  const prices = new Map<string, number>();
  if (tickers.length === 0) return prices;
  try {
    const coinIds = tickers.map(t => CRYPTO_MAP[t.toUpperCase()]).filter(Boolean).join(',');
    if (!coinIds) return prices;
    const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=usd`);
    if (!response.ok) return prices;
    const data = await response.json();
    for (const ticker of tickers) {
      const coinId = CRYPTO_MAP[ticker.toUpperCase()];
      if (coinId && data[coinId]?.usd) prices.set(ticker.toUpperCase(), data[coinId].usd);
    }
  } catch (error) { console.error('CoinGecko error:', error); }
  return prices;
}

async function getStockPrices(tickers: string[], apiKey: string): Promise<Map<string, number>> {
  const prices = new Map<string, number>();
  const uniqueTickers = [...new Set(tickers)];
  
  for (let i = 0; i < uniqueTickers.length; i++) {
    const ticker = uniqueTickers[i];
    const price = await getStockPrice(ticker, apiKey);
    if (price !== null && price > 0) {
      prices.set(ticker, price);
      console.log(`✅ ${ticker}: $${price}`);
    }
    // Rate limit: 8 calls/min on free, being safe with 800ms
    if (i < uniqueTickers.length - 1) await new Promise(r => setTimeout(r, 800));
  }
  return prices;
}

export async function GET(req: NextRequest) {
  const trigger = new URL(req.url).searchParams.get('trigger');
  if (trigger !== 'manual' && trigger !== 'cron') {
    return NextResponse.json({
      message: 'Market Oracle Price Update API v4',
      usage: '?trigger=manual',
      apiKeySet: !!process.env.TWELVE_DATA_API_KEY,
    });
  }
  return updatePrices();
}

export async function POST(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return updatePrices();
}

async function updatePrices() {
  const startTime = Date.now();
  const apiKey = process.env.TWELVE_DATA_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json({ error: 'TWELVE_DATA_API_KEY not set' }, { status: 500 });
  }
  
  console.log('Using Twelve Data API key:', apiKey.substring(0, 8) + '...');
  
  const { data: picks, error: fetchError } = await supabase
    .from('stock_picks').select('id, ticker, category, entry_price').eq('status', 'active');
  
  if (fetchError || !picks || picks.length === 0) {
    return NextResponse.json({ error: 'No picks found', updated: 0 });
  }
  
  const stockTickers = [...new Set(picks.filter(p => p.category !== 'crypto').map(p => p.ticker))];
  const cryptoTickers = [...new Set(picks.filter(p => p.category === 'crypto').map(p => p.ticker))];
  
  console.log(`Fetching: ${stockTickers.length} stocks, ${cryptoTickers.length} crypto`);
  
  const [stockPrices, cryptoPrices] = await Promise.all([
    getStockPrices(stockTickers, apiKey),
    getCryptoPrices(cryptoTickers),
  ]);
  
  const allPrices = new Map([...stockPrices, ...cryptoPrices]);
  
  let updated = 0, failed = 0;
  const now = new Date().toISOString();
  const updates: Array<{ticker: string, current: number, pct: number}> = [];
  
  for (const pick of picks) {
    const currentPrice = allPrices.get(pick.ticker.toUpperCase());
    if (currentPrice !== undefined && currentPrice > 0) {
      const priceChange = currentPrice - pick.entry_price;
      const priceChangePct = ((currentPrice - pick.entry_price) / pick.entry_price) * 100;
      
      const { error } = await supabase.from('stock_picks').update({
        current_price: currentPrice, price_change: priceChange,
        price_change_pct: priceChangePct, last_price_update: now,
      }).eq('id', pick.id);
      
      if (!error) { updated++; updates.push({ ticker: pick.ticker, current: currentPrice, pct: priceChangePct }); }
      else failed++;
    } else failed++;
  }
  
  const sorted = updates.sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct));
  
  return NextResponse.json({
    success: updated > 0,
    summary: { totalPicks: picks.length, pricesFound: allPrices.size, updated, failed },
    sources: { stocks: stockPrices.size, crypto: cryptoPrices.size },
    topMovers: sorted.slice(0, 5).map(u => ({ ticker: u.ticker, price: u.current, change: `${u.pct >= 0 ? '+' : ''}${u.pct.toFixed(2)}%` })),
    elapsedMs: Date.now() - startTime,
    timestamp: now,
  });
}
