// app/api/cron/daily-battle/route.ts
// PRODUCTION CRON JOB: Daily AI Battle Automation
// Runs daily at 9:30 AM EST (market open + 30 min)
// Created: December 12, 2025 - Roy Henderson / CR AudioViz AI

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Force dynamic execution
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// AI Model Configuration
const AI_MODELS = [
  { id: 'a1000000-0000-0000-0000-000000000001', name: 'TechVanguard AI', provider: 'openai', model: 'gpt-4-turbo-preview' },
  { id: 'a2000000-0000-0000-0000-000000000002', name: 'ValueHunter Pro', provider: 'anthropic', model: 'claude-sonnet-4-20250514' },
  { id: 'a3000000-0000-0000-0000-000000000003', name: 'SwingTrader X', provider: 'openai', model: 'gpt-4-turbo-preview' },
  { id: 'a4000000-0000-0000-0000-000000000004', name: 'DividendKing', provider: 'anthropic', model: 'claude-sonnet-4-20250514' },
  { id: 'a5000000-0000-0000-0000-000000000005', name: 'CryptoQuantum', provider: 'openai', model: 'gpt-4-turbo-preview' },
  { id: 'a6000000-0000-0000-0000-000000000006', name: 'GlobalMacro AI', provider: 'google', model: 'gemini-2.0-flash-exp' },
];

// Ticker pools
const STOCK_POOLS = {
  regular: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'JPM', 'V', 'UNH', 'HD', 'MA', 'PG', 'JNJ', 'XOM', 'DIS', 'NFLX', 'CRM', 'AMD', 'INTC'],
  penny: ['SOFI', 'PLTR', 'HOOD', 'RIVN', 'LCID', 'NIO', 'CLOV', 'IONQ', 'RKLB', 'JOBY', 'GRAB', 'OPEN', 'DNA', 'FCEL', 'PLUG'],
  crypto: ['BTC', 'ETH', 'SOL', 'XRP', 'ADA', 'DOGE', 'AVAX', 'LINK', 'DOT', 'MATIC']
};

const CRYPTO_MAP: Record<string, string> = {
  'BTC': 'bitcoin', 'ETH': 'ethereum', 'SOL': 'solana', 'XRP': 'ripple',
  'ADA': 'cardano', 'DOGE': 'dogecoin', 'AVAX': 'avalanche-2', 'LINK': 'chainlink',
  'DOT': 'polkadot', 'MATIC': 'matic-network'
};

// ----- PRICE FETCHING FUNCTIONS -----

async function fetchStockPrices(tickers: string[]): Promise<Map<string, number>> {
  const prices = new Map<string, number>();
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY || process.env.TWELVE_DATA_API_KEY;
  
  for (const ticker of tickers) {
    try {
      // Try Alpha Vantage first
      const response = await fetch(
        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${apiKey}`
      );
      const data = await response.json();
      
      if (data['Global Quote'] && data['Global Quote']['05. price']) {
        prices.set(ticker, parseFloat(data['Global Quote']['05. price']));
      }
      
      // Rate limiting
      await new Promise(r => setTimeout(r, 250));
    } catch (error) {
      console.error(`Failed to fetch price for ${ticker}:`, error);
    }
  }
  
  return prices;
}

async function fetchCryptoPrices(tickers: string[]): Promise<Map<string, number>> {
  const prices = new Map<string, number>();
  
  try {
    const coinIds = tickers.map(t => CRYPTO_MAP[t]).filter(Boolean).join(',');
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=usd`
    );
    const data = await response.json();
    
    for (const ticker of tickers) {
      const coinId = CRYPTO_MAP[ticker];
      if (coinId && data[coinId]?.usd) {
        prices.set(ticker, data[coinId].usd);
      }
    }
  } catch (error) {
    console.error('Failed to fetch crypto prices:', error);
  }
  
  return prices;
}

// ----- AI PICK GENERATION -----

async function generateAIPick(
  model: typeof AI_MODELS[0],
  category: 'regular' | 'penny' | 'crypto',
  availablePrices: Map<string, number>
): Promise<any | null> {
  const tickers = Array.from(availablePrices.keys());
  if (tickers.length === 0) return null;
  
  const tickerList = tickers.map(t => `${t}: $${availablePrices.get(t)?.toFixed(2)}`).join('\n');
  
  const systemPrompt = `You are ${model.name}, an AI stock analyst competing in Market Oracle.
Your specialty: ${getModelSpecialty(model.id)}
Today's date: ${new Date().toISOString().split('T')[0]}

RULES:
1. Pick ONE ${category} ${category === 'crypto' ? 'cryptocurrency' : 'stock'} from the list provided
2. Provide your analysis and confidence level (0-100)
3. Respond ONLY with valid JSON

Return EXACTLY this JSON structure:
{
  "ticker": "SYMBOL",
  "direction": "UP" or "DOWN",
  "confidence": 75,
  "target_price": 150.00,
  "stop_loss": 130.00,
  "reasoning": "2-3 sentence analysis",
  "key_factors": ["factor1", "factor2", "factor3"]
}`;

  const userPrompt = `Available ${category} ${category === 'crypto' ? 'cryptocurrencies' : 'stocks'} with current prices:\n${tickerList}\n\nMake your pick:`;

  try {
    let response;
    
    if (model.provider === 'openai') {
      response = await callOpenAI(systemPrompt, userPrompt, model.model);
    } else if (model.provider === 'anthropic') {
      response = await callAnthropic(systemPrompt, userPrompt, model.model);
    } else if (model.provider === 'google') {
      response = await callGemini(systemPrompt, userPrompt, model.model);
    }
    
    if (!response) return null;
    
    // Parse JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    
    const pick = JSON.parse(jsonMatch[0]);
    return {
      ...pick,
      entry_price: availablePrices.get(pick.ticker) || 0,
      ai_model_id: model.id,
      category,
      asset_type: category === 'crypto' ? 'crypto' : 'stock'
    };
  } catch (error) {
    console.error(`${model.name} pick generation failed:`, error);
    return null;
  }
}

function getModelSpecialty(modelId: string): string {
  const specialties: Record<string, string> = {
    'a1000000-0000-0000-0000-000000000001': 'Technology & Growth Stocks - Focus on innovation, R&D, and market disruption',
    'a2000000-0000-0000-0000-000000000002': 'Value Investing - Undervalued stocks with strong fundamentals',
    'a3000000-0000-0000-0000-000000000003': 'Technical Analysis - Chart patterns, momentum, and swing trades',
    'a4000000-0000-0000-0000-000000000004': 'Dividend & Income - High-yield, sustainable dividend stocks',
    'a5000000-0000-0000-0000-000000000005': 'Crypto & Digital Assets - Blockchain and cryptocurrency analysis',
    'a6000000-0000-0000-0000-000000000006': 'Macro & ETFs - Economic trends and sector allocation'
  };
  return specialties[modelId] || 'General market analysis';
}

// ----- AI API CALLS -----

async function callOpenAI(system: string, user: string, model: string): Promise<string | null> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user }
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    });
    
    const data = await response.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (error) {
    console.error('OpenAI call failed:', error);
    return null;
  }
}

async function callAnthropic(system: string, user: string, model: string): Promise<string | null> {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: model,
        max_tokens: 500,
        system: system,
        messages: [{ role: 'user', content: user }]
      })
    });
    
    const data = await response.json();
    return data.content?.[0]?.text || null;
  } catch (error) {
    console.error('Anthropic call failed:', error);
    return null;
  }
}

async function callGemini(system: string, user: string, model: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GOOGLE_GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${system}\n\n${user}` }] }],
          generationConfig: { maxOutputTokens: 500, temperature: 0.7 }
        })
      }
    );
    
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch (error) {
    console.error('Gemini call failed:', error);
    return null;
  }
}

// ----- MAIN CRON HANDLER -----

export async function GET(request: NextRequest) {
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    // Allow manual trigger for testing
    const url = new URL(request.url);
    if (url.searchParams.get('test') !== 'true') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }
  
  console.log(`[DAILY BATTLE] Starting - ${new Date().toISOString()}`);
  
  const results = {
    timestamp: new Date().toISOString(),
    picks_generated: 0,
    picks_saved: 0,
    errors: [] as string[],
    ai_models_processed: [] as string[]
  };
  
  try {
    // Step 1: Fetch all current prices
    console.log('[DAILY BATTLE] Fetching current prices...');
    const stockPrices = await fetchStockPrices([...STOCK_POOLS.regular, ...STOCK_POOLS.penny]);
    const cryptoPrices = await fetchCryptoPrices(STOCK_POOLS.crypto);
    
    console.log(`[DAILY BATTLE] Got ${stockPrices.size} stock prices, ${cryptoPrices.size} crypto prices`);
    
    // Step 2: Get current week/competition info
    const today = new Date();
    const weekNumber = Math.ceil((today.getDate()) / 7);
    const pickDate = today.toISOString().split('T')[0];
    const expiryDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Step 3: Generate picks for each AI model
    for (const model of AI_MODELS) {
      console.log(`[DAILY BATTLE] Generating picks for ${model.name}...`);
      
      try {
        // Each AI picks from regular stocks (or crypto for CryptoQuantum)
        const category = model.id === 'a5000000-0000-0000-0000-000000000005' ? 'crypto' : 'regular';
        const prices = category === 'crypto' ? cryptoPrices : stockPrices;
        
        const pick = await generateAIPick(model, category as any, prices);
        
        if (pick) {
          results.picks_generated++;
          
          // Save to database
          const { error } = await supabase.from('stock_picks').insert({
            id: `pick-${Date.now()}-${model.id.slice(-4)}`,
            ai_model_id: model.id,
            ticker: pick.ticker,
            symbol: pick.ticker,
            company_name: pick.ticker, // Will be updated
            category: pick.category,
            asset_type: pick.asset_type,
            direction: pick.direction,
            confidence: pick.confidence,
            entry_price: pick.entry_price,
            current_price: pick.entry_price,
            target_price: pick.target_price,
            stop_loss: pick.stop_loss,
            price_change_percent: 0,
            price_change_dollars: 0,
            reasoning: pick.reasoning,
            reasoning_summary: pick.reasoning?.substring(0, 100),
            key_factors: pick.key_factors,
            risk_factors: [],
            status: 'active',
            week_number: weekNumber,
            pick_date: pickDate,
            expiry_date: expiryDate,
            price_updated_at: new Date().toISOString()
          });
          
          if (error) {
            results.errors.push(`Failed to save ${model.name} pick: ${error.message}`);
          } else {
            results.picks_saved++;
          }
        }
        
        results.ai_models_processed.push(model.name);
        
        // Rate limiting between AI calls
        await new Promise(r => setTimeout(r, 1000));
        
      } catch (error: any) {
        results.errors.push(`${model.name} error: ${error.message}`);
      }
    }
    
    // Step 4: Log battle completion
    console.log(`[DAILY BATTLE] Complete - ${results.picks_saved}/${results.picks_generated} picks saved`);
    
    // Step 5: Notify Javari for learning (optional)
    await notifyJavariNewPicks(results.picks_saved);
    
    return NextResponse.json({
      success: true,
      message: 'Daily battle completed',
      ...results
    });
    
  } catch (error: any) {
    console.error('[DAILY BATTLE] Critical error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      ...results
    }, { status: 500 });
  }
}

async function notifyJavariNewPicks(pickCount: number): Promise<void> {
  // Send to Javari knowledge base for learning
  try {
    await supabase.from('javari_learning_queue').insert({
      source: 'market_oracle',
      event_type: 'daily_battle_complete',
      data: { picks_generated: pickCount, timestamp: new Date().toISOString() },
      status: 'pending'
    });
  } catch (error) {
    console.log('Javari notification skipped:', error);
  }
}

// Also support POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}
