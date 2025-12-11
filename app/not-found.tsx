import Link from 'next/link';
import { Home, Search, MessageCircle, ArrowLeft, Map, TrendingUp, Trophy, BarChart3 } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="max-w-lg w-full text-center">
        {/* 404 Graphic */}
        <div className="relative mb-8">
          <div className="text-[150px] font-black text-gray-800/30 leading-none select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 bg-cyan-900/30 rounded-full flex items-center justify-center">
              <Search className="w-12 h-12 text-cyan-400" />
            </div>
          </div>
        </div>
        
        {/* Title */}
        <h1 className="text-2xl font-bold text-white mb-2">Page Not Found</h1>
        <p className="text-gray-400 mb-8">
          The page you're looking for doesn't exist or has been moved.
          Let's get you back on track!
        </p>
        
        {/* Quick Links */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <Link 
            href="/"
            className="flex items-center justify-center gap-2 px-4 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-xl transition-colors font-medium col-span-2"
          >
            <Home className="w-5 h-5" />
            Go to Dashboard
          </Link>
          <Link 
            href="/hot-picks"
            className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors"
          >
            <TrendingUp className="w-4 h-4 text-orange-400" />
            Hot Picks
          </Link>
          <Link 
            href="/battle"
            className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors"
          >
            <Trophy className="w-4 h-4 text-yellow-400" />
            AI Battle
          </Link>
        </div>
        
        {/* Sitemap */}
        <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-xl text-left">
          <p className="text-sm text-gray-400 mb-3 flex items-center gap-2">
            <Map className="w-4 h-4" />
            Popular Pages
          </p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <Link href="/" className="text-gray-500 hover:text-cyan-400 transition-colors">
              Dashboard
            </Link>
            <Link href="/hot-picks" className="text-gray-500 hover:text-cyan-400 transition-colors">
              Hot Picks
            </Link>
            <Link href="/battle" className="text-gray-500 hover:text-cyan-400 transition-colors">
              AI Battle
            </Link>
            <Link href="/insights" className="text-gray-500 hover:text-cyan-400 transition-colors">
              Insights
            </Link>
            <Link href="/portfolio" className="text-gray-500 hover:text-cyan-400 transition-colors">
              Portfolio
            </Link>
            <Link href="/watchlist" className="text-gray-500 hover:text-cyan-400 transition-colors">
              Watchlist
            </Link>
            <Link href="/alerts" className="text-gray-500 hover:text-cyan-400 transition-colors">
              Alerts
            </Link>
            <Link href="/help" className="text-gray-500 hover:text-cyan-400 transition-colors">
              Help
            </Link>
          </div>
        </div>
        
        {/* Javari Help */}
        <p className="mt-6 text-sm text-gray-500">
          Need help? Click the{' '}
          <span className="inline-flex items-center gap-1 text-cyan-400">
            <MessageCircle className="w-3 h-3" />
            Javari AI
          </span>{' '}
          button in the corner.
        </p>
      </div>
    </div>
  );
}
