// ============================================================================
// MARKET ORACLE - ROOT LAYOUT
// Wrapped with centralized AuthProvider
// Created: December 15, 2025
// ============================================================================

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Market Oracle AI | Multi-AI Stock Analysis',
  description: 'Get stock predictions from 4 leading AI models with Javari consensus. Part of CR AudioViz AI ecosystem.',
  keywords: 'stock analysis, AI trading, market predictions, GPT-4, Claude, Gemini, Perplexity',
  authors: [{ name: 'CR AudioViz AI' }],
  openGraph: {
    title: 'Market Oracle AI | Multi-AI Stock Analysis',
    description: 'Get stock predictions from 4 leading AI models with Javari consensus.',
    type: 'website',
    url: 'https://marketoracle.craudiovizai.com',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-gray-950 text-white antialiased`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
