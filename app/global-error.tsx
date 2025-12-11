'use client';

import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-gray-950 text-white min-h-screen flex items-center justify-center p-6">
        <div className="max-w-lg w-full text-center">
          {/* Error Icon */}
          <div className="w-24 h-24 mx-auto mb-6 bg-red-900/30 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-12 h-12 text-red-400" />
          </div>
          
          {/* Title */}
          <h1 className="text-3xl font-bold text-white mb-3">Critical Error</h1>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">
            A critical error occurred in Market Oracle. 
            This might be a temporary issue. Please try again.
          </p>
          
          {/* Error Details */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-8 p-4 bg-gray-900 rounded-lg text-left max-w-md mx-auto">
              <p className="text-xs text-gray-500 mb-1">Error:</p>
              <p className="text-sm text-red-400 font-mono break-all">
                {error.message || 'Unknown error'}
              </p>
            </div>
          )}
          
          {/* Actions */}
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => reset()}
              className="flex items-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-xl transition-colors font-medium"
            >
              <RefreshCw className="w-5 h-5" />
              Try Again
            </button>
            <a 
              href="/"
              className="flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors"
            >
              <Home className="w-5 h-5" />
              Go Home
            </a>
          </div>
          
          {/* Support */}
          <p className="mt-8 text-sm text-gray-600">
            If this persists, please contact{' '}
            <a 
              href="https://craudiovizai.com/support"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:underline"
            >
              support
            </a>
          </p>
        </div>
      </body>
    </html>
  );
}
