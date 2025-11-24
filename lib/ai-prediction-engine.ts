// ============================================
// MARKET ORACLE V3.0 - AI PREDICTION ENGINE
// 15 Picks per AI: 5 Regular, 5 Penny, 5 Crypto
// ============================================

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Types
export type Category = 'regular' | 'penny' | 'crypto';
export type Direction = 'UP' | 'DOWN' | 'HOLD';

export interface StockPick {
  ticker: string;
  category: Category;
  direction: Direction;
  confidence: number;
  entry_price: number;
  target_price: number;
  stop_loss: number;
  reasoning: string;
}

export interface AIResponse {
  success: boolean;
  aiModel: string;
  picks: StockPick[];
  error?: string;
}

// Category-specific prompts
const CATEGORY_PROMPTS = {
  regular: `
REGULAR STOCKS (Large/Mid Cap, $10+):
Pick 5 stocks from well-known companies trading above $10.
Focus on: FAANG, S&P 500, major sectors (tech, healthcare, finance, consumer, energy).
Examples: AAPL, NVDA, TSLA, GOOGL, AMZN, META, MSFT, JPM, JNJ, XOM
`,
  penny: `
PENNY STOCKS (Under $5):
Pick 5 penny stocks trading under $5 with high potential.
Focus on: Small caps, speculative plays, momentum stocks, biotech, emerging tech.
Look for: High volume, recent news catalysts, potential breakouts.
Examples: SNDL, MULN, BBIG, CLOV, SOFI (when under $5), PLTR (when under $5)
`,
  crypto: `
CRYPTOCURRENCY:
Pick 5 cryptocurrencies with strong potential.
Include mix of: Large caps (BTC, ETH), mid caps (SOL, AVAX, MATIC), and promising altcoins.
Focus on: Technical setups, upcoming catalysts, ecosystem growth.
Examples: BTC, ETH, SOL, AVAX, MATIC, LINK, DOT, ADA, XRP, DOGE
`
};

// Master prompt template
function buildPrompt(category: Category, currentDate: string): string {
  return `You are an elite AI investment analyst competing in the Market Oracle AI Battle.
Your reputation depends on accurate picks. Today is ${currentDate}.

${CATEGORY_PROMPTS[category]}

Analyze current market conditions and provide EXACTLY 5 picks for this category.

For each pick, provide:
- ticker: The stock/crypto symbol (uppercase)
- direction: UP (bullish), DOWN (bearish), or HOLD
- confidence: Your confidence level 0-100
- entry_price: Current approximate price to enter
- target_price: Your price target (7 days out)
- stop_loss: Stop loss price to limit downside
- reasoning: 2-3 sentence explanation of your thesis

IMPORTANT:
- Be specific with price targets
- Consider current market sentiment
- Include both technical and fundamental reasoning
- Vary your confidence based on conviction
- Include at least one contrarian/high-risk pick

Respond ONLY with valid JSON array, no markdown:
[
  {
    "ticker": "SYMBOL",
    "direction": "UP",
    "confidence": 75,
    "entry_price": 100.00,
    "target_price": 110.00,
    "stop_loss": 95.00,
    "reasoning": "Your analysis here"
  }
]`;
}

// Parse AI response to extract JSON
function parseAIResponse(text: string, category: Category): StockPick[] {
  try {
    // Remove markdown code blocks if present
    let cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Find JSON array
    const startIdx = cleaned.indexOf('[');
    const endIdx = cleaned.lastIndexOf(']') + 1;
    if (startIdx >= 0 && endIdx > startIdx) {
      cleaned = cleaned.slice(startIdx, endIdx);
    }
    
    const picks = JSON.parse(cleaned);
    
    // Validate and add category
    return picks.slice(0, 5).map((pick: any) => ({
      ticker: String(pick.ticker || '').toUpperCase().replace(/[^A-Z0-9]/g, ''),
      category,
      direction: ['UP', 'DOWN', 'HOLD'].includes(pick.direction) ? pick.direction : 'HOLD',
      confidence: Math.min(100, Math.max(0, Number(pick.confidence) || 50)),
      entry_price: Number(pick.entry_price) || 0,
      target_price: Number(pick.target_price) || 0,
      stop_loss: Number(pick.stop_loss) || 0,
      reasoning: String(pick.reasoning || 'No reasoning provided').slice(0, 500),
    }));
  } catch (e) {
    console.error('Parse error:', e);
    return [];
  }
}

// ============================================
// AI PROVIDER FUNCTIONS
// ============================================

async function getOpenAIPicks(prompt: string): Promise<StockPick[]> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });
  
  if (!response.ok) throw new Error(`OpenAI error: ${response.status}`);
  const data = await response.json();
  return parseAIResponse(data.choices[0].message.content, 'regular');
}

async function getClaudePicks(prompt: string): Promise<StockPick[]> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  
  if (!response.ok) throw new Error(`Claude error: ${response.status}`);
  const data = await response.json();
  return parseAIResponse(data.content[0].text, 'regular');
}

async function getGeminiPicks(prompt: string): Promise<StockPick[]> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    }
  );
  
  if (!response.ok) throw new Error(`Gemini error: ${response.status}`);
  const data = await response.json();
  return parseAIResponse(data.candidates[0].content.parts[0].text, 'regular');
}

async function getPerplexityPicks(prompt: string): Promise<StockPick[]> {
  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'sonar',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000,
    }),
  });
  
  if (!response.ok) throw new Error(`Perplexity error: ${response.status}`);
  const data = await response.json();
  return parseAIResponse(data.choices[0].message.content, 'regular');
}

async function getJavariPicks(prompt: string, otherPicks: StockPick[]): Promise<StockPick[]> {
  // Javari uses Claude but with enhanced context from other AIs
  const enhancedPrompt = `${prompt}

COMPETITIVE INTELLIGENCE:
Other AIs have picked these tickers this week: ${[...new Set(otherPicks.map(p => p.ticker))].join(', ')}

Use this information strategically:
- If you agree with consensus, explain why
- If you disagree, provide contrarian picks with strong reasoning
- Try to find opportunities others may have missed`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: enhancedPrompt }],
    }),
  });
  
  if (!response.ok) throw new Error(`Javari error: ${response.status}`);
  const data = await response.json();
  return parseAIResponse(data.content[0].text, 'regular');
}

// Generic AI picker with category support
type AIProvider = 'openai' | 'claude' | 'gemini' | 'perplexity' | 'javari';

async function getAIPicks(
  provider: AIProvider,
  category: Category,
  currentDate: string,
  otherPicks: StockPick[] = []
): Promise<StockPick[]> {
  const prompt = buildPrompt(category, currentDate);
  
  let picks: StockPick[];
  
  switch (provider) {
    case 'openai':
      picks = await getOpenAIPicks(prompt);
      break;
    case 'claude':
      picks = await getClaudePicks(prompt);
      break;
    case 'gemini':
      picks = await getGeminiPicks(prompt);
      break;
    case 'perplexity':
      picks = await getPerplexityPicks(prompt);
      break;
    case 'javari':
      picks = await getJavariPicks(prompt, otherPicks);
      break;
    default:
      picks = [];
  }
  
  // Ensure category is set correctly
  return picks.map(p => ({ ...p, category }));
}

// ============================================
// MAIN GENERATION FUNCTION
// ============================================

export interface GenerationResult {
  success: boolean;
  totalPicks: number;
  byAI: {
    name: string;
    regular: number;
    penny: number;
    crypto: number;
    total: number;
    error?: string;
  }[];
  byCategory: {
    regular: number;
    penny: number;
    crypto: number;
  };
  savedPicks: number;
  errors: string[];
}

export async function generateAllPicks(competitionId: string, weekNumber: number): Promise<GenerationResult> {
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  const categories: Category[] = ['regular', 'penny', 'crypto'];
  const providers: { name: string; provider: AIProvider; modelId: string }[] = [
    { name: 'GPT-4', provider: 'openai', modelId: '' },
    { name: 'Claude', provider: 'claude', modelId: '' },
    { name: 'Gemini', provider: 'gemini', modelId: '' },
    { name: 'Perplexity', provider: 'perplexity', modelId: '' },
    { name: 'Javari', provider: 'javari', modelId: '' },
  ];
  
  // Get AI model IDs from database
  const { data: aiModels } = await supabase
    .from('ai_models')
    .select('id, name')
    .eq('is_active', true);
  
  const aiModelMap = new Map(aiModels?.map(m => [m.name, m.id]) || []);
  providers.forEach(p => {
    p.modelId = aiModelMap.get(p.name) || '';
  });
  
  const result: GenerationResult = {
    success: true,
    totalPicks: 0,
    byAI: [],
    byCategory: { regular: 0, penny: 0, crypto: 0 },
    savedPicks: 0,
    errors: [],
  };
  
  const allPicks: StockPick[] = [];
  const expiryDate = getNextFriday();
  
  // Generate picks for each AI
  for (const ai of providers) {
    const aiResult = {
      name: ai.name,
      regular: 0,
      penny: 0,
      crypto: 0,
      total: 0,
      error: undefined as string | undefined,
    };
    
    try {
      // Generate picks for each category
      for (const category of categories) {
        const picks = await getAIPicks(
          ai.provider,
          category,
          currentDate,
          ai.provider === 'javari' ? allPicks : []
        );
        
        // Save picks to database
        for (const pick of picks) {
          const { error } = await supabase.from('stock_picks').insert({
            competition_id: competitionId,
            ai_model_id: ai.modelId,
            ticker: pick.ticker,
            category: pick.category,
            direction: pick.direction,
            confidence: pick.confidence,
            entry_price: pick.entry_price,
            target_price: pick.target_price,
            stop_loss: pick.stop_loss,
            reasoning: pick.reasoning,
            week_number: weekNumber,
            pick_date: new Date().toISOString(),
            expiry_date: expiryDate,
            status: 'active',
          });
          
          if (!error) {
            result.savedPicks++;
            aiResult[category]++;
            aiResult.total++;
            result.byCategory[category]++;
            allPicks.push(pick);
          }
        }
      }
    } catch (e) {
      aiResult.error = String(e);
      result.errors.push(`${ai.name}: ${e}`);
    }
    
    result.byAI.push(aiResult);
    result.totalPicks += aiResult.total;
  }
  
  result.success = result.errors.length < providers.length;
  
  return result;
}

// Helper function
function getNextFriday(): string {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysUntilFriday = (5 - dayOfWeek + 7) % 7 || 7;
  const friday = new Date(now);
  friday.setDate(now.getDate() + daysUntilFriday);
  friday.setHours(16, 0, 0, 0); // 4 PM
  return friday.toISOString();
}

// ============================================
// PRICE UPDATE & SCORING
// ============================================

export async function updatePricesAndScore(): Promise<{
  updated: number;
  winners: number;
  losers: number;
  errors: string[];
}> {
  const result = { updated: 0, winners: 0, losers: 0, errors: [] as string[] };
  
  // Get active picks
  const { data: activePicks, error } = await supabase
    .from('stock_picks')
    .select('*')
    .eq('status', 'active');
  
  if (error || !activePicks) {
    result.errors.push('Failed to fetch active picks');
    return result;
  }
  
  // Group by category for different price sources
  const regularPicks = activePicks.filter(p => p.category === 'regular');
  const pennyPicks = activePicks.filter(p => p.category === 'penny');
  const cryptoPicks = activePicks.filter(p => p.category === 'crypto');
  
  // Update regular & penny stocks via Yahoo Finance
  const stockPicks = [...regularPicks, ...pennyPicks];
  if (stockPicks.length > 0) {
    const tickers = [...new Set(stockPicks.map(p => p.ticker))];
    const tickerChunks = chunkArray(tickers, 10);
    
    for (const chunk of tickerChunks) {
      try {
        const prices = await fetchYahooFinancePrices(chunk);
        
        for (const pick of stockPicks.filter(p => chunk.includes(p.ticker))) {
          const price = prices[pick.ticker];
          if (price) {
            await updatePickWithPrice(pick, price, result);
          }
        }
      } catch (e) {
        result.errors.push(`Yahoo Finance error: ${e}`);
      }
    }
  }
  
  // Update crypto via CoinGecko
  if (cryptoPicks.length > 0) {
    try {
      const cryptoTickers = [...new Set(cryptoPicks.map(p => p.ticker))];
      const prices = await fetchCryptoPrices(cryptoTickers);
      
      for (const pick of cryptoPicks) {
        const price = prices[pick.ticker];
        if (price) {
          await updatePickWithPrice(pick, price, result);
        }
      }
    } catch (e) {
      result.errors.push(`Crypto price error: ${e}`);
    }
  }
  
  return result;
}

async function updatePickWithPrice(
  pick: any,
  currentPrice: number,
  result: { updated: number; winners: number; losers: number; errors: string[] }
): Promise<void> {
  const changePercent = ((currentPrice - pick.entry_price) / pick.entry_price) * 100;
  
  let status = 'active';
  let pointsEarned = 0;
  
  // Check if target hit (winner)
  if (pick.direction === 'UP' && currentPrice >= pick.target_price) {
    status = 'won';
    pointsEarned = 10 + Math.round(pick.confidence * 0.1);
    result.winners++;
  } else if (pick.direction === 'DOWN' && currentPrice <= pick.target_price) {
    status = 'won';
    pointsEarned = 10 + Math.round(pick.confidence * 0.1);
    result.winners++;
  }
  // Check if stop loss hit (loser)
  else if (pick.direction === 'UP' && currentPrice <= pick.stop_loss) {
    status = 'lost';
    pointsEarned = -5;
    result.losers++;
  } else if (pick.direction === 'DOWN' && currentPrice >= pick.stop_loss) {
    status = 'lost';
    pointsEarned = -5;
    result.losers++;
  }
  // Check expiry
  else if (new Date(pick.expiry_date) < new Date()) {
    status = pick.direction === 'UP' 
      ? (currentPrice > pick.entry_price ? 'won' : 'lost')
      : (currentPrice < pick.entry_price ? 'won' : 'lost');
    pointsEarned = status === 'won' ? 5 : -3;
    status === 'won' ? result.winners++ : result.losers++;
  }
  
  const profitLoss = pick.direction === 'UP'
    ? currentPrice - pick.entry_price
    : pick.entry_price - currentPrice;
  
  const { error } = await supabase
    .from('stock_picks')
    .update({
      current_price: currentPrice,
      price_change_percent: changePercent,
      status,
      points_earned: pointsEarned,
      profit_loss: profitLoss,
      result: status !== 'active' ? `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%` : null,
      closed_at: status !== 'active' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', pick.id);
  
  if (!error) result.updated++;
}

// Helper functions
function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

async function fetchYahooFinancePrices(tickers: string[]): Promise<Record<string, number>> {
  const prices: Record<string, number> = {};
  
  for (const ticker of tickers) {
    try {
      const response = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`
      );
      const data = await response.json();
      const price = data.chart?.result?.[0]?.meta?.regularMarketPrice;
      if (price) prices[ticker] = price;
    } catch (e) {
      console.error(`Failed to fetch ${ticker}:`, e);
    }
  }
  
  return prices;
}

async function fetchCryptoPrices(symbols: string[]): Promise<Record<string, number>> {
  const prices: Record<string, number> = {};
  
  // Map common symbols to CoinGecko IDs
  const idMap: Record<string, string> = {
    BTC: 'bitcoin', ETH: 'ethereum', SOL: 'solana',
    AVAX: 'avalanche-2', MATIC: 'matic-network', LINK: 'chainlink',
    DOT: 'polkadot', ADA: 'cardano', XRP: 'ripple', DOGE: 'dogecoin',
    SHIB: 'shiba-inu', LTC: 'litecoin', UNI: 'uniswap', ATOM: 'cosmos',
    NEAR: 'near', APT: 'aptos', ARB: 'arbitrum', OP: 'optimism',
  };
  
  const ids = symbols.map(s => idMap[s] || s.toLowerCase()).filter(Boolean);
  
  if (ids.length === 0) return prices;
  
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(',')}&vs_currencies=usd`
    );
    const data = await response.json();
    
    for (const symbol of symbols) {
      const id = idMap[symbol] || symbol.toLowerCase();
      if (data[id]?.usd) {
        prices[symbol] = data[id].usd;
      }
    }
  } catch (e) {
    console.error('CoinGecko error:', e);
  }
  
  return prices;
}
