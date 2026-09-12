import { rateLimit } from '@/lib/api/rate-limit';
// app/api/auth/sso/consume/route.ts — spend the handoff code, server side
//
// The browser hands this route the opaque code it arrived with. This calls
// craudiovizai.com server to server with the shared secret and gets back a
// single-use sign-in hash.
//
// THE BROWSER MUST NOT CALL CORE DIRECTLY. The reply carries a sign-in hash; a
// hash the page can read, or that rides in a URL, is the same leak as the
// token-in-query-string route this replaced. The hash crosses machines, never
// addresses.
//
// CR AudioViz AI · EIN 39-3646201 · August 2026
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

const CORE_ORIGIN = "https://craudiovizai.com";
const NO_STORE = { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" } as const;

export async function POST(req: NextRequest): Promise<Response> {
  const limited = rateLimit(req);
  if (limited) return limited;

  let body: { code?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Body must be JSON" }, { status: 400, headers: NO_STORE });
  }

  const code = body.code?.trim();
  if (!code) {
    return NextResponse.json({ error: "code is required" }, { status: 400, headers: NO_STORE });
  }

  // Read from env directly: the branded sites do not all carry the platform
  // vault client, and a shared helper that assumes they do would fork.
  const secret = process.env.SSO_SHARED_SECRET;
  if (!secret) {
    // Fail closed AND say so. A misconfigured site must not look like a rejected
    // sign-in, or nobody ever finds out it is misconfigured.
    return NextResponse.json({ error: "Sign-in is not configured on this site" }, { status: 503, headers: NO_STORE });
  }

  try {
    const res = await fetch(`${CORE_ORIGIN}/api/auth/sso/redeem`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-sso-secret": secret },
      body: JSON.stringify({ code, origin: req.nextUrl.origin }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      const detail = (await res.json().catch(() => ({}))) as { error?: string };
      return NextResponse.json(
        { error: detail.error ?? "That sign-in link is no longer valid" },
        { status: res.status === 401 ? 401 : 502, headers: NO_STORE },
      );
    }
    const { tokenHash } = (await res.json()) as { tokenHash: string };
    return NextResponse.json({ tokenHash }, { headers: NO_STORE });
  } catch {
    return NextResponse.json({ error: "Could not reach the sign-in service" }, { status: 502, headers: NO_STORE });
  }
}
