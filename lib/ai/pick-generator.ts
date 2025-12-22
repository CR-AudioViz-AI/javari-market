// lib/ai/pick-generator.ts
// Market Oracle Ultimate - Enhanced AI Pick Generator
// Updated: December 21, 2025 - 22 AI Models, 11 Providers, 3 Tiers
// Maintains backward compatibility with legacy model names

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

// ============================================================================
// TIER TYPES
// ============================================================================

type AITier = 'small' | 'medium' | 'large' | 'javari';

// Legacy model names that have calibration data
const LEGACY_MODELS: AIModelName[] = ['gpt4', 'claude', 'gemini', 'perplexity', 'javari'];

// ============================================================================
// ENHANCED AI CONFIGURATION - 22 Models
// ============================================================================

interface AIModelConfig {
  id: string;
  provider: string;
  tier: AITier;
  name: string;
  displayName: string;
  modelString: string;
  description: string;
  personality: string;
  tradingStyle: string;
  avatar: string;
  color: string;
  enabled: boolean;
  legacyId?: AIModelName; // Maps to old model names for calibration
}

const AI_MODELS: Record<string, AIModelConfig> = {
  // LARGE TIER
  'gpt-4-turbo': {
    id: 'gpt-4-turbo', provider: 'openai', tier: 'large',
    name: 'GPT-4 Turbo', displayName: 'Oracle GPT', modelString: 'gpt-4-turbo-preview',
    description: 'OpenAI flagship', personality: 'Methodical strategist',
    tradingStyle: 'balanced', avatar: '🔮', color: '#10A37F', enabled: true, legacyId: 'gpt4',
  },
  'claude-3-opus': {
    id: 'claude-3-opus', provider: 'anthropic', tier: 'large',
    name: 'Claude 3 Opus', displayName: 'Claude Sage', modelString: 'claude-3-opus-20240229',
    description: 'Anthropic most capable', personality: 'Wise counselor',
    tradingStyle: 'conservative', avatar: '🧙', color: '#D97706', enabled: true,
  },
  'gemini-ultra': {
    id: 'gemini-ultra', provider: 'google', tier: 'large',
    name: 'Gemini Ultra', displayName: 'Gemini Titan', modelString: 'gemini-1.5-pro-latest',
    description: 'Google most powerful', personality: 'Analytical powerhouse',
    tradingStyle: 'aggressive', avatar: '⚡', color: '#4285F4', enabled: true,
  },
  'sonar-large': {
    id: 'sonar-large', provider: 'perplexity', tier: 'large',
    name: 'Sonar Large', displayName: 'Perplexity Pro', modelString: 'sonar-pro',
    description: 'Real-time search', personality: 'News-driven analyst',
    tradingStyle: 'momentum', avatar: '🌐', color: '#8B5CF6', enabled: true,
  },
  'grok-2': {
    id: 'grok-2', provider: 'xai', tier: 'large',
    name: 'Grok 2', displayName: 'Grok Oracle', modelString: 'grok-2-latest',
    description: 'xAI flagship', personality: 'Bold contrarian',
    tradingStyle: 'aggressive', avatar: '🚀', color: '#1DA1F2', enabled: !!process.env.XAI_API_KEY,
  },

  // MEDIUM TIER
  'gpt-4o': {
    id: 'gpt-4o', provider: 'openai', tier: 'medium',
    name: 'GPT-4o', displayName: 'GPT Omni', modelString: 'gpt-4o',
    description: 'Multimodal flagship', personality: 'Versatile analyst',
    tradingStyle: 'balanced', avatar: '👁️', color: '#10A37F', enabled: true,
  },
  'claude-3-sonnet': {
    id: 'claude-3-sonnet', provider: 'anthropic', tier: 'medium',
    name: 'Claude 3 Sonnet', displayName: 'Claude Analyst', modelString: 'claude-3-sonnet-20240229',
    description: 'Balanced intelligence', personality: 'Careful analyst',
    tradingStyle: 'balanced', avatar: '📊', color: '#D97706', enabled: true, legacyId: 'claude',
  },
  'gemini-pro': {
    id: 'gemini-pro', provider: 'google', tier: 'medium',
    name: 'Gemini Pro', displayName: 'Gemini Scout', modelString: 'gemini-pro',
    description: 'Versatile Google model', personality: 'Technical analyst',
    tradingStyle: 'technical', avatar: '🔍', color: '#4285F4', enabled: true, legacyId: 'gemini',
  },
  'sonar-medium': {
    id: 'sonar-medium', provider: 'perplexity', tier: 'medium',
    name: 'Sonar Medium', displayName: 'Perplexity Scout', modelString: 'sonar',
    description: 'Market intelligence', personality: 'Quick researcher',
    tradingStyle: 'momentum', avatar: '📡', color: '#8B5CF6', enabled: true, legacyId: 'perplexity',
  },
  'mixtral-large': {
    id: 'mixtral-large', provider: 'mistral', tier: 'medium',
    name: 'Mixtral Large', displayName: 'Mixtral Expert', modelString: 'mistral-large-latest',
    description: 'Mixture of experts', personality: 'Multi-perspective',
    tradingStyle: 'balanced', avatar: '🎯', color: '#FF6B35', enabled: !!process.env.MISTRAL_API_KEY,
  },
  'llama-3-70b': {
    id: 'llama-3-70b', provider: 'groq', tier: 'medium',
    name: 'Llama 3 70B', displayName: 'Llama Pro', modelString: 'llama-3.1-70b-versatile',
    description: 'Meta via Groq', personality: 'Fast thinker',
    tradingStyle: 'balanced', avatar: '🦙', color: '#6366F1', enabled: !!process.env.GROQ_API_KEY,
  },
  'command-r-plus': {
    id: 'command-r-plus', provider: 'cohere', tier: 'medium',
    name: 'Command R+', displayName: 'Cohere Commander', modelString: 'command-r-plus',
    description: 'Enterprise grade', personality: 'Enterprise analyst',
    tradingStyle: 'conservative', avatar: '🎖️', color: '#39D353', enabled: !!process.env.COHERE_API_KEY,
  },

  // SMALL TIER
  'gpt-4o-mini': {
    id: 'gpt-4o-mini', provider: 'openai', tier: 'small',
    name: 'GPT-4o Mini', displayName: 'GPT Swift', modelString: 'gpt-4o-mini',
    description: 'Fast and efficient', personality: 'Quick decision maker',
    tradingStyle: 'momentum', avatar: '⚡', color: '#10A37F', enabled: true,
  },
  'claude-3-haiku': {
    id: 'claude-3-haiku', provider: 'anthropic', tier: 'small',
    name: 'Claude 3 Haiku', displayName: 'Claude Swift', modelString: 'claude-3-haiku-20240307',
    description: 'Lightning fast', personality: 'Rapid-fire analyst',
    tradingStyle: 'momentum', avatar: '🏃', color: '#D97706', enabled: true,
  },
  'gemini-flash': {
    id: 'gemini-flash', provider: 'google', tier: 'small',
    name: 'Gemini Flash', displayName: 'Gemini Flash', modelString: 'gemini-1.5-flash',
    description: 'Speed optimized', personality: 'Quick scanner',
    tradingStyle: 'momentum', avatar: '💨', color: '#4285F4', enabled: true,
  },
  'sonar-small': {
    id: 'sonar-small', provider: 'perplexity', tier: 'small',
    name: 'Sonar Small', displayName: 'Sonar Quick', modelString: 'sonar',
    description: 'Rapid search', personality: 'Speed researcher',
    tradingStyle: 'momentum', avatar: '🔊', color: '#8B5CF6', enabled: true,
  },
  'llama-3-8b': {
    id: 'llama-3-8b', provider: 'groq', tier: 'small',
    name: 'Llama 3 8B', displayName: 'Llama Quick', modelString: 'llama-3.1-8b-instant',
    description: 'Ultra-fast via Groq', personality: 'Instant analyst',
    tradingStyle: 'momentum', avatar: '🦙', color: '#6366F1', enabled: !!process.env.GROQ_API_KEY,
  },
  'mixtral-8x7b': {
    id: 'mixtral-8x7b', provider: 'groq', tier: 'small',
    name: 'Mixtral 8x7B', displayName: 'Mixtral Mix', modelString: 'mixtral-8x7b-32768',
    description: 'Sparse MoE via Groq', personality: 'Efficient expert',
    tradingStyle: 'balanced', avatar: '🎲', color: '#FF6B35', enabled: !!process.env.GROQ_API_KEY,
  },

  // JAVARI
  'javari-prime': {
    id: 'javari-prime', provider: 'internal', tier: 'javari',
    name: 'Javari Prime', displayName: 'Javari Prime', modelString: 'internal',
    description: 'Multi-AI consensus', personality: 'Master synthesizer',
    tradingStyle: 'adaptive', avatar: '🏆', color: '#06B6D4', enabled: true, legacyId: 'javari',
  },
};

// Map new model IDs to legacy names for calibration lookup
const LEGACY_TO_NEW: Record<string, string> = {
  'gpt4': 'gpt-4-turbo', 'claude': 'claude-3-sonnet', 'gemini': 'gemini-pro',
  'perplexity': 'sonar-medium', 'javari': 'javari-prime',
};

// ============================================================================
// MARKET DATA
// ============================================================================

interface MarketData {
  symbol: string; companyName: string; sector: string; currentPrice: number;
  changePercent24h: number; volume: number; avgVolume: number; marketCap: number;
  peRatio: number | null; high52Week: number; low52Week: number;
  sma50: number | null; sma200: number | null;
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
      symbol: symbol.toUpperCase(), companyName: o.Name || symbol, sector: o.Sector || 'Unknown',
      currentPrice: parseFloat(q['05. price']),
      changePercent24h: parseFloat((q['10. change percent'] || '0%').replace('%', '')),
      volume: parseInt(q['06. volume'] || '0'), avgVolume: parseInt(o.AverageVolume || '0'),
      marketCap: parseInt(o.MarketCapitalization || '0'),
      peRatio: o.PERatio ? parseFloat(o.PERatio) : null,
      high52Week: parseFloat(o['52WeekHigh'] || q['03. high']),
      low52Week: parseFloat(o['52WeekLow'] || q['04. low']),
      sma50: o['50DayMovingAverage'] ? parseFloat(o['50DayMovingAverage']) : null,
      sma200: o['200DayMovingAverage'] ? parseFloat(o['200DayMovingAverage']) : null,
    };
  } catch (err) { console.error('Market data error:', err); return null; }
}

// ============================================================================
// CALIBRATION HELPER - Safely get calibration for any model
// ============================================================================

async function getCalibrationForModel(modelId: string): Promise<{ bestSectors: string[]; worstSectors: string[]; adjustments: string[] } | null> {
  const cfg = AI_MODELS[modelId];
  if (!cfg) return null;
  
  // Only get calibration for models with legacy IDs (have historical data)
  if (cfg.legacyId && LEGACY_MODELS.includes(cfg.legacyId)) {
    const cal = await getLatestCalibration(cfg.legacyId);
    if (cal) {
      return {
        bestSectors: cal.bestSectors || [],
        worstSectors: cal.worstSectors || [],
        adjustments: cal.keyLearnings || [],
      };
    }
  }
  
  // For new models without legacy data, return null (no calibration yet)
  return null;
}

// ============================================================================
// PROMPT
// ============================================================================

function buildPrompt(m: MarketData, cfg: AIModelConfig, cal: { bestSectors: string[]; worstSectors: string[]; adjustments: string[] } | null): string {
  return `You are ${cfg.displayName}, an AI stock analyst. Personality: "${cfg.personality}". Trading style: ${cfg.tradingStyle}.

Analyze ${m.symbol} (${m.companyName}).
Price: $${m.currentPrice.toFixed(2)}, Change: ${m.changePercent24h.toFixed(2)}%, Sector: ${m.sector}
MCap: $${(m.marketCap/1e9).toFixed(2)}B, PE: ${m.peRatio||'N/A'}, 52W: $${m.low52Week.toFixed(2)}-$${m.high52Week.toFixed(2)}
SMA50: ${m.sma50?'$'+m.sma50.toFixed(2):'N/A'}, SMA200: ${m.sma200?'$'+m.sma200.toFixed(2):'N/A'}
${cal ? `Best sectors: ${cal.bestSectors.join(', ')}.` : ''}

Respond JSON ONLY: {"direction":"UP"|"DOWN"|"HOLD","confidence":0-100,"thesis":"summary","full_reasoning":"detailed","target_price":number,"stop_loss":number,"timeframe":"1W"|"2W"|"1M","factor_assessments":[{"factorId":"id","factorName":"name","value":"v","interpretation":"BULLISH"|"BEARISH"|"NEUTRAL","confidence":0-100,"reasoning":"why"}],"key_bullish_factors":["f"],"key_bearish_factors":["f"],"risks":["r"],"catalysts":["c"]}`;
}

// ============================================================================
// AI CALLS
// ============================================================================

async function callOpenAI(prompt: string, model: string): Promise<string | null> {
  const key = process.env.OPENAI_API_KEY; if (!key) return null;
  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], max_tokens: 2000, temperature: 0.3, response_format: { type: 'json_object' } }),
    });
    if (!r.ok) return null;
    const d = await r.json(); return d.choices?.[0]?.message?.content || null;
  } catch { return null; }
}

async function callAnthropic(prompt: string, model: string): Promise<string | null> {
  const key = process.env.ANTHROPIC_API_KEY; if (!key) return null;
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model, max_tokens: 2000, messages: [{ role: 'user', content: prompt }] }),
    });
    const d = await r.json(); if (d.error) return null;
    return d.content?.[0]?.text || null;
  } catch { return null; }
}

async function callGoogle(prompt: string, model: string): Promise<string | null> {
  if (!genAI) return null;
  try {
    const m = genAI.getGenerativeModel({ model });
    const result = await m.generateContent(prompt);
    return result.response.text() || null;
  } catch { return null; }
}

async function callPerplexity(prompt: string, model: string): Promise<string | null> {
  const key = process.env.PERPLEXITY_API_KEY; if (!key) return null;
  try {
    const r = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], max_tokens: 2000 }),
    });
    if (!r.ok) return null;
    const d = await r.json(); return d.choices?.[0]?.message?.content || null;
  } catch { return null; }
}

async function callGroq(prompt: string, model: string): Promise<string | null> {
  const key = process.env.GROQ_API_KEY; if (!key) return null;
  try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], max_tokens: 2000 }),
    });
    if (!r.ok) return null;
    const d = await r.json(); return d.choices?.[0]?.message?.content || null;
  } catch { return null; }
}

async function callMistral(prompt: string, model: string): Promise<string | null> {
  const key = process.env.MISTRAL_API_KEY; if (!key) return null;
  try {
    const r = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], max_tokens: 2000 }),
    });
    if (!r.ok) return null;
    const d = await r.json(); return d.choices?.[0]?.message?.content || null;
  } catch { return null; }
}

async function callXAI(prompt: string, model: string): Promise<string | null> {
  const key = process.env.XAI_API_KEY; if (!key) return null;
  try {
    const r = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], max_tokens: 2000 }),
    });
    if (!r.ok) return null;
    const d = await r.json(); return d.choices?.[0]?.message?.content || null;
  } catch { return null; }
}

async function callCohere(prompt: string, model: string): Promise<string | null> {
  const key = process.env.COHERE_API_KEY; if (!key) return null;
  try {
    const r = await fetch('https://api.cohere.ai/v1/chat', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model, message: prompt }),
    });
    if (!r.ok) return null;
    const d = await r.json(); return d.text || null;
  } catch { return null; }
}

async function callAI(modelId: string, prompt: string): Promise<string | null> {
  const cfg = AI_MODELS[modelId]; if (!cfg || !cfg.enabled) return null;
  switch (cfg.provider) {
    case 'openai': return callOpenAI(prompt, cfg.modelString);
    case 'anthropic': return callAnthropic(prompt, cfg.modelString);
    case 'google': return callGoogle(prompt, cfg.modelString);
    case 'perplexity': return callPerplexity(prompt, cfg.modelString);
    case 'groq': return callGroq(prompt, cfg.modelString);
    case 'mistral': return callMistral(prompt, cfg.modelString);
    case 'xai': return callXAI(prompt, cfg.modelString);
    case 'cohere': return callCohere(prompt, cfg.modelString);
    default: return null;
  }
}

// ============================================================================
// PARSE & DB
// ============================================================================

function parsePick(res: string, modelId: string, m: MarketData): AIPick | null {
  try {
    const c = res.trim().replace(/^```json\s*/g, '').replace(/\s*```$/g, '').replace(/^```\s*/g, '');
    const p = JSON.parse(c);
    const now = new Date(); const exp = new Date(now);
    const tf = p.timeframe || '1W';
    exp.setDate(exp.getDate() + (tf === '2W' ? 14 : tf === '1M' ? 30 : 7));
    const cfg = AI_MODELS[modelId];
    // Use legacy ID for database compatibility, or fallback to a valid legacy name
    const dbModel: AIModelName = cfg?.legacyId || 'gpt4';
    return {
      id: crypto.randomUUID(), aiModel: dbModel, symbol: m.symbol, companyName: m.companyName,
      sector: m.sector, direction: p.direction as PickDirection, confidence: Math.min(100, Math.max(0, p.confidence)),
      timeframe: tf, entryPrice: m.currentPrice, targetPrice: p.target_price, stopLoss: p.stop_loss,
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
  try { const { error } = await supabase.from('market_oracle_picks').insert(toDb(pick)); return !error; } catch { return false; }
}

async function saveConsensusToDb(symbol: string, consensus: ConsensusAssessment): Promise<boolean> {
  try {
    const agreeingModels = consensus.aiPicks.filter(p => p.direction === consensus.consensusDirection).map(p => p.aiModel);
    const { error } = await supabase.from('market_oracle_consensus_picks').insert({
      symbol, direction: consensus.consensusDirection, ai_combination: agreeingModels,
      ai_combination_key: agreeingModels.sort().join('+'), consensus_strength: consensus.consensusStrength,
      weighted_confidence: consensus.weightedConfidence, javari_confidence: consensus.javariConfidence,
      javari_reasoning: consensus.javariReasoning, status: 'PENDING', created_at: new Date().toISOString(),
    });
    return !error;
  } catch { return false; }
}

// ============================================================================
// EXPORTS
// ============================================================================

export function getEnabledModels(): string[] {
  return Object.entries(AI_MODELS).filter(([_, c]) => c.enabled && c.tier !== 'javari').map(([id]) => id);
}

export function getModelsByTier(tier: AITier): string[] {
  return Object.entries(AI_MODELS).filter(([_, c]) => c.tier === tier && c.enabled).map(([id]) => id);
}

export function resolveModelId(input: string): string { return LEGACY_TO_NEW[input] || input; }

export async function generatePickFromAI(modelInput: string, symbol: string): Promise<AIPick | null> {
  const modelId = resolveModelId(modelInput);
  const cfg = AI_MODELS[modelId]; if (!cfg || !cfg.enabled) return null;
  const m = await getMarketData(symbol); if (!m) return null;
  const cal = await getCalibrationForModel(modelId);
  const prompt = buildPrompt(m, cfg, cal);
  const res = await callAI(modelId, prompt); if (!res) return null;
  const pick = parsePick(res, modelId, m); if (!pick) return null;
  await savePickToDb(pick);
  return pick;
}

export async function generateAllAIPicks(symbol: string, options?: { tier?: AITier; maxModels?: number }): Promise<{ 
  picks: AIPick[]; consensus: ConsensusAssessment | null; dbErrors: string[]; aiStatus: Record<string, string>;
}> {
  const aiStatus: Record<string, string> = {}; const dbErrors: string[] = [];
  const m = await getMarketData(symbol);
  if (!m) return { picks: [], consensus: null, dbErrors: ['No market data'], aiStatus: {} };
  
  let modelIds = options?.tier ? getModelsByTier(options.tier) : getEnabledModels();
  if (options?.maxModels && modelIds.length > options.maxModels) modelIds = modelIds.slice(0, options.maxModels);
  
  console.log(`Generating picks for ${modelIds.length} models: ${modelIds.join(', ')}`);
  
  const prompts = await Promise.all(modelIds.map(async id => {
    const cfg = AI_MODELS[id];
    const cal = await getCalibrationForModel(id);
    return { id, prompt: buildPrompt(m, cfg, cal), cfg };
  }));
  
  const results = await Promise.all(prompts.map(async ({ id, prompt }) => ({ id, res: await callAI(id, prompt) })));
  
  const picks: AIPick[] = [];
  for (const { id, res } of results) {
    if (!res) { aiStatus[id] = 'failed'; continue; }
    const pick = parsePick(res, id, m);
    if (!pick) { aiStatus[id] = 'parse_failed'; continue; }
    if (!await savePickToDb(pick)) dbErrors.push(`Failed to save ${id}`);
    picks.push(pick); aiStatus[id] = 'success';
  }
  
  let consensus: ConsensusAssessment | null = null;
  if (picks.length >= 2) {
    const fp = picks.map(p => ({ aiModel: p.aiModel, direction: p.direction, confidence: p.confidence, pickId: p.id }));
    consensus = await buildJavariConsensus(symbol, fp);
    if (consensus && !await saveConsensusToDb(symbol, consensus)) dbErrors.push('Failed to save consensus');
  }
  
  return { picks, consensus, dbErrors, aiStatus };
}

export { AI_MODELS };
