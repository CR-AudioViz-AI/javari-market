// ============================================================================
// JAVARI AI WIDGET - Market Oracle Edition
// Global AI Assistant + JavariHelpButton Export
// Fixed: 2025-12-17
// ============================================================================

'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles, Loader2, HelpCircle } from 'lucide-react';

interface Message { 
  role: 'user' | 'assistant'; 
  content: string; 
}

// ============================================================================
// JAVARI HELP BUTTON - For inline help throughout the app
// ============================================================================
export function JavariHelpButton({ 
  topic, 
  className = '' 
}: { 
  topic: string; 
  className?: string; 
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  
  const helpTopics: Record<string, string> = {
    'ai-battle': 'The AI Battle Royale pits our 4 AI models against each other. Track their picks, win rates, and total returns to see which AI is performing best!',
    'hot-picks': 'Hot Picks shows the most confident recent stock recommendations from all AI models. Higher confidence means the AI is more certain about the direction.',
    'consensus': 'Javari Consensus combines all 4 AI opinions into a single verdict. When multiple AIs agree, the consensus is stronger.',
    'confidence': 'Confidence shows how certain an AI is about its prediction. 80%+ is high confidence, 60-80% is moderate.',
    'direction': 'UP means the AI expects the stock to rise, DOWN means fall, HOLD means stay relatively flat.',
    'win-rate': 'Win Rate shows the percentage of picks that ended profitably. Higher is better!',
    'credits': 'Credits are used for AI analysis. Each full analysis costs 5 credits. Buy more in your account settings.',
    'default': 'Click to learn more about this feature. Javari AI is here to help!'
  };
  
  const helpText = helpTopics[topic] || helpTopics['default'];
  
  return (
    <div className={`relative inline-block ${className}`}>
      <button
        onClick={() => setShowTooltip(!showTooltip)}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="p-1 text-gray-500 hover:text-amber-400 transition-colors"
        aria-label="Help"
      >
        <HelpCircle className="w-4 h-4" />
      </button>
      
      {showTooltip && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-gray-800 border border-gray-700 rounded-lg shadow-xl text-sm text-gray-300">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <span>{helpText}</span>
          </div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full">
            <div className="border-8 border-transparent border-t-gray-800"></div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN JAVARI WIDGET - Floating Chat Assistant
// ============================================================================
export default function JavariWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hi! I'm Javari, your AI stock analysis assistant. Ask me about any stock, our AI predictions, or how to use Market Oracle!" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { 
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); 
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);
    
    // Smart response based on keywords
    setTimeout(() => {
      let response = "Thanks for your question! ";
      
      const lowerMsg = userMsg.toLowerCase();
      
      if (lowerMsg.includes('stock') || lowerMsg.includes('symbol') || lowerMsg.includes('ticker')) {
        response = "To analyze a stock, go to the Dashboard and enter any ticker symbol (like AAPL or MSFT). You can also search by company name! Our 4 AI models will provide their analysis and I'll give you the consensus verdict.";
      } else if (lowerMsg.includes('battle') || lowerMsg.includes('competition')) {
        response = "The AI Battle Royale tracks the performance of our 4 AI models: GPT-4, Claude, Gemini, and Perplexity. View the leaderboard to see who's winning based on actual stock returns!";
      } else if (lowerMsg.includes('hot pick') || lowerMsg.includes('recommend')) {
        response = "Hot Picks shows recent high-confidence recommendations from all AI models. Filter by UP/DOWN direction or see what's trending. Remember, higher confidence doesn't guarantee success!";
      } else if (lowerMsg.includes('credit')) {
        response = "Each full stock analysis costs 5 credits. You can buy credits on the main CR AudioViz AI site. Free users get 50 credits to start!";
      } else if (lowerMsg.includes('how') && (lowerMsg.includes('work') || lowerMsg.includes('use'))) {
        response = "Here's how Market Oracle works:\n\n1. Enter a stock ticker or company name\n2. Our 4 AI models analyze it independently\n3. I (Javari) combine their views into a consensus\n4. You get direction (UP/DOWN/HOLD), confidence %, and reasoning\n\nCheck the Battle page to see which AI is performing best!";
      } else {
        response = "I'm here to help with stock analysis! You can:\n\n• Search stocks by ticker OR company name\n• View AI Battle Royale rankings\n• See Hot Picks with highest confidence\n• Get consensus from 4 AI models\n\nWhat would you like to know more about?";
      }
      
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      setLoading(false);
    }, 800);
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)} 
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full shadow-lg hover:shadow-xl hover:shadow-amber-500/25 hover:scale-110 transition-all flex items-center justify-center z-50"
          aria-label="Open Javari AI Assistant"
        >
          <Sparkles className="w-6 h-6 text-white" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-900 animate-pulse"></span>
        </button>
      )}
      
      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[520px] bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-b border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Javari AI</h3>
                <p className="text-xs text-gray-400">Stock Analysis Assistant</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)} 
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="Close chat"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          
          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-4 py-2 rounded-2xl text-sm whitespace-pre-line ${
                  msg.role === 'user' 
                    ? 'bg-amber-600 text-white' 
                    : 'bg-gray-800 text-gray-100'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-800 px-4 py-2 rounded-2xl">
                  <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input */}
          <div className="p-4 border-t border-gray-700">
            <div className="flex gap-2">
              <input 
                value={input} 
                onChange={e => setInput(e.target.value)} 
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()} 
                placeholder="Ask about stocks, AI picks..." 
                className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-amber-500 focus:outline-none" 
              />
              <button 
                onClick={sendMessage} 
                disabled={loading || !input.trim()} 
                className="p-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors"
                aria-label="Send message"
              >
                <Send className="w-5 h-5 text-white" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Part of CR AudioViz AI • Your Story. Our Design.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
