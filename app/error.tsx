'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, MessageCircle, Home, Bug, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { triggerJavariHelp } from '@/components/JavariWidget';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to console (could send to error tracking service)
    console.error('Page error:', error);
  }, [error]);

  const handleAskJavari = () => {
    triggerJavariHelp('I encountered an error. Can you help me troubleshoot?');
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="max-w-lg w-full">
        {/* Error Card */}
        <div className="bg-gray-900/80 border border-red-900/50 rounded-2xl p-8 text-center">
          {/* Error Icon */}
          <div className="w-20 h-20 mx-auto mb-6 bg-red-900/30 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-red-400" />
          </div>
          
          {/* Title */}
          <h1 className="text-2xl font-bold text-white mb-2">Something went wrong</h1>
          <p className="text-gray-400 mb-6">
            An unexpected error occurred while loading this page. 
            Our AI assistant Javari can help you troubleshoot!
          </p>
          
          {/* Error Details (in development) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-6 p-4 bg-gray-800 rounded-lg text-left">
              <p className="text-xs text-gray-500 mb-1">Error Details:</p>
              <p className="text-sm text-red-400 font-mono break-all">
                {error.message || 'Unknown error'}
              </p>
              {error.digest && (
                <p className="text-xs text-gray-600 mt-2">
                  Digest: {error.digest}
                </p>
              )}
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => reset()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-xl transition-colors font-medium"
            >
              <RefreshCw className="w-5 h-5" />
              Try Again
            </button>
            
            <button
              onClick={handleAskJavari}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl transition-colors"
            >
              <MessageCircle className="w-5 h-5 text-cyan-400" />
              Ask Javari AI for Help
            </button>
            
            <div className="flex gap-3">
              <button
                onClick={() => window.history.back()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Go Back
              </button>
              <Link 
                href="/"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-colors"
              >
                <Home className="w-4 h-4" />
                Dashboard
              </Link>
            </div>
          </div>
        </div>
        
        {/* Support Link */}
        <div className="mt-6 text-center">
          <a 
            href="https://craudiovizai.com/support"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-cyan-400 transition-colors"
          >
            <Bug className="w-4 h-4" />
            Report this issue to support
          </a>
        </div>
        
        {/* Tips */}
        <div className="mt-8 p-4 bg-gray-900/50 border border-gray-800 rounded-xl">
          <p className="text-sm text-gray-400 mb-2">Quick tips:</p>
          <ul className="text-xs text-gray-500 space-y-1">
            <li>• Try refreshing the page</li>
            <li>• Clear your browser cache</li>
            <li>• Check your internet connection</li>
            <li>• Ask Javari AI for personalized help</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

