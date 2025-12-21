// lib/types/ai-models.ts
// Market Oracle - Enhanced AI Models Configuration
// Created: December 21, 2025
// Tiered Competition System with 15+ AI Providers

// ============================================================================
// AI TIER DEFINITIONS
// ============================================================================

export type AITier = 'small' | 'medium' | 'large' | 'javari';

export interface AITierConfig {
  id: AITier;
  name: string;
  displayName: string;
  description: string;
  icon: string; // emoji
  color: string; // tailwind color
  gradient: string; // tailwind gradient
  minModels: number;
  maxModels: number;
}

export const AI_TIERS: Record<AITier, AITierConfig> = {
  small: {
    id: 'small',
    name: 'Small',
    displayName: '🥉 Small Tier',
    description: 'Fast, cost-efficient models for quick analysis',
    icon: '🥉',
    color: 'amber',
    gradient: 'from-amber-500 to-yellow-600',
    minModels: 4,
    maxModels: 8,
  },
  medium: {
    id: 'medium',
    name: 'Medium',
    displayName: '🥈 Medium Tier',
    description: 'Balanced models with strong reasoning',
    icon: '🥈',
    color: 'slate',
    gradient: 'from-slate-400 to-gray-500',
    minModels: 4,
    maxModels: 8,
  },
  large: {
    id: 'large',
    name: 'Large',
    displayName: '🥇 Large Tier',
    description: 'Premium flagship models for deep analysis',
    icon: '🥇',
    color: 'yellow',
    gradient: 'from-yellow-400 to-amber-500',
    minModels: 4,
    maxModels: 8,
  },
  javari: {
    id: 'javari',
    name: 'Javari',
    displayName: '🏆 Javari Prime',
    description: 'Multi-AI consensus engine - competes in ALL tiers',
    icon: '🏆',
    color: 'cyan',
    gradient: 'from-cyan-500 to-teal-600',
    minModels: 1,
    maxModels: 1,
  },
};

// ============================================================================
// AI PROVIDER DEFINITIONS
// ============================================================================

export type AIProvider = 
  | 'openai' 
  | 'anthropic' 
  | 'google' 
  | 'perplexity' 
  | 'groq' 
  | 'huggingface'
  | 'mistral'
  | 'xai'
  | 'cohere'
  | 'together'
  | 'fireworks';

export interface AIProviderConfig {
  id: AIProvider;
  name: string;
  displayName: string;
  website: string;
  apiKeyEnv: string;
  baseUrl: string;
  description: string;
  costTier: 'free' | 'low' | 'medium' | 'high';
  rateLimits: {
    requestsPerMinute: number;
    requestsPerDay: number;
  };
  features: string[];
  enabled: boolean;
}

export const AI_PROVIDERS: Record<AIProvider, AIProviderConfig> = {
  openai: {
    id: 'openai',
    name: 'OpenAI',
    displayName: 'OpenAI',
    website: 'https://openai.com',
    apiKeyEnv: 'OPENAI_API_KEY',
    baseUrl: 'https://api.openai.com/v1',
    description: 'Industry-leading AI models including GPT-4',
    costTier: 'high',
    rateLimits: { requestsPerMinute: 60, requestsPerDay: 10000 },
    features: ['Chat', 'Vision', 'Function calling', 'JSON mode'],
    enabled: true,
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    displayName: 'Anthropic',
    website: 'https://anthropic.com',
    apiKeyEnv: 'ANTHROPIC_API_KEY',
    baseUrl: 'https://api.anthropic.com/v1',
    description: 'Claude models with strong reasoning and safety',
    costTier: 'high',
    rateLimits: { requestsPerMinute: 60, requestsPerDay: 10000 },
    features: ['Chat', 'Vision', 'Long context', 'Tool use'],
    enabled: true,
  },
  google: {
    id: 'google',
    name: 'Google',
    displayName: 'Google AI',
    website: 'https://ai.google.dev',
    apiKeyEnv: 'GEMINI_API_KEY',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    description: 'Gemini models with multimodal capabilities',
    costTier: 'medium',
    rateLimits: { requestsPerMinute: 60, requestsPerDay: 1500 },
    features: ['Chat', 'Vision', 'Long context', 'Grounding'],
    enabled: true,
  },
  perplexity: {
    id: 'perplexity',
    name: 'Perplexity',
    displayName: 'Perplexity AI',
    website: 'https://perplexity.ai',
    apiKeyEnv: 'PERPLEXITY_API_KEY',
    baseUrl: 'https://api.perplexity.ai',
    description: 'Real-time web search integrated AI',
    costTier: 'medium',
    rateLimits: { requestsPerMinute: 20, requestsPerDay: 5000 },
    features: ['Chat', 'Web search', 'Citations', 'Real-time data'],
    enabled: true,
  },
  groq: {
    id: 'groq',
    name: 'Groq',
    displayName: 'Groq',
    website: 'https://groq.com',
    apiKeyEnv: 'GROQ_API_KEY',
    baseUrl: 'https://api.groq.com/openai/v1',
    description: 'Ultra-fast inference with LPU technology - FREE TIER',
    costTier: 'free',
    rateLimits: { requestsPerMinute: 30, requestsPerDay: 14400 },
    features: ['Chat', 'Fast inference', 'OpenAI compatible'],
    enabled: true,
  },
  huggingface: {
    id: 'huggingface',
    name: 'Hugging Face',
    displayName: 'Hugging Face',
    website: 'https://huggingface.co',
    apiKeyEnv: 'HUGGINGFACE_API_KEY',
    baseUrl: 'https://api-inference.huggingface.co',
    description: 'Open source models including FinBERT - FREE TIER',
    costTier: 'free',
    rateLimits: { requestsPerMinute: 30, requestsPerDay: 10000 },
    features: ['Chat', 'Embeddings', 'Sentiment', 'Classification'],
    enabled: true,
  },
  mistral: {
    id: 'mistral',
    name: 'Mistral',
    displayName: 'Mistral AI',
    website: 'https://mistral.ai',
    apiKeyEnv: 'MISTRAL_API_KEY',
    baseUrl: 'https://api.mistral.ai/v1',
    description: 'European AI leader - 70% cheaper than GPT-4',
    costTier: 'low',
    rateLimits: { requestsPerMinute: 60, requestsPerDay: 10000 },
    features: ['Chat', 'Function calling', 'JSON mode', 'Code'],
    enabled: false, // Needs API key
  },
  xai: {
    id: 'xai',
    name: 'xAI',
    displayName: 'xAI (Grok)',
    website: 'https://x.ai',
    apiKeyEnv: 'XAI_API_KEY',
    baseUrl: 'https://api.x.ai/v1',
    description: 'Grok model with real-time X/Twitter data',
    costTier: 'medium',
    rateLimits: { requestsPerMinute: 60, requestsPerDay: 10000 },
    features: ['Chat', 'Real-time social data', 'Sentiment'],
    enabled: false, // Needs API key
  },
  cohere: {
    id: 'cohere',
    name: 'Cohere',
    displayName: 'Cohere',
    website: 'https://cohere.com',
    apiKeyEnv: 'COHERE_API_KEY',
    baseUrl: 'https://api.cohere.ai/v1',
    description: 'Enterprise RAG and knowledge retrieval',
    costTier: 'medium',
    rateLimits: { requestsPerMinute: 100, requestsPerDay: 10000 },
    features: ['Chat', 'RAG', 'Embeddings', 'Rerank'],
    enabled: false, // Needs API key
  },
  together: {
    id: 'together',
    name: 'Together',
    displayName: 'Together AI',
    website: 'https://together.ai',
    apiKeyEnv: 'TOGETHER_API_KEY',
    baseUrl: 'https://api.together.xyz/v1',
    description: '50+ open source models for cost optimization',
    costTier: 'low',
    rateLimits: { requestsPerMinute: 60, requestsPerDay: 10000 },
    features: ['Chat', 'OpenAI compatible', 'Open source models'],
    enabled: false, // Needs API key
  },
  fireworks: {
    id: 'fireworks',
    name: 'Fireworks',
    displayName: 'Fireworks AI',
    website: 'https://fireworks.ai',
    apiKeyEnv: 'FIREWORKS_API_KEY',
    baseUrl: 'https://api.fireworks.ai/inference/v1',
    description: 'Fastest inference speeds for low latency',
    costTier: 'low',
    rateLimits: { requestsPerMinute: 100, requestsPerDay: 10000 },
    features: ['Chat', 'Fast inference', 'OpenAI compatible'],
    enabled: false, // Needs API key
  },
};

// ============================================================================
// AI MODEL DEFINITIONS (Individual Models)
// ============================================================================

export type AIModelId = 
  // OpenAI
  | 'gpt-4-turbo'
  | 'gpt-4o'
  | 'gpt-4o-mini'
  // Anthropic
  | 'claude-opus'
  | 'claude-sonnet'
  | 'claude-haiku'
  // Google
  | 'gemini-pro'
  | 'gemini-flash'
  // Perplexity
  | 'sonar-pro'
  | 'sonar'
  // Groq (FREE)
  | 'groq-llama-70b'
  | 'groq-llama-8b'
  | 'groq-mixtral'
  // Hugging Face (FREE)
  | 'finbert'
  // Mistral
  | 'mistral-large'
  | 'mistral-medium'
  | 'mistral-small'
  // xAI
  | 'grok-2'
  | 'grok-1'
  // Cohere
  | 'command-r-plus'
  | 'command-r'
  // Javari
  | 'javari-prime';

export interface AIModelConfig {
  id: AIModelId;
  provider: AIProvider;
  tier: AITier;
  name: string;
  displayName: string;
  modelString: string; // Actual model string for API calls
  description: string;
  personality: string; // Trading personality
  tradingStyle: 'conservative' | 'balanced' | 'aggressive' | 'momentum' | 'value' | 'technical' | 'fundamental' | 'news-driven' | 'consensus';
  strengths: string[];
  weaknesses: string[];
  avatar: string; // Avatar emoji or icon
  color: string; // Brand color
  contextWindow: number;
  maxOutputTokens: number;
  costPer1kTokens: { input: number; output: number };
  enabled: boolean;
  supportsVision: boolean;
  supportsStreaming: boolean;
  supportsJSON: boolean;
}

export const AI_MODELS: Record<AIModelId, AIModelConfig> = {
  // ============================================================================
  // LARGE TIER - Premium Flagship Models
  // ============================================================================
  'gpt-4-turbo': {
    id: 'gpt-4-turbo',
    provider: 'openai',
    tier: 'large',
    name: 'GPT-4 Turbo',
    displayName: 'Oracle GPT',
    modelString: 'gpt-4-turbo-preview',
    description: 'OpenAI flagship with superior reasoning',
    personality: 'Methodical strategist who values precision over speed',
    tradingStyle: 'balanced',
    strengths: ['Complex reasoning', 'Pattern recognition', 'Risk assessment', 'Long-term analysis'],
    weaknesses: ['Can be overly cautious', 'Slower response times'],
    avatar: '🔮',
    color: '#10A37F',
    contextWindow: 128000,
    maxOutputTokens: 4096,
    costPer1kTokens: { input: 0.01, output: 0.03 },
    enabled: true,
    supportsVision: true,
    supportsStreaming: true,
    supportsJSON: true,
  },
  'claude-opus': {
    id: 'claude-opus',
    provider: 'anthropic',
    tier: 'large',
    name: 'Claude Opus',
    displayName: 'Claude Sage',
    modelString: 'claude-3-opus-20240229',
    description: 'Anthropic flagship with deepest analysis',
    personality: 'Thoughtful researcher who digs deep into fundamentals',
    tradingStyle: 'conservative',
    strengths: ['Fundamental analysis', 'Risk identification', 'Long-form reasoning', 'Nuanced takes'],
    weaknesses: ['Can miss momentum plays', 'Overly risk-averse'],
    avatar: '🧠',
    color: '#D4A574',
    contextWindow: 200000,
    maxOutputTokens: 4096,
    costPer1kTokens: { input: 0.015, output: 0.075 },
    enabled: true,
    supportsVision: true,
    supportsStreaming: true,
    supportsJSON: true,
  },
  'gemini-pro': {
    id: 'gemini-pro',
    provider: 'google',
    tier: 'large',
    name: 'Gemini 2.5 Pro',
    displayName: 'Gemini Titan',
    modelString: 'gemini-2.5-pro-preview-06-05',
    description: 'Google flagship with 1M context window',
    personality: 'Data-driven analyst who processes massive information',
    tradingStyle: 'technical',
    strengths: ['Pattern recognition', 'Technical analysis', 'Multi-source synthesis', 'Sector analysis'],
    weaknesses: ['Can overfit to patterns', 'Less intuitive picks'],
    avatar: '💎',
    color: '#4285F4',
    contextWindow: 1000000,
    maxOutputTokens: 8192,
    costPer1kTokens: { input: 0.00125, output: 0.005 },
    enabled: true,
    supportsVision: true,
    supportsStreaming: true,
    supportsJSON: true,
  },
  'sonar-pro': {
    id: 'sonar-pro',
    provider: 'perplexity',
    tier: 'large',
    name: 'Sonar Pro',
    displayName: 'Perplexity Pro',
    modelString: 'sonar-pro',
    description: 'Real-time web intelligence with citations',
    personality: 'News hound who catches breaking stories first',
    tradingStyle: 'news-driven',
    strengths: ['Breaking news', 'Real-time sentiment', 'Event-driven picks', 'Current data'],
    weaknesses: ['Can overreact to news', 'Short-term focus'],
    avatar: '📡',
    color: '#20B2AA',
    contextWindow: 127000,
    maxOutputTokens: 4096,
    costPer1kTokens: { input: 0.003, output: 0.015 },
    enabled: true,
    supportsVision: false,
    supportsStreaming: true,
    supportsJSON: true,
  },
  'mistral-large': {
    id: 'mistral-large',
    provider: 'mistral',
    tier: 'large',
    name: 'Mistral Large',
    displayName: 'Mistral Master',
    modelString: 'mistral-large-latest',
    description: 'European powerhouse with excellent reasoning',
    personality: 'Efficient analyst who delivers precise insights',
    tradingStyle: 'balanced',
    strengths: ['Efficient analysis', 'Code generation', 'Multilingual', 'Cost-effective'],
    weaknesses: ['Smaller training data', 'Less real-time knowledge'],
    avatar: '🌊',
    color: '#FF7000',
    contextWindow: 128000,
    maxOutputTokens: 4096,
    costPer1kTokens: { input: 0.002, output: 0.006 },
    enabled: false,
    supportsVision: false,
    supportsStreaming: true,
    supportsJSON: true,
  },
  'grok-2': {
    id: 'grok-2',
    provider: 'xai',
    tier: 'large',
    name: 'Grok 2',
    displayName: 'Grok Alpha',
    modelString: 'grok-2-latest',
    description: 'Real-time social sentiment from X/Twitter',
    personality: 'Witty contrarian who reads social sentiment',
    tradingStyle: 'momentum',
    strengths: ['Social sentiment', 'Meme stock detection', 'Trend spotting', 'Real-time X data'],
    weaknesses: ['Can be influenced by noise', 'Occasional humor in serious picks'],
    avatar: '🚀',
    color: '#1DA1F2',
    contextWindow: 131072,
    maxOutputTokens: 4096,
    costPer1kTokens: { input: 0.005, output: 0.015 },
    enabled: false,
    supportsVision: true,
    supportsStreaming: true,
    supportsJSON: true,
  },
  'command-r-plus': {
    id: 'command-r-plus',
    provider: 'cohere',
    tier: 'large',
    name: 'Command R+',
    displayName: 'Cohere Commander',
    modelString: 'command-r-plus',
    description: 'Enterprise RAG with superior retrieval',
    personality: 'Research librarian who finds every relevant document',
    tradingStyle: 'fundamental',
    strengths: ['Document analysis', 'RAG capabilities', 'Citation accuracy', 'Enterprise data'],
    weaknesses: ['Less creative', 'Requires good context'],
    avatar: '📚',
    color: '#39594D',
    contextWindow: 128000,
    maxOutputTokens: 4096,
    costPer1kTokens: { input: 0.003, output: 0.015 },
    enabled: false,
    supportsVision: false,
    supportsStreaming: true,
    supportsJSON: true,
  },

  // ============================================================================
  // MEDIUM TIER - Balanced Models
  // ============================================================================
  'gpt-4o': {
    id: 'gpt-4o',
    provider: 'openai',
    tier: 'medium',
    name: 'GPT-4o',
    displayName: 'GPT Balanced',
    modelString: 'gpt-4o',
    description: 'Optimized GPT-4 with speed and quality balance',
    personality: 'Versatile analyst with quick turnaround',
    tradingStyle: 'balanced',
    strengths: ['Speed', 'Multi-modal', 'Cost-effective', 'Reliable'],
    weaknesses: ['Not as deep as Turbo', 'Can miss nuance'],
    avatar: '⚡',
    color: '#10A37F',
    contextWindow: 128000,
    maxOutputTokens: 4096,
    costPer1kTokens: { input: 0.005, output: 0.015 },
    enabled: true,
    supportsVision: true,
    supportsStreaming: true,
    supportsJSON: true,
  },
  'claude-sonnet': {
    id: 'claude-sonnet',
    provider: 'anthropic',
    tier: 'medium',
    name: 'Claude Sonnet',
    displayName: 'Claude Analyst',
    modelString: 'claude-3-5-sonnet-20241022',
    description: 'Balanced Claude with strong coding and analysis',
    personality: 'Diligent analyst who catches what others miss',
    tradingStyle: 'value',
    strengths: ['Risk awareness', 'Balanced views', 'Good documentation', 'Consistent'],
    weaknesses: ['Can be overly cautious', 'Moderate speed'],
    avatar: '🎯',
    color: '#D4A574',
    contextWindow: 200000,
    maxOutputTokens: 8192,
    costPer1kTokens: { input: 0.003, output: 0.015 },
    enabled: true,
    supportsVision: true,
    supportsStreaming: true,
    supportsJSON: true,
  },
  'groq-llama-70b': {
    id: 'groq-llama-70b',
    provider: 'groq',
    tier: 'medium',
    name: 'Llama 3.1 70B',
    displayName: 'Llama Speedster',
    modelString: 'llama-3.1-70b-versatile',
    description: 'Ultra-fast open source powerhouse - FREE',
    personality: 'Speed demon who delivers quick analysis',
    tradingStyle: 'momentum',
    strengths: ['Blazing fast', 'Free tier', 'Good reasoning', 'Open source'],
    weaknesses: ['Less refined', 'No real-time data'],
    avatar: '🦙',
    color: '#0066FF',
    contextWindow: 131072,
    maxOutputTokens: 8000,
    costPer1kTokens: { input: 0, output: 0 },
    enabled: true,
    supportsVision: false,
    supportsStreaming: true,
    supportsJSON: true,
  },
  'sonar': {
    id: 'sonar',
    provider: 'perplexity',
    tier: 'medium',
    name: 'Sonar',
    displayName: 'Perplexity Scout',
    modelString: 'sonar',
    description: 'Real-time search with web citations',
    personality: 'Scout who finds relevant news and data',
    tradingStyle: 'news-driven',
    strengths: ['Web search', 'Current events', 'Citations', 'Fast'],
    weaknesses: ['Less deep analysis', 'Can follow crowd'],
    avatar: '🔍',
    color: '#20B2AA',
    contextWindow: 127000,
    maxOutputTokens: 4096,
    costPer1kTokens: { input: 0.001, output: 0.001 },
    enabled: true,
    supportsVision: false,
    supportsStreaming: true,
    supportsJSON: true,
  },
  'mistral-medium': {
    id: 'mistral-medium',
    provider: 'mistral',
    tier: 'medium',
    name: 'Mistral Medium',
    displayName: 'Mistral Balanced',
    modelString: 'mistral-medium-latest',
    description: 'Well-rounded European model',
    personality: 'Efficient European analyst',
    tradingStyle: 'balanced',
    strengths: ['Cost-effective', 'Good reasoning', 'Fast', 'Reliable'],
    weaknesses: ['Less creative', 'Smaller knowledge base'],
    avatar: '🌀',
    color: '#FF7000',
    contextWindow: 32000,
    maxOutputTokens: 4096,
    costPer1kTokens: { input: 0.0027, output: 0.0081 },
    enabled: false,
    supportsVision: false,
    supportsStreaming: true,
    supportsJSON: true,
  },
  'grok-1': {
    id: 'grok-1',
    provider: 'xai',
    tier: 'medium',
    name: 'Grok 1',
    displayName: 'Grok Scout',
    modelString: 'grok-1',
    description: 'Social media intelligence from X',
    personality: 'Social media native who spots trends',
    tradingStyle: 'momentum',
    strengths: ['Social trends', 'Meme stocks', 'Real-time sentiment'],
    weaknesses: ['Can be noisy', 'Humor can distract'],
    avatar: '📱',
    color: '#1DA1F2',
    contextWindow: 8192,
    maxOutputTokens: 4096,
    costPer1kTokens: { input: 0.001, output: 0.002 },
    enabled: false,
    supportsVision: false,
    supportsStreaming: true,
    supportsJSON: true,
  },
  'command-r': {
    id: 'command-r',
    provider: 'cohere',
    tier: 'medium',
    name: 'Command R',
    displayName: 'Cohere Analyst',
    modelString: 'command-r',
    description: 'RAG-optimized analysis model',
    personality: 'Document specialist who retrieves key info',
    tradingStyle: 'fundamental',
    strengths: ['Document analysis', 'RAG', 'Citations'],
    weaknesses: ['Less creative', 'Needs good context'],
    avatar: '📋',
    color: '#39594D',
    contextWindow: 128000,
    maxOutputTokens: 4096,
    costPer1kTokens: { input: 0.0005, output: 0.0015 },
    enabled: false,
    supportsVision: false,
    supportsStreaming: true,
    supportsJSON: true,
  },

  // ============================================================================
  // SMALL TIER - Fast & Cost-Efficient
  // ============================================================================
  'gpt-4o-mini': {
    id: 'gpt-4o-mini',
    provider: 'openai',
    tier: 'small',
    name: 'GPT-4o Mini',
    displayName: 'GPT Swift',
    modelString: 'gpt-4o-mini',
    description: 'Smallest GPT-4 class model - fast and cheap',
    personality: 'Quick thinker for rapid decisions',
    tradingStyle: 'momentum',
    strengths: ['Very fast', 'Cheap', 'Good for quick takes'],
    weaknesses: ['Less nuanced', 'Shorter context'],
    avatar: '⚡',
    color: '#10A37F',
    contextWindow: 128000,
    maxOutputTokens: 16384,
    costPer1kTokens: { input: 0.00015, output: 0.0006 },
    enabled: true,
    supportsVision: true,
    supportsStreaming: true,
    supportsJSON: true,
  },
  'claude-haiku': {
    id: 'claude-haiku',
    provider: 'anthropic',
    tier: 'small',
    name: 'Claude Haiku',
    displayName: 'Claude Swift',
    modelString: 'claude-3-haiku-20240307',
    description: 'Fastest Claude for quick analysis',
    personality: 'Concise analyst who cuts to the chase',
    tradingStyle: 'balanced',
    strengths: ['Very fast', 'Cost-effective', 'Concise'],
    weaknesses: ['Less depth', 'Basic reasoning'],
    avatar: '🎋',
    color: '#D4A574',
    contextWindow: 200000,
    maxOutputTokens: 4096,
    costPer1kTokens: { input: 0.00025, output: 0.00125 },
    enabled: true,
    supportsVision: true,
    supportsStreaming: true,
    supportsJSON: true,
  },
  'gemini-flash': {
    id: 'gemini-flash',
    provider: 'google',
    tier: 'small',
    name: 'Gemini 2.0 Flash',
    displayName: 'Gemini Flash',
    modelString: 'gemini-2.0-flash',
    description: 'Fast Gemini for quick technical analysis',
    personality: 'Speed-focused technical scanner',
    tradingStyle: 'technical',
    strengths: ['Fast', 'Vision capable', 'Good for charts'],
    weaknesses: ['Less nuanced', 'Basic fundamentals'],
    avatar: '⚡',
    color: '#4285F4',
    contextWindow: 1000000,
    maxOutputTokens: 8192,
    costPer1kTokens: { input: 0.00035, output: 0.0015 },
    enabled: true,
    supportsVision: true,
    supportsStreaming: true,
    supportsJSON: true,
  },
  'groq-llama-8b': {
    id: 'groq-llama-8b',
    provider: 'groq',
    tier: 'small',
    name: 'Llama 3.1 8B',
    displayName: 'Llama Quick',
    modelString: 'llama-3.1-8b-instant',
    description: 'Lightning fast small model - FREE',
    personality: 'Ultra-fast basic analyst',
    tradingStyle: 'momentum',
    strengths: ['Fastest response', 'Free', 'Basic analysis'],
    weaknesses: ['Limited reasoning', 'Basic output'],
    avatar: '🦙',
    color: '#0066FF',
    contextWindow: 131072,
    maxOutputTokens: 8000,
    costPer1kTokens: { input: 0, output: 0 },
    enabled: true,
    supportsVision: false,
    supportsStreaming: true,
    supportsJSON: true,
  },
  'groq-mixtral': {
    id: 'groq-mixtral',
    provider: 'groq',
    tier: 'small',
    name: 'Mixtral 8x7B',
    displayName: 'Mixtral Mix',
    modelString: 'mixtral-8x7b-32768',
    description: 'MoE model for diverse perspectives - FREE',
    personality: 'Multi-perspective quick analyst',
    tradingStyle: 'balanced',
    strengths: ['Fast', 'Free', 'Good variety'],
    weaknesses: ['Inconsistent', 'Less focused'],
    avatar: '🎰',
    color: '#0066FF',
    contextWindow: 32768,
    maxOutputTokens: 8000,
    costPer1kTokens: { input: 0, output: 0 },
    enabled: true,
    supportsVision: false,
    supportsStreaming: true,
    supportsJSON: true,
  },
  'mistral-small': {
    id: 'mistral-small',
    provider: 'mistral',
    tier: 'small',
    name: 'Mistral Small',
    displayName: 'Mistral Quick',
    modelString: 'mistral-small-latest',
    description: 'Fast European model for quick picks',
    personality: 'Efficient quick scanner',
    tradingStyle: 'momentum',
    strengths: ['Very cheap', 'Fast', 'Reliable'],
    weaknesses: ['Basic analysis', 'Limited depth'],
    avatar: '💨',
    color: '#FF7000',
    contextWindow: 32000,
    maxOutputTokens: 4096,
    costPer1kTokens: { input: 0.0002, output: 0.0006 },
    enabled: false,
    supportsVision: false,
    supportsStreaming: true,
    supportsJSON: true,
  },
  'finbert': {
    id: 'finbert',
    provider: 'huggingface',
    tier: 'small',
    name: 'FinBERT',
    displayName: 'FinBERT Sentiment',
    modelString: 'ProsusAI/finbert',
    description: 'Financial sentiment analysis - FREE',
    personality: 'Sentiment specialist reading market mood',
    tradingStyle: 'news-driven',
    strengths: ['Financial sentiment', 'Free', 'Specialized'],
    weaknesses: ['Only sentiment', 'No full analysis'],
    avatar: '📊',
    color: '#FFD21E',
    contextWindow: 512,
    maxOutputTokens: 1,
    costPer1kTokens: { input: 0, output: 0 },
    enabled: true,
    supportsVision: false,
    supportsStreaming: false,
    supportsJSON: false,
  },

  // ============================================================================
  // JAVARI - Meta-Learner (Competes in ALL tiers)
  // ============================================================================
  'javari-prime': {
    id: 'javari-prime',
    provider: 'anthropic',
    tier: 'javari',
    name: 'Javari Prime',
    displayName: 'Javari Prime',
    modelString: 'claude-3-5-sonnet-20241022', // Uses Sonnet under the hood
    description: 'Ultimate synthesizer - weighted consensus across all AI picks',
    personality: 'Master strategist who synthesizes all perspectives into optimal decisions',
    tradingStyle: 'consensus',
    strengths: ['Multi-AI consensus', 'Adaptive weighting', 'Historical learning', 'Best of all worlds'],
    weaknesses: ['Depends on other AIs', 'Can be slow with many inputs'],
    avatar: '🏆',
    color: '#06B6D4',
    contextWindow: 200000,
    maxOutputTokens: 8192,
    costPer1kTokens: { input: 0.003, output: 0.015 },
    enabled: true,
    supportsVision: true,
    supportsStreaming: true,
    supportsJSON: true,
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getModelsByTier(tier: AITier): AIModelConfig[] {
  return Object.values(AI_MODELS).filter(m => m.tier === tier && m.enabled);
}

export function getModelsByProvider(provider: AIProvider): AIModelConfig[] {
  return Object.values(AI_MODELS).filter(m => m.provider === provider);
}

export function getEnabledModels(): AIModelConfig[] {
  return Object.values(AI_MODELS).filter(m => m.enabled);
}

export function getEnabledModelsByTier(tier: AITier): AIModelConfig[] {
  return Object.values(AI_MODELS).filter(m => m.tier === tier && m.enabled);
}

export function getModelById(id: AIModelId): AIModelConfig | undefined {
  return AI_MODELS[id];
}

export function getTierConfig(tier: AITier): AITierConfig {
  return AI_TIERS[tier];
}

export function getProviderConfig(provider: AIProvider): AIProviderConfig {
  return AI_PROVIDERS[provider];
}

export function isModelEnabled(id: AIModelId): boolean {
  return AI_MODELS[id]?.enabled ?? false;
}

export function getModelDisplayName(id: AIModelId): string {
  return AI_MODELS[id]?.displayName ?? id;
}

export function getModelAvatar(id: AIModelId): string {
  return AI_MODELS[id]?.avatar ?? '🤖';
}

export function getModelColor(id: AIModelId): string {
  return AI_MODELS[id]?.color ?? '#6B7280';
}

// Get all models for competition (excluding javari from tier counts)
export function getCompetitionModels(): AIModelConfig[] {
  return Object.values(AI_MODELS).filter(m => m.enabled && m.tier !== 'javari');
}

// Get Javari specifically
export function getJavariModel(): AIModelConfig {
  return AI_MODELS['javari-prime'];
}

// Calculate estimated cost for a request
export function estimateRequestCost(modelId: AIModelId, inputTokens: number, outputTokens: number): number {
  const model = AI_MODELS[modelId];
  if (!model) return 0;
  return (inputTokens / 1000 * model.costPer1kTokens.input) + 
         (outputTokens / 1000 * model.costPer1kTokens.output);
}
