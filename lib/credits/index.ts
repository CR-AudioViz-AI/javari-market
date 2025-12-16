// ============================================================================
// MARKET ORACLE - CENTRALIZED CREDITS INTEGRATION
// All credit operations go through main CR AudioViz AI system
// SERVER-SIDE ONLY - Use in API routes
// Created: December 15, 2025
// ============================================================================

import { createClient } from '@supabase/supabase-js';

// Create admin client for credit operations
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kteobfyferrukqeolofj.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = SUPABASE_SERVICE_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null;

// Credit costs for Market Oracle operations
export const MARKET_ORACLE_COSTS = {
  SINGLE_AI_ANALYSIS: 2,      // One AI analyzes one stock
  FULL_ANALYSIS: 5,           // All 4 AIs analyze one stock
  JAVARI_CONSENSUS: 1,        // Javari builds consensus (included in full)
  HISTORICAL_DATA: 1,         // Access to historical picks
  EXPORT_REPORT: 3,           // Export detailed PDF report
};

// Check if user has enough credits
export async function checkCredits(userId: string, amount: number): Promise<boolean> {
  if (!supabaseAdmin) {
    console.error('Supabase admin not configured');
    return false;
  }

  const { data, error } = await supabaseAdmin
    .from('user_credits')
    .select('balance')
    .eq('user_id', userId)
    .single();

  if (error || !data) return false;
  return data.balance >= amount;
}

// Deduct credits for an operation
export async function deductCredits(
  userId: string, 
  amount: number, 
  operation: string,
  metadata?: Record<string, any>
): Promise<{ success: boolean; newBalance?: number; error?: string }> {
  if (!supabaseAdmin) {
    return { success: false, error: 'Supabase admin not configured' };
  }

  // First check balance
  const { data: credits, error: checkError } = await supabaseAdmin
    .from('user_credits')
    .select('balance, lifetime_spent')
    .eq('user_id', userId)
    .single();

  if (checkError || !credits) {
    return { success: false, error: 'User credits not found' };
  }

  if (credits.balance < amount) {
    return { success: false, error: 'Insufficient credits' };
  }

  // Deduct credits
  const newBalance = credits.balance - amount;
  const { error: updateError } = await supabaseAdmin
    .from('user_credits')
    .update({ 
      balance: newBalance,
      lifetime_spent: (credits.lifetime_spent || 0) + amount,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);

  if (updateError) {
    return { success: false, error: 'Failed to update credits' };
  }

  // Log transaction
  await supabaseAdmin.from('credit_transactions').insert({
    user_id: userId,
    amount: -amount,
    transaction_type: 'spend',
    app_id: 'market-oracle',
    operation,
    description: `Market Oracle: ${operation}`,
    metadata,
  });

  return { success: true, newBalance };
}

// Refund credits (on error)
export async function refundCredits(
  userId: string,
  amount: number,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  if (!supabaseAdmin) {
    return { success: false, error: 'Supabase admin not configured' };
  }

  const { data: credits } = await supabaseAdmin
    .from('user_credits')
    .select('balance')
    .eq('user_id', userId)
    .single();

  if (!credits) {
    return { success: false, error: 'User not found' };
  }

  const newBalance = credits.balance + amount;
  await supabaseAdmin
    .from('user_credits')
    .update({ balance: newBalance })
    .eq('user_id', userId);

  await supabaseAdmin.from('credit_transactions').insert({
    user_id: userId,
    amount: amount,
    transaction_type: 'refund',
    app_id: 'market-oracle',
    description: `Market Oracle Refund: ${reason}`,
  });

  return { success: true };
}

// Get user's credit balance
export async function getCreditBalance(userId: string): Promise<number> {
  if (!supabaseAdmin) return 0;

  const { data } = await supabaseAdmin
    .from('user_credits')
    .select('balance')
    .eq('user_id', userId)
    .single();

  return data?.balance || 0;
}
