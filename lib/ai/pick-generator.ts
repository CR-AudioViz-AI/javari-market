// lib/ai/pick-generator.ts
// Market Oracle Ultimate - Real AI Pick Generator
// Updated: December 14, 2025
// Purpose: Generate stock picks using REAL AI API calls with full reasoning

import { createClient } from '@supabase/supabase-js';
import type { 
  AIModelName, 
  AIPick, 
  PickDirection,
  FactorAssessment
} from '../types/learning';
import { getLatestCalibration } from '../learning/calibration-engine';
import { buildJavariConsensus } from '../learning/javari-consensus';

// ============================================================================
// SUPABASE CLIENT
// ============================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ============================================================================
// AI API ENDPOINTS & CONFIGS - UPDATED December 14, 2025
// ============================================================================

interface AIConfig {
  model: string;
  maxTokens: number;
  temperature: number;
  enabled: boolean;
}

const AI_CONFIGS: Record<Exclude<AIModelName, 'javari'>, AIConfig> = {
  gpt4: {
    model: 'gpt-4-turbo-preview',
    maxTokens: 2000,
    temperature: 0.3,
    enabled: true,
  },
  claude: {
    model: 'claude-3-sonnet-20240229',
    maxTokens: 2000,
    temperature: 0.3,
    enabled: false,
  },
  gemini: {
    model: 'gemini-1.5-flash',
    maxTokens: 2000,
    temperature: 0.3,
    enabled: false,
  },
  perplexity: {
    model: 'sonar',
    maxTokens: 2000,
    temperature: 0.3,
    enabled: true,
  },
};

// ============================================================================
// MARKET DATA FETCHER
// ============================================================================

interface MarketData {
  symbol: string;
  companyName: string;
  sector: string;
  currentPrice: number;
  change24h: number;
  changePercent24h: number;
  volume: number;
  avgVolume: number;
  marketCap: number;
  peRatio: number | null;
  high52Week: number;
  low52Week: number;
  sma50: number | null;
  sma200: number | null;
  rsi: number | null;
}

async function getMarketData(symbol: string): Promise<MarketData | null> {
  try {
    const alphaVantageKey = process.env.ALPHA_VANTAGE_API_KEY;
    
    const quoteResponse = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${alphaVantageKey}`
    );
    const quoteData = await quoteResponse.json();
    const quote = quoteData['Global Quote'];

    if (!quote || !quote['05. price']) {
      console.log(`No quote data for ${symbol}`);
      return null;
    }

    const overviewResponse = await fetch(
      `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${alphaVantageKey}`
    );
    const overview = await overviewResponse.json();

    return {
      symbol: symbol.toUpperCase(),
      companyName: overview.Name || symbol,
      sector: overview.Sector || 'Unknown',
      currentPrice: parseFloat(quote['05. price']),
      change24h: parseFloat(quote['09. change'] || '0'),
      changePercent24h: parseFloat((quote['10. change percent'] || '0%').replace('%', '')),
      volume: parseInt(quote['06. volume'] || '0'),
      avgVolume: parseInt(overview.AverageVolume || '0'),
      marketCap: parseInt(overview.MarketCapitalization || '0'),
      peRatio: overview.PERatio ? parseFloat(overview.PERatio) : null,
      high52Week: parseFloat(overview['52WeekHigh'] || quote['03. high']),
      low52Week: parseFloat(overview['52WeekLow'] || quote['04. low']),
      sma50: overview['50DayMovingAverage'] ? parseFloat(overview['50DayMovingAverage']) : null,
      sma200: overview['200DayMovingAverage'] ? parseFloat(overview['200DayMovingAverage']) : null,
      rsi: null,
    };
  } catch (error) {
    console.error(`Error fetching market data for ${symbol}:`, error);
    return null;
  }
}

// ============================================================================
// BUILD ANALYSIS PROMPT
// ============================================================================

function buildAnalysisPrompt(
  marketData: MarketData,
  calibration: { bestSectors: string[]; worstSectors: string[]; adjustments: string[] } | null,
  recentNews: string[]
): string {
  let prompt = `You are a professional stock analyst for Market Oracle. Analyze ${marketData.symbol} (${marketData.companyName}) and provide a pick recommendation.

## CURRENT MARKET DATA
- Symbol: ${marketData.symbol}
- Company: ${marketData.companyName}
- Sector: ${marketData.sector}
- Current Price: $${marketData.currentPrice.toFixed(2)}
- 24h Change: ${marketData.changePercent24h.toFixed(2)}%
- Volume: ${marketData.volume.toLocaleString()} (Avg: ${marketData.avgVolume.toLocaleString()})
- Market Cap: $${(marketData.marketCap / 1e9).toFixed(2)}B
- P/E Ratio: ${marketData.peRatio || 'N/A'}
- 52-Week Range: $${marketData.low52Week.toFixed(2)} - $${marketData.high52Week.toFixed(2)}
- SMA 50: ${marketData.sma50 ? `$${marketData.sma50.toFixed(2)}` : 'N/A'}
- SMA 200: ${marketData.sma200 ? `$${marketData.sma200.toFixed(2)}` : 'N/A'}

## RECENT NEWS
${recentNews.length > 0 ? recentNews.map((n, i) => `${i + 1}. ${n}`).join('\n') : 'No recent news available.'}
`;

  if (calibration) {
    prompt += `
## YOUR CALIBRATION NOTES
- Best sectors: ${calibration.bestSectors.join(', ') || 'Still learning'}
- Caution sectors: ${calibration.worstSectors.join(', ') || 'Still learning'}
- Adjustments: ${calibration.adjustments.slice(0, 3).join('; ') || 'None yet'}
`;
  }

  prompt += `
## YOUR TASK
Respond in this EXACT JSON format only:

{
  "direction": "UP" | "DOWN" | "HOLD",
  "confidence": <number 0-100>,
  "thesis": "<one sentence>",
  "full_reasoning": "<2-3 paragraphs>",
  "target_price": <number>,
  "stop_loss": <number>,
  "timeframe": "1W" | "2W" | "1M",
  "factor_assessments": [{"factorId": "pe_ratio", "factorName": "P/E Ratio", "value": "<value>", "interpretation": "BULLISH" | "BEARISH" | "NEUTRAL", "confidence": <0-100>, "reasoning": "<why>"}],
  "key_bullish_factors": ["<factor>"],
  "key_bearish_factors": ["<factor>"],
  "risks": ["<risk>"],
  "catalysts": ["<catalyst>"]
}

Respond ONLY with valid JSON, no markdown.`;

  return prompt;
}

// ============================================================================
// AI CALL FUNCTIONS
// ============================================================================

async function callGPT4(prompt: string): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: AI_CONFIGS.gpt4.model,
        messages: [
          { role: 'system', content: 'You are a professional stock analyst. Respond with valid JSON only.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: AI_CONFIGS.gpt4.maxTokens,
        temperature: AI_CONFIGS.gpt4.temperature,
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('GPT-4 call failed:', error);
    return null;
  }
}

async function callClaude(prompt: string): Promise<string | null> {
  if (!AI_CONFIGS.claude.enabled) return null;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: AI_CONFIGS.claude.model,
        max_tokens: AI_CONFIGS.claude.maxTokens,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data.content[0].text;
  } catch (error) {
    return null;
  }
}

async function callGemini(prompt: string): Promise<string | null> {
  if (!AI_CONFIGS.gemini.enabled) return null;
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${AI_CONFIGS.gemini.model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    );

    if (!response.ok) return null;
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch (error) {
    return null;
  }
}

async function callPerplexity(prompt: string): Promise<string | null> {
  if (!AI_CONFIGS.perplexity.enabled) return null;
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: AI_CONFIGS.perplexity.model,
        messages: [
          { role: 'system', content: 'You are a professional stock analyst. Respond with valid JSON only.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: AI_CONFIGS.perplexity.maxTokens,
        temperature: AI_CONFIGS.perplexity.temperature,
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    return null;
  }
}

// ============================================================================
// PARSE AI RESPONSE
// ============================================================================

function parseAIResponse(response: string, aiModel: AIModelName, marketData: MarketData): AIPick | null {
  try {
    let cleaned = response.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const parsed = JSON.parse(cleaned);
    const now = new Date();
    const expiresAt = new Date(now);
    const timeframe = parsed.timeframe || '1W';
    
    switch (timeframe) {
      case '2W': expiresAt.setDate(expiresAt.getDate() + 14); break;
      case '1M': expiresAt.setDate(expiresAt.getDate() + 30); break;
      default: expiresAt.setDate(expiresAt.getDate() + 7);
    }

    // Return with camelCase properties matching the TypeScript interface
    const pick: AIPick = {
      id: crypto.randomUUID(),
      aiModel: aiModel,
      symbol: marketData.symbol,
      companyName: marketData.companyName,
      sector: marketData.sector,
      direction: parsed.direction as PickDirection,
      confidence: parsed.confidence,
      timeframe: timeframe,
      entryPrice: marketData.currentPrice,
      targetPrice: parsed.target_price,
      stopLoss: parsed.stop_loss,
      thesis: parsed.thesis,
      fullReasoning: parsed.full_reasoning,
      factorAssessments: parsed.factor_assessments || [],
      keyBullishFactors: parsed.key_bullish_factors || [],
      keyBearishFactors: parsed.key_bearish_factors || [],
      risks: parsed.risks || [],
      catalysts: parsed.catalysts || [],
      createdAt: now,
      expiresAt: expiresAt,
      status: 'PENDING',
    };

    return pick;
  } catch (error) {
    console.error(`Failed to parse ${aiModel} response:`, error);
    return null;
  }
}

// Convert camelCase pick to snake_case for database
function pickToDbFormat(pick: AIPick): Record<string, unknown> {
  return {
    id: pick.id,
    ai_model: pick.aiModel,
    symbol: pick.symbol,
    company_name: pick.companyName,
    sector: pick.sector,
    direction: pick.direction,
    confidence: pick.confidence,
    timeframe: pick.timeframe,
    entry_price: pick.entryPrice,
    target_price: pick.targetPrice,
    stop_loss: pick.stopLoss,
    thesis: pick.thesis,
    full_reasoning: pick.fullReasoning,
    factor_assessments: pick.factorAssessments,
    key_bullish_factors: pick.keyBullishFactors,
    key_bearish_factors: pick.keyBearishFactors,
    risks: pick.risks,
    catalysts: pick.catalysts,
    created_at: pick.createdAt.toISOString(),
    expires_at: pick.expiresAt.toISOString(),
    status: pick.status,
  };
}

// ============================================================================
// GENERATE PICK FROM SPECIFIC AI
// ============================================================================

export async function generatePickFromAI(
  aiModel: Exclude<AIModelName, 'javari'>,
  symbol: string
): Promise<AIPick | null> {
  console.log(`Generating ${aiModel} pick for ${symbol}...`);
  
  if (!AI_CONFIGS[aiModel].enabled) {
    console.log(`${aiModel} is disabled`);
    return null;
  }

  const marketData = await getMarketData(symbol);
  if (!marketData) {
    console.error(`Could not get market data for ${symbol}`);
    return null;
  }

  const calibration = await getLatestCalibration(aiModel);
  const prompt = buildAnalysisPrompt(marketData, calibration, []);

  let response: string | null = null;
  switch (aiModel) {
    case 'gpt4':
      response = await callGPT4(prompt);
      break;
    case 'claude':
      response = await callClaude(prompt);
      break;
    case 'gemini':
      response = await callGemini(prompt);
      break;
    case 'perplexity':
      response = await callPerplexity(prompt);
      break;
  }

  if (!response) {
    console.error(`No response from ${aiModel}`);
    return null;
  }

  const pick = parseAIResponse(response, aiModel, marketData);
  if (!pick) {
    console.error(`Failed to parse ${aiModel} response`);
    return null;
  }

  // Save to database using snake_case format
  const dbPick = pickToDbFormat(pick);
  const { error } = await supabase
    .from('market_oracle_picks')
    .insert(dbPick);

  if (error) {
    console.error(`Failed to save ${aiModel} pick:`, error);
  } else {
    console.log(`✅ ${aiModel} pick saved for ${symbol}`);
  }

  return pick;
}

// ============================================================================
// GENERATE ALL AI PICKS + JAVARI CONSENSUS
// ============================================================================

export async function generateAllAIPicks(symbol: string): Promise<{
  picks: AIPick[];
  consensus: ReturnType<typeof buildJavariConsensus> | null;
}> {
  console.log(`Generating ALL AI picks for ${symbol}`);

  const aiModels: Exclude<AIModelName, 'javari'>[] = ['gpt4', 'perplexity'];
  const picks: AIPick[] = [];

  for (const model of aiModels) {
    if (AI_CONFIGS[model].enabled) {
      try {
        const pick = await generatePickFromAI(model, symbol);
        if (pick) {
          picks.push(pick);
        }
      } catch (error) {
        console.error(`Error generating ${model} pick:`, error);
      }
    }
  }

  let consensus = null;
  if (picks.length >= 2) {
    consensus = buildJavariConsensus(picks);
    
    if (consensus) {
      const { error } = await supabase
        .from('market_oracle_consensus_picks')
        .insert({
          symbol,
          direction: consensus.direction,
          ai_combination: consensus.agreeing_models,
          ai_combination_key: consensus.agreeing_models.sort().join('+'),
          consensus_strength: consensus.consensus_strength,
          weighted_confidence: consensus.weighted_confidence,
          javari_confidence: consensus.javari_confidence,
          javari_reasoning: consensus.reasoning,
          status: 'PENDING',
          created_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Failed to save consensus:', error);
      }
    }
  }

  console.log(`Generated ${picks.length} picks for ${symbol}`);
  return { picks, consensus };
}
