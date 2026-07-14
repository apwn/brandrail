/** Server-side proxy helpers: the engine URL and API key never reach the client. */

const ENGINE_URL = (process.env.ENGINE_URL ?? process.env.RENDER_API_URL ?? "http://localhost:4747").replace(/\/$/, "");
const ENGINE_KEY = process.env.BRANDRAIL_API_KEY;
// shared secret proving this call comes from the trusted proxy (prod only)
const INTERNAL_SECRET = process.env.INTERNAL_SECRET;

export async function engine(path: string, init: RequestInit = {}, userId?: string): Promise<Response> {
  if (process.env.NODE_ENV === "production" && (!INTERNAL_SECRET || INTERNAL_SECRET.length < 24)) {
    throw new Error("INTERNAL_SECRET must be set to at least 24 characters in production");
  }
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
 * Daily compile cap per IP: 3 anonymous, more with a verified account (the
 * account should always GIVE something). In-memory is fine for V0 (single
 * instance); // V1: move to the shared store when the playground scales out.
 */
const compileHits = new Map<string, { day: string; count: number }>();

export function rateLimitCompile(ip: string, max = 3): { ok: boolean; remaining: number } {
  const day = new Date().toISOString().slice(0, 10);
  const entry = compileHits.get(ip);
  if (!entry || entry.day !== day) {
    compileHits.set(ip, { day, count: 1 });
    return { ok: true, remaining: max - 1 };
  }
  if (entry.count >= max) return { ok: false, remaining: 0 };
  entry.count += 1;
  return { ok: true, remaining: max - entry.count };
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "local";
}

/** Is this session's user email-verified? Gates the "take" actions (publish,
 * export) server-side — the engine stays agent-friendly, the funnel stays real. */
export async function isVerifiedUser(uid: string): Promise<boolean> {
  try {
    const res = await engine(`/v0/users/${encodeURIComponent(uid)}`, {}, uid);
    if (!res.ok) return false;
    const { user } = (await res.json()) as { user?: { email?: string | null; emailVerified?: boolean } };
    return Boolean(user?.email && user.emailVerified);
  } catch {
    return false;
  }
}

export async function getUserAccess(uid: string): Promise<{ verified: boolean; plan: "free" | "studio" | "agency" }> {
  try {
    const res = await engine("/v0/me/usage", {}, uid);
    if (!res.ok) return { verified: false, plan: "free" };
    const data = (await res.json()) as { user?: { emailVerified?: boolean; plan?: "free" | "studio" | "agency" } };
    return { verified: Boolean(data.user?.emailVerified), plan: data.user?.plan ?? "free" };
  } catch {
    return { verified: false, plan: "free" };
  }
}
