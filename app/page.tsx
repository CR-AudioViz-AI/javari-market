// app/page.tsx
// Market Oracle AI - Premium Landing Page
// Multi-AI Stock Analysis Powered by Javari AI
// FIXED: Logo display and company name lookup

'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  TrendingUp, 
  Brain, 
  Shield, 
  Zap, 
  Target,
  BarChart3,
  Users,
  Award,
  ChevronRight,
  Sparkles,
  LineChart,
  Bot,
  CheckCircle2,
  Search,
  X,
  Loader2
} from 'lucide-react';

// Popular stocks for quick suggestions
const POPULAR_STOCKS = [
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'MSFT', name: 'Microsoft Corporation' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation' },
  { symbol: 'TSLA', name: 'Tesla Inc.' },
  { symbol: 'META', name: 'Meta Platforms Inc.' },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.' },
  { symbol: 'V', name: 'Visa Inc.' },
  { symbol: 'JNJ', name: 'Johnson & Johnson' },
  { symbol: 'WMT', name: 'Walmart Inc.' },
  { symbol: 'PG', name: 'Procter & Gamble Co.' },
  { symbol: 'MA', name: 'Mastercard Inc.' },
  { symbol: 'HD', name: 'Home Depot Inc.' },
  { symbol: 'DIS', name: 'Walt Disney Co.' },
  { symbol: 'NFLX', name: 'Netflix Inc.' },
  { symbol: 'PYPL', name: 'PayPal Holdings Inc.' },
  { symbol: 'INTC', name: 'Intel Corporation' },
  { symbol: 'AMD', name: 'Advanced Micro Devices' },
  { symbol: 'CRM', name: 'Salesforce Inc.' },
  { symbol: 'COIN', name: 'Coinbase Global Inc.' },
  { symbol: 'SQ', name: 'Block Inc.' },
  { symbol: 'UBER', name: 'Uber Technologies Inc.' },
  { symbol: 'ABNB', name: 'Airbnb Inc.' },
  { symbol: 'SNAP', name: 'Snap Inc.' },
  { symbol: 'PLTR', name: 'Palantir Technologies' },
  { symbol: 'SOFI', name: 'SoFi Technologies Inc.' },
  { symbol: 'RIVN', name: 'Rivian Automotive Inc.' },
  { symbol: 'LCID', name: 'Lucid Group Inc.' },
  { symbol: 'NIO', name: 'NIO Inc.' },
];

// Penny stocks
const PENNY_STOCKS = [
  { symbol: 'SNDL', name: 'SNDL Inc.' },
  { symbol: 'MULN', name: 'Mullen Automotive' },
  { symbol: 'FFIE', name: 'Faraday Future' },
  { symbol: 'CLOV', name: 'Clover Health' },
  { symbol: 'WISH', name: 'ContextLogic Inc.' },
  { symbol: 'BBIG', name: 'Vinco Ventures' },
  { symbol: 'PROG', name: 'Progenity Inc.' },
  { symbol: 'ATER', name: 'Aterian Inc.' },
];

// Crypto symbols
const CRYPTO_SYMBOLS = [
  { symbol: 'BTC', name: 'Bitcoin' },
  { symbol: 'ETH', name: 'Ethereum' },
  { symbol: 'SOL', name: 'Solana' },
  { symbol: 'XRP', name: 'Ripple' },
  { symbol: 'ADA', name: 'Cardano' },
  { symbol: 'DOGE', name: 'Dogecoin' },
  { symbol: 'AVAX', name: 'Avalanche' },
  { symbol: 'DOT', name: 'Polkadot' },
  { symbol: 'MATIC', name: 'Polygon' },
  { symbol: 'LINK', name: 'Chainlink' },
];

// Combine all for search
const ALL_SYMBOLS = [...POPULAR_STOCKS, ...PENNY_STOCKS, ...CRYPTO_SYMBOLS];

export default function LandingPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<typeof ALL_SYMBOLS>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Filter suggestions based on search query
  useEffect(() => {
    if (searchQuery.length > 0) {
      const query = searchQuery.toLowerCase();
      const filtered = ALL_SYMBOLS.filter(
        stock => 
          stock.symbol.toLowerCase().includes(query) ||
          stock.name.toLowerCase().includes(query)
      ).slice(0, 8);
      setSuggestions(filtered);
      setShowSuggestions(true);
      setSelectedIndex(-1);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery]);

  // Close suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter' && searchQuery) {
        handleAnalyze(searchQuery.toUpperCase());
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSelectSuggestion(suggestions[selectedIndex]);
        } else if (searchQuery) {
          handleAnalyze(searchQuery.toUpperCase());
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
    }
  };

  const handleSelectSuggestion = (stock: { symbol: string; name: string }) => {
    setSearchQuery(stock.symbol);
    setShowSuggestions(false);
    handleAnalyze(stock.symbol);
  };

  const handleAnalyze = (symbol: string) => {
    if (symbol) {
      setIsSearching(true);
      router.push(`/ai-picks?analyze=${symbol}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
      {/* Navigation with PROPER LOGO */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-950/80 backdrop-blur-xl border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo - Using the actual image */}
            <Link href="/" className="flex items-center gap-3">
              <div className="relative w-10 h-10">
                <Image
                  src="/market-oracle-logo.png"
                  alt="Market Oracle"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <div className="flex items-center">
                <span className="text-xl font-bold text-white">Market Oracle</span>
                <span className="ml-2 text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-medium">AI</span>
              </div>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/ai-picks" className="text-gray-400 hover:text-white transition">
                Dashboard
              </Link>
              <Link 
                href="/ai-picks" 
                className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg hover:shadow-amber-500/25 transition"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-2 mb-8">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-amber-400 text-sm font-medium">Powered by 4 Leading AI Models</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Wall Street Intelligence<br />
            <span className="bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
              Without the Wall Street Price
            </span>
          </h1>
          
          <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-10">
            Get stock picks from GPT-4, Claude, Gemini, and Perplexity—then let our 
            <span className="text-amber-400 font-semibold"> Javari AI </span> 
            build a consensus. Four minds. One verdict.
          </p>

          {/* ENHANCED Search with Company Name Support */}
          <div className="max-w-lg mx-auto mb-12" ref={searchRef}>
            <div className="relative">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Enter stock symbol or company name (e.g., AAPL or Apple)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => searchQuery && setShowSuggestions(true)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-12 pr-10 py-3.5 text-white placeholder-gray-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        inputRef.current?.focus();
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <button
                  onClick={() => handleAnalyze(searchQuery.toUpperCase())}
                  disabled={!searchQuery || isSearching}
                  className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-6 py-3.5 rounded-lg font-medium hover:shadow-lg hover:shadow-amber-500/25 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSearching ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Analyze <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              {/* Autocomplete Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden">
                  {suggestions.map((stock, index) => (
                    <button
                      key={stock.symbol}
                      onClick={() => handleSelectSuggestion(stock)}
                      className={`w-full px-4 py-3 flex items-center justify-between hover:bg-gray-700 transition ${
                        index === selectedIndex ? 'bg-gray-700' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-amber-400 w-16 text-left">{stock.symbol}</span>
                        <span className="text-gray-300 text-sm">{stock.name}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    </button>
                  ))}
                </div>
              )}

              {/* No results message */}
              {showSuggestions && searchQuery.length > 0 && suggestions.length === 0 && (
                <div className="absolute z-50 w-full mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-4">
                  <p className="text-gray-400 text-sm text-center">
                    No matching stocks found. Press Enter to search for "{searchQuery.toUpperCase()}"
                  </p>
                </div>
              )}
            </div>

            {/* Quick suggestion chips */}
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              <span className="text-gray-500 text-sm">Popular:</span>
              {['AAPL', 'NVDA', 'TSLA', 'MSFT', 'BTC'].map(symbol => (
                <button
                  key={symbol}
                  onClick={() => handleAnalyze(symbol)}
                  className="text-sm px-3 py-1 rounded-full bg-gray-800 text-gray-400 hover:text-amber-400 hover:bg-gray-700 transition"
                >
                  {symbol}
                </button>
              ))}
            </div>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-8 text-gray-500">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <span>Real-time Analysis</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <span>4 AI Models</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <span>Consensus Algorithm</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <span>Track Record</span>
            </div>
          </div>
        </div>
      </section>

      {/* AI Models Section */}
      <section className="py-20 px-4 bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Four AI Analysts. One Unified Verdict.
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Each AI brings unique strengths. Javari synthesizes them into actionable intelligence.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* GPT-4 */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 hover:border-emerald-500/50 transition group">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <Brain className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">GPT-4</h3>
              <p className="text-gray-400 text-sm mb-4">
                Deep reasoning and nuanced analysis. Conservative approach with high accuracy.
              </p>
              <div className="text-emerald-400 text-sm font-medium">Conservative • High Precision</div>
            </div>

            {/* Claude */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 hover:border-purple-500/50 transition group">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <Bot className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Claude</h3>
              <p className="text-gray-400 text-sm mb-4">
                Balanced analysis with strong reasoning. Excellent at identifying risks.
              </p>
              <div className="text-purple-400 text-sm font-medium">Balanced • Risk-Aware</div>
            </div>

            {/* Gemini */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 hover:border-blue-500/50 transition group">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <Sparkles className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Gemini</h3>
              <p className="text-gray-400 text-sm mb-4">
                Technical analysis focus. Excels at pattern recognition and price targets.
              </p>
              <div className="text-blue-400 text-sm font-medium">Technical • Pattern Focus</div>
            </div>

            {/* Perplexity */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 hover:border-cyan-500/50 transition group">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <Zap className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Perplexity</h3>
              <p className="text-gray-400 text-sm mb-4">
                Real-time web data. Breaking news and sentiment analysis integrated.
              </p>
              <div className="text-cyan-400 text-sm font-medium">Real-Time • News-Driven</div>
            </div>
          </div>

          {/* Javari */}
          <div className="mt-8 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Javari Consensus Engine</h3>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Our proprietary algorithm weighs each AI's prediction based on historical accuracy, 
              confidence levels, and market conditions to deliver a unified, high-conviction verdict.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              How Market Oracle Works
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Simple, transparent, and powered by the world's most advanced AI models.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/20 flex items-center justify-center mx-auto mb-6">
                <Search className="w-8 h-8 text-amber-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">1. Enter Any Stock</h3>
              <p className="text-gray-400">
                Type a stock symbol or company name. Our AI will recognize it and fetch real-time data.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/20 flex items-center justify-center mx-auto mb-6">
                <Brain className="w-8 h-8 text-amber-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">2. AI Analysis</h3>
              <p className="text-gray-400">
                Four AI models analyze the stock independently using different methodologies.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/20 flex items-center justify-center mx-auto mb-6">
                <Target className="w-8 h-8 text-amber-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">3. Consensus Verdict</h3>
              <p className="text-gray-400">
                Javari synthesizes all analyses into a single, high-confidence prediction.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Everything You Need
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: TrendingUp, title: 'Regular Stocks', desc: 'S&P 500, blue chips, and growth stocks' },
              { icon: Zap, title: 'Penny Stocks', desc: 'High-risk, high-reward opportunities under $5' },
              { icon: BarChart3, title: 'Cryptocurrency', desc: 'BTC, ETH, and top altcoins analysis' },
              { icon: LineChart, title: 'Track Record', desc: 'Full history of all AI predictions and outcomes' },
              { icon: Shield, title: 'Risk Analysis', desc: 'Stop-loss and take-profit recommendations' },
              { icon: Award, title: 'AI Battle', desc: 'Watch AI models compete in real-time' },
            ].map((feature, i) => (
              <div key={i} className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:border-amber-500/30 transition">
                <feature.icon className="w-8 h-8 text-amber-400 mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Get AI-Powered Stock Picks?
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Join thousands of investors using Market Oracle for smarter trading decisions.
          </p>
          <Link 
            href="/ai-picks" 
            className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white px-8 py-4 rounded-xl text-lg font-medium hover:shadow-lg hover:shadow-amber-500/25 transition"
          >
            Start Analyzing Now <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="relative w-8 h-8">
                <Image
                  src="/market-oracle-logo.png"
                  alt="Market Oracle"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="text-gray-400">Market Oracle AI</span>
            </div>
            <div className="flex items-center gap-6 text-gray-500 text-sm">
              <Link href="/privacy" className="hover:text-white transition">Privacy</Link>
              <Link href="/terms" className="hover:text-white transition">Terms</Link>
              <Link href="/disclaimer" className="hover:text-white transition">Disclaimer</Link>
            </div>
            <div className="text-gray-500 text-sm">
              © 2025 CR AudioViz AI, LLC. All rights reserved.
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-600 text-xs">
            Not financial advice. AI predictions are for informational purposes only. Past performance does not guarantee future results.
          </div>
        </div>
      </footer>
    </div>
  );
}
