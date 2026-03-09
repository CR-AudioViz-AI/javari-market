// Market Oracle - AI Price Targets API
// Multiple AI models generate price targets with consensus

import { NextResponse } from 'next/server';

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

interface PriceTarget {
  model: string;
  modelId: string;
  tier: 'large' | 'medium' | 'small';
  target30Day: number;
  target90Day: number;
  target12Month: number;
  recommendation: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
  confidence: number;
  reasoning: string;
  keyFactors: string[];
  risks: string[];
  upside30Day: number;
  upside12Month: number;
  processingTime: number;
}

async function fetchStockData(symbol: string): Promise<any> {
  try {
    const [quoteRes, profileRes, metricsRes] = await Promise.all([
      fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`),
      fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${FINNHUB_API_KEY}`),
      fetch(`https://finnhub.io/api/v1/stock/metric?symbol=${symbol}&metric=all&token=${FINNHUB_API_KEY}`)
    ]);
    const [quote, profile, metrics] = await Promise.all([quoteRes.json(), profileRes.json(), metricsRes.json()]);
    return {
      symbol, name: profile.name || symbol, price: quote.c || 0,
      change: quote.d || 0, changePercent: quote.dp || 0,
      high52Week: metrics.metric?.['52WeekHigh'] || 0, low52Week: metrics.metric?.['52WeekLow'] || 0,
      marketCap: profile.marketCapitalization || 0, pe: metrics.metric?.peBasicExclExtraTTM || 0,
      eps: metrics.metric?.epsBasicExclExtraItemsTTM || 0, beta: metrics.metric?.beta || 1,
      industry: profile.finnhubIndustry || 'Unknown'
    };
  } catch (error) { return null; }
}

function buildPrompt(stockData: any): string {
  return `Analyze ${stockData.symbol} (${stockData.name}): Price $${stockData.price.toFixed(2)}, P/E ${stockData.pe.toFixed(2)}, 52W Range $${stockData.low52Week}-${stockData.high52Week}, Industry: ${stockData.industry}
Respond ONLY with JSON: {"target30Day":<n>,"target90Day":<n>,"target12Month":<n>,"recommendation":"<strong_buy|buy|hold|sell|strong_sell>","confidence":<1-100>,"reasoning":"<paragraph>","keyFactors":["<f1>","<f2>","<f3>"],"risks":["<r1>","<r2>","<r3>"]}`;
}

async function getGPT4Target(stockData: any): Promise<PriceTarget | null> {
  if (!OPENAI_API_KEY) return null;
  const start = Date.now();
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` },
      body: JSON.stringify({ model: 'gpt-4o', messages: [{ role: 'system', content: 'Stock analyst. JSON only.' }, { role: 'user', content: buildPrompt(stockData) }], temperature: 0.3, max_tokens: 500 })
    });
    if (!res.ok) return null;
    const data = await res.json();
    const parsed = JSON.parse((data.choices?.[0]?.message?.content || '').replace(/```json\n?|\n?```/g, '').trim());
    return { model: 'GPT-4o', modelId: 'gpt-4o', tier: 'large', ...parsed, upside30Day: ((parsed.target30Day - stockData.price) / stockData.price) * 100, upside12Month: ((parsed.target12Month - stockData.price) / stockData.price) * 100, processingTime: Date.now() - start };
  } catch { return null; }
}

async function getClaudeTarget(stockData: any): Promise<PriceTarget | null> {
  if (!ANTHROPIC_API_KEY) return null;
  const start = Date.now();
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-3-5-sonnet-20241022', max_tokens: 500, messages: [{ role: 'user', content: buildPrompt(stockData) }] })
    });
    if (!res.ok) return null;
    const data = await res.json();
    const parsed = JSON.parse((data.content?.[0]?.text || '').replace(/```json\n?|\n?```/g, '').trim());
    return { model: 'Claude Sonnet', modelId: 'claude-3-5-sonnet', tier: 'large', ...parsed, upside30Day: ((parsed.target30Day - stockData.price) / stockData.price) * 100, upside12Month: ((parsed.target12Month - stockData.price) / stockData.price) * 100, processingTime: Date.now() - start };
  } catch { return null; }
}

async function getGeminiTarget(stockData: any): Promise<PriceTarget | null> {
  if (!GEMINI_API_KEY) return null;
  const start = Date.now();
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: buildPrompt(stockData) }] }], generationConfig: { temperature: 0.3, maxOutputTokens: 500 } })
    });
    if (!res.ok) return null;
    const data = await res.json();
    const parsed = JSON.parse((data.candidates?.[0]?.content?.parts?.[0]?.text || '').replace(/```json\n?|\n?```/g, '').trim());
    return { model: 'Gemini Flash', modelId: 'gemini-1.5-flash', tier: 'medium', ...parsed, upside30Day: ((parsed.target30Day - stockData.price) / stockData.price) * 100, upside12Month: ((parsed.target12Month - stockData.price) / stockData.price) * 100, processingTime: Date.now() - start };
  } catch { return null; }
}

async function getGroqTarget(stockData: any): Promise<PriceTarget | null> {
  if (!GROQ_API_KEY) return null;
  const start = Date.now();
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` },
      body: JSON.stringify({ model: 'llama-3.1-70b-versatile', messages: [{ role: 'system', content: 'Stock analyst. JSON only.' }, { role: 'user', content: buildPrompt(stockData) }], temperature: 0.3, max_tokens: 500 })
    });
    if (!res.ok) return null;
    const data = await res.json();
    const parsed = JSON.parse((data.choices?.[0]?.message?.content || '').replace(/```json\n?|\n?```/g, '').trim());
    return { model: 'Llama 3.1 70B', modelId: 'llama-3.1-70b', tier: 'medium', ...parsed, upside30Day: ((parsed.target30Day - stockData.price) / stockData.price) * 100, upside12Month: ((parsed.target12Month - stockData.price) / stockData.price) * 100, processingTime: Date.now() - start };
  } catch { return null; }
}

function calculateConsensus(targets: PriceTarget[], price: number): any {
  if (!targets.length) return null;
  const weights: Record<string, number> = { large: 1.5, medium: 1.0, small: 0.7 };
  let tw = 0, w30 = 0, w90 = 0, w12 = 0, wc = 0;
  const recs: Record<string, number> = {};
  for (const t of targets) {
    const w = weights[t.tier]; tw += w;
    w30 += t.target30Day * w; w90 += t.target90Day * w; w12 += t.target12Month * w; wc += t.confidence * w;
    recs[t.recommendation] = (recs[t.recommendation] || 0) + 1;
  }
  const c30 = w30 / tw, c90 = w90 / tw, c12 = w12 / tw;
  return { target30Day: Math.round(c30 * 100) / 100, target90Day: Math.round(c90 * 100) / 100, target12Month: Math.round(c12 * 100) / 100, upside30Day: Math.round(((c30 - price) / price) * 10000) / 100, upside12Month: Math.round(((c12 - price) / price) * 10000) / 100, recommendation: Object.entries(recs).sort((a, b) => b[1] - a[1])[0][0], confidence: Math.round(wc / tw), modelsAgree: targets.length };
}

export async function GET(request: Request) {
  const start = Date.now();
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  if (!symbol) return NextResponse.json({ success: false, error: 'Symbol required' }, { status: 400 });
  const stockData = await fetchStockData(symbol.toUpperCase());
  if (!stockData?.price) return NextResponse.json({ success: false, error: `No data for ${symbol}` }, { status: 404 });
  const [gpt4, claude, gemini, groq] = await Promise.all([getGPT4Target(stockData), getClaudeTarget(stockData), getGeminiTarget(stockData), getGroqTarget(stockData)]);
  const targets = [gpt4, claude, gemini, groq].filter((t): t is PriceTarget => t !== null);
  if (!targets.length) return NextResponse.json({ success: false, error: 'No AI models responded' }, { status: 500 });
  const consensus = calculateConsensus(targets, stockData.price);
  return NextResponse.json({ success: true, timestamp: new Date().toISOString(), processingTime: `${Date.now() - start}ms`, stock: stockData, consensus, aiTargets: targets, disclaimer: 'AI-generated. Not financial advice.' });
}
