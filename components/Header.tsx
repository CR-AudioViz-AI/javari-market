'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { 
  Menu, X, TrendingUp, Zap, Bitcoin, Trophy, 
  BarChart3, LineChart, Bell, Home, Flame, LogIn
} from 'lucide-react';
import { useAuthContext } from '@/components/AuthProvider';
import UserMenu from '@/components/UserMenu';
import LoginModal from '@/components/LoginModal';

const NAV_ITEMS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/ai-picks', label: 'Dashboard', icon: BarChart3 },
  { href: '/competition', label: 'AI Battle', icon: Trophy },
  { href: '/hot-picks', label: 'Stocks', icon: TrendingUp },
  { href: '/penny-stocks', label: 'Penny Stocks', icon: Zap },
  { href: '/crypto', label: 'Crypto', icon: Bitcoin },
  { href: '/insights', label: 'Insights', icon: LineChart },
  { href: '/alerts', label: 'Alerts', icon: Bell },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const pathname = usePathname();
  const { user, loading: authLoading } = useAuthContext();

  return (
    <>
      <header className="sticky top-0 z-50 bg-gray-950/90 backdrop-blur-xl border-b border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative w-10 h-10">
                <Image
                  src="/market-oracle-logo.png"
                  alt="Market Oracle"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <div className="hidden sm:block">
                <span className="text-lg font-bold text-[#1B3A4B]">MARKET</span>
                <span className="text-lg font-bold text-cyan-400 ml-1">ORACLE</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href || 
                  (item.href !== '/' && pathname?.startsWith(item.href));
                const Icon = item.icon;
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-cyan-500/10 text-cyan-400'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Desktop CTA & Auth */}
            <div className="hidden lg:flex items-center gap-3">
              <Link
                href="/competition"
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <Flame className="w-4 h-4" />
                Live Battle
              </Link>
              
              {/* Auth Section */}
              {authLoading ? (
                <div className="w-8 h-8 rounded-full bg-gray-700 animate-pulse" />
              ) : user ? (
                <UserMenu />
              ) : (
                <button
                  onClick={() => setShowLogin(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-medium rounded-lg hover:shadow-lg transition-all"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-gray-900/95 backdrop-blur-xl border-b border-gray-800/50">
            <nav className="max-w-7xl mx-auto px-4 py-4 space-y-1">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href || 
                  (item.href !== '/' && pathname?.startsWith(item.href));
                const Icon = item.icon;
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-cyan-500/10 text-cyan-400'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                );
              })}
              
              {/* Mobile Auth & CTA */}
              <div className="pt-4 border-t border-gray-800 space-y-2">
                {authLoading ? (
                  <div className="w-full h-12 bg-gray-700 animate-pulse rounded-lg" />
                ) : user ? (
                  <div className="px-4 py-2">
                    <UserMenu />
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setShowLogin(true);
                    }}
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg text-sm font-medium"
                  >
                    <LogIn className="w-5 h-5" />
                    Sign In
                  </button>
                )}
                
                <Link
                  href="/competition"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg text-sm font-medium"
                >
                  <Flame className="w-5 h-5" />
                  Watch Live AI Battle
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>
      
      {/* Login Modal */}
      {showLogin && <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />}
    </>
  );
}
