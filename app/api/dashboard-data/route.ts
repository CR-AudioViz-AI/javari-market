import { NextResponse } from "next/server";
import { getPicks, getAIModels, getAIStatistics, getHotPicks, getOverallStats, getRecentWinners } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") || "all";
  
  try {
    const [picksData, modelsData, statsData, hotData, overallData, winnersData] = await Promise.all([
      getPicks({ category: category === "all" ? undefined : category as "regular" | "penny" | "crypto", limit: 500 }),
      getAIModels(),
      getAIStatistics(category === "all" ? undefined : category as "regular" | "penny" | "crypto"),
      getHotPicks(category === "all" ? undefined : category as "regular" | "penny" | "crypto"),
      getOverallStats(),
      getRecentWinners(5),
    ]);
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        picks: picksData,
        aiModels: modelsData,
        aiStats: statsData,
        hotPicks: hotData,
        overallStats: overallData,
        recentWinners: winnersData,
      },
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json({
      success: false,
      error: String(error),
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
