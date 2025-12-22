// lib/ai/pick-generator.ts
// Market Oracle Ultimate - AI Pick Generator with Google AI SDK
// Updated: December 14, 2025 - Use official Google AI SDK for Gemini

import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AIModelName, AIPick, PickDirection, ConsensusAssessment } from '../types/learning';
import { getLatestCalibration } from '../learning/calibration-engine';
import { buildJavariConsensus } from '../learning/javari-consensus';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Initialize Google AI
const genAI = process.env.GEMINI_API_KEY 
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

// AI Configuration
const AI_CONFIGS: Record<string, { model: string; enabled: boolean; name: string }> = {
  gpt4: { model: 'gpt-4-turbo-preview', enabled: true, name: 'GPT-4' },
  claude: { model: 'claude-3-sonnet-20240229', enabled: true, name: 'Claude' },
  gemini: { model: 'gemini-pro-latest', enabled: true, name: 'Gemini' },
  perplexity: { model: 'sonar', enabled: true, name: 'Perplexity' },
};

interface MarketData {
  symbol: string;
  companyName: string;
  sector: string;
  currentPrice: number;
  changePercent24h: number;
  volume: number;
  avgVolume: number;
  marketCap: number;
  peRatio: number | null;
  high52Week: number;
  low52Week: number;
  sma50: number | null;
  sma200: number | null;
}

async function getMarketData(symbol: string): Promise<MarketData | null> {
  try {
    const key = process.env.ALPHA_VANTAGE_API_KEY;
    const qRes = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${key}`);
    const qData = await qRes.json();
    const q = qData['Global Quote'];
    if (!q || !q['05. price']) return null;
    
    const oRes = await fetch(`https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${key}`);
    const o = await oRes.json();
    
    return {
      symbol: symbol.toUpperCase(),
      companyName: o.Name || symbol,
      sector: o.Sector || 'Unknown',
      currentPrice: parseFloat(q['05. price']),
      changePercent24h: parseFloat((q['10. change percent'] || '0%').replace('%', '')),
      volume: parseInt(q['06. volume'] || '0'),
      avgVolume: parseInt(o.AverageVolume || '0'),
      marketCap: parseInt(o.MarketCapitalization || '0'),
      peRatio: o.PERatio ? parseFloat(o.PERatio) : null,
      high52Week: parseFloat(o['52WeekHigh'] || q['03. high']),
      low52Week: parseFloat(o['52WeekLow'] || q['04. low']),
      sma50: o['50DayMovingAverage'] ? parseFloat(o['50DayMovingAverage']) : null,
      sma200: o['200DayMovingAverage'] ? parseFloat(o['200DayMovingAverage']) : null,
    };
  } catch (err) { 
    console.error('Market data error:', err);
    return null; 
  }
}

function buildPrompt(m: MarketData, cal: { bestSectors: string[]; worstSectors: string[]; adjustments: string[] } | null): string {
  const base = `Analyze ${m.symbol} (${m.companyName}). Price: $${m.currentPrice.toFixed(2)}, Change: ${m.changePercent24h.toFixed(2)}%, Sector: ${m.sector}, MCap: $${(m.marketCap/1e9).toFixed(2)}B, PE: ${m.peRatio||'N/A'}, 52W: $${m.low52Week.toFixed(2)}-$${m.high52Week.toFixed(2)}, SMA50: ${m.sma50?'$'+m.sma50.toFixed(2):'N/A'}, SMA200: ${m.sma200?'$'+m.sma200.toFixed(2):'N/A'}.`;
  const calInfo = cal ? ` Best sectors: ${cal.bestSectors.join(',')}.` : '';
  const format = ` Respond JSON ONLY: {"direction":"UP"|"DOWN"|"HOLD","confidence":0-100,"thesis":"text","full_reasoning":"text","target_price":number,"stop_loss":number,"timeframe":"1W"|"2W"|"1M","factor_assessments":[{"factorId":"pe_ratio","factorName":"P/E","value":"v","interpretation":"BULLISH"|"BEARISH"|"NEUTRAL","confidence":0-100,"reasoning":"why"}],"key_bullish_factors":["f"],"key_bearish_factors":["f"],"risks":["r"],"catalysts":["c"]}`;
  return base + calInfo + format;
}

async function callGPT4(prompt: string): Promise<string | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: 'gpt-4-turbo-preview', messages: [{ role: 'user', content: prompt }], max_tokens: 2000, temperature: 0.3 }),
    });
    if (!r.ok) return null;
    const d = await r.json();
    return d.choices?.[0]?.message?.content || null;
  } catch { return null; }
}

async function callClaude(prompt: string): Promise<string | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-3-sonnet-20240229', max_tokens: 2000, messages: [{ role: 'user', content: prompt }] }),
    });
    const d = await r.json();
    if (d.error) return null;
    return d.content?.[0]?.text || null;
  } catch { return null; }
}

async function callGemini(prompt: string): Promise<string | null> {
  if (!genAI) {
    console.log('Gemini: No API key configured');
    return null;
  }
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro-latest' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    console.log('Gemini response received:', text?.substring(0, 100));
    return text || null;
  } catch (err) {
    console.error('Gemini SDK error:', err);
    return null;
  }
}

async function callPerplexity(prompt: string): Promise<string | null> {
  const key = process.env.PERPLEXITY_API_KEY;
  if (!key) return null;
  try {
    const r = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: 'sonar', messages: [{ role: 'user', content: prompt }], max_tokens: 2000, temperature: 0.3 }),
    });
    if (!r.ok) return null;
    const d = await r.json();
    return d.choices?.[0]?.message?.content || null;
  } catch { return null; }
}

function parsePick(res: string, ai: AIModelName, m: MarketData): AIPick | null {
  try {
    const c = res.trim().replace(/^```json\s*/g, '').replace(/\s*```$/g, '').replace(/^```\s*/g, '');
    const p = JSON.parse(c);
    const now = new Date();
    const exp = new Date(now);
    const tf = p.timeframe || '1W';
    exp.setDate(exp.getDate() + (tf === '2W' ? 14 : tf === '1M' ? 30 : 7));
    return {
      id: crypto.randomUUID(), aiModel: ai, symbol: m.symbol, companyName: m.companyName, sector: m.sector,
      direction: p.direction as PickDirection, confidence: p.confidence, timeframe: tf,
      entryPrice: m.currentPrice, targetPrice: p.target_price, stopLoss: p.stop_loss,
      thesis: p.thesis, fullReasoning: p.full_reasoning, factorAssessments: p.factor_assessments || [],
      keyBullishFactors: p.key_bullish_factors || [], keyBearishFactors: p.key_bearish_factors || [],
      risks: p.risks || [], catalysts: p.catalysts || [], createdAt: now, expiresAt: exp, status: 'PENDING',
    };
  } catch { return null; }
}

function toDb(p: AIPick): Record<string, unknown> {
  return {
    id: p.id, ai_model: p.aiModel, symbol: p.symbol, company_name: p.companyName, sector: p.sector,
    direction: p.direction, confidence: p.confidence, timeframe: p.timeframe,
    entry_price: p.entryPrice, target_price: p.targetPrice, stop_loss: p.stopLoss,
    thesis: p.thesis, full_reasoning: p.fullReasoning, factor_assessments: p.factorAssessments,
    key_bullish_factors: p.keyBullishFactors, key_bearish_factors: p.keyBearishFactors,
    risks: p.risks, catalysts: p.catalysts, created_at: p.createdAt.toISOString(),
    expires_at: p.expiresAt.toISOString(), status: p.status,
  };
}

async function savePickToDb(pick: AIPick): Promise<boolean> {
  try {
    const { error } = await supabase.from('market_oracle_picks').insert(toDb(pick));
    return !error;
  } catch { return false; }
}

async function saveConsensusToDb(symbol: string, consensus: ConsensusAssessment): Promise<boolean> {
  try {
    const agreeingModels = consensus.aiPicks
      .filter(p => p.direction === consensus.consensusDirection)
      .map(p => p.aiModel);
    
    const { error } = await supabase.from('market_oracle_consensus_picks').insert({
      symbol,
      direction: consensus.consensusDirection,
      ai_combination: agreeingModels,
      ai_combination_key: agreeingModels.sort().join('+'),
      consensus_strength: consensus.consensusStrength,
      weighted_confidence: consensus.weightedConfidence,
      javari_confidence: consensus.javariConfidence,
      javari_reasoning: consensus.javariReasoning,
      status: 'PENDING',
      created_at: new Date().toISOString(),
    });
    return !error;
  } catch { return false; }
}

// Generate pick from a single AI
export async function generatePickFromAI(ai: Exclude<AIModelName, 'javari'>, sym: string): Promise<AIPick | null> {
  if (!AI_CONFIGS[ai]?.enabled) return null;
  
  const m = await getMarketData(sym);
  if (!m) return null;
  
  const cal = await getLatestCalibration(ai);
  const prompt = buildPrompt(m, cal);
  
  let res: string | null = null;
  switch (ai) {
    case 'gpt4': res = await callGPT4(prompt); break;
    case 'claude': res = await callClaude(prompt); break;
    case 'gemini': res = await callGemini(prompt); break;
    case 'perplexity': res = await callPerplexity(prompt); break;
  }
  
  if (!res) return null;
  const pick = parsePick(res, ai, m);
  if (!pick) return null;
  
  await savePickToDb(pick);
  return pick;
}

// Generate picks from ALL AIs in parallel
export async function generateAllAIPicks(symbol: string): Promise<{ 
  picks: AIPick[]; 
  consensus: ConsensusAssessment | null; 
  dbErrors: string[];
  aiStatus: Record<string, string>;
}> {
  const aiStatus: Record<string, string> = {};
  const dbErrors: string[] = [];
  
  // Get market data first (shared by all AIs)
  const m = await getMarketData(symbol);
  if (!m) {
    return { picks: [], consensus: null, dbErrors: ['No market data'], aiStatus: {} };
  }
  
  const aiModels: Array<Exclude<AIModelName, 'javari'>> = ['gpt4', 'claude', 'gemini', 'perplexity'];
  const enabledAIs = aiModels.filter(ai => AI_CONFIGS[ai]?.enabled);
  
  // Build prompts (can use calibration data)
  const promptPromises = enabledAIs.map(async ai => {
    const cal = await getLatestCalibration(ai);
    return { ai, prompt: buildPrompt(m, cal) };
  });
  const prompts = await Promise.all(promptPromises);
  
  // Call all AIs in PARALLEL
  const aiCalls = prompts.map(async ({ ai, prompt }) => {
    let res: string | null = null;
    switch (ai) {
      case 'gpt4': res = await callGPT4(prompt); break;
      case 'claude': res = await callClaude(prompt); break;
      case 'gemini': res = await callGemini(prompt); break;
      case 'perplexity': res = await callPerplexity(prompt); break;
    }
    return { ai, res };
  });
  
  const results = await Promise.all(aiCalls);
  
  // Parse results and save to DB
  const picks: AIPick[] = [];
  for (const { ai, res } of results) {
    if (!res) {
      aiStatus[ai] = 'failed';
      continue;
    }
    
    const pick = parsePick(res, ai, m);
    if (!pick) {
      aiStatus[ai] = 'parse_failed';
      continue;
    }
    
    const saved = await savePickToDb(pick);
    if (!saved) {
      dbErrors.push(`Failed to save ${ai} pick`);
    }
    
    picks.push(pick);
    aiStatus[ai] = 'success';
  }
  
  // Mark disabled AIs
  for (const ai of aiModels) {
    if (!enabledAIs.includes(ai)) {
      aiStatus[ai] = 'disabled';
    }
  }
  
  // Build consensus if we have 2+ picks
  let consensus: ConsensusAssessment | null = null;
  if (picks.length >= 2) {
    const fp = picks.map(p => ({ aiModel: p.aiModel, direction: p.direction, confidence: p.confidence, pickId: p.id }));
    consensus = await buildJavariConsensus(symbol, fp);
    
    if (consensus) {
      const saved = await saveConsensusToDb(symbol, consensus);
      if (!saved) {
        dbErrors.push('Failed to save consensus');
      }
    }
  }
  
  return { picks, consensus, dbErrors, aiStatus };
}

