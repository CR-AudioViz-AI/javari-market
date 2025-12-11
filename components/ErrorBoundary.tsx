'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, MessageCircle, Home, Bug } from 'lucide-react';
import Link from 'next/link';
import { triggerJavariHelp } from './JavariWidget';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  handleAskJavari = () => {
    triggerJavariHelp({ 
      topic: 'error help',
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-gray-900/80 border border-red-900/50 rounded-2xl p-8 text-center">
            {/* Error Icon */}
            <div className="w-16 h-16 mx-auto mb-4 bg-red-900/30 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            
            {/* Title */}
            <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
            <p className="text-gray-400 text-sm mb-6">
              An unexpected error occurred. Don't worry, this happens sometimes!
            </p>
            
            {/* Error Details (collapsible in production) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-3 bg-gray-800 rounded-lg text-left">
                <p className="text-xs text-red-400 font-mono break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={this.handleReset}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-colors font-medium"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
              
              <button
                onClick={this.handleAskJavari}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-cyan-400" />
                Ask Javari AI for Help
              </button>
              
              <Link 
                href="/"
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-gray-400 hover:text-white transition-colors"
              >
                <Home className="w-4 h-4" />
                Return to Dashboard
              </Link>
            </div>
            
            {/* Support Link */}
            <div className="mt-6 pt-4 border-t border-gray-800">
              <a 
                href="https://craudiovizai.com/support"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-cyan-400 transition-colors"
              >
                <Bug className="w-3 h-3" />
                Report this issue
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Functional wrapper for use with hooks
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

// Simple error fallback component
export function ErrorFallback({ 
  error, 
  resetErrorBoundary 
}: { 
  error?: Error; 
  resetErrorBoundary?: () => void;
}) {
  return (
    <div className="p-6 bg-red-900/20 border border-red-800/50 rounded-xl">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-medium text-red-400">Error loading content</h3>
          <p className="text-sm text-gray-400 mt-1">
            {error?.message || 'Something went wrong. Please try again.'}
          </p>
          <div className="flex gap-3 mt-3">
            {resetErrorBoundary && (
              <button
                onClick={resetErrorBoundary}
                className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                Retry
              </button>
            )}
            <button
              onClick={() => triggerJavariHelp({ topic: 'error help' })}
              className="text-sm text-gray-400 hover:text-white flex items-center gap-1"
            >
              <MessageCircle className="w-3 h-3" />
              Ask Javari
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ErrorBoundary;
