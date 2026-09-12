import { NextResponse } from "next/server";
import { supabase, getPicks, getAIModels, getOverallStats } from "@/lib/supabase";
import { publishableKey, supabaseUrl } from "@craudioviz/platform-sdk";

export const dynamic = "force-dynamic";

export async function GET() {
  const diagnostics: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    environment: {
      supabaseUrl: supabaseUrl() ? "SET" : "MISSING",
      supabaseKey: publishableKey() ? "SET" : "MISSING",
      urlValue: supabaseUrl()?.substring(0, 30) || "none",
    },
    tests: {},
  };
  
  // Test 1: Direct Supabase query
  try {
    const { data, error, count } = await supabase
      .from("stock_picks")
      .select("*", { count: "exact" })
      .limit(5);
    
    (diagnostics.tests as Record<string, unknown>).directQuery = {
      success: !error,
      count: count,
      picks: data?.length || 0,
      sampleTicker: data?.[0]?.ticker || "none",
      error: error?.message,
    };
  } catch (e: unknown) {
    (diagnostics.tests as Record<string, unknown>).directQuery = { success: false, error: String(e) };
  }
  
  // Test 2: getPicks function
  try {
    const picks = await getPicks({ limit: 5 });
    (diagnostics.tests as Record<string, unknown>).getPicks = {
      success: true,
      count: picks.length,
      sampleTicker: picks[0]?.ticker || "none",
      hasAIInfo: !!picks[0]?.ai_display_name,
    };
  } catch (e: unknown) {
    (diagnostics.tests as Record<string, unknown>).getPicks = { success: false, error: String(e) };
  }
  
  // Test 3: getAIModels
  try {
    const models = await getAIModels();
    (diagnostics.tests as Record<string, unknown>).getAIModels = {
      success: true,
      count: models.length,
      names: models.map(m => m.display_name),
    };
  } catch (e: unknown) {
    (diagnostics.tests as Record<string, unknown>).getAIModels = { success: false, error: String(e) };
  }
  
  // Test 4: getOverallStats
  try {
    const stats = await getOverallStats();
    (diagnostics.tests as Record<string, unknown>).getOverallStats = {
      success: true,
      totalPicks: stats.totalPicks,
      activeModels: stats.activeModels,
    };
  } catch (e: unknown) {
    (diagnostics.tests as Record<string, unknown>).getOverallStats = { success: false, error: String(e) };
  }
  
  return NextResponse.json(diagnostics);
}
