// app/help/ai-models/page.tsx
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const aiModels = [
  { 
    name: 'GPT-4 Turbo', 
    provider: 'OpenAI', 
    color: 'from-green-500 to-emerald-600',
    strength: 'Broad market knowledge and reasoning',
    description: 'OpenAI\'s most capable model excels at complex analysis and pattern recognition across diverse market sectors.',
    specialty: 'Blue-chip stocks, market trends'
  },
  { 
    name: 'Claude', 
    provider: 'Anthropic', 
    color: 'from-amber-500 to-orange-600',
    strength: 'Detailed fundamental analysis',
    description: 'Anthropic\'s Claude provides thorough, nuanced analysis with strong attention to risk factors and market context.',
    specialty: 'Risk assessment, fundamental analysis'
  },
  { 
    name: 'Gemini', 
    provider: 'Google', 
    color: 'from-blue-500 to-indigo-600',
    strength: 'Real-time data integration',
    description: 'Google\'s Gemini leverages vast data sources for comprehensive market views and technical analysis.',
    specialty: 'Technical analysis, crypto markets'
  },
  { 
    name: 'Perplexity', 
    provider: 'Perplexity AI', 
    color: 'from-purple-500 to-violet-600',
    strength: 'Web-connected research',
    description: 'Perplexity searches the web in real-time for the latest news and sentiment affecting stocks.',
    specialty: 'News-driven picks, sentiment analysis'
  },
  { 
    name: 'Javari AI', 
    provider: 'CR AudioViz AI', 
    color: 'from-red-500 to-pink-600',
    strength: 'Proprietary ensemble approach',
    description: 'Our custom AI combines multiple models and proprietary analysis for unique market insights.',
    specialty: 'Penny stocks, high-volatility plays'
  },
];

export default function AIModelsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="container mx-auto px-4 py-12">
        <Link href="/help" className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Help Center
        </Link>
        
        <h1 className="text-4xl font-bold mb-4">AI Models Guide</h1>
        <p className="text-xl text-slate-400 mb-12 max-w-3xl">
          Meet the 5 AI models competing to make the best stock predictions. Each has unique strengths and approaches.
        </p>

        <div className="space-y-6">
          {aiModels.map((ai, i) => (
            <div key={i} className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
              <div className={`h-2 bg-gradient-to-r ${ai.color}`} />
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold">{ai.name}</h3>
                    <p className="text-slate-400">by {ai.provider}</p>
                  </div>
                  <span className="px-3 py-1 bg-slate-800 rounded-full text-sm text-slate-300">
                    {ai.specialty}
                  </span>
                </div>
                <p className="text-slate-300 mb-4">{ai.description}</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500">Key Strength:</span>
                  <span className="text-sm text-cyan-400">{ai.strength}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 p-6 bg-slate-900/50 rounded-xl border border-slate-800">
          <h3 className="text-xl font-bold mb-3">Which AI is Best?</h3>
          <p className="text-slate-400">
            There's no single "best" AI - each excels in different market conditions. GPT-4 tends to be 
            conservative with blue-chips, while Javari often finds high-risk/high-reward penny stocks. 
            Check the leaderboard to see current performance rankings!
          </p>
        </div>
      </div>
    </div>
  );
}
