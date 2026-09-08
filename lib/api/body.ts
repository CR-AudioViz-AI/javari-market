// lib/api/body.ts
// 2026-09-07
//
// Read a request body, or refuse it.
//
// Seventeen routes in this app read request.json() and used the result without
// checking anything: no 400 on a malformed body, no check that a required field
// was present, no bound on a number that becomes a batch size.
//
// This is deliberately NOT a schema library. zod is already a dependency and is
// the right answer for a route with a known shape - but seventeen bespoke
// schemas written in one pass by somebody who does not know each feature would
// be seventeen guesses. This handles what is true of ALL of them:
//
//   a body that is not JSON is a 400, not a 500
//   a body that is not an object is a 400
//   a required field that is missing is a 400 naming the field
//   a number that controls how much work happens is bounded
//
// A route with a real shape should graduate to zod. This is the floor.

export type BodyResult<T> = { ok: true; body: T } | { ok: false; response: Response };

function bad(message: string, field?: string): Response {
  return new Response(
    JSON.stringify({ error: message, code: 'INVALID_BODY', field }),
    { status: 400, headers: { 'content-type': 'application/json' } },
  );
}

export async function readBody<T extends Record<string, unknown>>(
  request: Request,
  opts: { require?: string[] } = {},
): Promise<BodyResult<T>> {
  let parsed: unknown;
  try {
    parsed = await request.json();
  } catch {
    return { ok: false, response: bad('The body must be valid JSON.') };
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ok: false, response: bad('The body must be a JSON object.') };
  }
  const body = parsed as T;
  for (const field of opts.require ?? []) {
    const v = (body as Record<string, unknown>)[field];
    if (v === undefined || v === null || (typeof v === 'string' && !v.trim())) {
      return { ok: false, response: bad(`${field} is required.`, field) };
    }
  }
  return { ok: true, body };
}

/**
 * Bound a number that decides how much work happens.
 *
 * An unbounded limit from a request body is a denial of service written by the
 * caller: batchSize 1000000 is a valid number and an unavailable service.
 */
export function boundedInt(
  value: unknown,
  { fallback, min = 1, max = 100 }: { fallback: number; min?: number; max?: number },
): number {
  const n = typeof value === 'number' ? value : Number.parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(n)));
}
