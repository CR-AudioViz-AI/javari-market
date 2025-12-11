// components/JavariWidget.tsx - Enhanced Javari AI Assistant for Market Oracle
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  MessageCircle, X, Send, Sparkles, ExternalLink, 
  HelpCircle, TrendingUp, BookOpen, Brain, Zap,
  ChevronDown, Minimize2, Maximize2, RefreshCw
} from 'lucide-react';

// Message interface
interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  mode?: string;
}

// Context for contextual help triggers
interface JavariContext {
  page?: string;
  ticker?: string;
  aiModel?: string;
  topic?: string;
}

// Global context setter (can be called from other components)
let globalSetContext: ((ctx: JavariContext) => void) | null = null;
let globalOpenWidget: (() => void) | null = null;

export function triggerJavariHelp(context: JavariContext) {
  if (globalSetContext) globalSetContext(context);
  if (globalOpenWidget) globalOpenWidget();
}

// Market Oracle knowledge base
const MARKET_ORACLE_KNOWLEDGE = {
  overview: `Market Oracle is an AI-powered stock prediction competition platform where multiple AI models compete to pick the best stocks. Each AI makes weekly picks across Regular Stocks, Penny Stocks, and Crypto. Users can track performance, compare AIs, and learn from their strategies. This is for EDUCATIONAL PURPOSES ONLY - not financial advice.`,
  
  aiModels: {
    'TechVanguard AI': 'Specializes in technology and growth stocks. Tends toward high-conviction plays in AI, semiconductors, and cloud computing.',
    'ValueHunter Pro': 'Focuses on undervalued stocks with strong fundamentals. Prefers low P/E ratios and solid balance sheets.',
    'SwingTrader X': 'Technical analysis expert. Looks for momentum plays and chart patterns for short-term gains.',
    'DividendKing': 'Income-focused strategy. Picks stable dividend-paying stocks with consistent yield growth.',
    'CryptoQuantum': 'Cryptocurrency specialist. Analyzes on-chain metrics, whale movements, and market sentiment.',
    'GlobalMacro AI': 'Big picture thinker. Considers global economics, interest rates, and sector rotations.'
  },
  
  features: {
    dashboard: 'The Dashboard shows all active picks with Entry, Current (with trend arrows), and Target prices. Filter by AI model, category, or search for specific tickers.',
    hotPicks: 'Hot Picks highlights when multiple AIs agree on a stock. 🔥 FIRE = 4+ AIs agree, ⚡ HOT = 3 AIs, ✨ WARM = 2 AIs.',
    battle: 'AI Battle is the leaderboard. See which AI is winning based on total return %, win rate, and consistency.',
    portfolio: 'Portfolio Tracker lets you simulate following AI picks. Add picks, set share quantities, and track hypothetical P/L.',
    watchlist: 'Watchlist saves picks you want to monitor. Data persists in your browser.',
    alerts: 'Price Alerts notify you when picks hit your targets. Set price above/below, target reached, or % gain/loss alerts.'
  },
  
  terms: {
    'entry price': 'The price when the AI made its pick. This is the starting point for calculating gains/losses.',
    'current price': 'The live market price. Green arrow (↑) = up from entry, Red arrow (↓) = down from entry.',
    'target price': 'The AI\'s predicted price target. Progress bars show how close the current price is to the target.',
    'stop loss': 'The price where a position should be closed to limit losses. Risk management level.',
    'confidence': 'AI\'s conviction level (0-100%). Higher confidence = stronger belief in the prediction.',
    'p&l': 'Profit & Loss. Calculated as: ((Current - Entry) / Entry) × 100. Green = profit, Red = loss.',
    'win rate': 'Percentage of picks that hit their target. Higher is better but must consider average return too.',
    'direction': 'UP = AI predicts price increase, DOWN = AI predicts price decrease (rare).'
  }
};

// AI response generator (enhanced pattern matching, ready for real API)
function generateResponse(userMessage: string, context: JavariContext, mode: string): string {
  const msg = userMessage.toLowerCase();
  
  // Context-specific responses
  if (context.ticker) {
    if (msg.includes('why') || msg.includes('explain') || msg.includes('reasoning')) {
      return `For ${context.ticker}, I'd need to look at the AI's reasoning. Each pick has detailed analysis including key factors, risk assessment, and the AI's thesis. Click on the pick card to see full reasoning. Want me to explain what to look for in AI reasoning?`;
    }
    if (msg.includes('should') || msg.includes('buy') || msg.includes('invest')) {
      return `⚠️ **Important**: I cannot give financial advice. ${context.ticker} is an AI pick for EDUCATIONAL purposes only. Before any real investment, consult a licensed financial advisor. Would you like me to explain how to interpret the AI's analysis instead?`;
    }
  }
  
  if (context.aiModel) {
    const aiInfo = MARKET_ORACLE_KNOWLEDGE.aiModels[context.aiModel as keyof typeof MARKET_ORACLE_KNOWLEDGE.aiModels];
    if (aiInfo) {
      return `**${context.aiModel}**: ${aiInfo}\n\nThis AI's specialty affects its pick style. Check the AI Battle page to see how ${context.aiModel} compares to others!`;
    }
  }
  
  // Mode-specific responses
  if (mode === 'learn') {
    if (msg.includes('start') || msg.includes('begin') || msg.includes('new')) {
      return `Welcome to learning mode! 📚 Here's how to get started:\n\n1. **Dashboard** - See all AI picks with prices\n2. **Hot Picks** - Find stocks multiple AIs agree on\n3. **AI Battle** - Compare AI performance\n4. **Watchlist** - Save picks to monitor\n\nWhat would you like to learn about first?`;
    }
  }
  
  if (mode === 'analyze') {
    return `I can help analyze picks, but remember this is educational only. Here's what to look at:\n\n• **Entry vs Current** - Is it up or down?\n• **Progress to Target** - How close to AI's prediction?\n• **Confidence Level** - How sure is the AI?\n• **Multiple AI Agreement** - Check Hot Picks\n\nWhat specific aspect would you like to understand?`;
  }
  
  // Knowledge base lookups
  for (const [term, definition] of Object.entries(MARKET_ORACLE_KNOWLEDGE.terms)) {
    if (msg.includes(term)) {
      return `**${term.charAt(0).toUpperCase() + term.slice(1)}**: ${definition}\n\nWant me to explain another term?`;
    }
  }
  
  // Feature explanations
  for (const [feature, description] of Object.entries(MARKET_ORACLE_KNOWLEDGE.features)) {
    if (msg.includes(feature)) {
      return description + `\n\nNeed help with anything else about ${feature}?`;
    }
  }
  
  // Common questions
  if (msg.includes('how') && (msg.includes('read') || msg.includes('understand'))) {
    return `Each pick card shows:\n• **Entry** - Starting price\n• **Current** - Live price with ↑↓ trend\n• **Target** - AI's prediction\n• **Progress Bar** - How close to target\n• **% Change** - Gain/loss in green/red\n\nClick any pick to see full AI reasoning!`;
  }
  
  if (msg.includes('best ai') || msg.includes('which ai') || msg.includes('winning')) {
    return `AI performance varies! Check the **AI Battle** page for current rankings. Each AI has different strengths:\n\n• TechVanguard - Tech stocks\n• ValueHunter - Value plays\n• SwingTrader - Momentum\n• DividendKing - Income\n• CryptoQuantum - Crypto\n• GlobalMacro - Big picture\n\nNo single AI wins all the time!`;
  }
  
  if (msg.includes('real') || msg.includes('money') || msg.includes('invest') || msg.includes('trade')) {
    return `⚠️ **IMPORTANT DISCLAIMER**\n\nMarket Oracle is for **EDUCATIONAL PURPOSES ONLY**. This is NOT:\n• Real trading\n• Financial advice\n• A recommendation to buy/sell\n\nAlways consult a licensed financial advisor before making real investments. We track AI predictions to learn from them, not to follow them blindly.`;
  }
  
  if (msg.includes('update') || msg.includes('refresh') || msg.includes('live')) {
    return `Prices refresh automatically every **30 seconds** on most pages. Market hours are 9:30 AM - 4 PM ET (Mon-Fri). Crypto updates 24/7. You can click the Refresh button anytime for manual updates.`;
  }
  
  if (msg.includes('hot') || msg.includes('consensus') || msg.includes('agree')) {
    return `**Hot Picks** shows when multiple AIs agree:\n\n🔥 **FIRE** - 4+ AIs (very rare, high conviction)\n⚡ **HOT** - 3 AIs agree\n✨ **WARM** - 2 AIs agree\n👀 **WATCH** - Single AI (most picks)\n\nMore agreement = potentially stronger signal, but remember this is educational only!`;
  }
  
  if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
    return `Hey there! 👋 I'm Javari AI, your Market Oracle guide. I can help you:\n\n• Understand AI picks and prices\n• Explain trading terms\n• Navigate features\n• Learn market concepts\n\nWhat would you like to know?`;
  }
  
  // Default response
  return `Great question! I'm here to help with Market Oracle. I can explain:\n\n• **Picks** - How to read Entry/Current/Target\n• **AIs** - What each AI specializes in\n• **Features** - Dashboard, Hot Picks, Battle, etc.\n• **Terms** - P&L, confidence, win rate, etc.\n\nWhat specific topic interests you?`;
}

// Mode configurations
const MODES = [
  { id: 'chat', label: 'Chat', icon: MessageCircle, color: 'cyan' },
  { id: 'help', label: 'Help', icon: HelpCircle, color: 'blue' },
  { id: 'analyze', label: 'Analyze', icon: TrendingUp, color: 'emerald' },
  { id: 'learn', label: 'Learn', icon: BookOpen, color: 'purple' },
];

// Quick questions by mode
const QUICK_QUESTIONS: Record<string, string[]> = {
  chat: ['How do I read picks?', 'Which AI is winning?', 'What is P&L?', 'Is this real trading?'],
  help: ['How does this work?', 'Explain the dashboard', 'What are Hot Picks?', 'How to use alerts?'],
  analyze: ['How to compare AIs?', 'What is confidence?', 'Explain win rate', 'What is stop loss?'],
  learn: ['Beginner guide', 'What is entry price?', 'How targets work?', 'Risk management basics'],
};

export default function JavariWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [mode, setMode] = useState('chat');
  const [context, setContext] = useState<JavariContext>({});
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: 'Hi! I\'m Javari AI 👋 Your Market Oracle guide. Ask me anything about AI picks, trading terms, or how to use the platform!',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Expose global functions for external triggers
  useEffect(() => {
    globalSetContext = setContext;
    globalOpenWidget = () => {
      setIsOpen(true);
      setIsMinimized(false);
    };
    return () => {
      globalSetContext = null;
      globalOpenWidget = null;
    };
  }, []);
  
  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Handle context changes (from ? buttons)
  useEffect(() => {
    if (context.topic) {
      const contextMessage = context.ticker 
        ? `Tell me about ${context.ticker}` 
        : context.aiModel 
        ? `Explain ${context.aiModel}` 
        : `Help me with ${context.topic}`;
      handleSend(contextMessage);
      setContext({}); // Clear after use
    }
  }, [context]);

  const handleSend = useCallback(async (overrideInput?: string) => {
    const messageText = overrideInput || input.trim();
    if (!messageText || isLoading) return;
    
    if (!overrideInput) setInput('');
    
    const userMessage: Message = {
      role: 'user',
      content: messageText,
      timestamp: new Date(),
      mode
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Simulate API delay (replace with real API call in production)
    setTimeout(() => {
      const response = generateResponse(messageText, context, mode);
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        mode
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 600 + Math.random() * 400);
  }, [input, isLoading, context, mode]);
  
  const handleClear = () => {
    setMessages([{
      role: 'assistant',
      content: 'Chat cleared! How can I help you with Market Oracle?',
      timestamp: new Date()
    }]);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => { setIsOpen(true); setIsMinimized(false); }}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-cyan-500/25 hover:scale-105 transition-all ${isOpen && !isMinimized ? 'hidden' : ''}`}
        aria-label="Open Javari AI Assistant"
      >
        <MessageCircle className="w-6 h-6 text-white" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-950 animate-pulse" />
      </button>

      {/* Chat Window */}
      {isOpen && !isMinimized && (
        <div className="fixed bottom-6 right-6 z-50 w-[400px] max-w-[calc(100vw-3rem)] bg-gray-900 rounded-2xl shadow-2xl border border-gray-700 flex flex-col max-h-[600px]">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-700 bg-gradient-to-r from-cyan-900/50 to-blue-900/50 rounded-t-2xl">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-semibold text-sm">Javari AI</div>
                <div className="text-[10px] text-gray-400">Market Oracle Assistant</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={handleClear}
                className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
                title="Clear chat"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setIsMinimized(true)}
                className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
                title="Minimize"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setIsOpen(false)} 
                className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* Mode Tabs */}
          <div className="flex border-b border-gray-800 px-2 pt-2">
            {MODES.map(m => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-t-lg transition-colors ${
                  mode === m.id 
                    ? `bg-gray-800 text-${m.color}-400 border-b-2 border-${m.color}-400` 
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <m.icon className="w-3.5 h-3.5" />
                {m.label}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[200px] max-h-[320px]">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-2.5 rounded-xl text-sm ${
                  msg.role === 'user' 
                    ? 'bg-cyan-600 text-white' 
                    : 'bg-gray-800 text-gray-200'
                }`}>
                  {msg.content.split('\n').map((line, j) => (
                    <p key={j} className={j > 0 ? 'mt-2' : ''}>
                      {line.split('**').map((part, k) => 
                        k % 2 === 1 ? <strong key={k} className="text-cyan-300">{part}</strong> : part
                      )}
                    </p>
                  ))}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-800 p-3 rounded-xl">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions */}
          {messages.length <= 3 && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5">
              {QUICK_QUESTIONS[mode].map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(q)}
                  className="px-2.5 py-1 text-[11px] bg-gray-800 hover:bg-gray-700 rounded-full text-gray-400 hover:text-white transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-gray-700">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={`Ask Javari (${mode} mode)...`}
                className="flex-1 px-3 py-2 bg-gray-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder-gray-500"
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-700 disabled:text-gray-500 rounded-xl transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center justify-between mt-2">
              <a 
                href="https://craudiovizai.com/javari" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-cyan-400 transition-colors"
              >
                Full Javari AI <ExternalLink className="w-2.5 h-2.5" />
              </a>
              <span className="text-[10px] text-gray-600">
                Educational purposes only
              </span>
            </div>
          </div>
        </div>
      )}
      
      {/* Minimized State */}
      {isOpen && isMinimized && (
        <button
          onClick={() => setIsMinimized(false)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2 bg-gray-900 border border-gray-700 rounded-full shadow-lg hover:border-cyan-500 transition-all"
        >
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span className="text-sm">Javari AI</span>
          <Maximize2 className="w-3 h-3 text-gray-400" />
        </button>
      )}
    </>
  );
}

// Export the context help button component
export function JavariHelpButton({ 
  topic, 
  ticker, 
  aiModel,
  className = '' 
}: { 
  topic?: string; 
  ticker?: string; 
  aiModel?: string;
  className?: string;
}) {
  return (
    <button
      onClick={() => triggerJavariHelp({ topic, ticker, aiModel })}
      className={`p-1 text-gray-500 hover:text-cyan-400 hover:bg-cyan-900/20 rounded transition-colors ${className}`}
      title="Ask Javari AI"
    >
      <HelpCircle className="w-4 h-4" />
    </button>
  );
}
