// app/api/consensus/route.ts
// Purpose: where today's models AGREE - computed live from the real picks.
// Date: 2026-09-11 (rewritten)
//
// This route used to serve rows from `market_oracle_consensus_picks`, a table last
// written in December 2025 whose rows name retired models ("gemini", "gpt4",
// "perplexity"). It was publishing nine-month-old agreement as if it were current.
// Consensus is now derived from the live contest: a symbol two or more active models
// picked on the most recent pick date.
//
// CR AudioViz AI, LLC · EIN 39-3646201
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { secretKey, supabaseUrl } from "@craudioviz/platform-sdk";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(): Promise<NextResponse> {
  try {
    const url = supabaseUrl();
    const key = secretKey();
    if (!url || !key) return NextResponse.json({ success: false, error: "Database unavailable" }, { status: 503 });
    const db = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

    const { data: last, error: lErr } = await db.from("stock_picks").select("pick_date").not("javari_request_id", "is", null)
      .order("pick_date", { ascending: false }).limit(1).maybeSingle();
    if (lErr) throw new Error(lErr.message);
    if (!last?.pick_date) return NextResponse.json({ success: true, pickDate: null, consensus: [] });

    const [{ data: picks, error: pErr }, { data: models, error: mErr }] = await Promise.all([
      db.from("stock_picks").select("symbol, confidence, target_price, entry_price, ai_model_id").eq("pick_date", last.pick_date).not("javari_request_id", "is", null),
      db.from("ai_models").select("id, display_name").eq("is_active", true),
    ]);
    if (pErr) throw new Error(pErr.message);
    if (mErr) throw new Error(mErr.message);
    const names = new Map((models ?? []).map((m) => [m.id as string, m.display_name as string]));

    const bySymbol = new Map<string, { models: string[]; confidences: number[]; targets: number[]; entry: number }>();
    for (const p of picks ?? []) {
      const sym = String(p.symbol);
      const e = bySymbol.get(sym) ?? { models: [], confidences: [], targets: [], entry: Number(p.entry_price) };
      e.models.push(names.get(p.ai_model_id as string) ?? "Unknown");
      e.confidences.push(Number(p.confidence));
      e.targets.push(Number(p.target_price));
      bySymbol.set(sym, e);
    }
    const consensus = [...bySymbol.entries()]
      .filter(([, e]) => e.models.length >= 2)
      .map(([symbol, e]) => ({
        symbol,
        agreeing: e.models.length,
        totalModels: (models ?? []).length,
        models: e.models.sort(),
        averageConfidence: Math.round(e.confidences.reduce((a, b) => a + b, 0) / e.confidences.length),
        averageTarget: Number((e.targets.reduce((a, b) => a + b, 0) / e.targets.length).toFixed(2)),
        entryPrice: e.entry,
      }))
      .sort((a, b) => b.agreeing - a.agreeing || b.averageConfidence - a.averageConfidence);

    return NextResponse.json({ success: true, pickDate: last.pick_date, consensus });
  } catch (e) {
    console.error(JSON.stringify({ level: "error", msg: "market.consensus_failed", error: e instanceof Error ? e.message : String(e) }));
    return NextResponse.json({ success: false, error: "Could not compute consensus" }, { status: 500 });
  }
}
