// app/learn/page.tsx
// Comprehensive training center for Market Oracle

'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  GraduationCap, BookOpen, Brain, Target, BarChart3, 
  TrendingUp, TrendingDown, Shield, Zap, Award,
  ChevronDown, ChevronRight, Play, Clock, CheckCircle,
  Lightbulb, AlertTriangle, DollarSign, Bot
} from 'lucide-react';

interface Module {
  id: string;
  title: string;
  description: string;
  duration: string;
  lessons: Lesson[];
  icon: React.ReactNode;
}

interface Lesson {
  id: string;
  title: string;
  content: string;
  keyPoints: string[];
}

const MODULES: Module[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    description: 'Learn the basics of Market Oracle and how to use AI-powered stock analysis',
    duration: '15 min',
    icon: <BookOpen className="w-6 h-6" />,
    lessons: [
      {
        id: 'what-is-market-oracle',
        title: 'What is Market Oracle?',
        content: `Market Oracle is a revolutionary multi-AI stock analysis platform that combines the intelligence of four leading AI models to provide you with comprehensive, consensus-driven investment insights.

Unlike traditional stock analysis tools that rely on a single algorithm or human analyst, Market Oracle leverages GPT-4, Claude, Gemini, and Perplexity simultaneously. Each AI brings unique strengths - from deep fundamental analysis to real-time news integration - giving you a 360-degree view of any stock.

The secret sauce is our Javari Consensus Engine, which weighs each AI's prediction based on historical accuracy, confidence levels, and market conditions to deliver a unified, high-conviction verdict.`,
        keyPoints: [
          'Multi-AI approach reduces single-point-of-failure in analysis',
          'Four different AI perspectives on every stock',
          'Javari Consensus provides a weighted, unified verdict',
          'System learns and improves over time'
        ]
      },
      {
        id: 'how-to-analyze',
        title: 'How to Analyze a Stock',
        content: `Analyzing a stock with Market Oracle is simple:

1. **Enter a Symbol**: Type any stock ticker (like AAPL, TSLA, NVDA) in the search bar
2. **Generate Analysis**: Click "Analyze" and wait for all AIs to process
3. **Review Individual Picks**: Each AI provides its own direction (UP/DOWN/HOLD), confidence score, and reasoning
4. **Check Javari Consensus**: See the weighted verdict that synthesizes all AI opinions
5. **Dig Deeper**: Click on any AI card to see full reasoning, factors, risks, and catalysts

Pro tip: Generate fresh analysis before market open or after major news events to get the most current AI opinions.`,
        keyPoints: [
          'Enter any stock ticker to get instant AI analysis',
          'Each AI provides independent analysis',
          'Javari weighs and combines all opinions',
          'Click to expand for full reasoning'
        ]
      },
      {
        id: 'understanding-directions',
        title: 'Understanding UP, DOWN, HOLD',
        content: `Each AI provides a directional prediction:

**UP (Bullish)**: The AI expects the stock price to increase within the specified timeframe. This could range from a modest gain to significant upside. Look at the target price for expected magnitude.

**DOWN (Bearish)**: The AI expects the stock price to decrease. The stop-loss level indicates where the AI thinks risk is unacceptable.

**HOLD (Neutral)**: The AI doesn't see a clear directional opportunity. This could mean:
- The stock is fairly valued
- Mixed signals make direction unclear
- Better opportunities exist elsewhere

Important: A HOLD is not negative - it's an honest assessment that the risk/reward isn't compelling enough for a directional bet.`,
        keyPoints: [
          'UP = Bullish, expect price increase',
          'DOWN = Bearish, expect price decrease',
          'HOLD = Neutral, no clear opportunity',
          'Check target price and stop loss for magnitude'
        ]
      }
    ]
  },
  {
    id: 'understanding-ais',
    title: 'Understanding the AIs',
    description: 'Deep dive into each AI model\'s personality, strengths, and best use cases',
    duration: '25 min',
    icon: <Brain className="w-6 h-6" />,
    lessons: [
      {
        id: 'gpt4-profile',
        title: 'GPT-4: The Conservative Analyst',
        content: `GPT-4, developed by OpenAI, is the most thorough and conservative of our AI analysts.

**Personality**: GPT-4 takes a measured, risk-conscious approach. It prefers to recommend HOLD unless there's overwhelming evidence for a directional move. This makes it excellent for avoiding false signals but may cause it to miss some opportunities.

**Analytical Style**: 
- Deep fundamental analysis (earnings, cash flow, competitive position)
- Multi-step reasoning chains
- Comprehensive risk assessment
- Conservative price targets

**When GPT-4 Shines**:
- Long-term investment decisions
- High-quality, blue-chip stocks
- When you want to avoid overtrading

**When to Be Cautious**:
- Momentum plays where GPT-4 may be too slow
- Short-term trading where speed matters
- Speculative opportunities`,
        keyPoints: [
          'Most conservative AI, often recommends HOLD',
          'Excellent fundamental analysis',
          'Best for long-term, risk-averse investors',
          'May miss short-term momentum opportunities'
        ]
      },
      {
        id: 'claude-profile',
        title: 'Claude: The Balanced Risk Manager',
        content: `Claude, developed by Anthropic, provides balanced analysis with exceptional risk awareness.

**Personality**: Claude strives for balance, clearly articulating both bull and bear cases. It's particularly strong at identifying risks that other AIs might overlook.

**Analytical Style**:
- Balanced presentation of pros and cons
- Excellent risk identification
- Clear, readable explanations
- Good at edge cases and unusual situations

**When Claude Shines**:
- Understanding the full picture of a trade
- Risk management and position sizing
- Complex situations with many variables

**When to Be Cautious**:
- Claude can sometimes be too balanced (fence-sitting)
- May not provide strong conviction calls`,
        keyPoints: [
          'Balanced analysis with both bull and bear views',
          'Excellent at identifying risks',
          'Best for understanding full trade picture',
          'May lack strong conviction at times'
        ]
      },
      {
        id: 'gemini-profile',
        title: 'Gemini: The Technical Trader',
        content: `Gemini, developed by Google, excels at technical analysis and pattern recognition.

**Personality**: Gemini is quantitative and precise. It focuses heavily on chart patterns, support/resistance levels, and technical indicators.

**Analytical Style**:
- Technical analysis expertise
- Pattern recognition (head & shoulders, triangles, etc.)
- Precise price targets
- Strong with moving averages and volume analysis

**When Gemini Shines**:
- Short-term and swing trading
- Timing entries and exits
- Stocks with clear technical patterns

**When to Be Cautious**:
- Fundamental catalysts that override technicals
- Stocks without clear chart patterns
- Long-term investment decisions`,
        keyPoints: [
          'Technical analysis specialist',
          'Precise price targets and patterns',
          'Best for short-term traders',
          'May underweight fundamental factors'
        ]
      },
      {
        id: 'perplexity-profile',
        title: 'Perplexity: The News Hunter',
        content: `Perplexity integrates real-time web data for the most current analysis.

**Personality**: Perplexity is aggressive and news-driven. It reacts quickly to breaking news and tends to make more directional calls based on current events.

**Analytical Style**:
- Real-time news integration
- Sentiment analysis
- Catalyst identification
- Event-driven insights

**When Perplexity Shines**:
- Breaking news situations
- Earnings reactions
- Event-driven trades
- Momentum plays

**When to Be Cautious**:
- May overreact to news
- Can be too aggressive on thin evidence
- Short-term focused, may miss long-term value`,
        keyPoints: [
          'Real-time news and sentiment',
          'Most aggressive AI',
          'Best for news-driven trades',
          'May overreact to short-term events'
        ]
      }
    ]
  },
  {
    id: 'javari-consensus',
    title: 'Javari Consensus Engine',
    description: 'How our proprietary algorithm synthesizes multiple AI opinions',
    duration: '20 min',
    icon: <Target className="w-6 h-6" />,
    lessons: [
      {
        id: 'how-consensus-works',
        title: 'How Consensus Works',
        content: `The Javari Consensus Engine is the brain behind Market Oracle. Here's how it works:

**Step 1: Collect Predictions**
All enabled AIs analyze the stock simultaneously, each providing:
- Direction (UP/DOWN/HOLD)
- Confidence score (0-100%)
- Reasoning and factors

**Step 2: Weight by Accuracy**
Not all AIs are equal. Javari tracks each AI's historical accuracy and weights their votes accordingly. An AI that's been right 70% of the time gets more weight than one at 50%.

**Step 3: Sector Adjustments**
Some AIs perform better in certain sectors. GPT-4 might excel at financial stocks while Perplexity dominates tech. Javari applies sector-specific bonuses.

**Step 4: Vote Aggregation**
Weighted votes are summed for each direction:
- Total UP votes = Σ(weight × confidence) for UP picks
- Highest vote total wins

**Step 5: Consensus Strength**
Javari calculates how strong the agreement is:
- STRONG (80%+): High agreement, trade with confidence
- MODERATE (60-80%): Good agreement, normal position size
- WEAK (40-60%): Mixed signals, use caution
- SPLIT (<40%): No consensus, consider sitting out`,
        keyPoints: [
          'Weights AI votes by historical accuracy',
          'Applies sector-specific adjustments',
          'Calculates consensus strength',
          'Provides unified confidence score'
        ]
      },
      {
        id: 'reading-consensus',
        title: 'Reading Consensus Signals',
        content: `Understanding Javari's output helps you make better decisions:

**Consensus Direction**
The final verdict: UP, DOWN, or HOLD. This is the weighted majority vote.

**Javari Confidence**
A 0-100% score indicating how confident Javari is in the consensus. Factors include:
- Strength of agreement among AIs
- Individual AI confidence levels
- Historical accuracy patterns

**Consensus Strength**
- STRONG: 3-4 AIs agree with high confidence
- MODERATE: 2-3 AIs agree OR mixed confidence
- WEAK: Close vote, mixed signals
- SPLIT: No clear winner

**AIs Agree**
Shows how many of the 4 AIs voted for the consensus direction. "3/4 agree" is stronger than "2/4 agree."

**When to Trust Consensus More**:
- Strong consensus with 3+ AIs agreeing
- High individual confidence scores
- Consistent with current market conditions

**When to Be More Skeptical**:
- Weak consensus with split votes
- One AI drastically different from others
- During major market volatility`,
        keyPoints: [
          'Check direction + confidence + strength together',
          'Strong consensus = higher conviction trade',
          'Weak/split = consider smaller position or skip',
          'Always verify with your own research'
        ]
      }
    ]
  },
  {
    id: 'risk-management',
    title: 'Risk Management',
    description: 'Protect your capital with proper position sizing and stop losses',
    duration: '20 min',
    icon: <Shield className="w-6 h-6" />,
    lessons: [
      {
        id: 'using-stop-losses',
        title: 'Using Stop Losses',
        content: `Every AI pick includes a stop loss level. Here's how to use them:

**What is a Stop Loss?**
A predetermined price at which you exit a losing trade to limit damage. If you buy at $100 with a stop at $95, you sell if the price hits $95.

**How AIs Calculate Stops**:
- Technical support levels
- Volatility-based (ATR multiples)
- Maximum acceptable loss percentage
- Risk/reward ratio considerations

**Implementing Stops**:
1. Place actual stop orders, don't just "watch"
2. Use stop-limit orders in volatile stocks
3. Consider mental stops for very liquid stocks
4. Adjust position size so stop loss = acceptable dollar loss

**Stop Loss Best Practices**:
- Never move your stop further away
- Trail stops up (never down) as trade moves in your favor
- Use wider stops for volatile stocks
- Tighter stops for concentrated positions`,
        keyPoints: [
          'Always set a stop loss before entering',
          'Position size based on stop distance',
          'Never move stops further away',
          'Trail stops up as trade profits'
        ]
      },
      {
        id: 'position-sizing',
        title: 'Position Sizing',
        content: `How much to invest in each trade is as important as what to buy.

**The 1-2% Rule**
Never risk more than 1-2% of your portfolio on a single trade. This means if your stop loss is 10% away from entry, your position should be 10-20% of your portfolio maximum.

**Calculating Position Size**:
1. Determine your portfolio risk (1-2% of total)
2. Calculate stop loss distance (%)
3. Position Size = Portfolio Risk / Stop Distance

Example:
- $100,000 portfolio, 1% risk = $1,000 max loss
- Entry $50, Stop $45 = 10% stop distance
- Position Size = $1,000 / 10% = $10,000 (100 shares)

**Adjusting for Consensus Strength**:
- STRONG consensus: Use full 1-2% risk
- MODERATE consensus: Use 0.5-1% risk
- WEAK consensus: Use 0.25-0.5% or skip

**Portfolio Considerations**:
- Max 5-6 positions at a time
- Diversify across sectors
- Don't double down on losers`,
        keyPoints: [
          'Never risk more than 1-2% per trade',
          'Size positions based on stop distance',
          'Reduce size for weaker consensus',
          'Maintain portfolio diversification'
        ]
      }
    ]
  },
  {
    id: 'advanced-strategies',
    title: 'Advanced Strategies',
    description: 'Take your trading to the next level with sophisticated techniques',
    duration: '25 min',
    icon: <Award className="w-6 h-6" />,
    lessons: [
      {
        id: 'multi-timeframe',
        title: 'Multi-Timeframe Analysis',
        content: `Combine analyses from different timeframes for higher conviction trades.

**The Concept**:
A stock might be bullish short-term but bearish long-term (or vice versa). Understanding both helps you:
- Time entries better
- Set appropriate targets
- Avoid counter-trend traps

**Using Market Oracle Timeframes**:
1. Generate analysis for 1W (default)
2. Note the consensus direction
3. Compare to longer-term fundamental outlook
4. Look for alignment

**Best Setups**:
- Short-term UP + Long-term UP = Strong buy
- Short-term DOWN + Long-term DOWN = Strong sell/short
- Conflicting signals = Wait or smaller size

**Warning Signs**:
- Short-term UP but at long-term resistance
- Short-term DOWN but at major support
- Conflicting AI opinions on timeframe alignment`,
        keyPoints: [
          'Look at multiple timeframes before trading',
          'Best trades have timeframe alignment',
          'Conflicting signals = reduce size or wait',
          'Use longer-term levels for context'
        ]
      },
      {
        id: 'sector-rotation',
        title: 'Sector Rotation Strategy',
        content: `Use Market Oracle to identify sector trends and rotate accordingly.

**The Concept**:
Different sectors outperform at different times:
- Early cycle: Financials, Consumer Discretionary
- Mid cycle: Technology, Industrials
- Late cycle: Energy, Materials
- Recession: Utilities, Healthcare

**Using Market Oracle for Sectors**:
1. Analyze multiple stocks in each sector
2. Note which sectors have most UP consensus
3. Which sectors show most DOWN consensus
4. Allocate more to bullish sectors

**Execution**:
- Track consensus across sector leaders
- Look for sector-wide agreement among AIs
- Rotate from bearish to bullish sectors
- Rebalance monthly or quarterly

**Key Metrics**:
- % of stocks with UP consensus in sector
- Average confidence by sector
- Sector-specific AI accuracy trends`,
        keyPoints: [
          'Sectors cycle through leadership',
          'Analyze multiple stocks per sector',
          'Rotate to sectors with strongest consensus',
          'Rebalance periodically'
        ]
      }
    ]
  }
];

export default function LearnPage() {
  const [expandedModule, setExpandedModule] = useState<string | null>('getting-started');
  const [expandedLesson, setExpandedLesson] = useState<string | null>('what-is-market-oracle');

  const toggleModule = (moduleId: string) => {
    setExpandedModule(expandedModule === moduleId ? null : moduleId);
    setExpandedLesson(null);
  };

  const toggleLesson = (lessonId: string) => {
    setExpandedLesson(expandedLesson === lessonId ? null : lessonId);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500/10 to-gray-900 border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Market Oracle Academy</h1>
              <p className="text-gray-400">Master AI-powered stock analysis</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6 mt-6 text-gray-400">
            <span className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" /> {MODULES.length} Modules
            </span>
            <span className="flex items-center gap-2">
              <Clock className="w-5 h-5" /> ~2 hours total
            </span>
            <span className="flex items-center gap-2">
              <Award className="w-5 h-5" /> Certificate on completion
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-4">
          {MODULES.map((module) => (
            <div key={module.id} className="bg-gray-800/50 rounded-xl overflow-hidden">
              {/* Module Header */}
              <button
                onClick={() => toggleModule(module.id)}
                className="w-full p-6 flex items-center gap-4 text-left hover:bg-gray-800/80 transition"
              >
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
                  {module.icon}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-white">{module.title}</h2>
                  <p className="text-gray-400">{module.description}</p>
                </div>
                <span className="text-gray-500 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> {module.duration}
                </span>
                {expandedModule === module.id ? (
                  <ChevronDown className="w-6 h-6 text-gray-400" />
                ) : (
                  <ChevronRight className="w-6 h-6 text-gray-400" />
                )}
              </button>

              {/* Module Content */}
              {expandedModule === module.id && (
                <div className="border-t border-gray-700">
                  {module.lessons.map((lesson) => (
                    <div key={lesson.id} className="border-b border-gray-700 last:border-b-0">
                      <button
                        onClick={() => toggleLesson(lesson.id)}
                        className="w-full p-4 pl-20 flex items-center gap-4 text-left hover:bg-gray-800/50 transition"
                      >
                        <Play className="w-5 h-5 text-amber-400" />
                        <span className="flex-1 text-white">{lesson.title}</span>
                        {expandedLesson === lesson.id ? (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        )}
                      </button>

                      {expandedLesson === lesson.id && (
                        <div className="px-6 pb-6 pl-20">
                          <div className="bg-gray-900 rounded-lg p-6">
                            <div className="prose prose-invert max-w-none">
                              {lesson.content.split('\n\n').map((para, i) => (
                                <p key={i} className="text-gray-300 mb-4 whitespace-pre-wrap">
                                  {para}
                                </p>
                              ))}
                            </div>
                            
                            <div className="mt-6 bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                              <h4 className="text-amber-400 font-semibold mb-3 flex items-center gap-2">
                                <Lightbulb className="w-5 h-5" /> Key Takeaways
                              </h4>
                              <ul className="space-y-2">
                                {lesson.keyPoints.map((point, i) => (
                                  <li key={i} className="text-gray-300 flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                                    {point}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Practice?</h2>
          <p className="text-gray-400 mb-6">Put your knowledge to the test with live AI analysis</p>
          <Link
            href="/ai-picks"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-lg"
          >
            <TrendingUp className="w-5 h-5" /> Start Analyzing Stocks
          </Link>
        </div>
      </div>
    </div>
  );
}
