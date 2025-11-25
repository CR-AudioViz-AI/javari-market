// components/PromoBanner.tsx - CR AudioViz AI Promotional Banner
'use client';

import { useState } from 'react';
import { X, Sparkles, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function PromoBanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="bg-gradient-to-r from-cyan-600 to-blue-600 border-b border-cyan-500/50 relative">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <Sparkles className="w-5 h-5 text-white animate-pulse hidden sm:block" />
          <p className="text-white text-sm md:text-base">
            <strong className="font-bold">Market Oracle</strong> is powered by CR AudioViz AI - 
            <span className="hidden md:inline"> Explore our complete ecosystem of 60+ AI tools, games, and virtual experiences!</span>
            <span className="md:hidden"> 60+ AI tools available!</span>
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <a
            href="https://craudiovizai.com"
            target="_blank"
            className="bg-white hover:bg-cyan-50 text-cyan-700 px-4 py-2 rounded-lg text-sm font-bold transition-all hover:scale-105 flex items-center gap-2 whitespace-nowrap shadow-lg"
          >
            Explore Now <ExternalLink className="w-4 h-4" />
          </a>
          <button
            onClick={() => setIsVisible(false)}
            className="text-white hover:text-cyan-100 transition-colors"
            aria-label="Close banner"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
