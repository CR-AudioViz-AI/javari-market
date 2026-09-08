// lib/api/rate-limit.ts
// 2026-09-07
//
// A per-process limiter for anonymous routes that cost money.
//
// javari-spirits had twelve routes anyone could call that reach a paid AI
// provider, a barcode lookup or an email sender. No account needed, no limit -
// so the ceiling on the bill was somebody's patience.
//
// DELIBERATELY IN MEMORY. A shared store would be better and needs Redis, which
// is a decision and a cost. This holds per serverless instance, so a determined
// caller spread across instances gets more than the stated limit - it raises the
// effort from trivial to deliberate, which is the honest claim.
//
// Returns a Response to send, or null to continue.

const HITS = new Map<string, number[]>();

export function rateLimit(
  request: Request,
  opts: { limit?: number; windowMs?: number; key?: string } = {},
): Response | null {
  const limit = opts.limit ?? 20;
  const windowMs = opts.windowMs ?? 60_000;

  // The first entry of x-forwarded-for is the client; anything after is a proxy
  // the client can append to, so only the first is worth keying on.
  const fwd = request.headers.get('x-forwarded-for') ?? '';
  const ip = fwd.split(',')[0].trim() || 'unknown';
  const key = `${opts.key ?? new URL(request.url).pathname}:${ip}`;

  const now = Date.now();
  const recent = (HITS.get(key) ?? []).filter((t) => now - t < windowMs);

  if (recent.length >= limit) {
    const retry = Math.ceil((windowMs - (now - recent[0])) / 1000);
    return new Response(
      JSON.stringify({
        error: 'Too many requests. Please slow down.',
        code: 'RATE_LIMITED',
        retryAfterSeconds: retry,
      }),
      {
        status: 429,
        headers: { 'content-type': 'application/json', 'retry-after': String(retry) },
      },
    );
  }

  recent.push(now);
  HITS.set(key, recent);

  // Unbounded growth is its own defect: a map keyed on IP grows with every
  // caller and never shrinks.
  if (HITS.size > 5000) {
    for (const [k, v] of HITS) {
      if (v.every((t) => now - t >= windowMs)) HITS.delete(k);
    }
  }
  return null;
}
