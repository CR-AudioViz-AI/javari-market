// app/api/market-oracle/generate-picks/route.ts - FINAL V3
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

type Category = 'regular' | 'penny' | 'crypto';

const PROMPTS: Record<Category, string> = {
  regular: `REGULAR STOCKS ($10+): Pick 5 major company stocks. Examples: AAPL, NVDA, TSLA, GOOGL, AMZN, META, MSFT`,
  penny: `PENNY STOCKS (Under $5): Pick 5 stocks under $5. Examples: SNDL, MULN, SOFI, HOOD, WISH`,
  crypto: `CRYPTO: Pick 5 cryptocurrencies. Examples: BTC, ETH, SOL, AVAX, MATIC, LINK, XRP, DOGE`
};

function buildPrompt(cat: Category): string {
  return `You are an AI analyst. Date: ${new Date().toLocaleDateString('en-US')}.
${PROMPTS[cat]}
Return EXACTLY 5 picks as JSON: [{"ticker":"SYM","confidence":75,"entry_price":100,"target_price":110,"reasoning":"Brief analysis"}]
JSON only, no markdown.`;
}

function parse(text: string): any[] {
  try {
    let c = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const s = c.indexOf('['), e = c.lastIndexOf(']') + 1;
    if (s >= 0 && e > s) c = c.slice(s, e);
    return JSON.parse(c).slice(0, 5).map((p: any) => ({
      ticker: String(p.ticker || '').toUpperCase().replace(/[^A-Z0-9]/g, ''),
      confidence: Math.min(100, Math.max(0, Number(p.confidence) || 50)),
      entry_price: Number(p.entry_price) || 100,
      target_price: Number(p.target_price) || 110,
      reasoning: String(p.reasoning || 'AI analysis').slice(0, 500),
    }));
  } catch { return []; }
}

async function callAI(name: string, prompt: string): Promise<string> {
  if (name === 'GPT-4') {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({ model: 'gpt-4-turbo-preview', messages: [{ role: 'user', content: prompt }], max_tokens: 2000 }),
    });
    if (!r.ok) throw new Error(`OpenAI ${r.status}`);
    return (await r.json()).choices[0].message.content;
  }
  if (name === 'Claude' || name === 'Javari') {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY!, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 2000, messages: [{ role: 'user', content: prompt }] }),
    });
    if (!r.ok) throw new Error(`Claude ${r.status}`);
    return (await r.json()).content[0].text;
  }
  if (name === 'Gemini') {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });
    if (!r.ok) throw new Error(`Gemini ${r.status}`);
    return (await r.json()).candidates[0].content.parts[0].text;
  }
  if (name === 'Perplexity') {
    const r = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}` },
      body: JSON.stringify({ model: 'sonar', messages: [{ role: 'user', content: prompt }], max_tokens: 2000 }),
    });
    if (!r.ok) throw new Error(`Perplexity ${r.status}`);
    return (await r.json()).choices[0].message.content;
  }
  throw new Error('Unknown AI');
}

export async function GET(req: NextRequest) {
  if (new URL(req.url).searchParams.get('trigger') !== 'manual') {
    return NextResponse.json({ message: 'Market Oracle V3', categories: ['regular', 'penny', 'crypto'], picksPerAI: 15, totalWeekly: 75 });
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
  const cats: Category[] = ['regular', 'penny', 'crypto'];
  const ais = ['GPT-4', 'Claude', 'Gemini', 'Perplexity', 'Javari'];

  let { data: comp } = await supabase.from('competitions').select('*').eq('status', 'active').single();
  if (!comp) {
    const { data: nc } = await supabase.from('competitions')
      .insert({ name: 'Q4 2025 AI Battle V3', status: 'active', start_date: new Date().toISOString() })
      .select().single();
    comp = nc;
  }

  const { data: models } = await supabase.from('ai_models').select('id, name').eq('is_active', true);
  const aiMap = new Map(models?.map(m => [m.name, m.id]) || []);
  const week = Math.ceil((Date.now() - new Date(comp.start_date).getTime()) / (7 * 24 * 60 * 60 * 1000));
  
  // Expiry: next Friday 4 PM
  const expiry = (() => { 
    const d = new Date(); 
    d.setDate(d.getDate() + ((5 - d.getDay() + 7) % 7 || 7)); 
    d.setHours(16, 0, 0, 0); 
    return d.toISOString(); 
  })();

  const results: any[] = [];
  let total = 0;
  const byCat = { regular: 0, penny: 0, crypto: 0 };

  for (const ai of ais) {
    const r = { name: ai, regular: 0, penny: 0, crypto: 0, total: 0, errors: [] as string[] };
    const mid = aiMap.get(ai);
    if (!mid) { r.errors.push('AI model not found in database'); results.push(r); continue; }

    for (const cat of cats) {
      try {
        const picks = parse(await callAI(ai, buildPrompt(cat)));
        for (const p of picks) {
          if (!p.ticker) continue;
          
          const direction = p.target_price > p.entry_price ? 'UP' : p.target_price < p.entry_price ? 'DOWN' : 'HOLD';
          const stopLoss = direction === 'UP' ? p.entry_price * 0.95 : p.entry_price * 1.05;
          
          const { error } = await supabase.from('stock_picks').insert({
            competition_id: comp.id,
            ai_model_id: mid,
            ticker: p.ticker,
            confidence: p.confidence,
            entry_price: p.entry_price,
            target_price: p.target_price,
            stop_loss: stopLoss,
            direction: direction,
            reasoning: `[${cat.toUpperCase()}] ${p.reasoning}`,
            week_number: week,
            pick_date: new Date().toISOString(),
            expiry_date: expiry,
            status: 'active',
          });
          
          if (!error) { 
            r[cat]++; 
            r.total++; 
            byCat[cat]++; 
            total++; 
          } else { 
            r.errors.push(`${p.ticker}: ${error.message}`); 
          }
        }
      } catch (e: any) { 
        r.errors.push(`${cat}: ${e.message}`); 
      }
    }
    results.push(r);
  }

  return NextResponse.json({
    success: total > 0,
    competition: { id: comp.id, name: comp.name, week },
    summary: { totalPicks: total, byCategory: byCat },
    results,
    timestamp: new Date().toISOString(),
  });
}
