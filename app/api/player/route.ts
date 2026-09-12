// app/api/player/route.ts
// Purpose: a player's own profile and picks - read, create a handle, save picks.
// Date: 2026-09-12
//
// Identity always comes from a verified token, never from the request body.
//
// CR AudioViz AI, LLC · EIN 39-3646201
import { NextResponse } from "next/server";
import { z } from "zod";
import { db, userFromRequest, currentDay } from "@/lib/market/player";
import { MARKET_IDS, MARKETS, pricesFor, type MarketId } from "@/lib/market/battle";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RESERVED = new Set(["admin", "javari", "craudiovizai", "support", "oracle", "market"]);

const ProfileBody = z.object({
  handle: z.string().trim().toLowerCase().regex(/^[a-z0-9_]{3,20}$/, "3-20 letters, numbers or underscores"),
  displayName: z.string().trim().min(1).max(40).regex(/^[^<>{}]*$/, "No angle brackets or braces"),
});
const PickBody = z.object({
  picks: z.array(z.object({
    category: z.enum(["sp500", "nasdaq", "dow", "penny", "crypto"]),
    symbol: z.string().trim().toUpperCase().regex(/^[A-Z0-9.\-]{1,10}$/),
    note: z.string().trim().max(280).optional(),
  })).min(1).max(5),
});

export async function GET(req: Request): Promise<NextResponse> {
  const user = await userFromRequest(req);
  if (!user) return NextResponse.json({ ok: false, error: "Sign in required" }, { status: 401 });
  try {
    const d = db();
    const day = await currentDay();
    const [{ data: profile, error: pErr }, { data: picks, error: kErr }] = await Promise.all([
      d.from("market_players").select("handle, display_name").eq("user_id", user.id).maybeSingle(),
      d.from("market_player_picks").select("category, symbol, note").eq("user_id", user.id).eq("pick_date", day.pickDate),
    ]);
    if (pErr) throw new Error(pErr.message);
    if (kErr) throw new Error(kErr.message);

    // 2026-09-12 (Roy): everyone signed up is in the competition. A first visit enrols
    // you with a handle derived from your email; you can change it, but not opt out of
    // being scored once you have made a pick.
    let enrolled = profile;
    if (!enrolled) {
      const base = (user.email ?? "player").split("@")[0]?.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 14) || "player";
      for (let attempt = 0; attempt < 5 && !enrolled; attempt++) {
        const candidate = attempt === 0 ? base.padEnd(3, "0") : `${base.slice(0, 12)}_${Math.floor(Math.random() * 900 + 100)}`;
        const { data: created, error: cErr } = await d.from("market_players")
          .insert({ user_id: user.id, handle: candidate, display_name: candidate })
          .select("handle, display_name").maybeSingle();
        if (created) enrolled = created;
        else if (cErr && cErr.code !== "23505") throw new Error(cErr.message);
      }
    }
    const mine: Record<string, { symbol: string; note: string | null }> = {};
    for (const p of picks ?? []) mine[String(p.category)] = { symbol: String(p.symbol), note: p.note ? String(p.note) : null };
    return NextResponse.json({
      ok: true, day,
      profile: enrolled ? { handle: enrolled.handle, displayName: enrolled.display_name } : null,
      picks: mine,
      universe: Object.fromEntries(MARKET_IDS.map((m) => [m, { label: MARKETS[m].label, symbols: MARKETS[m].symbols }])),
    });
  } catch (e) {
    console.error(JSON.stringify({ level: "error", msg: "market.player_get_failed", error: e instanceof Error ? e.message : String(e) }));
    return NextResponse.json({ ok: false, error: "Could not load your picks" }, { status: 500 });
  }
}

export async function PUT(req: Request): Promise<NextResponse> {
  const user = await userFromRequest(req);
  if (!user) return NextResponse.json({ ok: false, error: "Sign in required" }, { status: 401 });
  const parsed = ProfileBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid profile" }, { status: 400 });
  const { handle, displayName } = parsed.data;
  if (RESERVED.has(handle)) return NextResponse.json({ ok: false, error: "That handle is reserved" }, { status: 409 });
  try {
    const d = db();
    const { data: taken, error: tErr } = await d.from("market_players").select("user_id").eq("handle", handle).maybeSingle();
    if (tErr) throw new Error(tErr.message);
    if (taken && taken.user_id !== user.id) return NextResponse.json({ ok: false, error: "That handle is taken" }, { status: 409 });
    const { error } = await d.from("market_players").upsert({ user_id: user.id, handle, display_name: displayName, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    if (error) {
      if (error.code === "23505") return NextResponse.json({ ok: false, error: "That handle is taken" }, { status: 409 });
      throw new Error(error.message);
    }
    return NextResponse.json({ ok: true, profile: { handle, displayName } });
  } catch (e) {
    console.error(JSON.stringify({ level: "error", msg: "market.player_profile_failed", error: e instanceof Error ? e.message : String(e) }));
    return NextResponse.json({ ok: false, error: "Could not save your profile" }, { status: 500 });
  }
}

export async function POST(req: Request): Promise<NextResponse> {
  const user = await userFromRequest(req);
  if (!user) return NextResponse.json({ ok: false, error: "Sign in required" }, { status: 401 });
  const parsed = PickBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Invalid picks" }, { status: 400 });

  try {
    const d = db();
    const day = await currentDay();
    if (day.locked) return NextResponse.json({ ok: false, error: "Picks locked at 9:30 AM ET. Come back tomorrow." }, { status: 423 });
    const { data: profile, error: pErr } = await d.from("market_players").select("user_id").eq("user_id", user.id).maybeSingle();
    if (pErr) throw new Error(pErr.message);
    if (!profile) return NextResponse.json({ ok: false, error: "Choose a handle first" }, { status: 409 });

    // Entry price is recorded at save time, from the same feeds the models use.
    const needed = [...new Set(parsed.data.picks.map((p) => p.category))] as MarketId[];
    const priceByMarket = new Map<MarketId, Map<string, number>>();
    for (const m of needed) {
      try { priceByMarket.set(m, await pricesFor(m)); } catch { priceByMarket.set(m, new Map()); }
    }

    const rows = parsed.data.picks.map((p) => {
      const market = p.category as MarketId;
      if (!MARKETS[market].symbols.includes(p.symbol as never)) throw new Error(`${p.symbol} is not in ${MARKETS[market].label}`);
      return {
        user_id: user.id, pick_date: day.pickDate, category: p.category, symbol: p.symbol,
        entry_price: priceByMarket.get(market)?.get(p.symbol) ?? null,
        current_price: priceByMarket.get(market)?.get(p.symbol) ?? null,
        note: p.note ?? null, status: "active", updated_at: new Date().toISOString(),
      };
    });
    const { error } = await d.from("market_player_picks").upsert(rows, { onConflict: "user_id,pick_date,category" });
    if (error) {
      if (/locked/i.test(error.message)) return NextResponse.json({ ok: false, error: "Picks are locked" }, { status: 423 });
      throw new Error(error.message);
    }
    return NextResponse.json({ ok: true, saved: rows.length, lockAt: day.lockAt });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/is not in /.test(msg)) return NextResponse.json({ ok: false, error: msg }, { status: 400 });
    console.error(JSON.stringify({ level: "error", msg: "market.player_picks_failed", error: msg }));
    return NextResponse.json({ ok: false, error: "Could not save your picks" }, { status: 500 });
  }
}
