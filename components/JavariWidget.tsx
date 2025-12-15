// components/JavariWidget.tsx - Javari AI Assistant (Minimized by Default)
'use client';

import { useState, useRef, useCallback } from 'react';
import { 
  MessageCircle, X, Send, Sparkles,
  HelpCircle, TrendingUp, BookOpen, Brain,
  ChevronUp
} from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface JavariContext {
  page?: string;
  ticker?: string;
  topic?: string;
}

let globalOpenWidget: (() => void) | null = null;
let globalSetContext: ((ctx: JavariContext) => void) | null = null;

export function triggerJavariHelp(context: JavariContext) {
  if (globalSetContext) globalSetContext(context);
  if (globalOpenWidget) globalOpenWidget();
}

const QUICK_PROMPTS = [
  { icon: TrendingUp, text: 'How do I analyze a stock?', category: 'trading' },
  { icon: Brain, text: 'Explain the AI models', category: 'platform' },
  { icon: HelpCircle, text: 'What is Javari Consensus?', category: 'platform' },
  { icon: BookOpen, text: 'Risk management tips', category: 'education' },
];

const MARKET_KNOWLEDGE: Record<string, string> = {
  'analyze a stock': 'To analyze a stock in Market Oracle: 1) Go to the Dashboard, 2) Enter any stock symbol (like AAPL or NVDA), 3) Click Analyze, 4) Our 4 AI models (GPT-4, Claude, Gemini, Perplexity) will analyze it simultaneously, 5) Review each AI\'s reasoning by clicking to expand, 6) Check the Javari Consensus for the weighted verdict.',
  'ai models': 'Market Oracle uses 4 AI models: **GPT-4** (conservative, thorough analysis), **Claude** (balanced, risk-aware), **Gemini** (technical patterns), **Perplexity** (real-time news). Each brings unique strengths. Javari AI combines their predictions using accuracy-weighted voting.',
  'javari consensus': 'Javari Consensus is our proprietary algorithm that synthesizes predictions from all AI models. It weights each AI based on historical accuracy, sector performance, and confidence levels. Strong consensus (80%+ agreement) indicates high conviction. Split votes suggest caution.',
  'risk management': 'Key risk management principles: 1) Never risk more than 1-2% of your portfolio per trade, 2) Always set stop losses before entering, 3) Size positions based on stop distance, 4) Reduce position size for weaker consensus, 5) Diversify across sectors, 6) Don\'t chase trades - wait for setups.',
  'hot picks': 'Hot Picks shows stocks where multiple AI models strongly agree. These are high-conviction opportunities where 3+ AIs recommend the same direction with high confidence. However, always do your own research before trading.',
  'how does it work': 'Market Oracle works by: 1) Fetching real-time market data for any stock, 2) Sending this data to 4 different AI models simultaneously, 3) Each AI provides direction, confidence, and reasoning, 4) Javari Consensus weights the votes by historical accuracy, 5) You get a unified verdict plus individual AI insights.',
};

function findAnswer(question: string): string {
  const q = question.toLowerCase();
  
  for (const [key, answer] of Object.entries(MARKET_KNOWLEDGE)) {
    if (q.includes(key) || key.split(' ').some(word => q.includes(word))) {
      return answer;
    }
  }
  
  // Default response
  return 'I can help you with Market Oracle! Try asking about: analyzing stocks, AI models, Javari Consensus, risk management, or how the platform works. For more in-depth learning, visit the Learn section.';
}

export default function JavariWidget() {
  // START MINIMIZED - only show button, not expanded
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [context, setContext] = useState<JavariContext>({});
  const inputRef = useRef<HTMLInputElement>(null);

  // Expose functions globally
  globalOpenWidget = useCallback(() => setIsOpen(true), []);
  globalSetContext = useCallback((ctx: JavariContext) => setContext(ctx), []);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    const answer = findAnswer(input);
    const assistantMessage: Message = {
      role: 'assistant',
      content: answer,
      timestamp: new Date(),
    };

    setMessages([...messages, userMessage, assistantMessage]);
    setInput('');
    inputRef.current?.focus();
  };

  const handleQuickPrompt = (prompt: string) => {
    const userMessage: Message = {
      role: 'user',
      content: prompt,
      timestamp: new Date(),
    };

    const answer = findAnswer(prompt);
    const assistantMessage: Message = {
      role: 'assistant',
      content: answer,
      timestamp: new Date(),
    };

    setMessages([...messages, userMessage, assistantMessage]);
  };

  // ONLY show minimized button when closed
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/25 flex items-center justify-center hover:scale-110 transition-transform z-50"
        aria-label="Open Javari AI Assistant"
      >
        <Sparkles className="w-6 h-6 text-white" />
      </button>
    );
  }

  // Expanded widget
  return (
    <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-white">Javari AI</h3>
            <p className="text-white/70 text-xs">Market Oracle Assistant</p>
          </div>
        </div>
        <button 
          onClick={() => setIsOpen(false)}
          className="text-white/70 hover:text-white p-1"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-4">
            <Sparkles className="w-8 h-8 text-amber-400 mx-auto mb-2" />
            <p className="text-gray-400 text-sm mb-4">Hi! I'm Javari. How can I help you today?</p>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleQuickPrompt(prompt.text)}
                  className="flex items-center gap-2 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-left text-sm text-gray-300 transition"
                >
                  <prompt.icon className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="line-clamp-1">{prompt.text}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-xl px-4 py-2 ${
                  msg.role === 'user'
                    ? 'bg-amber-500 text-white'
                    : 'bg-gray-800 text-gray-200'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask Javari anything..."
            className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-sm text-white placeholder-gray-500 focus:border-amber-500 focus:outline-none"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="bg-amber-500 hover:bg-amber-600 disabled:bg-gray-700 text-white p-2 rounded-xl transition"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}


}

// Helper button component for other pages
export function JavariHelpButton({ topic, context }: { topic?: string; context?: string }) {
  return (
    <button
      onClick={() => triggerJavariHelp({ page: topic || context || 'general', action: 'help' })}
      className="fixed bottom-4 right-4 w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg hover:shadow-amber-500/25 transition-all hover:scale-105 z-40"
      title="Ask Javari for help"
    >
      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </button>
  );
}
