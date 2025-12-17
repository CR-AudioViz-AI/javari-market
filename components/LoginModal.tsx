'use client';

import { useState } from 'react';
import { X, Mail, Lock, Loader2 } from 'lucide-react';
import { useAuthContext } from './AuthProvider';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { signIn, signInWithEmail, signInWithMagicLink } = useAuthContext();
  const [mode, setMode] = useState<'options' | 'email' | 'magic'>('options');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  if (!isOpen) return null;

  const handleOAuth = async (provider: 'google' | 'github' | 'apple' | 'azure' | 'discord') => {
    try { setError(''); setLoading(true); await signIn(provider); }
    catch (err: any) { setError(err.message || 'Sign in failed'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      if (mode === 'magic') {
        const { error } = await signInWithMagicLink(email);
        if (error) setError(error.message);
        else setMagicLinkSent(true);
      } else {
        const { error } = await signInWithEmail(email, password);
        if (error) setError(error.message);
        else onClose();
      }
    } finally { setLoading(false); }
  };

  const providers = [
    { id: 'google', name: 'Google', bg: 'bg-white hover:bg-gray-100 text-gray-800 border border-gray-300' },
    { id: 'github', name: 'GitHub', bg: 'bg-gray-900 hover:bg-gray-800 text-white' },
    { id: 'apple', name: 'Apple', bg: 'bg-black hover:bg-gray-900 text-white' },
    { id: 'azure', name: 'Microsoft', bg: 'bg-blue-600 hover:bg-blue-700 text-white' },
    { id: 'discord', name: 'Discord', bg: 'bg-indigo-600 hover:bg-indigo-700 text-white' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-700 flex items-center justify-between bg-gradient-to-r from-cyan-500/10 to-blue-500/10">
          <div>
            <h2 className="text-xl font-bold text-white">Sign In</h2>
            <p className="text-sm text-gray-400">Access with your CR AudioViz AI account</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-800"><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="p-6">
          {magicLinkSent ? (
            <div className="text-center py-8">
              <Mail className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Check Your Email</h3>
              <p className="text-gray-400 text-sm">Magic link sent to <strong className="text-white">{email}</strong></p>
              <button onClick={() => { setMagicLinkSent(false); setMode('options'); }} className="mt-4 text-cyan-400 hover:text-cyan-300 text-sm">Use different method</button>
            </div>
          ) : mode === 'options' ? (
            <div className="space-y-3">
              {providers.map(p => (
                <button key={p.id} onClick={() => handleOAuth(p.id as any)} disabled={loading}
                  className={`w-full py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-3 transition-colors ${p.bg} disabled:opacity-50`}>
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : p.name}
                </button>
              ))}
              <div className="relative my-6"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-700"></div></div><div className="relative flex justify-center text-sm"><span className="px-4 bg-gray-900 text-gray-500">or</span></div></div>
              <button onClick={() => setMode('email')} className="w-full py-3 px-4 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-medium flex items-center justify-center gap-2"><Mail className="w-5 h-5" /> Email & Password</button>
              <button onClick={() => setMode('magic')} className="w-full py-3 px-4 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-sm">Magic Link (passwordless)</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm text-gray-400 mb-2">Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none" required /></div>
              {mode === 'email' && <div><label className="block text-sm text-gray-400 mb-2">Password</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none" required /></div>}
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button type="submit" disabled={loading} className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-medium disabled:opacity-50">{loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : mode === 'magic' ? 'Send Magic Link' : 'Sign In'}</button>
              <button type="button" onClick={() => setMode('options')} className="w-full text-gray-400 hover:text-white text-sm">← Back to options</button>
            </form>
          )}
        </div>
        <div className="px-6 py-3 bg-gray-800/50 border-t border-gray-700"><p className="text-xs text-gray-500 text-center">Universal account for all CR AudioViz AI apps</p></div>
      </div>
    </div>
  );
}
