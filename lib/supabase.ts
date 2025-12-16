// ============================================================================
// MARKET ORACLE - CENTRALIZED SUPABASE CLIENT
// Connects to CR AudioViz AI central database
// CLIENT-SIDE ONLY - No next/headers import
// Created: December 15, 2025
// ============================================================================

import { createClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';

// CENTRALIZED Supabase - same as main website
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kteobfyferrukqeolofj.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Browser client (client-side)
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Create browser client for client components
export function createSupabaseBrowserClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Types for centralized user
export interface CentralUser {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  credits_balance: number;
  subscription_tier: 'free' | 'starter' | 'pro' | 'enterprise';
  created_at: string;
}

// Market Oracle specific types
export type Category = 'regular' | 'penny' | 'crypto' | 'all';
export type Direction = 'UP' | 'DOWN' | 'HOLD';
export type PickStatus = 'active' | 'closed' | 'expired';

export interface AIPick {
  id: string;
  user_id?: string;
  symbol: string;
  company_name: string;
  sector: string;
  ai_model: string;
  direction: Direction;
  confidence: number;
  timeframe: string;
  entry_price: number;
  target_price: number;
  stop_loss: number;
  thesis: string;
  full_reasoning: string;
  key_bullish_factors: string[];
  key_bearish_factors: string[];
  risks: string[];
  catalysts: string[];
  status: PickStatus;
  actual_return?: number;
  created_at: string;
  updated_at: string;
}
