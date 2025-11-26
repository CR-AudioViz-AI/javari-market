// app/layout.tsx - Market Oracle Enterprise Layout
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import { 
  Home, TrendingUp, Trophy, BarChart3, Brain, BookOpen, 
  HelpCircle, Zap, MessageCircle, ExternalLink 
} from 'lucide-react';
import JavariWidget from '@/components/JavariWidget';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Market Oracle | AI-Powered Stock Predictions',
  description: 'Watch 5 AI models compete to predict stocks, crypto, and penny stocks. Real-time tracking, leaderboards, and educational insights. Part of the CR AudioViz AI ecosystem.',
  keywords: 'AI stocks, stock predictions, GPT-4, Claude, Gemini, crypto predictions, market analysis',
  authors: [{ name: 'CR AudioViz AI' }],
  openGraph: {
    title: 'Market Oracle | AI Stock Prediction Competition',
    description: '5 AI models compete to predict the market. Who will win?',
    url: 'https://crav-market-oracle.vercel.app',
    siteName: 'Market Oracle',
    type: 'website',
  },
};

// Navigation items
const navItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/hot-picks', label: 'Hot Picks', icon: TrendingUp },
  { href: '/battle', label: 'AI Battle', icon: Trophy },
  { href: '/insights', label: 'Insights', icon: BarChart3 },
  { href: '/learn', label: 'Learn', icon: BookOpen },
];

// CR AudioViz AI ecosystem links
const ecosystemLinks = [
  { name: 'CR AudioViz AI', url: 'https://craudiovizai.com', description: 'Main Platform' },
  { name: 'Javari AI', url: 'https://craudiovizai.com/javari', description: 'AI Assistant' },
  { name: 'VerifyForge', url: 'https://verifyforge-ai.vercel.app', description: 'Testing Platform' },
  { name: 'All Tools', url: 'https://craudiovizai.com/tools', description: '60+ AI Tools' },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-slate-950 text-white min-h-screen flex flex-col`}>
        {/* Top Banner - Ecosystem Link */}
        <div className="bg-gradient-to-r from-cyan-900/50 to-purple-900/50 border-b border-slate-800">
          <div className="container mx-auto px-4 py-2 flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span className="text-slate-300">Part of the</span>
              <a href="https://craudiovizai.com" target="_blank" rel="noopener noreferrer" 
                 className="text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1">
                CR AudioViz AI Ecosystem
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <a href="https://craudiovizai.com/pricing" target="_blank" rel="noopener noreferrer"
                 className="text-slate-400 hover:text-white">Pricing</a>
              <a href="https://craudiovizai.com/support" target="_blank" rel="noopener noreferrer"
                 className="text-slate-400 hover:text-white">Support</a>
            </div>
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-800 sticky top-0 z-40">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="font-bold text-lg">Market Oracle</div>
                  <div className="text-xs text-slate-400">AI Predictions</div>
                </div>
              </Link>

              {/* Nav Links */}
              <div className="hidden md:flex items-center gap-1">
                {navItems.map(item => (
                  <Link key={item.href} href={item.href}
                    className="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-2">
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                ))}
              </div>

              {/* Right Side */}
              <div className="flex items-center gap-3">
                <Link href="/help" 
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Help Center">
                  <HelpCircle className="w-5 h-5" />
                </Link>
                <a href="https://craudiovizai.com/pricing" target="_blank" rel="noopener noreferrer"
                  className="hidden sm:flex px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg text-white font-medium hover:from-cyan-500 hover:to-blue-500 transition-all items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Upgrade
                </a>
              </div>
            </div>
          </div>
        </nav>

        {/* Mobile Navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 z-40">
          <div className="flex justify-around py-2">
            {navItems.slice(0, 4).map(item => (
              <Link key={item.href} href={item.href}
                className="flex flex-col items-center gap-1 px-3 py-2 text-slate-400 hover:text-cyan-400">
                <item.icon className="w-5 h-5" />
                <span className="text-xs">{item.label}</span>
              </Link>
            ))}
            <Link href="/help" className="flex flex-col items-center gap-1 px-3 py-2 text-slate-400 hover:text-cyan-400">
              <HelpCircle className="w-5 h-5" />
              <span className="text-xs">Help</span>
            </Link>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 pb-20 md:pb-0">
          {children}
        </main>

        {/* Footer - Cross Marketing */}
        <footer className="bg-slate-900 border-t border-slate-800 hidden md:block">
          <div className="container mx-auto px-4 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {/* Brand */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                  <div className="font-bold text-lg">Market Oracle</div>
                </div>
                <p className="text-slate-400 text-sm mb-4">
                  AI-powered stock predictions for educational purposes. Watch 5 AI models compete weekly.
                </p>
                <p className="text-xs text-slate-500">
                  Part of CR AudioViz AI, LLC
                </p>
              </div>

              {/* Quick Links */}
              <div>
                <h4 className="font-semibold mb-4">Features</h4>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li><Link href="/hot-picks" className="hover:text-cyan-400">Hot Picks</Link></li>
                  <li><Link href="/battle" className="hover:text-cyan-400">AI Battle</Link></li>
                  <li><Link href="/insights" className="hover:text-cyan-400">Market Insights</Link></li>
                  <li><Link href="/learn" className="hover:text-cyan-400">Learn Trading</Link></li>
                  <li><Link href="/watchlist" className="hover:text-cyan-400">Watchlist</Link></li>
                </ul>
              </div>

              {/* Help */}
              <div>
                <h4 className="font-semibold mb-4">Support</h4>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li><Link href="/help" className="hover:text-cyan-400">Help Center</Link></li>
                  <li><Link href="/help/getting-started" className="hover:text-cyan-400">Getting Started</Link></li>
                  <li><Link href="/help/faq" className="hover:text-cyan-400">FAQ</Link></li>
                  <li><a href="https://craudiovizai.com/support" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400">Contact Support</a></li>
                </ul>
              </div>

              {/* Ecosystem */}
              <div>
                <h4 className="font-semibold mb-4">CR AudioViz AI Ecosystem</h4>
                <ul className="space-y-2 text-sm">
                  {ecosystemLinks.map(link => (
                    <li key={link.name}>
                      <a href={link.url} target="_blank" rel="noopener noreferrer"
                         className="text-slate-400 hover:text-cyan-400 flex items-center gap-2">
                        {link.name}
                        <span className="text-xs text-slate-500">({link.description})</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-sm text-slate-500">
                © {new Date().getFullYear()} CR AudioViz AI, LLC. All rights reserved.
              </p>
              <div className="flex items-center gap-4 text-sm text-slate-500">
                <a href="https://craudiovizai.com/privacy" className="hover:text-slate-300">Privacy</a>
                <a href="https://craudiovizai.com/terms" className="hover:text-slate-300">Terms</a>
                <span className="text-slate-700">|</span>
                <span className="text-yellow-500/80 text-xs">
                  ⚠️ Educational purposes only. Not financial advice.
                </span>
              </div>
            </div>
          </div>
        </footer>

        {/* Javari AI Widget */}
        <JavariWidget />
      </body>
    </html>
  );
}
