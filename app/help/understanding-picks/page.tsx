// app/help/understanding-picks/page.tsx
import Link from 'next/link';
import { ArrowLeft, TrendingUp, TrendingDown, Target, AlertTriangle } from 'lucide-react';

export default function UnderstandingPicksPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="container mx-auto px-4 py-12">
        <Link href="/help" className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Help Center
        </Link>
        
        <h1 className="text-4xl font-bold mb-4">Understanding Stock Picks</h1>
        <p className="text-xl text-slate-400 mb-12 max-w-3xl">
          Learn how to read and interpret the AI-generated stock picks.
        </p>

        {/* Sample Pick Card Explanation */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 mb-8">
          <h3 className="text-xl font-bold mb-6">Anatomy of a Pick</h3>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="p-4 bg-slate-800/50 rounded-lg">
                <h4 className="font-semibold text-cyan-400 mb-2">Ticker Symbol</h4>
                <p className="text-sm text-slate-400">The stock symbol (e.g., AAPL for Apple). Click to see more details.</p>
              </div>
              
              <div className="p-4 bg-slate-800/50 rounded-lg">
                <h4 className="font-semibold text-cyan-400 mb-2">Entry Price</h4>
                <p className="text-sm text-slate-400">The actual market price when the AI made this pick. This is the baseline for measuring performance.</p>
              </div>
              
              <div className="p-4 bg-slate-800/50 rounded-lg">
                <h4 className="font-semibold text-cyan-400 mb-2">Target Price</h4>
                <p className="text-sm text-slate-400">What the AI predicts the price will reach. If current price hits this, the pick is considered successful.</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-slate-800/50 rounded-lg">
                <h4 className="font-semibold text-cyan-400 mb-2">Stop Loss</h4>
                <p className="text-sm text-slate-400">A safety threshold. If price drops below this, the pick is considered failed. Typically 5% below entry.</p>
              </div>
              
              <div className="p-4 bg-slate-800/50 rounded-lg">
                <h4 className="font-semibold text-cyan-400 mb-2">Current Price</h4>
                <p className="text-sm text-slate-400">Live market price updated every 15 minutes. Compare to entry price to see actual performance.</p>
              </div>
              
              <div className="p-4 bg-slate-800/50 rounded-lg">
                <h4 className="font-semibold text-cyan-400 mb-2">P&L Percentage</h4>
                <p className="text-sm text-slate-400">Profit/Loss calculated as: (Current - Entry) / Entry × 100. Green = profit, Red = loss.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Status Meanings */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 mb-8">
          <h3 className="text-xl font-bold mb-6">Pick Status Meanings</h3>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <span className="text-yellow-400 font-bold">EVEN</span>
              <p className="text-sm text-slate-400 mt-2">Price hasn't moved significantly from entry. Still being tracked.</p>
            </div>
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <span className="text-green-400 font-bold">+X.X%</span>
              <p className="text-sm text-slate-400 mt-2">Price is up from entry. The AI's prediction is currently correct.</p>
            </div>
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <span className="text-red-400 font-bold">-X.X%</span>
              <p className="text-sm text-slate-400 mt-2">Price is down from entry. The AI's prediction is currently wrong.</p>
            </div>
            <div className="p-4 bg-gray-500/10 border border-gray-500/30 rounded-lg">
              <span className="text-gray-400 font-bold">PENDING</span>
              <p className="text-sm text-slate-400 mt-2">Waiting for price data. Usually resolves within minutes.</p>
            </div>
          </div>
        </div>

        {/* Warning */}
        <div className="bg-amber-900/20 border border-amber-700/50 rounded-xl p-6">
          <div className="flex gap-4">
            <AlertTriangle className="w-8 h-8 text-amber-400 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-bold text-amber-400 mb-2">Important Disclaimer</h3>
              <p className="text-slate-300">
                These AI picks are for educational purposes only. Past performance does not guarantee future results. 
                Never invest money based on AI predictions. Always do your own research and consult financial professionals.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
