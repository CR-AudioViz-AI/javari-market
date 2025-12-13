// lib/ai/pick-generator.ts
// Market Oracle Ultimate - Real AI Pick Generator
// Created: December 13, 2025
// Purpose: Generate stock picks using REAL AI API calls with full reasoning

import { createClient } from '@supabase/supabase-js';
import type { 
  AIModelName, 
  AIPick, 
  PickDirection,
  FactorAssessment,
  MarketFactor,
  MARKET_FACTORS
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
// AI API ENDPOINTS & CONFIGS
// ============================================================================

interface AIConfig {
  model: string;
  maxTokens: number;
  temperature: number;
}

const AI_CONFIGS: Record<Exclude<AIModelName, 'javari'>, AIConfig> = {
  gpt4: {
    model: 'gpt-4-turbo-preview',
    maxTokens: 2000,
    temperature: 0.3,
  },
  claude: {
    model: 'claude-3-sonnet-20240229',
    maxTokens: 2000,
    temperature: 0.3,
  },
  gemini: {
    model: 'gemini-pro',
    maxTokens: 2000,
    temperature: 0.3,
  },
  perplexity: {
    model: 'llama-3.1-sonar-large-128k-online',
    maxTokens: 2000,
    temperature: 0.3,
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
    
    // Get quote data
    const quoteResponse = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${alphaVantageKey}`
    );
    const quoteData = await quoteResponse.json();
    const quote = quoteData['Global Quote'];

    if (!quote || !quote['05. price']) {
      return null;
    }

    // Get company overview
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
      rsi: null, // Would need to calculate from price history
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
## YOUR CALIBRATION NOTES (Based on past performance)
- Best sectors for you: ${calibration.bestSectors.join(', ') || 'Still learning'}
- Sectors to be cautious in: ${calibration.worstSectors.join(', ') || 'Still learning'}
- Adjustments to make: ${calibration.adjustments.slice(0, 3).join('; ') || 'None yet'}
`;
  }

  prompt += `
## YOUR TASK
Analyze this stock and provide a recommendation. You MUST respond in this EXACT JSON format:

{
  "direction": "UP" | "DOWN" | "HOLD",
  "confidence": <number 0-100>,
  "thesis": "<one sentence summary of your thesis>",
  "full_reasoning": "<detailed 2-3 paragraph analysis>",
  "target_price": <number - your price target>,
  "stop_loss": <number - your stop loss>,
  "timeframe": "1W" | "2W" | "1M",
  "factor_assessments": [
    {
      "factorId": "pe_ratio" | "volume_trend" | "sma_50" | "news_sentiment" | "price_momentum_1m",
      "factorName": "<human readable name>",
      "value": "<the value you observed>",
      "interpretation": "BULLISH" | "BEARISH" | "NEUTRAL",
      "confidence": <0-100>,
      "reasoning": "<why this factor matters for this pick>"
    }
  ],
  "key_bullish_factors": ["<factor 1>", "<factor 2>"],
  "key_bearish_factors": ["<factor 1>", "<factor 2>"],
  "risks": ["<risk 1>", "<risk 2>"],
  "catalysts": ["<upcoming catalyst 1>", "<catalyst 2>"]
}

IMPORTANT:
- Be specific with numbers and reasoning
- Your confidence should reflect your actual certainty (don't be overconfident)
- Include at least 3 factor assessments
- Stop loss should typically be 5-10% from entry
- Target should reflect your timeframe (1W: 2-5%, 2W: 5-10%, 1M: 10-20%)
- If you don't have a strong view, use "HOLD" with lower confidence

Respond ONLY with the JSON object, no additional text.`;

  return prompt;
}

// ============================================================================
// CALL GPT-4
// ============================================================================

async function callGPT4(prompt: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not set');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: AI_CONFIGS.gpt4.model,
      messages: [
        { role: 'system', content: 'You are a professional stock analyst. Always respond with valid JSON.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: AI_CONFIGS.gpt4.maxTokens,
      temperature: AI_CONFIGS.gpt4.temperature,
    }),
  });

  if (!response.ok) {
    throw new Error(`GPT-4 API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// ============================================================================
// CALL CLAUDE
// ============================================================================

async function callClaude(prompt: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');

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
      messages: [
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

// ============================================================================
// CALL GEMINI
// ============================================================================

async function callGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_GEMINI_API_KEY not set');

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${AI_CONFIGS.gemini.model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          { parts: [{ text: prompt }] },
        ],
        generationConfig: {
          temperature: AI_CONFIGS.gemini.temperature,
          maxOutputTokens: AI_CONFIGS.gemini.maxTokens,
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

// ============================================================================
// CALL PERPLEXITY
// ============================================================================

async function callPerplexity(prompt: string): Promise<string> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) throw new Error('PERPLEXITY_API_KEY not set');

  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: AI_CONFIGS.perplexity.model,
      messages: [
        { role: 'system', content: 'You are a professional stock analyst with real-time market access. Always respond with valid JSON.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: AI_CONFIGS.perplexity.maxTokens,
      temperature: AI_CONFIGS.perplexity.temperature,
    }),
  });

  if (!response.ok) {
    throw new Error(`Perplexity API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// ============================================================================
// PARSE AI RESPONSE
// ============================================================================

interface AIResponse {
  direction: PickDirection;
  confidence: number;
  thesis: string;
  full_reasoning: string;
  target_price: number;
  stop_loss: number;
  timeframe: string;
  factor_assessments: FactorAssessment[];
  key_bullish_factors: string[];
  key_bearish_factors: string[];
  risks: string[];
  catalysts: string[];
}

function parseAIResponse(response: string): AIResponse | null {
  try {
    // Clean up response - remove markdown code blocks if present
    let cleaned = response.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.slice(7);
    }
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.slice(3);
    }
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.slice(0, -3);
    }
    cleaned = cleaned.trim();

    const parsed = JSON.parse(cleaned);
    
    // Validate required fields
    if (!parsed.direction || !['UP', 'DOWN', 'HOLD'].includes(parsed.direction)) {
      console.error('Invalid direction:', parsed.direction);
      return null;
    }
    
    if (typeof parsed.confidence !== 'number' || parsed.confidence < 0 || parsed.confidence > 100) {
      parsed.confidence = 50; // Default
    }

    return {
      direction: parsed.direction,
      confidence: parsed.confidence,
      thesis: parsed.thesis || 'No thesis provided',
      full_reasoning: parsed.full_reasoning || parsed.thesis || 'No reasoning provided',
      target_price: parsed.target_price || 0,
      stop_loss: parsed.stop_loss || 0,
      timeframe: parsed.timeframe || '1W',
      factor_assessments: Array.isArray(parsed.factor_assessments) ? parsed.factor_assessments : [],
      key_bullish_factors: Array.isArray(parsed.key_bullish_factors) ? parsed.key_bullish_factors : [],
      key_bearish_factors: Array.isArray(parsed.key_bearish_factors) ? parsed.key_bearish_factors : [],
      risks: Array.isArray(parsed.risks) ? parsed.risks : [],
      catalysts: Array.isArray(parsed.catalysts) ? parsed.catalysts : [],
    };
  } catch (error) {
    console.error('Error parsing AI response:', error);
    console.error('Raw response:', response.substring(0, 500));
    return null;
  }
}

// ============================================================================
// GENERATE PICK FROM AI
// ============================================================================

export async function generatePickFromAI(
  aiModel: Exclude<AIModelName, 'javari'>,
  symbol: string
): Promise<AIPick | null> {
  try {
    console.log(`🤖 Generating ${aiModel} pick for ${symbol}...`);

    // Get market data
    const marketData = await getMarketData(symbol);
    if (!marketData) {
      console.error(`Failed to get market data for ${symbol}`);
      return null;
    }

    // Get calibration data
    const calibration = await getLatestCalibration(aiModel);

    // Get recent news (simplified - you could use NewsAPI here)
    const recentNews: string[] = [];

    // Build prompt
    const prompt = buildAnalysisPrompt(
      marketData,
      calibration ? {
        bestSectors: calibration.bestSectors,
        worstSectors: calibration.worstSectors,
        adjustments: calibration.adjustments,
      } : null,
      recentNews
    );

    // Call the appropriate AI
    let response: string;
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
      default:
        throw new Error(`Unknown AI model: ${aiModel}`);
    }

    // Parse response
    const parsed = parseAIResponse(response);
    if (!parsed) {
      console.error(`Failed to parse ${aiModel} response`);
      return null;
    }

    // Apply calibration adjustments
    let adjustedConfidence = parsed.confidence;
    if (calibration && calibration.overconfidenceScore > 10) {
      adjustedConfidence = Math.max(30, adjustedConfidence - 10);
    }

    // Create pick object
    const pick: AIPick = {
      id: `pick_${aiModel}_${symbol}_${Date.now()}`,
      aiModel,
      symbol: marketData.symbol,
      companyName: marketData.companyName,
      sector: marketData.sector,
      direction: parsed.direction,
      confidence: adjustedConfidence,
      timeframe: parsed.timeframe as AIPick['timeframe'],
      entryPrice: marketData.currentPrice,
      targetPrice: parsed.target_price || (parsed.direction === 'UP' 
        ? marketData.currentPrice * 1.05 
        : marketData.currentPrice * 0.95),
      stopLoss: parsed.stop_loss || (parsed.direction === 'UP'
        ? marketData.currentPrice * 0.93
        : marketData.currentPrice * 1.07),
      thesis: parsed.thesis,
      fullReasoning: parsed.full_reasoning,
      factorAssessments: parsed.factor_assessments,
      keyBullishFactors: parsed.key_bullish_factors,
      keyBearishFactors: parsed.key_bearish_factors,
      risks: parsed.risks,
      catalysts: parsed.catalysts,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week default
      status: 'PENDING',
    };

    // Store in database
    const { error } = await supabase
      .from('market_oracle_picks')
      .insert({
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
      });

    if (error) {
      console.error(`Error storing ${aiModel} pick:`, error);
    } else {
      console.log(`✅ ${aiModel} pick generated: ${symbol} ${parsed.direction} (${adjustedConfidence}%)`);
    }

    return pick;
  } catch (error) {
    console.error(`Error generating ${aiModel} pick for ${symbol}:`, error);
    return null;
  }
}

// ============================================================================
// GENERATE ALL AI PICKS FOR SYMBOL
// ============================================================================

export async function generateAllAIPicks(
  symbol: string
): Promise<{
  picks: AIPick[];
  consensus: ReturnType<typeof buildJavariConsensus> extends Promise<infer T> ? T : never;
}> {
  const aiModels: Exclude<AIModelName, 'javari'>[] = ['gpt4', 'claude', 'gemini', 'perplexity'];
  const picks: AIPick[] = [];

  console.log(`\n${'='.repeat(60)}`);
  console.log(`🎯 GENERATING AI PICKS FOR ${symbol}`);
  console.log(`${'='.repeat(60)}\n`);

  for (const model of aiModels) {
    try {
      const pick = await generatePickFromAI(model, symbol);
      if (pick) {
        picks.push(pick);
      }
      // Small delay between API calls
      await new Promise(r => setTimeout(r, 1000));
    } catch (error) {
      console.error(`Failed to generate ${model} pick:`, error);
    }
  }

  // Build Javari consensus
  const aiPicks = picks.map(p => ({
    aiModel: p.aiModel,
    direction: p.direction,
    confidence: p.confidence,
    pickId: p.id,
  }));

  const consensus = await buildJavariConsensus(symbol, aiPicks);

  console.log(`\n✅ Generated ${picks.length} picks for ${symbol}`);
  console.log(`📊 Javari Consensus: ${consensus.javariRecommendation} (${consensus.javariConfidence}%)`);
  console.log(`💬 "${consensus.javariReasoning}"\n`);

  return { picks, consensus };
}

// ============================================================================
// DAILY BATTLE - Generate picks for multiple symbols
// ============================================================================

export async function runDailyBattle(
  symbols: string[]
): Promise<void> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🏆 DAILY AI BATTLE - ${new Date().toISOString()}`);
  console.log(`📈 Analyzing ${symbols.length} symbols`);
  console.log(`${'='.repeat(60)}\n`);

  for (const symbol of symbols) {
    try {
      await generateAllAIPicks(symbol);
      // Longer delay between symbols to respect API limits
      await new Promise(r => setTimeout(r, 5000));
    } catch (error) {
      console.error(`Failed to generate picks for ${symbol}:`, error);
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ DAILY BATTLE COMPLETE`);
  console.log(`${'='.repeat(60)}\n`);
}

export default {
  generatePickFromAI,
  generateAllAIPicks,
  runDailyBattle,
  getMarketData,
};
