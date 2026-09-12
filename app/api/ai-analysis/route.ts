import { readBody } from '@/lib/api/body';
import { NextRequest, NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { checkAccess, deductCredits } from "@/lib/premium-gate";
import { secretKey, supabaseUrl } from "@craudioviz/platform-sdk";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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

export async function POST(request: NextRequest) {
  const supabase = getSupabase()!
  try {
    const parsed = await readBody<Record<string, unknown>>(request);
    if (!parsed.ok) return parsed.response;
    const body = parsed.body as any;
    // userId deliberately not read from the body.
    const { symbol, analysisType } = body;
    const userId = await callerId(request);
    if (!userId) return unauthorised();

    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Map analysis type to feature and cost
    const featureMap: Record<string, { feature: string; credits: number }> = {
      quick: { feature: "ai_analysis_basic", credits: 1 },
      detailed: { feature: "ai_analysis_advanced", credits: 3 },
      comprehensive: { feature: "ai_analysis_premium", credits: 5 },
      prediction: { feature: "price_prediction", credits: 5 },
      portfolio: { feature: "portfolio_analysis", credits: 10 }
    };

    const analysis = featureMap[analysisType] || featureMap.quick;

    // Check access
    const access = await checkAccess(userId, analysis.feature);
    if (!access.allowed) {
      return NextResponse.json({
        error: "Upgrade required",
        reason: access.reason,
        required_credits: analysis.credits
      }, { status: 403 });
    }

    // Deduct credits
    const deducted = await deductCredits(userId, analysis.feature, `AI Analysis: ${symbol} (${analysisType})`);
    if (!deducted) {
      return NextResponse.json({
        error: "Insufficient credits",
        required: analysis.credits
      }, { status: 402 });
    }

    // Get stock data
    const stockResponse = await fetch(
      `https://api.twelvedata.com/quote?symbol=${symbol}&apikey=${process.env.TWELVE_DATA_API_KEY}`
    );
    const stockData = await stockResponse.json();

    // Generate AI analysis using available AI provider
    const aiPrompt = `Analyze ${symbol} stock:
Price: $${stockData.close || "N/A"}
Change: ${stockData.percent_change || "N/A"}%
Volume: ${stockData.volume || "N/A"}

Provide a ${analysisType} analysis including:
1. Technical outlook (support/resistance levels)
2. Sentiment assessment
3. Key risks and opportunities
4. ${analysisType === "prediction" ? "Price prediction for next 7 days" : "Trading recommendation"}

Be specific with numbers and percentages.`;

    // Try Gemini first, fallback to OpenAI
    let aiAnalysis = "";
    try {
      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: aiPrompt }] }]
          })
        }
      );
      const geminiData = await geminiResponse.json();
      aiAnalysis = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } catch {
      // Fallback to OpenAI
      const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: aiPrompt }],
          max_tokens: 1000
        })
      });
      const openaiData = await openaiResponse.json();
      aiAnalysis = openaiData.choices?.[0]?.message?.content || "";
    }

    // Log usage
    await supabase.from("ai_usage_logs").insert({
      user_id: userId,
      feature: analysis.feature,
      symbol,
      credits_used: analysis.credits,
      created_at: new Date().toISOString()
    });

    return NextResponse.json({
      symbol,
      analysisType,
      creditsUsed: analysis.credits,
      stockData: {
        price: stockData.close,
        change: stockData.change,
        percentChange: stockData.percent_change,
        volume: stockData.volume
      },
      analysis: aiAnalysis,
      generatedAt: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'The request could not be completed.', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
