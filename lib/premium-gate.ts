import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { secretKey, supabaseUrl } from "@craudioviz/platform-sdk";

// Lazy Supabase client — initialized on first request (not at module load time)
// ⚠️ _supabase MUST be declared before getSupabase() — TDZ guard
let _supabase: SupabaseClient | null = null;
function getSupabase() {
  // 2026-08-19: this function was CORRUPTED in 27 files, byte-identically.
  // `return _supabase;` had been spliced into the middle of the options object:
  //
  //   return sb.createClient(url, key, { auth: { persistSession: false   return _supabase;
  //   } })
  //
  // The repo did not compile - 102 type errors across 29 files - and every route
  // using it threw "supabase is not defined". javarimarket.com kept serving only
  // because Vercel holds the last successful build; the next push would have
  // failed and stayed failed.
  //
  // Now caches properly, which is what _supabase was always for, and pins
  // no-store: Next 14 caches PostgREST GETs by URL and serves stale rows.
  if (_supabase) return _supabase;
  const sb = require('@supabase/supabase-js');
  const url = supabaseUrl();
  const key = secretKey();
  if (!url || !key) return null;
  _supabase = sb.createClient(url, key, {
    auth: { persistSession: false },
    global: { fetch: (u: RequestInfo | URL, o?: RequestInit) => fetch(u, { ...o, cache: 'no-store' }) },
  });
  return _supabase;
}
export interface UserAccess {
  userId: string;
  tier: "free" | "starter" | "pro" | "enterprise";
  credits: number;
  features: string[];
}

const TIER_FEATURES: Record<string, string[]> = {
  free: ["basic_quotes", "daily_picks_3", "news_summary"],
  starter: ["basic_quotes", "daily_picks_10", "news_summary", "ai_analysis_basic", "price_alerts_5"],
  pro: ["all_quotes", "unlimited_picks", "news_full", "ai_analysis_advanced", "price_alerts_50", "insider_trades", "earnings_calendar", "pattern_scanner"],
  enterprise: ["all_quotes", "unlimited_picks", "news_full", "ai_analysis_premium", "unlimited_alerts", "insider_trades", "earnings_calendar", "pattern_scanner", "api_access", "custom_models", "priority_support"]
};

const FEATURE_COSTS: Record<string, number> = {
  ai_analysis_basic: 1,
  ai_analysis_advanced: 3,
  ai_analysis_premium: 5,
  pattern_scan: 2,
  sentiment_analysis: 2,
  price_prediction: 5,
  portfolio_analysis: 10,
  custom_report: 20
};

export async function checkAccess(userId: string, feature: string): Promise<{ allowed: boolean; reason?: string }> {
  const supabase = getSupabase()!
  // Get user subscription
  const { data: sub } = await supabase
    .from("user_subscriptions")
    .select("plan_id, status")
    .eq("user_id", userId)
    .eq("status", "active")
    .single();

  const tier = sub?.plan_id || "free";
  const allowedFeatures = TIER_FEATURES[tier] || TIER_FEATURES.free;

  // Check if feature is included in tier
  if (allowedFeatures.includes(feature) || allowedFeatures.includes("all_quotes")) {
    return { allowed: true };
  }

  // Check if feature requires credits
  const cost = FEATURE_COSTS[feature];
  if (cost) {
    const { data: credits } = await supabase
      .from("user_credits")
      .select("balance")
      .eq("user_id", userId)
      .single();

    if ((credits?.balance || 0) >= cost) {
      return { allowed: true };
    }
    return { allowed: false, reason: `Requires ${cost} credits (you have ${credits?.balance || 0})` };
  }

  return { allowed: false, reason: `Requires ${tier === "free" ? "Starter" : "Pro"} plan or higher` };
}

export async function deductCredits(userId: string, feature: string, description?: string): Promise<boolean> {
  const supabase = getSupabase()!
  const cost = FEATURE_COSTS[feature];
  if (!cost) return true;

  const { data: credits } = await supabase
    .from("user_credits")
    .select("balance")
    .eq("user_id", userId)
    .single();

  if ((credits?.balance || 0) < cost) return false;

  const newBalance = (credits?.balance || 0) - cost;

  await supabase
    .from("user_credits")
    .update({ balance: newBalance, updated_at: new Date().toISOString() })
    .eq("user_id", userId);

  await supabase
    .from("credit_transactions")
    .insert({
      user_id: userId,
      amount: -cost,
      type: "ai_usage",
      description: description || `Market Oracle: ${feature}`,
      balance_after: newBalance
    });

  return true;
}

export function withPremiumGate(feature: string) {
  return async function gate(request: NextRequest, handler: () => Promise<NextResponse>) {
    const userId = request.headers.get("x-user-id");
    
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const access = await checkAccess(userId, feature);
    if (!access.allowed) {
      return NextResponse.json({ 
        error: "Premium feature", 
        reason: access.reason,
        upgrade_url: "https://craudiovizai.com/pricing"
      }, { status: 403 });
    }

    // Deduct credits if applicable
    const deducted = await deductCredits(userId, feature);
    if (!deducted) {
      return NextResponse.json({ 
        error: "Insufficient credits",
        buy_credits_url: "https://craudiovizai.com/dashboard/credits"
      }, { status: 402 });
    }

    return handler();
  };
}
