// ============================================================================
// MARKET ORACLE - LOGIN MODAL
// Centralized login with all OAuth providers
// Created: December 15, 2025
// ============================================================================

'use client';

import { useState } from 'react';
import { X, Mail, Lock, Chrome, Github, Apple, Building2, Gamepad2 } from 'lucide-react';
import { useAuthContext } from './AuthProvider';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  redirectTo?: string;
}

export default function LoginModal({ isOpen, onClose, redirectTo = '/ai-picks' }: LoginModalProps) {
  const { signIn, signInWithEmail, signInWithMagicLink, loading } = useAuthContext();
  const [mode, setMode] = useState<'options' | 'email' | 'magic'>('options');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  if (!isOpen) return null;

  const handleOAuthSignIn = async (provider: 'google' | 'github' | 'apple' | 'azure' | 'discord') => {
    try {
      setError('');
      await signIn(provider);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (mode === 'magic') {
      const { error } = await signInWithMagicLink(email);
      if (error) {
        setError(error.message);
      } else {
        setMagicLinkSent(true);
      }
    } else {
      const { error } = await signInWithEmail(email, password);
      if (error) {
        setError(error.message);
      } else {
        onClose();
      }
    }
  };

  const oauthProviders = [
    { id: 'google', name: 'Google', icon: Chrome, color: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300' },
    { id: 'github', name: 'GitHub', icon: Github, color: 'bg-gray-900 hover:bg-gray-800 text-white' },
    { id: 'apple', name: 'Apple', icon: Apple, color: 'bg-black hover:bg-gray-900 text-white' },
    { id: 'azure', name: 'Microsoft', icon: Building2, color: 'bg-blue-600 hover:bg-blue-700 text-white' },
    { id: 'discord', name: 'Discord', icon: Gamepad2, color: 'bg-indigo-600 hover:bg-indigo-700 text-white' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-700 flex items-center justify-between bg-gradient-to-r from-amber-500/10 to-orange-500/10">
          <div>
            <h2 className="text-xl font-bold text-white">Sign In</h2>
            <p className="text-sm text-gray-400">Access Market Oracle with your CR AudioViz AI account</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-800">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6">
          {magicLinkSent ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-amber-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Check Your Email</h3>
              <p className="text-gray-400 text-sm">
                We sent a magic link to <strong className="text-white">{email}</strong>
              </p>
              <button
                onClick={() => { setMagicLinkSent(false); setMode('options'); }}
                className="mt-4 text-amber-400 hover:text-amber-300 text-sm"
              >
                Use a different method
              </button>
            </div>
          ) : mode === 'options' ? (
            <>
              {/* OAuth Providers */}
              <div className="space-y-3 mb-6">
                {oauthProviders.map(provider => (
                  <button
                    key={provider.id}
                    onClick={() => handleOAuthSignIn(provider.id as any)}
                    disabled={loading}
                    className={`w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${provider.color} disabled:opacity-50`}
                  >
                    <provider.icon className="w-5 h-5" />
                    Continue with {provider.name}
                  </button>
                ))}
              </div>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-700" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gray-900 text-gray-500">or</span>
                </div>
              </div>

              {/* Email Options */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setMode('email')}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl text-white font-medium transition-colors"
                >
                  <Lock className="w-4 h-4" />
                  Password
                </button>
                <button
                  onClick={() => setMode('magic')}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl text-white font-medium transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  Magic Link
                </button>
              </div>
            </>
          ) : (
            <form onSubmit={handleEmailSignIn} className="space-y-4">
              <button
                type="button"
                onClick={() => setMode('options')}
                className="text-gray-400 hover:text-white text-sm mb-4"
              >
                ← Back to options
              </button>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-amber-500 focus:outline-none"
                  placeholder="you@example.com"
                  required
                />
              </div>

              {mode === 'email' && (
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-amber-500 focus:outline-none"
                    placeholder="••••••••"
                    required
                  />
                </div>
              )}

              {error && (
                <p className="text-red-400 text-sm">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
              >
                {loading ? 'Signing in...' : mode === 'magic' ? 'Send Magic Link' : 'Sign In'}
              </button>
            </form>
          )}

          {/* Footer */}
          <p className="mt-6 text-center text-xs text-gray-500">
            By signing in, you agree to our Terms of Service and Privacy Policy.
            <br />
            One account for all CR AudioViz AI apps.
          </p>
        </div>
      </div>
    </div>
  );
}
