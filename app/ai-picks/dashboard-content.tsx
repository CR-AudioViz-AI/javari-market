'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Brain, TrendingUp, TrendingDown, Minus, RefreshCw, 
  Target, Shield, Zap, BarChart3, Clock, Award,
  ChevronDown, ChevronUp, Sparkles, AlertCircle,
  Search, X, Info, Lightbulb, Star, ArrowRight,
  Eye, MessageCircle, HelpCircle, Flame
} from 'lucide-react';

// Types
interface AIPick {
  id: string;
  aiModel: string;
  symbol: string;
  companyName: string;
  sector: string;
  direction: 'UP' | 'DOWN' | 'HOLD';
  confidence: number;
  timeframe: string;
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
  thesis: string;
  fullReasoning: string;
  factorAssessments?: Array<{
    factorId: string;
    factorName: string;
    value: string;
    interpretation: string;
    confidence: number;
    reasoning: string;
  }>;
  keyBullishFactors: string[];
  keyBearishFactors: string[];
  risks: string[];
  catalysts: string[];
  status: string;
  actualReturn?: number;
  createdAt: string;
}

interface ConsensusData {
  symbol: string;
  consensusDirection: string;
  consensusStrength: number;
  weightedConfidence: number;
  javariConfidence: number;
  javariReasoning: string;
  aiPicks: { aiModel: string; direction: string; confidence: number }[];
}

interface StockAnalysis {
  symbol: string;
  companyName: string;
  sector: string;
  picks: AIPick[];
  consensus: ConsensusData | null;
}

// AI Model Colors & Config
const AI_CONFIG: Record<string, { color: string; gradient: string; name: string; description: string }> = {
  gpt4: { 
    color: '#10B981', 
    gradient: 'from-emerald-500 to-teal-600',
    name: 'GPT-4',
    description: 'Conservative, thorough analysis with deep reasoning'
  },
  perplexity: { 
    color: '#8B5CF6', 
    gradient: 'from-violet-500 to-purple-600',
    name: 'Perplexity',
    description: 'Real-time web data and breaking news integration'
  },
  claude: { 
    color: '#F59E0B', 
    gradient: 'from-amber-500 to-orange-600',
    name: 'Claude',
    description: 'Balanced analysis with strong risk awareness'
  },
  gemini: { 
    color: '#3B82F6', 
    gradient: 'from-blue-500 to-indigo-600',
    name: 'Gemini',
    description: 'Technical patterns and price target focus'
  },
};

// Direction Badge Component
function DirectionBadge({ direction, size = 'md' }: { direction: string; size?: 'sm' | 'md' | 'lg' }) {
  const config = {
    UP: { icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30' },
    DOWN: { icon: TrendingDown, color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30' },
    HOLD: { icon: Minus, color: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/30' },
  };
  const { icon: Icon, color, bg, border } = config[direction as keyof typeof config] || config.HOLD;
  const sizes = { sm: 'px-2 py-0.5 text-xs', md: 'px-3 py-1 text-sm', lg: 'px-4 py-1.5 text-base' };
  
  return (
    <span className={`inline-flex items-center gap-1.5 ${sizes[size]} ${bg} ${color} ${border} border rounded-full font-semibold`}>
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
      {direction}
    </span>
  );
}

// Confidence Meter Component
function ConfidenceMeter({ value, showLabel = true }: { value: number; showLabel?: boolean }) {
  const getColor = (v: number) => {
    if (v >= 70) return 'bg-emerald-500';
    if (v >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };
  
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
        <div 
          className={`h-full ${getColor(value)} transition-all duration-500`}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
      {showLabel && <span className="text-sm font-mono text-gray-300 w-12 text-right">{value.toFixed(0)}%</span>}
    </div>
  );
}

// Stock Card Component - Clickable to show all AI analyses
function StockCard({ 
  analysis, 
  onClick 
}: { 
  analysis: StockAnalysis; 
  onClick: () => void;
}) {
  const latestPick = analysis.picks[0];
  const aiCount = analysis.picks.length;
  const consensus = analysis.consensus;
  
  // Get unique directions
  const directions = analysis.picks.map(p => p.direction);
  const upVotes = directions.filter(d => d === 'UP').length;
  const downVotes = directions.filter(d => d === 'DOWN').length;
  const holdVotes = directions.filter(d => d === 'HOLD').length;
  
  return (
    <div 
      onClick={onClick}
      className="bg-gray-800/60 backdrop-blur border border-gray-700/50 rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/10 hover:scale-[1.02] group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-2xl font-bold text-white group-hover:text-amber-400 transition-colors">
              {analysis.symbol}
            </h3>
            {consensus && <DirectionBadge direction={consensus.consensusDirection} />}
          </div>
          <p className="text-sm text-gray-400">{latestPick?.companyName || analysis.symbol}</p>
          <p className="text-xs text-gray-500">{latestPick?.sector}</p>
        </div>
        
        {consensus && (
          <div className="text-right">
            <div className="text-3xl font-bold text-white">{consensus.javariConfidence?.toFixed(0)}%</div>
            <div className="text-xs text-amber-400">Javari Score</div>
          </div>
        )}
      </div>
      
      {/* AI Votes Summary */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-1">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <span className="text-sm text-emerald-400 font-semibold">{upVotes}</span>
        </div>
        <div className="flex items-center gap-1">
          <Minus className="w-4 h-4 text-amber-400" />
          <span className="text-sm text-amber-400 font-semibold">{holdVotes}</span>
        </div>
        <div className="flex items-center gap-1">
          <TrendingDown className="w-4 h-4 text-red-400" />
          <span className="text-sm text-red-400 font-semibold">{downVotes}</span>
        </div>
        <span className="text-xs text-gray-500 ml-auto">{aiCount} AI{aiCount > 1 ? 's' : ''} analyzed</span>
      </div>
      
      {/* AI Pills */}
      <div className="flex flex-wrap gap-2 mb-4">
        {analysis.picks.map(pick => {
          const config = AI_CONFIG[pick.aiModel] || AI_CONFIG.gpt4;
          return (
            <div 
              key={pick.id}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gradient-to-r ${config.gradient} bg-opacity-20`}
              style={{ backgroundColor: `${config.color}20` }}
            >
              <Brain className="w-3 h-3" style={{ color: config.color }} />
              <span className="text-xs font-medium text-white">{config.name}</span>
              <span className={`text-xs ${
                pick.direction === 'UP' ? 'text-emerald-400' : 
                pick.direction === 'DOWN' ? 'text-red-400' : 'text-amber-400'
              }`}>
                {pick.direction}
              </span>
            </div>
          );
        })}
      </div>
      
      {/* Thesis Preview */}
      {latestPick?.thesis && (
        <p className="text-sm text-gray-400 line-clamp-2 mb-3">{latestPick.thesis}</p>
      )}
      
      {/* View Details CTA */}
      <div className="flex items-center justify-center gap-2 text-amber-400 group-hover:text-amber-300 transition-colors">
        <Eye className="w-4 h-4" />
        <span className="text-sm font-medium">View All AI Analyses</span>
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  );
}

// Individual AI Analysis Panel
function AIAnalysisPanel({ pick }: { pick: AIPick }) {
  const config = AI_CONFIG[pick.aiModel] || AI_CONFIG.gpt4;
  const [showFull, setShowFull] = useState(false);
  
  return (
    <div className={`bg-gray-800/60 border border-gray-700/50 rounded-xl overflow-hidden`}>
      {/* AI Header */}
      <div className={`p-4 bg-gradient-to-r ${config.gradient} bg-opacity-10`} style={{ backgroundColor: `${config.color}15` }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${config.gradient} flex items-center justify-center`}>
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-bold text-white">{config.name}</h4>
              <p className="text-xs text-gray-400">{config.description}</p>
            </div>
          </div>
          <div className="text-right">
            <DirectionBadge direction={pick.direction} />
            <div className="mt-1 text-lg font-bold text-white">{pick.confidence}%</div>
          </div>
        </div>
      </div>
      
      {/* Price Targets */}
      <div className="p-4 border-b border-gray-700/50">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-900/50 rounded-lg p-3 text-center">
            <div className="text-xs text-gray-500 mb-1">Entry</div>
            <div className="text-lg font-semibold text-gray-300">${pick.entryPrice?.toFixed(2)}</div>
          </div>
          <div className="bg-emerald-500/10 rounded-lg p-3 text-center border border-emerald-500/20">
            <div className="text-xs text-emerald-400 mb-1">Target</div>
            <div className="text-lg font-semibold text-emerald-300">${pick.targetPrice?.toFixed(2)}</div>
            {pick.entryPrice && pick.targetPrice && (
              <div className="text-xs text-emerald-500">
                +{((pick.targetPrice - pick.entryPrice) / pick.entryPrice * 100).toFixed(1)}%
              </div>
            )}
          </div>
          <div className="bg-red-500/10 rounded-lg p-3 text-center border border-red-500/20">
            <div className="text-xs text-red-400 mb-1">Stop Loss</div>
            <div className="text-lg font-semibold text-red-300">${pick.stopLoss?.toFixed(2)}</div>
            {pick.entryPrice && pick.stopLoss && (
              <div className="text-xs text-red-500">
                {((pick.stopLoss - pick.entryPrice) / pick.entryPrice * 100).toFixed(1)}%
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Thesis */}
      <div className="p-4 border-b border-gray-700/50">
        <h5 className="text-sm font-semibold text-amber-400 mb-2 flex items-center gap-2">
          <Lightbulb className="w-4 h-4" /> {config.name}'s Thesis
        </h5>
        <p className="text-sm text-gray-300">{pick.thesis}</p>
      </div>
      
      {/* Full Reasoning (Expandable) */}
      <div className="p-4 border-b border-gray-700/50">
        <button 
          onClick={() => setShowFull(!showFull)}
          className="w-full flex items-center justify-between text-left"
        >
          <h5 className="text-sm font-semibold text-white flex items-center gap-2">
            <Brain className="w-4 h-4" /> Full Analysis from {config.name}
          </h5>
          {showFull ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>
        {showFull && (
          <div className="mt-3 p-3 bg-gray-900/50 rounded-lg">
            <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{pick.fullReasoning}</p>
          </div>
        )}
      </div>
      
      {/* Bullish/Bearish Factors */}
      <div className="p-4 grid md:grid-cols-2 gap-4">
        {pick.keyBullishFactors?.length > 0 && (
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3">
            <h5 className="text-sm font-semibold text-emerald-400 mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Bullish Factors
            </h5>
            <ul className="space-y-1.5">
              {pick.keyBullishFactors.map((factor, i) => (
                <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5">•</span>
                  {factor}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {pick.keyBearishFactors?.length > 0 && (
          <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-3">
            <h5 className="text-sm font-semibold text-red-400 mb-2 flex items-center gap-2">
              <TrendingDown className="w-4 h-4" /> Bearish Factors
            </h5>
            <ul className="space-y-1.5">
              {pick.keyBearishFactors.map((factor, i) => (
                <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">•</span>
                  {factor}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      {/* Risks & Catalysts */}
      {(pick.risks?.length > 0 || pick.catalysts?.length > 0) && (
        <div className="p-4 pt-0 grid md:grid-cols-2 gap-4">
          {pick.risks?.length > 0 && (
            <div>
              <h5 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-400" /> Risks Identified
              </h5>
              <ul className="space-y-1">
                {pick.risks.map((risk, i) => (
                  <li key={i} className="text-sm text-gray-400">• {risk}</li>
                ))}
              </ul>
            </div>
          )}
          
          {pick.catalysts?.length > 0 && (
            <div>
              <h5 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" /> Potential Catalysts
              </h5>
              <ul className="space-y-1">
                {pick.catalysts.map((catalyst, i) => (
                  <li key={i} className="text-sm text-gray-400">• {catalyst}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      
      {/* Timestamp */}
      <div className="px-4 pb-3 text-xs text-gray-500 flex items-center gap-1">
        <Clock className="w-3 h-3" />
        Analyzed {new Date(pick.createdAt).toLocaleDateString()} at {new Date(pick.createdAt).toLocaleTimeString()}
      </div>
    </div>
  );
}

// Stock Detail Modal
function StockDetailModal({ 
  analysis, 
  onClose 
}: { 
  analysis: StockAnalysis; 
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<string>('all');
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-700 flex items-center justify-between bg-gradient-to-r from-gray-800 to-gray-900">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-bold text-white">{analysis.symbol}</h2>
              {analysis.consensus && (
                <DirectionBadge direction={analysis.consensus.consensusDirection} size="lg" />
              )}
            </div>
            <p className="text-gray-400">{analysis.picks[0]?.companyName}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>
        
        {/* Javari Consensus (if exists) */}
        {analysis.consensus && (
          <div className="p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-b border-amber-500/20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-amber-400 font-semibold">Javari Consensus:</span>
                  <DirectionBadge direction={analysis.consensus.consensusDirection} />
                  <span className="text-white font-bold">{analysis.consensus.javariConfidence?.toFixed(0)}% confidence</span>
                </div>
                <p className="text-sm text-gray-300 mt-1">{analysis.consensus.javariReasoning}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Tabs */}
        <div className="flex border-b border-gray-700 px-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'all' 
                ? 'border-amber-500 text-amber-400' 
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            All AI Analyses ({analysis.picks.length})
          </button>
          {analysis.picks.map(pick => {
            const config = AI_CONFIG[pick.aiModel] || AI_CONFIG.gpt4;
            return (
              <button
                key={pick.id}
                onClick={() => setActiveTab(pick.aiModel)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
                  activeTab === pick.aiModel 
                    ? 'border-amber-500 text-amber-400' 
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <div className={`w-2 h-2 rounded-full`} style={{ backgroundColor: config.color }} />
                {config.name}
              </button>
            );
          })}
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTab === 'all' ? (
            analysis.picks.map(pick => (
              <AIAnalysisPanel key={pick.id} pick={pick} />
            ))
          ) : (
            analysis.picks
              .filter(p => p.aiModel === activeTab)
              .map(pick => (
                <AIAnalysisPanel key={pick.id} pick={pick} />
              ))
          )}
        </div>
      </div>
    </div>
  );
}

// Hot Picks Section
function HotPicksSection({ 
  analyses, 
  onSelect 
}: { 
  analyses: StockAnalysis[]; 
  onSelect: (analysis: StockAnalysis) => void;
}) {
  // Get hot picks - highest Javari confidence with UP direction
  const hotPicks = analyses
    .filter(a => a.consensus && a.consensus.javariConfidence >= 60 && a.consensus.consensusDirection === 'UP')
    .sort((a, b) => (b.consensus?.javariConfidence || 0) - (a.consensus?.javariConfidence || 0))
    .slice(0, 5);
  
  if (hotPicks.length === 0) return null;
  
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Flame className="w-5 h-5 text-orange-500" />
        <h2 className="text-xl font-bold text-white">Hot Picks</h2>
        <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full">
          High Confidence Bullish
        </span>
      </div>
      
      <div className="flex gap-4 overflow-x-auto pb-2">
        {hotPicks.map(analysis => (
          <div
            key={analysis.symbol}
            onClick={() => onSelect(analysis)}
            className="flex-shrink-0 w-48 bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/30 rounded-xl p-4 cursor-pointer hover:border-orange-500/60 transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg font-bold text-white">{analysis.symbol}</span>
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-orange-400 mb-1">
              {analysis.consensus?.javariConfidence?.toFixed(0)}%
            </div>
            <div className="text-xs text-gray-400">Javari Score</div>
            <div className="mt-2 text-xs text-gray-500">
              {analysis.picks.length} AI{analysis.picks.length > 1 ? 's' : ''} agree
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Help/Onboarding Panel
function HelpPanel({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-amber-400" />
            How Market Oracle Works
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Step 1 */}
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-amber-400 font-bold">1</span>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-1">Enter a Stock Symbol</h3>
              <p className="text-sm text-gray-400">
                Type any stock ticker (like AAPL, TSLA, NVDA) in the search box and click "Analyze". 
                The system fetches real-time market data for that stock.
              </p>
            </div>
          </div>
          
          {/* Step 2 */}
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-amber-400 font-bold">2</span>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-1">Four AIs Analyze Simultaneously</h3>
              <p className="text-sm text-gray-400 mb-2">
                Four leading AI models analyze the stock at the same time, each with different strengths:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(AI_CONFIG).map(([key, config]) => (
                  <div key={key} className="flex items-center gap-2 p-2 bg-gray-800 rounded-lg">
                    <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${config.gradient}`} />
                    <div>
                      <div className="text-sm text-white font-medium">{config.name}</div>
                      <div className="text-xs text-gray-500">{config.description.split(',')[0]}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Step 3 */}
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-amber-400 font-bold">3</span>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-1">Each AI Provides Detailed Analysis</h3>
              <p className="text-sm text-gray-400">
                Every AI gives you: Direction (UP/DOWN/HOLD), Confidence score, Price targets 
                (entry, target, stop-loss), Full reasoning, Bullish & bearish factors, 
                Risks and catalysts. Click any stock card to see each AI's individual analysis.
              </p>
            </div>
          </div>
          
          {/* Step 4 */}
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-amber-400 font-bold">4</span>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-1">Javari Builds Consensus</h3>
              <p className="text-sm text-gray-400">
                Our Javari AI weighs each model's prediction based on historical accuracy 
                and confidence to give you a single, unified verdict. High consensus = 
                more AIs agree. Use this for quick decisions, but always review individual analyses.
              </p>
            </div>
          </div>
          
          {/* Tips */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
            <h3 className="font-semibold text-amber-400 mb-2 flex items-center gap-2">
              <Lightbulb className="w-4 h-4" /> Pro Tips
            </h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>• <strong>Hot Picks</strong> shows stocks where Javari is most confident bullish</li>
              <li>• <strong>Click stock cards</strong> to see each AI's full reasoning</li>
              <li>• <strong>Compare AI opinions</strong> - when they disagree, dig deeper</li>
              <li>• <strong>Check risks</strong> - each AI identifies potential problems</li>
              <li>• <strong>Use tabs</strong> to filter by specific AI you trust most</li>
            </ul>
          </div>
          
          {/* Disclaimer */}
          <div className="bg-gray-800 rounded-xl p-4 text-xs text-gray-500">
            <strong>Disclaimer:</strong> Market Oracle provides AI-generated analysis for informational purposes only. 
            This is not financial advice. Always do your own research and consult a financial advisor 
            before making investment decisions. Past AI performance does not guarantee future results.
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Dashboard Component
export default function AIDashboardContent() {
  const searchParams = useSearchParams();
  const [symbol, setSymbol] = useState(searchParams.get('analyze') || '');
  const [loading, setLoading] = useState(false);
  const [analyses, setAnalyses] = useState<StockAnalysis[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<StockAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  
  // Group picks by symbol into analyses
  const groupPicksBySymbol = useCallback((picks: AIPick[], consensusData?: Record<string, ConsensusData>): StockAnalysis[] => {
    const grouped: Record<string, StockAnalysis> = {};
    
    for (const pick of picks) {
      if (!grouped[pick.symbol]) {
        grouped[pick.symbol] = {
          symbol: pick.symbol,
          companyName: pick.companyName,
          sector: pick.sector,
          picks: [],
          consensus: consensusData?.[pick.symbol] || null
        };
      }
      grouped[pick.symbol].picks.push(pick);
    }
    
    return Object.values(grouped).sort((a, b) => {
      const aTime = new Date(a.picks[0]?.createdAt || 0).getTime();
      const bTime = new Date(b.picks[0]?.createdAt || 0).getTime();
      return bTime - aTime;
    });
  }, []);
  
  // Load existing picks on mount
  useEffect(() => {
    const loadPicks = async () => {
      try {
        const res = await fetch('/api/ai-picks/generate?limit=50');
        if (res.ok) {
          const data = await res.json();
          if (data.picks && data.picks.length > 0) {
            // Fetch consensus data for these symbols
            const symbols = [...new Set(data.picks.map((p: AIPick) => p.symbol))];
            const consensusMap: Record<string, ConsensusData> = {};
            
            // For now, just use picks without consensus
            setAnalyses(groupPicksBySymbol(data.picks, consensusMap));
          }
        }
      } catch (err) {
        console.error('Failed to load picks:', err);
      }
    };
    loadPicks();
  }, [groupPicksBySymbol]);
  
  // Auto-analyze if URL has ?analyze=SYMBOL
  useEffect(() => {
    const analyzeSymbol = searchParams.get('analyze');
    if (analyzeSymbol && analyzeSymbol !== symbol) {
      setSymbol(analyzeSymbol);
      handleAnalyze(analyzeSymbol);
    }
  }, [searchParams]);
  
  const handleAnalyze = async (sym?: string) => {
    const targetSymbol = (sym || symbol).toUpperCase().trim();
    if (!targetSymbol) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch('/api/ai-picks/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: targetSymbol })
      });
      
      const data = await res.json();
      
      if (!data.success) {
        setError(data.error || 'Failed to analyze stock');
        return;
      }
      
      // Create new analysis from response
      const newAnalysis: StockAnalysis = {
        symbol: targetSymbol,
        companyName: data.picks?.[0]?.companyName || targetSymbol,
        sector: data.picks?.[0]?.sector || 'Unknown',
        picks: data.picks || [],
        consensus: data.consensus || null
      };
      
      // Add to analyses (or update existing)
      setAnalyses(prev => {
        const filtered = prev.filter(a => a.symbol !== targetSymbol);
        return [newAnalysis, ...filtered];
      });
      
      // Auto-open the detail modal
      setSelectedAnalysis(newAnalysis);
      
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
      {/* Header */}
      <header className="bg-gray-900/80 backdrop-blur-xl border-b border-gray-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Market Oracle</h1>
                <p className="text-xs text-gray-400">Multi-AI Stock Analysis</p>
              </div>
            </div>
            
            <button
              onClick={() => setShowHelp(true)}
              className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <span className="text-sm text-gray-300">How It Works</span>
            </button>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Search Section */}
        <div className="mb-8">
          <div className="max-w-xl mx-auto">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                  placeholder="Enter stock symbol (e.g., AAPL, TSLA, NVDA)"
                  className="w-full pl-12 pr-4 py-4 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none text-lg"
                />
              </div>
              <button
                onClick={() => handleAnalyze()}
                disabled={loading || !symbol.trim()}
                className="px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-amber-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Zap className="w-5 h-5" />
                )}
                {loading ? 'Analyzing...' : 'Analyze'}
              </button>
            </div>
            
            {error && (
              <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span className="text-sm text-red-400">{error}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Hot Picks */}
        <HotPicksSection analyses={analyses} onSelect={setSelectedAnalysis} />
        
        {/* All Analyses */}
        {analyses.length > 0 ? (
          <div>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-amber-400" />
              Recent Analyses
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analyses.map(analysis => (
                <StockCard 
                  key={analysis.symbol} 
                  analysis={analysis}
                  onClick={() => setSelectedAnalysis(analysis)}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
              <Search className="w-10 h-10 text-gray-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No analyses yet</h3>
            <p className="text-gray-500 mb-4">Enter a stock symbol above to get started</p>
            <button
              onClick={() => setShowHelp(true)}
              className="text-amber-400 hover:text-amber-300 text-sm"
            >
              Learn how Market Oracle works →
            </button>
          </div>
        )}
      </main>
      
      {/* Detail Modal */}
      {selectedAnalysis && (
        <StockDetailModal 
          analysis={selectedAnalysis} 
          onClose={() => setSelectedAnalysis(null)} 
        />
      )}
      
      {/* Help Panel */}
      {showHelp && <HelpPanel onClose={() => setShowHelp(false)} />}
    </div>
  );
}


