'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { createSupabaseBrowserClient } from '@/lib/supabase';

type OAuthProvider = 'google' | 'github' | 'apple' | 'azure' | 'discord';
type SubscriptionTier = 'free' | 'starter' | 'pro' | 'enterprise';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  credits: number;
  subscriptionTier: SubscriptionTier;
  loading: boolean;
  signIn: (provider: OAuthProvider) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signInWithMagicLink: (email: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  refreshCredits: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  credits: 0,
  subscriptionTier: 'free',
  loading: true,
  signIn: async () => {},
  signInWithEmail: async () => ({ error: null }),
  signInWithMagicLink: async () => ({ error: null }),
  signOut: async () => {},
  refreshCredits: async () => {},
});

// Export both names for compatibility
export function useAuth() {
  return useContext(AuthContext);
}

export function useAuthContext() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [credits, setCredits] = useState(0);
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>('free');
  const [loading, setLoading] = useState(true);
  
  const supabase = createSupabaseBrowserClient();

  const fetchUserData = async (userId: string) => {
    try {
      // Fetch credits
      const { data: creditsData } = await supabase
        .from('user_credits')
        .select('balance')
        .eq('user_id', userId)
        .single();
      
      if (creditsData) {
        setCredits(creditsData.balance);
      }

      // Fetch subscription tier from profiles or subscriptions table
      const { data: profileData } = await supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('id', userId)
        .single();
      
      if (profileData?.subscription_tier) {
        setSubscriptionTier(profileData.subscription_tier as SubscriptionTier);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const refreshCredits = async () => {
    if (user) {
      await fetchUserData(user.id);
    }
  };

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchUserData(session.user.id);
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
          await fetchUserData(session.user.id);
        } else {
          setCredits(0);
          setSubscriptionTier('free');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (provider: OAuthProvider) => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
    
    if (error) throw error;
  };

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signInWithMagicLink = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setCredits(0);
    setSubscriptionTier('free');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      credits,
      subscriptionTier,
      loading, 
      signIn,
      signInWithEmail,
      signInWithMagicLink,
      signOut, 
      refreshCredits 
    }}>
      {children}
    </AuthContext.Provider>
  );
}
