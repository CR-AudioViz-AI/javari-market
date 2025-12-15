// app/page.tsx
// Market Oracle AI - Premium Landing Page
// Multi-AI Stock Analysis Powered by Javari AI

'use client';

import { useState } from 'react';
import Link from 'next/link';
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
  CheckCircle2
} from 'lucide-react';

export default function LandingPage() {
  const [symbol, setSymbol] = useState('');

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-950/80 backdrop-blur-xl border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Market Oracle</span>
              <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">AI</span>
            </div>
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

          {/* Quick Analysis */}
          <div className="max-w-md mx-auto mb-12">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter stock symbol (e.g., AAPL)"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
              />
              <Link
                href={`/ai-picks${symbol ? `?analyze=${symbol}` : ''}`}
                className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg hover:shadow-amber-500/25 transition flex items-center gap-2"
              >
                Analyze <ChevronRight className="w-4 h-4" />
              </Link>
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
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-800 flex items-center justify-center mx-auto mb-6 text-3xl font-bold text-amber-400">
                1
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Enter Symbol</h3>
              <p className="text-gray-400">
                Type any stock ticker and our system fetches real-time market data, fundamentals, and technicals.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-800 flex items-center justify-center mx-auto mb-6 text-3xl font-bold text-amber-400">
                2
              </div>
              <h3 className="text-xl font-bold text-white mb-2">AI Analysis</h3>
              <p className="text-gray-400">
                Four leading AI models analyze the stock simultaneously, each providing direction, confidence, and reasoning.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-800 flex items-center justify-center mx-auto mb-6 text-3xl font-bold text-amber-400">
                3
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Javari Verdict</h3>
              <p className="text-gray-400">
                Our consensus engine synthesizes all predictions into a single, actionable recommendation with confidence score.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
              <LineChart className="w-8 h-8 text-amber-400 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Price Targets</h3>
              <p className="text-gray-400 text-sm">Entry, target, and stop-loss levels from each AI model.</p>
            </div>

            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
              <BarChart3 className="w-8 h-8 text-amber-400 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Factor Analysis</h3>
              <p className="text-gray-400 text-sm">P/E, technicals, sentiment, and momentum breakdown.</p>
            </div>

            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
              <Shield className="w-8 h-8 text-amber-400 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Risk Assessment</h3>
              <p className="text-gray-400 text-sm">Key risks and catalysts identified by each model.</p>
            </div>

            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
              <Award className="w-8 h-8 text-amber-400 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Track Record</h3>
              <p className="text-gray-400 text-sm">Historical accuracy tracking for each AI and Javari.</p>
            </div>

            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
              <Users className="w-8 h-8 text-amber-400 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Community Voting</h3>
              <p className="text-gray-400 text-sm">See what other traders think about each pick.</p>
            </div>

            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
              <Zap className="w-8 h-8 text-amber-400 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Real-Time Updates</h3>
              <p className="text-gray-400 text-sm">Breaking news and sentiment integrated instantly.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Trade Smarter?
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Join thousands of traders using AI-powered analysis to make better decisions.
          </p>
          <Link
            href="/ai-picks"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:shadow-xl hover:shadow-amber-500/25 transition"
          >
            Start Analyzing Stocks <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-semibold">Market Oracle AI</span>
            </div>
            <p className="text-gray-500 text-sm">
              Part of the <span className="text-amber-400">CR AudioViz AI</span> ecosystem
            </p>
            <p className="text-gray-600 text-xs">
              Not financial advice. AI predictions are for informational purposes only.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
