// app/help/faq/page.tsx
import Link from 'next/link';
import { ArrowLeft, ChevronDown } from 'lucide-react';

const faqs = [
  {
    q: 'Is this real financial advice?',
    a: 'No. Market Oracle is for educational and entertainment purposes only. AI predictions are hypothetical and should not be used for actual trading decisions. Always consult a licensed financial advisor before investing.'
  },
  {
    q: 'How often are picks updated?',
    a: 'New picks are generated every Sunday at 8 AM EST. Price updates happen every 15 minutes during market hours (9 AM - 4 PM EST, Mon-Fri) and every 4 hours on weekends for crypto.'
  },
  {
    q: 'What does the "Target ↑" badge mean?',
    a: 'This shows the AI\'s prediction direction - what they think will happen. The percentage on the right shows actual performance (green for gains, red for losses, gray for no change).'
  },
  {
    q: 'How is P&L calculated?',
    a: 'P&L (Profit/Loss) = ((Current Price - Entry Price) / Entry Price) × 100. Entry price is the actual market price when the AI made the pick.'
  },
  {
    q: 'Which AI is most accurate?',
    a: 'Performance varies by market conditions and category. Check the AI Battle page for current rankings. Historical data shows no AI consistently wins - it changes weekly!'
  },
  {
    q: 'Can I trade based on these picks?',
    a: 'We strongly advise against it. This is an educational simulation. AI predictions are not reliable enough for real trading. Use this to learn about market analysis, not to make investment decisions.'
  },
  {
    q: 'What categories are available?',
    a: 'Three categories: Regular Stocks (large-cap, >$10), Penny Stocks (<$5, higher risk), and Crypto (Bitcoin, Ethereum, etc.). Each AI makes picks in all categories.'
  },
  {
    q: 'How do I contact support?',
    a: 'Visit craudiovizai.com/support or ask Javari AI for help. We typically respond within 24 hours.'
  },
];

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="container mx-auto px-4 py-12">
        <Link href="/help" className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Help Center
        </Link>
        
        <h1 className="text-4xl font-bold mb-4">Frequently Asked Questions</h1>
        <p className="text-xl text-slate-400 mb-12 max-w-3xl">
          Quick answers to common questions about Market Oracle.
        </p>

        <div className="space-y-4 max-w-3xl">
          {faqs.map((faq, i) => (
            <details key={i} className="group bg-slate-900 rounded-xl border border-slate-800">
              <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                <span className="font-semibold pr-4">{faq.q}</span>
                <ChevronDown className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform" />
              </summary>
              <div className="px-6 pb-6 text-slate-400">
                {faq.a}
              </div>
            </details>
          ))}
        </div>

        <div className="mt-12 p-6 bg-gradient-to-r from-cyan-900/30 to-blue-900/30 rounded-xl border border-cyan-800/50">
          <h3 className="text-xl font-bold mb-2">Still have questions?</h3>
          <p className="text-slate-300 mb-4">Our AI assistant Javari can help with any questions about Market Oracle.</p>
          <a href="https://craudiovizai.com/javari" target="_blank" rel="noopener noreferrer"
             className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg font-medium transition-colors">
            Ask Javari AI
          </a>
        </div>
      </div>
    </div>
  );
}
