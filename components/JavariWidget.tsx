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

const MARKET_KNOWLEDGE = {
  'analyze a stock': 'To analyze a stock in Market Oracle: 1) Go to the Dashboard, 2) Enter any stock symbol (like AAPL or NVDA), 3) Click Analyze, 4) Our 4 AI models (GPT-4, Claude, Gemini, Perplexity) will analyze it simultaneously, 5) Review each AI\'s reasoning by clicking to expand, 6) Check the Javari Consensus for the weighted verdict.',
  'ai models': 'Market Oracle uses 4 AI models: **GPT-4** (conservative, thorough analysis), **Claude** (balanced, risk-aware), **Gemini** (technical patterns), **Perplexity** (real-time news). Each brings unique strengths. Javari AI combines their predictions using accuracy-weighted voting.',
  'javari consensus': 'Javari Consensus is our proprietary algorithm that synthesizes predictions from all AI models. It weights each AI based on historical accuracy, sector performance, and confidence levels. Strong consensus (80%+ agreement) indicates high conviction. Split consensus means genuine market uncertainty.',
  'risk management': 'Key risk management rules: 1) Never risk more than 1-2% of portfolio per trade, 2) Always use stop losses (we provide levels), 3) Diversify across sectors, 4) Size positions based on your risk tolerance, 5) Track your trades and learn from outcomes.',
  'default': 'I\'m Javari, your AI assistant for Market Oracle. I can help you understand our platform, explain AI predictions, teach trading concepts, and guide you through features. What would you like to know?'
};

export default function JavariWidget() {
  const [isOpen, setIsOpen] = useState(false);  // CLOSED BY DEFAULT
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [context, setContext] = useState<JavariContext>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Register global functions
  globalOpenWidget = () => setIsOpen(true);
  globalSetContext = setContext;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const generateResponse = useCallback((userMessage: string): string => {
    const lower = userMessage.toLowerCase();
    
    for (const [key, response] of Object.entries(MARKET_KNOWLEDGE)) {
      if (key !== 'default' && lower.includes(key)) {
        return response;
      }
    }
    
    if (lower.includes('stock') || lower.includes('pick') || lower.includes('trade')) {
      return MARKET_KNOWLEDGE['analyze a stock'];
    }
    if (lower.includes('ai') || lower.includes('model') || lower.includes('gpt') || lower.includes('claude')) {
      return MARKET_KNOWLEDGE['ai models'];
    }
    if (lower.includes('consensus') || lower.includes('javari')) {
      return MARKET_KNOWLEDGE['javari consensus'];
    }
    if (lower.includes('risk') || lower.includes('stop') || lower.includes('loss')) {
      return MARKET_KNOWLEDGE['risk management'];
    }
    
    return MARKET_KNOWLEDGE['default'];
  }, []);

  const handleSend = useCallback(() => {
    if (!input.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const response = generateResponse(input);
      const assistantMessage: Message = {
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
      setTimeout(scrollToBottom, 100);
    }, 500 + Math.random() * 500);
  }, [input, generateResponse]);

  const handleQuickPrompt = (text: string) => {
    setInput(text);
    setTimeout(() => handleSend(), 100);
  };

  // MINIMIZED STATE - Just a button
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full shadow-lg hover:shadow-xl hover:shadow-amber-500/30 transition-all flex items-center justify-center z-50 group"
        title="Ask Javari AI"
      >
        <MessageCircle className="w-6 h-6 text-white" />
        <span className="absolute -top-10 right-0 bg-gray-900 text-white text-xs px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
          Ask Javari AI
        </span>
      </button>
    );
  }

  // EXPANDED STATE - Full chat
  return (
    <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">Javari AI</h3>
            <p className="text-white/70 text-xs">Your Market Oracle Guide</p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-white/70 hover:text-white transition p-1"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="space-y-4">
            <p className="text-gray-400 text-sm">
              Hi! I'm Javari, your AI assistant for Market Oracle. How can I help you today?
            </p>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleQuickPrompt(prompt.text)}
                  className="flex items-center gap-2 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-left text-xs text-gray-300 transition"
                >
                  <prompt.icon className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>{prompt.text}</span>
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
                className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
                  msg.role === 'user'
                    ? 'bg-amber-500 text-white'
                    : 'bg-gray-800 text-gray-200'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))
        )}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-800 px-4 py-2 rounded-xl">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask me anything..."
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
