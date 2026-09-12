import { NextRequest, NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
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
// Credit costs for features
const FEATURE_COSTS = {
  ai_prediction: 5,
  detailed_analysis: 10,
  portfolio_optimization: 15,
  sentiment_analysis: 5,
  price_alerts: 2,
  export_report: 3
};

// POST /api/premium/use-feature - Deduct credits for premium feature

/**
 * 2026-09-04: the caller's identity comes from their bearer token, never from the
 * request body or query string.
 *
 * These handlers took a user id from the caller and used it against a
 * SERVICE-ROLE client, which bypasses row level security entirely. Nothing
 * authenticated anybody.
 *
 * On /api/premium/use-feature that meant anyone could SPEND another person's
 * credits by posting their id with a feature name. On /api/challenge it meant
 * reading and writing somebody else's challenge progress.
 *
 * The fix is not to validate the id better. It is to stop accepting one, which
 * removes the whole class rather than each route's version of it.
 */
async function callerId(request: Request): Promise<string | null> {
  const header = request.headers.get('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;
  if (!token) return null;
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const { data, error } = await sb.auth.getUser(token);
    if (error || !data?.user) return null;
    return data.user.id;
  } catch {
    return null;
  }
}

function unauthorised(): NextResponse {
  return NextResponse.json(
    { error: 'Sign in required.', code: 'AUTH_REQUIRED' },
    { status: 401 },
  );
}

export async function POST(req: NextRequest) {
  const supabase = getSupabase()!
  try {
    const body = await req.json();
    // user_id deliberately not read from the body — accepting one is the defect.
    const { feature, metadata } = body;
    const user_id = await callerId(req);
    if (!user_id) return unauthorised();

    if (!feature) {
      return NextResponse.json({ error: "user_id and feature required" }, { status: 400 });
    }

    const cost = FEATURE_COSTS[feature as keyof typeof FEATURE_COSTS];
    if (!cost) {
      return NextResponse.json({ error: "Invalid feature" }, { status: 400 });
    }

    // Check user credits
    const { data: credits, error: creditsError } = await supabase
      .from("user_credits")
      .select("balance")
      .eq("user_id", user_id)
      .single();

    if (creditsError || !credits) {
      return NextResponse.json({ error: "Credits not found" }, { status: 404 });
    }

    if (credits.balance < cost) {
      return NextResponse.json({ 
        error: "Insufficient credits",
        required: cost,
        balance: credits.balance,
        purchase_url: "/pricing"
      }, { status: 402 });
    }

    // Deduct credits using the database function
    const { data: result, error: deductError } = await supabase
      .rpc("deduct_credits", {
        p_user_id: user_id,
        p_amount: cost,
        p_source_app: "market-oracle",
        p_source_action: feature
      });

    if (deductError) {
      return NextResponse.json({ error: deductError.message }, { status: 500 });
    }

    // Log usage
    await supabase.from("javari_usage_analytics").insert({
      user_id,
      app_slug: "market-oracle",
      feature_used: feature,
      credits_used: cost,
      metadata
    });

    return NextResponse.json({
      success: true,
      credits_used: cost,
      new_balance: result?.balance || credits.balance - cost,
      feature
    });

  } catch (error: any) {
    return NextResponse.json({ error: 'The request could not be completed.', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

// GET /api/premium/pricing - Get feature pricing
export async function GET() {
  const supabase = getSupabase()!
  return NextResponse.json({
    features: Object.entries(FEATURE_COSTS).map(([feature, cost]) => ({
      feature,
      cost,
      description: getFeatureDescription(feature)
    })),
    credit_packs: [
      { credits: 100, price: 9.99, bonus: 0 },
      { credits: 500, price: 39.99, bonus: 50 },
      { credits: 1000, price: 69.99, bonus: 150 }
    ]
  });
}

function getFeatureDescription(feature: string): string {
  const descriptions: Record<string, string> = {
    ai_prediction: "AI-powered stock price prediction",
    detailed_analysis: "Comprehensive technical analysis report",
    portfolio_optimization: "AI portfolio rebalancing suggestions",
    sentiment_analysis: "Market sentiment from news & social media",
    price_alerts: "Custom price alert notifications",
    export_report: "Export analysis as PDF report"
  };
  return descriptions[feature] || feature;
}

export const dynamic = "force-dynamic";
