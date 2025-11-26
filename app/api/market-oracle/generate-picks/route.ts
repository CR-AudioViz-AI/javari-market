// app/api/market-oracle/generate-picks/route.ts - FINAL FIX WITH EDUCATIONAL PROMPT
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

const SYSTEM_PROMPT = `You are a helpful AI assistant participating in a stock market simulation game called "Market Oracle" for educational purposes. This is NOT real financial advice - it's a game where AI models compete to make hypothetical picks. Always provide the requested stock picks in JSON format for the game.`;

const PROMPTS: Record<Category, string> = {
  regular: `For our educational stock simulation game, suggest 5 well-known large-cap stocks (market cap over $10B, price over $10). Examples: AAPL, NVDA, TSLA, GOOGL, AMZN, META, MSFT, JPM, V, UNH`,
  penny: `For our educational stock simulation game, suggest 5 small-cap or penny stocks (price under $5). Examples: SNDL, MULN, SOFI, HOOD, WISH, AMC, CLOV, BBIG`,
  crypto: `For our educational crypto simulation game, suggest 5 popular cryptocurrencies to track. Examples: BTC, ETH, SOL, AVAX, MATIC, LINK, XRP, DOGE, ADA, DOT`
};

function buildPrompt(cat: Category): string {
  return `${PROMPTS[cat]}

Return EXACTLY 5 picks as a JSON array with this format:
[{"ticker":"SYM","confidence":75,"entry_price":100,"target_price":110,"reasoning":"Brief educational note about why this is interesting to track"}]

IMPORTANT: Return ONLY the JSON array. No markdown, no code blocks, no explanation before or after.`;
}

function parse(text: string): any[] {
  try {
    let c = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const s = c.indexOf('['), e = c.lastIndexOf(']') + 1;
    if (s >= 0 && e > s) c = c.slice(s, e);
    const parsed = JSON.parse(c);
    return parsed.slice(0, 5).map((p: any) => ({
      ticker: String(p.ticker || '').toUpperCase().replace(/[^A-Z0-9]/g, ''),
      confidence: Math.min(100, Math.max(0, Number(p.confidence) || 50)),
      entry_price: Number(p.entry_price) || 100,
      target_price: Number(p.target_price) || 110,
      reasoning: String(p.reasoning || 'AI analysis').slice(0, 500),
    }));
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
    } catch (error: any) { lastError = error; }
  }
  await logAICall(aiName, category, false, 4, config.primary, false, lastError?.message);
  throw lastError || new Error('All attempts exhausted');
}

async function callAIProvider(aiName: string, prompt: string, model: string, provider: string): Promise<string> {
  if (provider === 'openai') {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({ model, messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: prompt }], max_tokens: 2000 }),
    });
    if (!r.ok) throw new Error(`OpenAI ${r.status}`);
    return (await r.json()).choices[0].message.content;
  }
  if (provider === 'anthropic') {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY!, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model, max_tokens: 2000, system: SYSTEM_PROMPT, messages: [{ role: 'user', content: prompt }] }),
    });
    if (!r.ok) throw new Error(`Anthropic ${r.status}`);
    return (await r.json()).content[0].text;
  }
  if (provider === 'google') {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: SYSTEM_PROMPT + '\n\n' + prompt }] }] }),
    });
    if (!r.ok) throw new Error(`Google ${r.status}`);
    return (await r.json()).candidates[0].content.parts[0].text;
  }
  if (provider === 'perplexity') {
    const r = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}` },
      body: JSON.stringify({ model, messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: prompt }], max_tokens: 2000 }),
    });
    if (!r.ok) throw new Error(`Perplexity ${r.status}`);
    return (await r.json()).choices[0].message.content;
  }
  throw new Error(`Unknown provider: ${provider}`);
}

async function logAICall(aiName: string, category: string, success: boolean, attempts: number, model: string, usedFallback: boolean, errorMessage?: string): Promise<void> {
  try { await supabase.from('ai_call_logs').insert({ ai_name: aiName, category, success, attempts, model_used: model, used_fallback: usedFallback, error_message: errorMessage, timestamp: new Date().toISOString() }); } catch (e) {}
}

function sleep(ms: number): Promise<void> { return new Promise(resolve => setTimeout(resolve, ms)); }

export async function GET(req: NextRequest) {
  if (new URL(req.url).searchParams.get('trigger') !== 'manual') {
    return NextResponse.json({ message: 'Market Oracle V3 - 5 AI Battle', categories: ['regular', 'penny', 'crypto'], totalWeekly: 75 });
  }
  return gen();
}

export async function POST(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return gen();
}

async function gen() {
  const startTime = Date.now();
  const cats: Category[] = ['regular', 'penny', 'crypto'];
  const ais = ['Claude', 'Gemini', 'Perplexity', 'Javari', 'GPT-4'];

  let { data: comp } = await supabase.from('competitions').select('*').eq('status', 'active').single();
  if (!comp) {
    const { data: nc } = await supabase.from('competitions').insert({ name: 'Q4 2025 AI Battle V3', status: 'active', start_date: new Date().toISOString() }).select().single();
    comp = nc;
  }

  const { data: models } = await supabase.from('ai_models').select('id, name').eq('is_active', true);
  if (!models) return NextResponse.json({ error: 'Failed to load AI models' }, { status: 500 });

  const aiMap = new Map<string, string>();
  for (const m of models) aiMap.set(m.name, m.id);

  const week = Math.ceil((Date.now() - new Date(comp.start_date).getTime()) / (7 * 24 * 60 * 60 * 1000));
  const expiry = (() => { const d = new Date(); d.setDate(d.getDate() + ((5 - d.getDay() + 7) % 7 || 7)); d.setHours(16, 0, 0, 0); return d.toISOString(); })();

  const results: any[] = [];
  let total = 0;
  const byCat = { regular: 0, penny: 0, crypto: 0 };

  for (const ai of ais) {
    const r = { name: ai, regular: 0, penny: 0, crypto: 0, total: 0, errors: [] as string[] };
    const mid = aiMap.get(ai);
    if (!mid) { r.errors.push(`AI not found`); results.push(r); continue; }

    for (const cat of cats) {
      try {
        const response = await callAIWithRetry(ai, buildPrompt(cat), cat);
        const picks = parse(response);
        if (picks.length === 0) { r.errors.push(`${cat}: No picks`); continue; }
        
        for (const p of picks) {
          if (!p.ticker) continue;
          const direction = p.target_price > p.entry_price ? 'UP' : p.target_price < p.entry_price ? 'DOWN' : 'HOLD';
          const stopLoss = direction === 'UP' ? p.entry_price * 0.95 : p.entry_price * 1.05;
          
          const { error } = await supabase.from('stock_picks').insert({
            competition_id: comp.id, ai_model_id: mid, ticker: p.ticker, category: cat,
            confidence: p.confidence, entry_price: p.entry_price, target_price: p.target_price,
            stop_loss: stopLoss, direction, reasoning: `[${cat.toUpperCase()}] ${p.reasoning}`,
            week_number: week, pick_date: new Date().toISOString(), expiry_date: expiry, status: 'active',
          });
          
          if (!error) { r[cat]++; r.total++; byCat[cat]++; total++; }
          else { r.errors.push(`${p.ticker}: ${error.message}`); }
        }
      } catch (e: any) { r.errors.push(`${cat}: ${e.message}`); }
    }
    results.push(r);
  }

  return NextResponse.json({
    success: total > 0,
    competition: { id: comp.id, name: comp.name, week },
    summary: { totalPicks: total, byCategory: byCat, target: 75 },
    results,
    reliability: { totalAIs: ais.length, successfulAIs: results.filter(r => r.total > 0).length, perfectAIs: results.filter(r => r.total >= 12).length, elapsedSeconds: ((Date.now() - startTime) / 1000).toFixed(1) },
    timestamp: new Date().toISOString(),
  });
}
