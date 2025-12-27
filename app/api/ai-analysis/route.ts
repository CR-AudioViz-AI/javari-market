import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkAccess, deductCredits } from "@/lib/premium-gate";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { symbol, analysisType, userId } = body;

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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
