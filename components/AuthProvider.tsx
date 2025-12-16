'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { createSupabaseBrowserClient } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  credits: number;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshCredits: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  credits: 0,
  loading: true,
  signOut: async () => {},
  refreshCredits: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const supabase = createSupabaseBrowserClient();

  const refreshCredits = async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from('user_credits')
        .select('balance')
        .eq('user_id', user.id)
        .single();
      
      if (data) {
        setCredits(data.balance);
      }
    } catch (error) {
      console.error('Error fetching credits:', error);
    }
  };

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch credits after getting session
          const { data } = await supabase
            .from('user_credits')
            .select('balance')
            .eq('user_id', session.user.id)
            .single();
          if (data) setCredits(data.balance);
        }
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          const { data } = await supabase
            .from('user_credits')
            .select('balance')
            .eq('user_id', session.user.id)
            .single();
          if (data) setCredits(data.balance);
        } else {
          setCredits(0);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setCredits(0);
  };

  return (
    <AuthContext.Provider value={{ user, session, credits, loading, signOut, refreshCredits }}>
      {children}
    </AuthContext.Provider>
  );
}
