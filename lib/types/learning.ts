// lib/types/learning.ts
// Market Oracle Ultimate - Learning System Types
// Created: December 13, 2025
// Purpose: Define all types for the AI learning and calibration system

// ============================================================================
// AI MODEL DEFINITIONS
// ============================================================================

export type AIModelName = 'gpt4' | 'claude' | 'gemini' | 'perplexity' | 'javari';

export interface AIModelConfig {
  name: AIModelName;
  displayName: string;
  description: string;
  strengths: string[];
  apiKeyEnv: string;
  endpoint: string;
  enabled: boolean;
}

export const AI_MODELS: Record<AIModelName, AIModelConfig> = {
  gpt4: {
    name: 'gpt4',
    displayName: 'GPT-4 Turbo',
    description: 'OpenAI flagship model - strong reasoning and analysis',
    strengths: ['Technical analysis', 'Pattern recognition', 'Risk assessment'],
    apiKeyEnv: 'OPENAI_API_KEY',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    enabled: true,
  },
  claude: {
    name: 'claude',
    displayName: 'Claude Sonnet',
    description: 'Anthropic model - nuanced analysis and safety focus',
    strengths: ['Fundamental analysis', 'Risk warnings', 'Long-term outlook'],
    apiKeyEnv: 'ANTHROPIC_API_KEY',
    endpoint: 'https://api.anthropic.com/v1/messages',
    enabled: true,
  },
  gemini: {
    name: 'gemini',
    displayName: 'Gemini Pro',
    description: 'Google model - broad knowledge and multimodal',
    strengths: ['News synthesis', 'Sector analysis', 'Market trends'],
    apiKeyEnv: 'GOOGLE_GEMINI_API_KEY',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
    enabled: true,
  },
  perplexity: {
    name: 'perplexity',
    displayName: 'Perplexity Sonar',
    description: 'Real-time search integrated - current events focus',
    strengths: ['Breaking news', 'Real-time data', 'Event-driven picks'],
    apiKeyEnv: 'PERPLEXITY_API_KEY',
    endpoint: 'https://api.perplexity.ai/chat/completions',
    enabled: true,
  },
  javari: {
    name: 'javari',
    displayName: 'Javari AI',
    description: 'Meta-learner - synthesizes all AI picks and learns which to trust',
    strengths: ['Consensus building', 'AI arbitration', 'Adaptive weighting'],
    apiKeyEnv: 'ANTHROPIC_API_KEY', // Uses Claude under the hood
    endpoint: 'internal',
    enabled: true,
  },
};

// ============================================================================
// MARKET FACTORS - What each AI considers when making picks
// ============================================================================

export type FactorCategory = 
  | 'technical'      // Chart patterns, indicators
  | 'fundamental'    // Earnings, P/E, revenue
  | 'sentiment'      // News, social media, analyst ratings
  | 'macro'          // Interest rates, GDP, inflation
  | 'sector'         // Industry trends, competition
  | 'momentum'       // Price momentum, volume
  | 'risk'           // Volatility, beta, drawdown
  | 'event';         // Earnings dates, product launches

export interface MarketFactor {
  id: string;
  name: string;
  category: FactorCategory;
  description: string;
  dataSource: string;
  weight: number; // 0-1, how much this factor matters
  lastUpdated: Date;
}

// Pre-defined factors that AIs can reference
export const MARKET_FACTORS: MarketFactor[] = [
  // Technical
  { id: 'rsi', name: 'RSI (14)', category: 'technical', description: 'Relative Strength Index - overbought/oversold', dataSource: 'calculated', weight: 0.7, lastUpdated: new Date() },
  { id: 'macd', name: 'MACD', category: 'technical', description: 'Moving Average Convergence Divergence', dataSource: 'calculated', weight: 0.6, lastUpdated: new Date() },
  { id: 'sma_50', name: 'SMA 50', category: 'technical', description: '50-day Simple Moving Average', dataSource: 'calculated', weight: 0.5, lastUpdated: new Date() },
  { id: 'sma_200', name: 'SMA 200', category: 'technical', description: '200-day Simple Moving Average', dataSource: 'calculated', weight: 0.6, lastUpdated: new Date() },
  { id: 'volume_trend', name: 'Volume Trend', category: 'technical', description: 'Volume relative to average', dataSource: 'alpha_vantage', weight: 0.5, lastUpdated: new Date() },
  
  // Fundamental
  { id: 'pe_ratio', name: 'P/E Ratio', category: 'fundamental', description: 'Price to Earnings ratio', dataSource: 'alpha_vantage', weight: 0.7, lastUpdated: new Date() },
  { id: 'revenue_growth', name: 'Revenue Growth', category: 'fundamental', description: 'YoY revenue growth rate', dataSource: 'alpha_vantage', weight: 0.8, lastUpdated: new Date() },
  { id: 'profit_margin', name: 'Profit Margin', category: 'fundamental', description: 'Net profit margin', dataSource: 'alpha_vantage', weight: 0.6, lastUpdated: new Date() },
  { id: 'debt_equity', name: 'Debt/Equity', category: 'fundamental', description: 'Debt to equity ratio', dataSource: 'alpha_vantage', weight: 0.5, lastUpdated: new Date() },
  
  // Sentiment
  { id: 'news_sentiment', name: 'News Sentiment', category: 'sentiment', description: 'Aggregate news sentiment score', dataSource: 'newsapi', weight: 0.6, lastUpdated: new Date() },
  { id: 'analyst_rating', name: 'Analyst Rating', category: 'sentiment', description: 'Consensus analyst rating', dataSource: 'alpha_vantage', weight: 0.5, lastUpdated: new Date() },
  
  // Macro
  { id: 'fed_rate', name: 'Fed Rate Impact', category: 'macro', description: 'Sensitivity to interest rate changes', dataSource: 'fred', weight: 0.4, lastUpdated: new Date() },
  { id: 'sector_rotation', name: 'Sector Rotation', category: 'macro', description: 'Current sector rotation phase', dataSource: 'calculated', weight: 0.5, lastUpdated: new Date() },
  
  // Momentum
  { id: 'price_momentum_1m', name: '1-Month Momentum', category: 'momentum', description: 'Price change over 1 month', dataSource: 'calculated', weight: 0.6, lastUpdated: new Date() },
  { id: 'price_momentum_3m', name: '3-Month Momentum', category: 'momentum', description: 'Price change over 3 months', dataSource: 'calculated', weight: 0.5, lastUpdated: new Date() },
  
  // Risk
  { id: 'volatility_30d', name: '30-Day Volatility', category: 'risk', description: 'Standard deviation of returns', dataSource: 'calculated', weight: 0.7, lastUpdated: new Date() },
  { id: 'beta', name: 'Beta', category: 'risk', description: 'Market sensitivity', dataSource: 'alpha_vantage', weight: 0.5, lastUpdated: new Date() },
  
  // Event
  { id: 'earnings_proximity', name: 'Earnings Proximity', category: 'event', description: 'Days until next earnings', dataSource: 'alpha_vantage', weight: 0.6, lastUpdated: new Date() },
  { id: 'dividend_date', name: 'Dividend Date', category: 'event', description: 'Days until ex-dividend', dataSource: 'alpha_vantage', weight: 0.3, lastUpdated: new Date() },
];

// ============================================================================
// PICK TYPES - Complete pick with full reasoning chain
// ============================================================================

export type PickDirection = 'UP' | 'DOWN' | 'HOLD';
export type PickTimeframe = '1D' | '1W' | '2W' | '1M' | '3M';
export type PickOutcome = 'WIN' | 'LOSS' | 'EXPIRED' | 'PENDING';

export interface FactorAssessment {
  factorId: string;
  factorName: string;
  value: number | string;
  interpretation: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  confidence: number; // 0-100
  reasoning: string;
}

export interface AIPick {
  id: string;
  aiModel: AIModelName;
  symbol: string;
  companyName: string;
  sector: string;
  
  // The pick itself
  direction: PickDirection;
  confidence: number; // 0-100
  timeframe: PickTimeframe;
  
  // Prices
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
  
  // Full reasoning chain (this is key for learning)
  thesis: string; // One sentence summary
  fullReasoning: string; // Complete analysis
  factorAssessments: FactorAssessment[]; // Each factor evaluated
  keyBullishFactors: string[];
  keyBearishFactors: string[];
  risks: string[];
  catalysts: string[];
  
  // Metadata
  createdAt: Date;
  expiresAt: Date;
  status: PickOutcome;
  
  // Outcome tracking (filled in later)
  closedAt?: Date;
  closedPrice?: number;
  actualReturn?: number;
  hitTarget?: boolean;
  hitStopLoss?: boolean;
  daysHeld?: number;
}

// ============================================================================
// CALIBRATION TYPES - How AIs learn from outcomes
// ============================================================================

export interface AICalibration {
  id: string;
  aiModel: AIModelName;
  calibrationDate: Date;
  
  // Performance metrics
  totalPicks: number;
  wins: number;
  losses: number;
  winRate: number;
  avgReturn: number;
  avgConfidence: number;
  
  // Confidence calibration
  confidenceAccuracyCorrelation: number; // Do high confidence picks actually perform better?
  overconfidenceScore: number; // Are we too confident? (negative = underconfident)
  
  // Factor performance
  factorPerformance: Record<string, {
    timesUsed: number;
    accuracy: number;
    avgContribution: number;
  }>;
  
  // Best/worst conditions
  bestSectors: string[];
  worstSectors: string[];
  bestMarketConditions: string[];
  worstMarketConditions: string[];
  
  // Learnings
  keyLearnings: string[];
  adjustments: string[];
}

// ============================================================================
// JAVARI CONSENSUS TYPES - Meta-learning across AIs
// ============================================================================

export interface ConsensusAssessment {
  symbol: string;
  aiPicks: {
    aiModel: AIModelName;
    direction: PickDirection;
    confidence: number;
    pickId: string;
  }[];
  
  // Consensus metrics
  consensusDirection: PickDirection;
  consensusStrength: number; // How many AIs agree
  weightedConfidence: number; // Confidence weighted by AI historical accuracy
  
  // Javari's decision
  javariRecommendation: PickDirection;
  javariConfidence: number;
  javariReasoning: string;
  
  // Historical context
  similarPastSetups: {
    setupId: string;
    outcome: PickOutcome;
    similarity: number;
  }[];
}

export interface JavariConsensusStats {
  aiCombination: AIModelName[];
  timesAgreed: number;
  accuracyRate: number;
  avgReturn: number;
  bestSector: string;
  worstSector: string;
  lastUpdated: Date;
}

// ============================================================================
// LEARNING QUEUE - Background learning tasks
// ============================================================================

export type LearningTaskType = 
  | 'CALIBRATE_AI'
  | 'ANALYZE_FACTOR'
  | 'UPDATE_CONSENSUS_WEIGHTS'
  | 'PROCESS_OUTCOME'
  | 'GENERATE_REPORT';

export interface LearningTask {
  id: string;
  taskType: LearningTaskType;
  targetAI?: AIModelName;
  targetPick?: string;
  priority: number; // 1-10
  status: 'PENDING' | 'PROCESSING' | 'COMPLETE' | 'FAILED';
  createdAt: Date;
  processedAt?: Date;
  result?: Record<string, unknown>;
  error?: string;
}

// ============================================================================
// DATABASE SCHEMA TYPES (for Supabase)
// ============================================================================

export interface DBPick {
  id: string;
  ai_model: AIModelName;
  symbol: string;
  company_name: string;
  sector: string;
  direction: PickDirection;
  confidence: number;
  timeframe: PickTimeframe;
  entry_price: number;
  target_price: number;
  stop_loss: number;
  thesis: string;
  full_reasoning: string;
  factor_assessments: FactorAssessment[];
  key_bullish_factors: string[];
  key_bearish_factors: string[];
  risks: string[];
  catalysts: string[];
  created_at: string;
  expires_at: string;
  status: PickOutcome;
  closed_at?: string;
  closed_price?: number;
  actual_return?: number;
  hit_target?: boolean;
  hit_stop_loss?: boolean;
  days_held?: number;
}

export interface DBCalibration {
  id: string;
  ai_model: AIModelName;
  calibration_date: string;
  total_picks: number;
  wins: number;
  losses: number;
  win_rate: number;
  avg_return: number;
  avg_confidence: number;
  confidence_accuracy_correlation: number;
  overconfidence_score: number;
  factor_performance: Record<string, unknown>;
  best_sectors: string[];
  worst_sectors: string[];
  best_market_conditions: string[];
  worst_market_conditions: string[];
  key_learnings: string[];
  adjustments: string[];
}

export interface DBConsensus {
  id: string;
  ai_combination: AIModelName[];
  times_agreed: number;
  accuracy_rate: number;
  avg_return: number;
  accuracy_by_sector: Record<string, number>;
  last_updated: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getAIDisplayName(model: AIModelName): string {
  return AI_MODELS[model]?.displayName || model;
}

export function isValidAIModel(model: string): model is AIModelName {
  return model in AI_MODELS;
}

export function getFactorById(id: string): MarketFactor | undefined {
  return MARKET_FACTORS.find(f => f.id === id);
}

export function getFactorsByCategory(category: FactorCategory): MarketFactor[] {
  return MARKET_FACTORS.filter(f => f.category === category);
}
