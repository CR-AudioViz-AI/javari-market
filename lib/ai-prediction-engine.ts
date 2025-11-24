/**
 * MARKET ORACLE - AI PREDICTION ENGINE
 * Fixed model names - November 24, 2025 - 5:42 AM ET
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface StockPick {
  ticker: string;
  direction: 'UP' | 'DOWN' | 'HOLD';
  confidence: number;
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
  reasoning: string;
}

interface AIResponse {
  aiModel: string;
  picks: StockPick[];
  timestamp: string;
  success: boolean;
  error?: string;
}

function getAnalysisPrompt(currentDate: string): string {
  return `You are a professional stock market analyst. Pick 5-7 stocks for the week.

CURRENT DATE: ${currentDate}

For each stock provide:
1. Ticker symbol (e.g., AAPL, TSLA)
2. Direction: UP, DOWN, or HOLD
3. Confidence level: 0-100
4. Entry price
5. Target price (end of week)
6. Stop loss
7. Reasoning (2-3 sentences)

RESPOND IN VALID JSON ONLY:
{
  "picks": [
    {
      "ticker": "AAPL",
      "direction": "UP",
      "confidence": 75,
      "entryPrice": 180.50,
      "targetPrice": 188.00,
      "stopLoss": 175.00,
      "reasoning": "Strong momentum..."
    }
  ]
}

Only output valid JSON.`;
}

function parseAIResponse(text: string): { picks: StockPick[] } | null {
  try {
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

// GPT-4
async function getGPT4Picks(prompt: string): Promise<AIResponse> {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY not configured');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: 'You are an expert stock analyst. Always respond with valid JSON only.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) throw new Error(`OpenAI API error: ${response.status}`);
    const data = await response.json();
    const parsed = parseAIResponse(data.choices?.[0]?.message?.content || '');

    return {
      aiModel: 'GPT-4',
      picks: parsed?.picks || [],
      timestamp: new Date().toISOString(),
      success: !!parsed?.picks?.length,
    };
  } catch (error) {
    return {
      aiModel: 'GPT-4',
      picks: [],
      timestamp: new Date().toISOString(),
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Claude
async function getClaudePicks(prompt: string): Promise<AIResponse> {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) throw new Error(`Anthropic API error: ${response.status}`);
    const data = await response.json();
    const parsed = parseAIResponse(data.content?.[0]?.text || '');

    return {
      aiModel: 'Claude',
      picks: parsed?.picks || [],
      timestamp: new Date().toISOString(),
      success: !!parsed?.picks?.length,
    };
  } catch (error) {
    return {
      aiModel: 'Claude',
      picks: [],
      timestamp: new Date().toISOString(),
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Gemini - FIXED: Use gemini-pro model
async function getGeminiPicks(prompt: string): Promise<AIResponse> {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

    // Use gemini-pro which is widely available
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 2000 },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorText.slice(0, 100)}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const parsed = parseAIResponse(text);

    return {
      aiModel: 'Gemini',
      picks: parsed?.picks || [],
      timestamp: new Date().toISOString(),
      success: !!parsed?.picks?.length,
    };
  } catch (error) {
    return {
      aiModel: 'Gemini',
      picks: [],
      timestamp: new Date().toISOString(),
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Perplexity - FIXED: Proper request format
async function getPerplexityPicks(prompt: string): Promise<AIResponse> {
  try {
    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) throw new Error('PERPLEXITY_API_KEY not configured');

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'sonar', // Simplified model name
        messages: [
          { role: 'system', content: 'You are an expert stock analyst with real-time web access. Always respond with valid JSON only.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Perplexity API error: ${response.status} - ${errorText.slice(0, 100)}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';
    const parsed = parseAIResponse(text);

    return {
      aiModel: 'Perplexity',
      picks: parsed?.picks || [],
      timestamp: new Date().toISOString(),
      success: !!parsed?.picks?.length,
    };
  } catch (error) {
    return {
      aiModel: 'Perplexity',
      picks: [],
      timestamp: new Date().toISOString(),
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Javari (uses Claude)
async function getJavariPicks(prompt: string): Promise<AIResponse> {
  const result = await getClaudePicks(prompt);
  return { ...result, aiModel: 'Javari' };
}

export async function generateAllPredictions(): Promise<AIResponse[]> {
  const currentDate = new Date().toISOString().split('T')[0];
  const prompt = getAnalysisPrompt(currentDate);

  console.log('🤖 Generating AI predictions...');

  const results = await Promise.all([
    getGPT4Picks(prompt),
    getClaudePicks(prompt),
    getGeminiPicks(prompt),
    getPerplexityPicks(prompt),
    getJavariPicks(prompt),
  ]);

  console.log('✅ All predictions generated');
  return results;
}

export async function savePredictionsToDatabase(
  predictions: AIResponse[],
  competitionId: string,
  weekNumber: number
): Promise<void> {
  const pickDate = new Date().toISOString().split('T')[0];
  
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysUntilFriday = dayOfWeek <= 5 ? 5 - dayOfWeek : 5 + (7 - dayOfWeek);
  today.setDate(today.getDate() + daysUntilFriday);
  const expiryDate = today.toISOString().split('T')[0];

  for (const prediction of predictions) {
    if (!prediction.success || prediction.picks.length === 0) {
      console.log(`⚠️ Skipping ${prediction.aiModel} - no valid picks`);
      continue;
    }

    const { data: aiModel } = await supabase
      .from('ai_models')
      .select('id')
      .eq('name', prediction.aiModel)
      .single();

    if (!aiModel) {
      console.log(`⚠️ AI model not found: ${prediction.aiModel}`);
      continue;
    }

    for (const pick of prediction.picks) {
      const { error } = await supabase.from('stock_picks').insert({
        competition_id: competitionId,
        ai_model_id: aiModel.id,
        ticker: pick.ticker.toUpperCase(),
        pick_date: pickDate,
        week_number: weekNumber,
        direction: pick.direction,
        confidence: pick.confidence,
        entry_price: pick.entryPrice,
        target_price: pick.targetPrice,
        stop_loss: pick.stopLoss,
        reasoning: pick.reasoning,
        expiry_date: expiryDate,
        status: 'active',
      });

      if (error) console.error(`Error saving pick for ${prediction.aiModel}:`, error.message);
    }

    console.log(`✅ Saved ${prediction.picks.length} picks for ${prediction.aiModel}`);
  }
}

export async function getOrCreateActiveCompetition() {
  const { data: activeCompetition } = await supabase
    .from('competitions')
    .select('*')
    .eq('status', 'active')
    .single();

  if (activeCompetition) return activeCompetition;

  const today = new Date();
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + 90);

  const quarter = Math.ceil((today.getMonth() + 1) / 3);
  const competitionName = `Q${quarter} ${today.getFullYear()} AI Battle`;

  const { data: newCompetition, error } = await supabase
    .from('competitions')
    .insert({
      name: competitionName,
      start_date: today.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      status: 'active',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating competition:', error);
    return null;
  }

  console.log(`✅ Created new competition: ${competitionName}`);
  return newCompetition;
}

export function calculateWeekNumber(startDate: string): number {
  const start = new Date(startDate);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.ceil(diffDays / 7) || 1;
}
