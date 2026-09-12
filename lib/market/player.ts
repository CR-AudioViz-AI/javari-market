// lib/market/player.ts
// Purpose: free player accounts - their profile, their picks, and how they are scored
//   against the models.
// Date: 2026-09-12
//
// Rules (the same ones the NFL app uses, because they work):
//   * a player may change a pick until that day's lock (09:30 ET, market open)
//   * after the lock nothing changes - enforced by a database trigger, not just here
//   * other players' picks stay hidden until the lock, so nobody can copy
//
// CR AudioViz AI, LLC · EIN 39-3646201
import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { secretKey, supabaseUrl } from "@craudioviz/platform-sdk";

export function db(): SupabaseClient {
  const url = supabaseUrl();
  const key = secretKey();
  if (!url || !key) throw new Error("Supabase credentials unavailable");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false }, global: { fetch: (i, init) => fetch(i, { ...init, cache: "no-store" }) } });
}

export async function userFromRequest(req: Request): Promise<{ id: string; email: string | null } | null> {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token || token.length > 4096) return null;
  const { data, error } = await db().auth.getUser(token);
  if (error || !data.user) return null;
  return { id: data.user.id, email: data.user.email ?? null };
}

const ET = "America/New_York";
export const etDate = (d: Date): string => new Intl.DateTimeFormat("en-CA", { timeZone: ET }).format(d);

/** The UTC instant when the Eastern clock reads h:mm on a given Eastern date. */
export function etInstant(dateStr: string, hour: number, minute: number): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  const guess = Date.UTC(y ?? 2026, (m ?? 1) - 1, d ?? 1, hour, minute);
  let t = guess;
  for (let i = 0; i < 3; i++) {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: ET, year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", hourCycle: "h23" }).formatToParts(new Date(t));
    const get = (k: string) => Number(parts.find((p) => p.type === k)?.value ?? 0);
    const shown = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"));
    t += guess - shown;
  }
  return new Date(t);
}

/** Monday of the Eastern week containing this date. */
export function weekStart(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y ?? 2026, (m ?? 1) - 1, d ?? 1));
  const dow = dt.getUTCDay();
  dt.setUTCDate(dt.getUTCDate() - ((dow + 6) % 7));
  return dt.toISOString().slice(0, 10);
}

/** The current trading day row, created on first use with its 09:30 ET lock. */
/** The next Eastern weekday on or after a date (markets are shut at weekends). */
function nextWeekday(dateStr: string): string {
  const dt = new Date(`${dateStr}T12:00:00Z`);
  while (dt.getUTCDay() === 0 || dt.getUTCDay() === 6) dt.setUTCDate(dt.getUTCDate() + 1);
  return dt.toISOString().slice(0, 10);
}

/**
 * The session a player is currently picking for.
 *
 * 2026-09-12: this used to be "today", so from 9:30 AM ET onwards the page was locked
 * and nobody could enter anything until the next morning - including all evening and
 * all weekend. Once a session's lock passes, picking rolls forward to the next trading
 * day, which is what a player expects: you can always put tomorrow's picks in.
 */
export async function currentDay(now = new Date()): Promise<{ pickDate: string; lockAt: string; locked: boolean; weekStart: string }> {
  const d = db();
  const today = etDate(now);
  let pickDate = nextWeekday(today);
  if (pickDate === today && now.getTime() >= etInstant(today, 9, 30).getTime()) {
    const tomorrow = new Date(`${today}T12:00:00Z`);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    pickDate = nextWeekday(tomorrow.toISOString().slice(0, 10));
  }
  const { data: have, error } = await d.from("market_days").select("*").eq("pick_date", pickDate).maybeSingle();
  if (error) throw new Error(`day: ${error.message}`);
  if (have) {
    return { pickDate, lockAt: String(have.lock_at), locked: now.getTime() >= new Date(String(have.lock_at)).getTime(), weekStart: String(have.week_start) };
  }
  const lock = etInstant(pickDate, 9, 30);
  const ws = weekStart(pickDate);
  const { error: insErr } = await d.from("market_days").insert({ pick_date: pickDate, lock_at: lock.toISOString(), week_start: ws });
  if (insErr && insErr.code !== "23505") throw new Error(`day insert: ${insErr.message}`);
  await d.from("market_weeks").upsert({
    week_start: ws,
    week_end: new Date(new Date(`${ws}T00:00:00Z`).getTime() + 6 * 86_400_000).toISOString().slice(0, 10),
    label: `Week of ${new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "short", day: "numeric" }).format(new Date(`${ws}T12:00:00Z`))}`,
  }, { onConflict: "week_start" });
  return { pickDate, lockAt: lock.toISOString(), locked: now.getTime() >= lock.getTime(), weekStart: ws };
}

export type PlayerStanding = { handle: string; displayName: string; picks: number; wins: number; losses: number; winRate: number | null; totalReturn: number };

export async function playerStandings(opts: { weekStart?: string } = {}): Promise<PlayerStanding[]> {
  const d = db();
  let q = d.from("market_player_picks").select("user_id, result, return_percent, status, pick_date, market_players(handle, display_name)");
  if (opts.weekStart) {
    const end = new Date(new Date(`${opts.weekStart}T00:00:00Z`).getTime() + 6 * 86_400_000).toISOString().slice(0, 10);
    q = q.gte("pick_date", opts.weekStart).lte("pick_date", end);
  }
  const { data, error } = await q;
  if (error) throw new Error(`standings: ${error.message}`);
  const byUser = new Map<string, PlayerStanding>();
  for (const row of data ?? []) {
    // supabase-js types an embedded relation as an array; one row comes back per pick.
    const rel = (row as unknown as { market_players?: { handle: string; display_name: string } | { handle: string; display_name: string }[] }).market_players;
    const profile = Array.isArray(rel) ? rel[0] : rel;
    if (!profile) continue;
    const e = byUser.get(profile.handle) ?? { handle: profile.handle, displayName: profile.display_name, picks: 0, wins: 0, losses: 0, winRate: null, totalReturn: 0 };
    e.picks++;
    if (row.status === "closed") {
      if (row.result === "win") e.wins++;
      else if (row.result === "loss") e.losses++;
      e.totalReturn += Number(row.return_percent ?? 0);
    }
    byUser.set(profile.handle, e);
  }
  return [...byUser.values()]
    .map((e) => ({ ...e, winRate: e.wins + e.losses ? (e.wins / (e.wins + e.losses)) * 100 : null, totalReturn: Number(e.totalReturn.toFixed(2)) }))
    .sort((a, b) => (b.winRate ?? -1) - (a.winRate ?? -1) || b.totalReturn - a.totalReturn);
}
