// middleware.ts
// Purpose: Pre-launch seal. This app is not public yet. Every request receives
//          the same maintenance page the core platform serves at
//          craudiovizai.com, with a real 503 and noindex - not a banner painted
//          over a live site.
// Access:  append ?bg=<break-glass token> to any URL to open this host for two
//          hours. The token is never stored here, only its SHA-256 hash.
// Note:    Temporary and deliberately self-contained - no imports, no env vars,
//          no network calls, so it cannot fail open. It is replaced by the
//          database-driven gate when this app goes through its own launch.
// CR AudioViz AI, LLC · EIN 39-3646201 · 2026-08-01
import { NextRequest, NextResponse } from "next/server";

const BG_HASH = "521b84d2790ae54266f5a45540fe25600a2d98729be9a33f759ca1b2368f4b46";
const COOKIE = "crav_bypass";
const TITLE = "We're building something worth the wait";
const MESSAGE = "CR AudioViz AI is preparing for launch. Check back soon.";

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function page(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${TITLE} · CR AudioViz AI</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center;
    padding:24px; background:#0a0f1a; color:#e8eef7; line-height:1.6;
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif; }
  main { max-width:34rem; width:100%; text-align:center; }
  .mark { width:64px; height:64px; margin:0 auto 28px; border-radius:16px; display:flex;
    align-items:center; justify-content:center; background:linear-gradient(135deg,#0891b2,#06b6d4);
    font-weight:700; font-size:1.5rem; color:#041016; letter-spacing:-0.02em; }
  h1 { font-size:1.75rem; line-height:1.25; margin:0 0 12px; font-weight:650; }
  p { margin:0 0 12px; color:#a9b8cc; font-size:1.0625rem; }
  footer { margin-top:36px; font-size:0.8125rem; color:#64748b; }
</style>
</head>
<body>
<main role="main">
  <div class="mark" aria-hidden="true">CR</div>
  <h1>${TITLE}</h1>
  <p>${MESSAGE}</p>
  <footer>CR AudioViz AI, LLC</footer>
</main>
</body>
</html>`;
}

export async function middleware(req: NextRequest): Promise<NextResponse> {
  const bg = req.nextUrl.searchParams.get("bg");
  if (bg && (await sha256Hex(bg)) === BG_HASH) {
    const clean = req.nextUrl.clone();
    clean.searchParams.delete("bg");
    const res = NextResponse.redirect(clean);
    res.cookies.set(COOKIE, BG_HASH, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 2 * 60 * 60,
    });
    return res;
  }

  if (req.cookies.get(COOKIE)?.value === BG_HASH) return NextResponse.next();

  return new NextResponse(page(), {
    status: 503,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      "Retry-After": "3600",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
