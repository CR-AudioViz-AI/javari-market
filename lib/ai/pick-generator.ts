// lib/ai/pick-generator.ts
// Market Oracle Ultimate - Enhanced AI Pick Generator
// Updated: December 21, 2025 - 22 AI Models, 3 Tiers, 11 Providers

import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AIPick, PickDirection, ConsensusAssessment } from '../types/learning';
import { getLatestCalibration } from '../learning/calibration-engine';
import { buildJavariConsensus } from '../learning/javari-consensus';
import { AI_MODELS, AI_PROVIDERS, type AIModelId, type AITier } from '../types/ai-models';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Initialize Google AI
const genAI = process.env.GEMINI_API_KEY 
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

// ============================================================================
// MARKET DATA
// ============================================================================

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

// ============================================================================
// PROMPT BUILDING
// ============================================================================

function buildPrompt(
  m: MarketData, 
  modelId: AIModelId,
  cal: { bestSectors: string[]; worstSectors: string[]; adjustments: string[] } | null
): string {
  const modelConfig = AI_MODELS[modelId];
  const personality = modelConfig?.personality || 'analytical and thorough';
  const style = modelConfig?.tradingStyle || 'balanced';
  
  const base = `You are ${modelConfig?.displayName || modelId}, an AI stock analyst with personality: "${personality}". Trading style: ${style}.

Analyze ${m.symbol} (${m.companyName}).
Current Price: $${m.currentPrice.toFixed(2)}
24h Change: ${m.changePercent24h.toFixed(2)}%
Sector: ${m.sector}
Market Cap: $${(m.marketCap/1e9).toFixed(2)}B
P/E Ratio: ${m.peRatio || 'N/A'}
52-Week Range: $${m.low52Week.toFixed(2)} - $${m.high52Week.toFixed(2)}
SMA 50: ${m.sma50 ? '$' + m.sma50.toFixed(2) : 'N/A'}
SMA 200: ${m.sma200 ? '$' + m.sma200.toFixed(2) : 'N/A'}`;

  const calInfo = cal ? `\nHistorical calibration: Best performing sectors: ${cal.bestSectors.join(', ')}.` : '';
  
  const format = `

Respond with ONLY valid JSON (no markdown, no code blocks):
{
  "direction": "UP" | "DOWN" | "HOLD",
  "confidence": 0-100,
  "thesis": "2-3 sentence summary",
  "full_reasoning": "detailed analysis",
  "target_price": number,
  "stop_loss": number,
  "timeframe": "1W" | "2W" | "1M",
  "factor_assessments": [
    {"factorId": "pe_ratio", "factorName": "P/E Ratio", "value": "string", "interpretation": "BULLISH" | "BEARISH" | "NEUTRAL", "confidence": 0-100, "reasoning": "why"}
  ],
  "key_bullish_factors": ["factor1", "factor2"],
  "key_bearish_factors": ["factor1", "factor2"],
  "risks": ["risk1", "risk2"],
  "catalysts": ["catalyst1", "catalyst2"]
}`;

  return base + calInfo + format;
}

// ============================================================================
// AI API CALLS - By Provider
// ============================================================================

// OpenAI (GPT models)
async function callOpenAI(prompt: string, modelString: string): Promise<string | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ 
        model: modelString, 
        messages: [{ role: 'user', content: prompt }], 
        max_tokens: 2000, 
        temperature: 0.3,
        response_format: { type: 'json_object' }
      }),
    });
    if (!r.ok) {
      console.error(`OpenAI ${modelString} error:`, r.status);
      return null;
    }
    const d = await r.json();
    return d.choices?.[0]?.message?.content || null;
  } catch (e) { 
    console.error(`OpenAI ${modelString} exception:`, e);
    return null; 
  }
}

// Anthropic (Claude models)
async function callAnthropic(prompt: string, modelString: string): Promise<string | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'x-api-key': key, 
        'anthropic-version': '2023-06-01' 
      },
      body: JSON.stringify({ 
        model: modelString, 
        max_tokens: 2000, 
        messages: [{ role: 'user', content: prompt }] 
      }),
    });
    const d = await r.json();
    if (d.error) {
      console.error(`Anthropic ${modelString} error:`, d.error);
      return null;
    }
    return d.content?.[0]?.text || null;
  } catch (e) { 
    console.error(`Anthropic ${modelString} exception:`, e);
    return null; 
  }
}

// Google (Gemini models)
async function callGoogle(prompt: string, modelString: string): Promise<string | null> {
  if (!genAI) {
    console.log('Gemini: No API key configured');
    return null;
  }
  try {
    const model = genAI.getGenerativeModel({ model: modelString });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return text || null;
  } catch (err) {
    console.error(`Gemini ${modelString} error:`, err);
    return null;
  }
}

// Perplexity (Sonar models)
async function callPerplexity(prompt: string, modelString: string): Promise<string | null> {
  const key = process.env.PERPLEXITY_API_KEY;
  if (!key) return null;
  try {
    const r = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ 
        model: modelString, 
        messages: [{ role: 'user', content: prompt }], 
        max_tokens: 2000, 
        temperature: 0.3 
      }),
    });
    if (!r.ok) {
      console.error(`Perplexity ${modelString} error:`, r.status);
      return null;
    }
    const d = await r.json();
    return d.choices?.[0]?.message?.content || null;
  } catch (e) { 
    console.error(`Perplexity ${modelString} exception:`, e);
    return null; 
  }
}

// Groq (Fast inference)
async function callGroq(prompt: string, modelString: string): Promise<string | null> {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ 
        model: modelString, 
        messages: [{ role: 'user', content: prompt }], 
        max_tokens: 2000, 
        temperature: 0.3 
      }),
    });
    if (!r.ok) {
      console.error(`Groq ${modelString} error:`, r.status);
      return null;
    }
    const d = await r.json();
    return d.choices?.[0]?.message?.content || null;
  } catch (e) { 
    console.error(`Groq ${modelString} exception:`, e);
    return null; 
  }
}

// Mistral
async function callMistral(prompt: string, modelString: string): Promise<string | null> {
  const key = process.env.MISTRAL_API_KEY;
  if (!key) return null;
  try {
    const r = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ 
        model: modelString, 
        messages: [{ role: 'user', content: prompt }], 
        max_tokens: 2000, 
        temperature: 0.3 
      }),
    });
    if (!r.ok) {
      console.error(`Mistral ${modelString} error:`, r.status);
      return null;
    }
    const d = await r.json();
    return d.choices?.[0]?.message?.content || null;
  } catch (e) { 
    console.error(`Mistral ${modelString} exception:`, e);
    return null; 
  }
}

// xAI (Grok)
async function callXAI(prompt: string, modelString: string): Promise<string | null> {
  const key = process.env.XAI_API_KEY;
  if (!key) return null;
  try {
    const r = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ 
        model: modelString, 
        messages: [{ role: 'user', content: prompt }], 
        max_tokens: 2000, 
        temperature: 0.3 
      }),
    });
    if (!r.ok) {
      console.error(`xAI ${modelString} error:`, r.status);
      return null;
    }
    const d = await r.json();
    return d.choices?.[0]?.message?.content || null;
  } catch (e) { 
    console.error(`xAI ${modelString} exception:`, e);
    return null; 
  }
}

// Cohere
async function callCohere(prompt: string, modelString: string): Promise<string | null> {
  const key = process.env.COHERE_API_KEY;
  if (!key) return null;
  try {
    const r = await fetch('https://api.cohere.ai/v1/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ 
        model: modelString, 
        message: prompt,
        temperature: 0.3 
      }),
    });
    if (!r.ok) {
      console.error(`Cohere ${modelString} error:`, r.status);
      return null;
    }
    const d = await r.json();
    return d.text || null;
  } catch (e) { 
    console.error(`Cohere ${modelString} exception:`, e);
    return null; 
  }
}

// Together AI
async function callTogether(prompt: string, modelString: string): Promise<string | null> {
  const key = process.env.TOGETHER_API_KEY;
  if (!key) return null;
  try {
    const r = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ 
        model: modelString, 
        messages: [{ role: 'user', content: prompt }], 
        max_tokens: 2000, 
        temperature: 0.3 
      }),
    });
    if (!r.ok) {
      console.error(`Together ${modelString} error:`, r.status);
      return null;
    }
    const d = await r.json();
    return d.choices?.[0]?.message?.content || null;
  } catch (e) { 
    console.error(`Together ${modelString} exception:`, e);
    return null; 
  }
}

// Fireworks AI
async function callFireworks(prompt: string, modelString: string): Promise<string | null> {
  const key = process.env.FIREWORKS_API_KEY;
  if (!key) return null;
  try {
    const r = await fetch('https://api.fireworks.ai/inference/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ 
        model: modelString, 
        messages: [{ role: 'user', content: prompt }], 
        max_tokens: 2000, 
        temperature: 0.3 
      }),
    });
    if (!r.ok) {
      console.error(`Fireworks ${modelString} error:`, r.status);
      return null;
    }
    const d = await r.json();
    return d.choices?.[0]?.message?.content || null;
  } catch (e) { 
    console.error(`Fireworks ${modelString} exception:`, e);
    return null; 
  }
}

// ============================================================================
// UNIFIED AI CALLER
// ============================================================================

async function callAI(modelId: AIModelId, prompt: string): Promise<string | null> {
  const modelConfig = AI_MODELS[modelId];
  if (!modelConfig || !modelConfig.enabled) {
    console.log(`Model ${modelId} is disabled or not found`);
    return null;
  }
  
  const providerConfig = AI_PROVIDERS[modelConfig.provider];
  if (!providerConfig || !providerConfig.enabled) {
    console.log(`Provider ${modelConfig.provider} is disabled or not found`);
    return null;
  }
  
  const modelString = modelConfig.modelString;
  
  switch (modelConfig.provider) {
    case 'openai':
      return callOpenAI(prompt, modelString);
    case 'anthropic':
      return callAnthropic(prompt, modelString);
    case 'google':
      return callGoogle(prompt, modelString);
    case 'perplexity':
      return callPerplexity(prompt, modelString);
    case 'groq':
      return callGroq(prompt, modelString);
    case 'mistral':
      return callMistral(prompt, modelString);
    case 'xai':
      return callXAI(prompt, modelString);
    case 'cohere':
      return callCohere(prompt, modelString);
    case 'together':
      return callTogether(prompt, modelString);
    case 'fireworks':
      return callFireworks(prompt, modelString);
    default:
      console.log(`Unknown provider: ${modelConfig.provider}`);
      return null;
  }
}

// ============================================================================
// RESPONSE PARSING
// ============================================================================

function parsePick(res: string, modelId: AIModelId, m: MarketData): AIPick | null {
  try {
    // Clean up response
    const c = res.trim()
      .replace(/^```json\s*/g, '')
      .replace(/\s*```$/g, '')
      .replace(/^```\s*/g, '');
    
    const p = JSON.parse(c);
    const now = new Date();
    const exp = new Date(now);
    const tf = p.timeframe || '1W';
    exp.setDate(exp.getDate() + (tf === '2W' ? 14 : tf === '1M' ? 30 : 7));
    
    const modelConfig = AI_MODELS[modelId];
    
    return {
      id: crypto.randomUUID(),
      aiModel: modelId,
      symbol: m.symbol,
      companyName: m.companyName,
      sector: m.sector,
      direction: p.direction as PickDirection,
      confidence: Math.min(100, Math.max(0, p.confidence)),
      timeframe: tf,
      entryPrice: m.currentPrice,
      targetPrice: p.target_price,
      stopLoss: p.stop_loss,
      thesis: p.thesis,
      fullReasoning: p.full_reasoning,
      factorAssessments: p.factor_assessments || [],
      keyBullishFactors: p.key_bullish_factors || [],
      keyBearishFactors: p.key_bearish_factors || [],
      risks: p.risks || [],
      catalysts: p.catalysts || [],
      createdAt: now,
      expiresAt: exp,
      status: 'PENDING',
      // New fields for tiered system
      tier: modelConfig?.tier,
      displayName: modelConfig?.displayName,
      avatar: modelConfig?.avatar,
    };
  } catch (e) { 
    console.error(`Parse error for ${modelId}:`, e);
    return null; 
  }
}

// ============================================================================
// DATABASE OPERATIONS
// ============================================================================

function toDb(p: AIPick): Record<string, unknown> {
  return {
    id: p.id,
    ai_model: p.aiModel,
    symbol: p.symbol,
    company_name: p.companyName,
    sector: p.sector,
    direction: p.direction,
    confidence: p.confidence,
    timeframe: p.timeframe,
    entry_price: p.entryPrice,
    target_price: p.targetPrice,
    stop_loss: p.stopLoss,
    thesis: p.thesis,
    full_reasoning: p.fullReasoning,
    factor_assessments: p.factorAssessments,
    key_bullish_factors: p.keyBullishFactors,
    key_bearish_factors: p.keyBearishFactors,
    risks: p.risks,
    catalysts: p.catalysts,
    created_at: p.createdAt.toISOString(),
    expires_at: p.expiresAt.toISOString(),
    status: p.status,
    tier: p.tier,
    display_name: p.displayName,
  };
}

async function savePickToDb(pick: AIPick): Promise<boolean> {
  try {
    const { error } = await supabase.from('market_oracle_picks').insert(toDb(pick));
    if (error) {
      console.error('DB save error:', error);
      return false;
    }
    return true;
  } catch (e) { 
    console.error('DB exception:', e);
    return false; 
  }
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

// ============================================================================
// GET MODELS BY TIER
// ============================================================================

export function getModelsByTier(tier: AITier): AIModelId[] {
  return Object.entries(AI_MODELS)
    .filter(([_, config]) => config.tier === tier && config.enabled)
    .map(([id]) => id as AIModelId);
}

export function getEnabledModels(): AIModelId[] {
  return Object.entries(AI_MODELS)
    .filter(([_, config]) => config.enabled && config.tier !== 'javari')
    .map(([id]) => id as AIModelId);
}

// Legacy mapping for backward compatibility
const LEGACY_MODEL_MAP: Record<string, AIModelId> = {
  'gpt4': 'gpt-4-turbo',
  'claude': 'claude-3-sonnet',
  'gemini': 'gemini-pro',
  'perplexity': 'sonar-medium',
};

// ============================================================================
// SINGLE AI PICK GENERATION
// ============================================================================

export async function generatePickFromAI(
  modelId: AIModelId | string, 
  symbol: string
): Promise<AIPick | null> {
  // Handle legacy model names
  const resolvedModelId = LEGACY_MODEL_MAP[modelId] || modelId as AIModelId;
  
  const modelConfig = AI_MODELS[resolvedModelId];
  if (!modelConfig || !modelConfig.enabled) {
    console.log(`Model ${resolvedModelId} is not available`);
    return null;
  }
  
  const m = await getMarketData(symbol);
  if (!m) {
    console.log(`No market data for ${symbol}`);
    return null;
  }
  
  const cal = await getLatestCalibration(resolvedModelId);
  const prompt = buildPrompt(m, resolvedModelId, cal);
  
  const res = await callAI(resolvedModelId, prompt);
  if (!res) {
    console.log(`No response from ${resolvedModelId}`);
    return null;
  }
  
  const pick = parsePick(res, resolvedModelId, m);
  if (!pick) {
    console.log(`Failed to parse response from ${resolvedModelId}`);
    return null;
  }
  
  await savePickToDb(pick);
  return pick;
}

// ============================================================================
// TIER-BASED PICK GENERATION
// ============================================================================

export async function generatePicksForTier(
  tier: AITier,
  symbol: string
): Promise<{
  picks: AIPick[];
  aiStatus: Record<string, string>;
  dbErrors: string[];
}> {
  const aiStatus: Record<string, string> = {};
  const dbErrors: string[] = [];
  
  const m = await getMarketData(symbol);
  if (!m) {
    return { picks: [], aiStatus: {}, dbErrors: ['No market data'] };
  }
  
  const modelIds = getModelsByTier(tier);
  console.log(`Generating picks for ${tier} tier: ${modelIds.join(', ')}`);
  
  // Build prompts for each model
  const promptPromises = modelIds.map(async modelId => {
    const cal = await getLatestCalibration(modelId);
    return { modelId, prompt: buildPrompt(m, modelId, cal) };
  });
  const prompts = await Promise.all(promptPromises);
  
  // Call all AIs in parallel
  const aiCalls = prompts.map(async ({ modelId, prompt }) => {
    const res = await callAI(modelId, prompt);
    return { modelId, res };
  });
  
  const results = await Promise.all(aiCalls);
  
  // Parse results
  const picks: AIPick[] = [];
  for (const { modelId, res } of results) {
    if (!res) {
      aiStatus[modelId] = 'failed';
      continue;
    }
    
    const pick = parsePick(res, modelId, m);
    if (!pick) {
      aiStatus[modelId] = 'parse_failed';
      continue;
    }
    
    const saved = await savePickToDb(pick);
    if (!saved) {
      dbErrors.push(`Failed to save ${modelId} pick`);
    }
    
    picks.push(pick);
    aiStatus[modelId] = 'success';
  }
  
  return { picks, aiStatus, dbErrors };
}

// ============================================================================
// ALL AI PICKS (Backward compatible + Enhanced)
// ============================================================================

export async function generateAllAIPicks(
  symbol: string,
  options?: {
    tier?: AITier;           // Specific tier only
    modelIds?: AIModelId[];  // Specific models only
    maxModels?: number;      // Limit number of models
  }
): Promise<{ 
  picks: AIPick[]; 
  consensus: ConsensusAssessment | null; 
  dbErrors: string[];
  aiStatus: Record<string, string>;
}> {
  const aiStatus: Record<string, string> = {};
  const dbErrors: string[] = [];
  
  // Get market data first
  const m = await getMarketData(symbol);
  if (!m) {
    return { picks: [], consensus: null, dbErrors: ['No market data'], aiStatus: {} };
  }
  
  // Determine which models to use
  let modelIds: AIModelId[];
  
  if (options?.modelIds) {
    modelIds = options.modelIds;
  } else if (options?.tier) {
    modelIds = getModelsByTier(options.tier);
  } else {
    // Default: Use one model from each tier for balance
    // Or use legacy 4 models for backward compatibility
    modelIds = [
      'gpt-4-turbo',      // Large tier
      'claude-3-sonnet',  // Medium tier
      'gemini-pro',       // Medium tier
      'sonar-medium',     // Medium tier (Perplexity)
    ].filter(id => AI_MODELS[id as AIModelId]?.enabled) as AIModelId[];
  }
  
  if (options?.maxModels && modelIds.length > options.maxModels) {
    modelIds = modelIds.slice(0, options.maxModels);
  }
  
  console.log(`Generating picks for: ${modelIds.join(', ')}`);
  
  // Build prompts
  const promptPromises = modelIds.map(async modelId => {
    const cal = await getLatestCalibration(modelId);
    return { modelId, prompt: buildPrompt(m, modelId, cal) };
  });
  const prompts = await Promise.all(promptPromises);
  
  // Call all AIs in parallel
  const aiCalls = prompts.map(async ({ modelId, prompt }) => {
    const res = await callAI(modelId, prompt);
    return { modelId, res };
  });
  
  const results = await Promise.all(aiCalls);
  
  // Parse and save results
  const picks: AIPick[] = [];
  for (const { modelId, res } of results) {
    if (!res) {
      aiStatus[modelId] = 'failed';
      continue;
    }
    
    const pick = parsePick(res, modelId, m);
    if (!pick) {
      aiStatus[modelId] = 'parse_failed';
      continue;
    }
    
    const saved = await savePickToDb(pick);
    if (!saved) {
      dbErrors.push(`Failed to save ${modelId} pick`);
    }
    
    picks.push(pick);
    aiStatus[modelId] = 'success';
  }
  
  // Mark missing models
  for (const modelId of modelIds) {
    if (!aiStatus[modelId]) {
      aiStatus[modelId] = 'not_called';
    }
  }
  
  // Build consensus if we have 2+ picks
  let consensus: ConsensusAssessment | null = null;
  if (picks.length >= 2) {
    const fp = picks.map(p => ({ 
      aiModel: p.aiModel, 
      direction: p.direction, 
      confidence: p.confidence, 
      pickId: p.id 
    }));
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

// ============================================================================
// EXPORTS FOR COMPETITION SYSTEM
// ============================================================================

export { getModelsByTier, getEnabledModels };
