// ============================================================================
// MARKET ORACLE - BRANDED HEADER
// Uses official logo + brand cyan/teal color scheme
// Updated: 2025-12-17
// ============================================================================

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { 
  BarChart3,
  Swords,
  Flame,
  Brain,
  Target,
  Menu,
  X,
  LogIn,
  Home
} from 'lucide-react';
import { useAuthContext } from '@/components/AuthProvider';
import LoginModal from '@/components/LoginModal';
import UserMenu from '@/components/UserMenu';

const NAV_ITEMS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/ai-picks', label: 'Dashboard', icon: BarChart3 },
  { href: '/battle', label: 'AI Battle', icon: Swords },
  { href: '/hot-picks', label: 'Hot Picks', icon: Flame },
  { href: '/insights', label: 'Insights', icon: Brain },
  { href: '/charts', label: 'Charts', icon: Target },
];

export default function Header() {
  const pathname = usePathname();
  const { user, loading } = useAuthContext();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a1929]/95 backdrop-blur-xl border-b border-cyan-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative w-12 h-12 transition-transform group-hover:scale-105">
                <Image
                  src="/market-oracle-logo.png"
                  alt="Market Oracle"
                  width={48}
                  height={48}
                  className="object-contain mo-logo-glow"
                  priority
                />
              </div>
              <div className="hidden sm:flex flex-col">
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold text-[#1B3A4B] dark:text-slate-200">MARKET</span>
                  <span className="text-lg font-bold text-cyan-400">ORACLE</span>
                </div>
                <span className="text-[10px] text-gray-500 -mt-1">AI-Powered Stock Predictions</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || 
                  (item.href !== '/' && pathname.startsWith(item.href));
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        : 'text-gray-400 hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Right Side: Auth + Mobile Menu */}
            <div className="flex items-center gap-3">
              {/* Auth Section */}
              {loading ? (
                <div className="w-8 h-8 rounded-full bg-slate-800 animate-pulse" />
              ) : user ? (
                <UserMenu />
              ) : (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg hover:shadow-cyan-500/25 transition-all text-sm"
                >
                  <LogIn className="w-4 h-4" />
                  <span className="hidden sm:inline">Sign In</span>
                </button>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 text-gray-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-cyan-500/20 bg-[#0a1929]/98 backdrop-blur-xl">
            <nav className="px-4 py-4 space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || 
                  (item.href !== '/' && pathname.startsWith(item.href));
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-cyan-500/20 text-cyan-400'
                        : 'text-gray-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                );
              })}
              
              {/* Additional Mobile Links */}
              <div className="border-t border-cyan-500/20 mt-4 pt-4 space-y-1">
                <Link
                  href="/backtesting"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-slate-800"
                >
                  Backtesting
                </Link>
                <Link
                  href="/portfolio"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-slate-800"
                >
                  Portfolio
                </Link>
                <Link
                  href="/watchlist"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-slate-800"
                >
                  Watchlist
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Spacer for fixed header */}
      <div className="h-16" />

      {/* Login Modal */}
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />
    </>
  );
}
