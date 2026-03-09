import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// Lazy Supabase client — initialized on first request (not at module load time)
let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://kteobfyferrukqeolofj.supabase.co";
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0ZW9iZnlmZXJydWtxZW9sb2ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk1NzUwNjUsImV4cCI6MjA1NTE1MTA2NX0.r3_3bXtqo6VCJqYHijtxdEpXkWyNVGKd67kNQvqkrD4";
    _supabase = createClient(url, key);
  }
  return _supabase!;
}
const supabase = getSupabase();
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
