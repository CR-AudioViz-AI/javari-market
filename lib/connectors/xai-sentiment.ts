// lib/connectors/xai-sentiment.ts
// xAI/Grok Twitter Sentiment Analysis for Stock Picks
// Uses Grok-4 with real-time X/Twitter access
// Created: December 25, 2025

export interface SentimentResult {
  symbol: string
  score: number // -100 to +100
  confidence: 'low' | 'medium' | 'high'
  bullishThemes: string[]
  bearishThemes: string[]
  mentionCount: number
  keyInfluencers: string[]
  trendDirection: 'up' | 'down' | 'stable'
  summary: string
  timestamp: string
}

export interface SentimentAnalysisResponse {
  success: boolean
  data?: SentimentResult
  error?: string
  model: string
  tokensUsed: number
}

export interface BatchSentimentResponse {
  success: boolean
  results: SentimentResult[]
  errors: { symbol: string; error: string }[]
  timestamp: string
}

const XAI_API_URL = 'https://api.x.ai/v1/chat/completions'
const MODEL = 'grok-3' // Updated Dec 28, 2025 - grok-beta/grok-4 deprecated

/**
 * Analyze Twitter/X sentiment for a single stock
 */
export async function analyzeStockSentiment(
  symbol: string,
  options: {
    includeInfluencers?: boolean
    timeframe?: '1h' | '24h' | '7d'
  } = {}
): Promise<SentimentAnalysisResponse> {
  const apiKey = process.env.XAI_API_KEY

  if (!apiKey) {
    return {
      success: false,
      error: 'XAI_API_KEY not configured',
      model: MODEL,
      tokensUsed: 0,
    }
  }

  const { includeInfluencers = true, timeframe = '24h' } = options

  const timeframeText = {
    '1h': 'the past hour',
    '24h': 'the past 24 hours',
    '7d': 'the past 7 days',
  }[timeframe]

  const prompt = `Analyze real-time X/Twitter sentiment for ${symbol} stock over ${timeframeText}.

Return a JSON object with this exact structure (no markdown, just raw JSON):
{
  "symbol": "${symbol}",
  "score": <number from -100 to +100>,
  "confidence": "<low|medium|high>",
  "bullishThemes": ["<theme1>", "<theme2>", "<theme3>"],
  "bearishThemes": ["<theme1>", "<theme2>", "<theme3>"],
  "mentionCount": <estimated number of relevant mentions>,
  "keyInfluencers": ${includeInfluencers ? '["@handle1", "@handle2"]' : '[]'},
  "trendDirection": "<up|down|stable>",
  "summary": "<2-3 sentence summary of overall sentiment>"
}

Base your analysis on actual X/Twitter data. Be specific about current discussions.`

  try {
    const response = await fetch(XAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'system',
            content:
              'You are a financial sentiment analyst with real-time access to X/Twitter. Always respond with valid JSON only, no markdown formatting.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 800,
        temperature: 0.3, // Lower temp for more consistent structured output
      }),
    })

    const data = await response.json()

    if (!data.choices?.[0]?.message?.content) {
      return {
        success: false,
        error: data.error?.message || 'No response from xAI',
        model: MODEL,
        tokensUsed: data.usage?.total_tokens || 0,
      }
    }

    const content = data.choices[0].message.content

    // Parse JSON from response (handle potential markdown wrapping)
    let jsonStr = content
    if (content.includes('```json')) {
      jsonStr = content.split('```json')[1].split('```')[0]
    } else if (content.includes('```')) {
      jsonStr = content.split('```')[1].split('```')[0]
    }

    const result: SentimentResult = JSON.parse(jsonStr.trim())
    result.timestamp = new Date().toISOString()

    return {
      success: true,
      data: result,
      model: MODEL,
      tokensUsed: data.usage?.total_tokens || 0,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      model: MODEL,
      tokensUsed: 0,
    }
  }
}

/**
 * Batch analyze sentiment for multiple stocks
 */
export async function analyzeMultipleStocks(
  symbols: string[],
  options: {
    includeInfluencers?: boolean
    timeframe?: '1h' | '24h' | '7d'
  } = {}
): Promise<BatchSentimentResponse> {
  const results: SentimentResult[] = []
  const errors: { symbol: string; error: string }[] = []

  // Process in parallel with rate limiting (max 5 concurrent)
  const batchSize = 5
  for (let i = 0; i < symbols.length; i += batchSize) {
    const batch = symbols.slice(i, i + batchSize)
    const promises = batch.map((symbol) => analyzeStockSentiment(symbol, options))
    const batchResults = await Promise.all(promises)

    batchResults.forEach((result, index) => {
      if (result.success && result.data) {
        results.push(result.data)
      } else {
        errors.push({
          symbol: batch[index],
          error: result.error || 'Unknown error',
        })
      }
    })

    // Small delay between batches to avoid rate limiting
    if (i + batchSize < symbols.length) {
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  }

  return {
    success: errors.length === 0,
    results,
    errors,
    timestamp: new Date().toISOString(),
  }
}

/**
 * Get trending stock mentions on Twitter
 */
export async function getTrendingStockMentions(): Promise<{
  success: boolean
  trending: { symbol: string; mentions: number; sentiment: number }[]
  error?: string
}> {
  const apiKey = process.env.XAI_API_KEY

  if (!apiKey) {
    return {
      success: false,
      trending: [],
      error: 'XAI_API_KEY not configured',
    }
  }

  try {
    const response = await fetch(XAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'user',
            content: `What are the top 10 most discussed stocks on X/Twitter right now? 
Return a JSON array with this structure (no markdown):
[
  {"symbol": "NVDA", "mentions": 15000, "sentiment": 68},
  {"symbol": "TSLA", "mentions": 12000, "sentiment": 45}
]
Include estimated mention counts and sentiment scores (-100 to +100).`,
          },
        ],
        max_tokens: 500,
        temperature: 0.3,
      }),
    })

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      return {
        success: false,
        trending: [],
        error: 'No response from xAI',
      }
    }

    let jsonStr = content
    if (content.includes('```')) {
      jsonStr = content.split('```')[1].split('```')[0].replace('json', '')
    }

    const trending = JSON.parse(jsonStr.trim())

    return {
      success: true,
      trending,
    }
  } catch (error) {
    return {
      success: false,
      trending: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Compare sentiment between two stocks
 */
interface ComparisonResult {
  symbol1Data: SentimentResult
  symbol2Data: SentimentResult
  winner: string
  analysis: string
}

export async function compareSentiment(
  symbol1: string,
  symbol2: string
): Promise<{
  success: boolean
  comparison?: ComparisonResult
  error?: string
}> {
  const [result1, result2] = await Promise.all([
    analyzeStockSentiment(symbol1),
    analyzeStockSentiment(symbol2),
  ])

  if (!result1.success || !result1.data) {
    return { success: false, error: `Failed to analyze ${symbol1}: ${result1.error}` }
  }

  if (!result2.success || !result2.data) {
    return { success: false, error: `Failed to analyze ${symbol2}: ${result2.error}` }
  }

  const winner = result1.data.score > result2.data.score ? symbol1 : symbol2
  const scoreDiff = Math.abs(result1.data.score - result2.data.score)

  let analysis = ''
  if (scoreDiff < 10) {
    analysis = `${symbol1} and ${symbol2} have similar Twitter sentiment. The market is relatively neutral between these two.`
  } else if (scoreDiff < 30) {
    analysis = `${winner} has moderately better Twitter sentiment (+${scoreDiff} points). Consider this in your analysis but other factors matter too.`
  } else {
    analysis = `${winner} has significantly better Twitter sentiment (+${scoreDiff} points). Strong social media momentum may drive short-term price action.`
  }

  return {
    success: true,
    comparison: {
      symbol1Data: result1.data,
      symbol2Data: result2.data,
      winner,
      analysis,
    },
  }
}

/**
 * Get sentiment history trend (simulated based on current data)
 */
export async function getSentimentWithContext(symbol: string): Promise<{
  success: boolean
  data?: {
    current: SentimentResult
    priceCorrelation: string
    recommendation: 'bullish' | 'bearish' | 'neutral'
    confidenceReason: string
  }
  error?: string
}> {
  const result = await analyzeStockSentiment(symbol, { includeInfluencers: true })

  if (!result.success || !result.data) {
    return { success: false, error: result.error }
  }

  const sentiment = result.data

  // Determine recommendation based on sentiment score and confidence
  let recommendation: 'bullish' | 'bearish' | 'neutral' = 'neutral'
  let confidenceReason = ''

  if (sentiment.score >= 50 && sentiment.confidence !== 'low') {
    recommendation = 'bullish'
    confidenceReason = `Strong positive sentiment (+${sentiment.score}) with ${sentiment.mentionCount}+ mentions suggests bullish momentum.`
  } else if (sentiment.score <= -50 && sentiment.confidence !== 'low') {
    recommendation = 'bearish'
    confidenceReason = `Strong negative sentiment (${sentiment.score}) with ${sentiment.mentionCount}+ mentions suggests bearish pressure.`
  } else if (sentiment.score > 20) {
    recommendation = 'bullish'
    confidenceReason = `Moderately positive sentiment indicates cautious optimism.`
  } else if (sentiment.score < -20) {
    recommendation = 'bearish'
    confidenceReason = `Moderately negative sentiment suggests caution.`
  } else {
    confidenceReason = `Mixed or neutral sentiment - consider other factors.`
  }

  // Price correlation insight
  let priceCorrelation = ''
  if (sentiment.trendDirection === 'up' && sentiment.score > 0) {
    priceCorrelation =
      'Sentiment trend aligns with positive score - momentum likely to continue.'
  } else if (sentiment.trendDirection === 'down' && sentiment.score < 0) {
    priceCorrelation = 'Declining sentiment matches negative score - continued weakness possible.'
  } else if (sentiment.trendDirection === 'up' && sentiment.score < 0) {
    priceCorrelation =
      'Sentiment improving despite negative score - potential reversal signal.'
  } else if (sentiment.trendDirection === 'down' && sentiment.score > 0) {
    priceCorrelation =
      'Sentiment declining despite positive score - watch for momentum shift.'
  } else {
    priceCorrelation = 'Sentiment stable - no clear directional signal.'
  }

  return {
    success: true,
    data: {
      current: sentiment,
      priceCorrelation,
      recommendation,
      confidenceReason,
    },
  }
}
