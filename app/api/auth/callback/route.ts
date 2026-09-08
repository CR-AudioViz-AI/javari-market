import { rateLimit } from '@/lib/api/rate-limit';
import { NextRequest, NextResponse } from 'next/server';
import { secretKey, publishableKey, supabaseUrl } from "@craudioviz/platform-sdk";

export const dynamic = "force-dynamic";

// ⚠️ _supabase MUST be declared before getSupabase() — TDZ guard
let _supabase: ReturnType<typeof createClient> | null = null;
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

export const runtime = "nodejs";

const SUPABASE_URL = supabaseUrl();
const SUPABASE_ANON_KEY = publishableKey();


/**
 * 2026-09-03: OPEN REDIRECT FIXED.
 *
 * The previous line was:
 *
 *   return NextResponse.redirect(new URL(redirectTo, requestUrl.origin));
 *
 * `new URL(x, base)` ignores the base entirely when x is absolute, so
 * ?redirect_to=https://attacker.example sent the freshly-authenticated visitor
 * straight there. Javari Verify found it by asking the endpoint to redirect
 * off-origin and reading where it actually pointed.
 *
 * This is the account-takeover class: an attacker sends a victim a link to THIS
 * domain, the victim signs in legitimately, and the code lands with the attacker.
 * Every visible signal in the flow says the site is genuine.
 *
 * Only a relative path is accepted now. Anything carrying a scheme, a host, a
 * backslash or a leading double slash falls back to "/" — a validator that tries
 * to CLEAN a hostile string keeps losing to the next encoding trick, so this one
 * only ever answers yes or no.
 */
function safeRedirectPath(raw: string | null): string {
  if (!raw) return '/';
  // Must start with exactly one slash. Rejects https://evil, //evil and \evil.
  if (!raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) return '/';
  // A scheme anywhere is a rewritten absolute URL, whatever it starts with.
  if (/^[a-z][a-z0-9+.-]*:/i.test(raw)) return '/';
  if (raw.includes('\\')) return '/';
  return raw;
}

export async function GET(request: NextRequest) {
  const limited = rateLimit(request);
  if (limited) return limited;

  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const redirectTo = safeRedirectPath(requestUrl.searchParams.get('redirect_to'));

  if (code) {
    // 2026-08-24: called createClient() with NO IMPORT - a plain ReferenceError,
    // so this route crashed on the first line touching the database. Same class as
    // the 15 undefined calls found across the core expenses module. The file
    // already obtains the SDK via require inside getSupabase(); this call site was
    // missed. Now uses the same runtime import.
    const { createClient: _mk } = require('@supabase/supabase-js');
    const supabase = _mk(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error('Auth callback error:', error);
      return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(error.message)}`, requestUrl.origin));
    }
  }

  return NextResponse.redirect(new URL(redirectTo, requestUrl.origin));
}
