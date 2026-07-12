/** Server-side proxy helpers: the engine URL and API key never reach the client. */

const ENGINE_URL = (process.env.ENGINE_URL ?? process.env.RENDER_API_URL ?? "http://localhost:4747").replace(/\/$/, "");
const ENGINE_KEY = process.env.BRANDRAIL_API_KEY;
// shared secret proving this call comes from the trusted proxy (prod only)
const INTERNAL_SECRET = process.env.INTERNAL_SECRET;

export async function engine(path: string, init: RequestInit = {}, userId?: string): Promise<Response> {
  return fetch(`${ENGINE_URL}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(ENGINE_KEY ? { "x-api-key": ENGINE_KEY } : {}),
      // the signed-session user this request acts as (scopes engine storage),
      // proven trusted by the shared internal secret when one is configured
      ...(userId ? { "x-brandrail-user": userId } : {}),
      ...(INTERNAL_SECRET ? { "x-internal-secret": INTERNAL_SECRET } : {}),
      ...(init.headers ?? {}),
    },
    // compile/render are slow calls
    signal: init.signal ?? AbortSignal.timeout(120_000),
  });
}

/**
 * 3 compiles per IP per day. In-memory is fine for V0 (single instance);
 * // V1: move to the shared store when the playground scales out.
 */
const compileHits = new Map<string, { day: string; count: number }>();

export function rateLimitCompile(ip: string): { ok: boolean; remaining: number } {
  const day = new Date().toISOString().slice(0, 10);
  const entry = compileHits.get(ip);
  if (!entry || entry.day !== day) {
    compileHits.set(ip, { day, count: 1 });
    return { ok: true, remaining: 2 };
  }
  if (entry.count >= 3) return { ok: false, remaining: 0 };
  entry.count += 1;
  return { ok: true, remaining: 3 - entry.count };
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "local";
}
