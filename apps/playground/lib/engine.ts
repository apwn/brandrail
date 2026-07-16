/** Server-side proxy helpers: the engine URL and API key never reach the client. */
import { createHash } from "node:crypto";

const ENGINE_KEY = process.env.BRANDRAIL_API_KEY;
// shared secret proving this call comes from the trusted proxy (prod only)
const INTERNAL_SECRET = process.env.INTERNAL_SECRET;

function engineUrl(): string {
  const configured = process.env.ENGINE_URL ?? process.env.RENDER_API_URL;
  if (process.env.NODE_ENV === "production" && !configured) {
    throw new Error("ENGINE_URL must be set explicitly in production");
  }
  const value = (configured ?? "http://localhost:4747").replace(/\/$/, "");
  const parsed = new URL(value);
  if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password) {
    throw new Error("ENGINE_URL must be an http(s) URL without embedded credentials");
  }
  return value;
}

export async function engine(path: string, init: RequestInit = {}, userId?: string): Promise<Response> {
  if (process.env.NODE_ENV === "production" && (!INTERNAL_SECRET || INTERNAL_SECRET.length < 24)) {
    throw new Error("INTERNAL_SECRET must be set to at least 24 characters in production");
  }
  return fetch(`${engineUrl()}${path}`, {
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

/** Call the engine without leaking transport failures or non-JSON upstream
 * responses into a browser route. Product routes should always return an
 * actionable JSON error, even while the engine is restarting or times out. */
export async function engineJson(
  path: string,
  init: RequestInit = {},
  userId?: string,
): Promise<{ status: number; data: unknown }> {
  try {
    const res = await engine(path, init, userId);
    const data = await res.json().catch(() => ({
      error: res.ok
        ? "The brand engine returned an unreadable response. Please retry."
        : "The brand engine could not complete this request. Please retry.",
    }));
    return { status: res.status, data };
  } catch (error) {
    const timedOut = error instanceof Error &&
      (error.name === "TimeoutError" || error.name === "AbortError");
    return {
      status: 503,
      data: {
        error: timedOut
          ? "The brand engine timed out. Try a simpler public page or retry in a moment."
          : "The brand engine is temporarily unavailable. Your allowance was not used—please retry in a moment.",
      },
    };
  }
}

/** Pass a self-serve workspace key through to the engine. Used by the hosted
 * stateless MCP endpoint; unlike `engine`, this must never substitute the
 * service credential or a browser-session identity. */
export async function agentEngine(path: string, apiKey: string, init: RequestInit = {}): Promise<Response> {
  if (!/^brk_[a-f0-9]{40}$/.test(apiKey)) return Response.json({ error: "invalid API key" }, { status: 401 });
  return fetch(`${engineUrl()}${path}`, {
    ...init,
    headers: { "content-type": "application/json", "x-api-key": apiKey, "x-brandrail-client": "hosted-mcp/0.4", ...(init.headers ?? {}) },
    signal: init.signal ?? AbortSignal.timeout(120_000),
  });
}

/** Reserve abuse-sensitive work in the engine's durable shared store. Failure
 * is explicit and fail-closed so a storage outage cannot disable protection. */
export async function reserveAbuseLimit(namespace: string, subject: string, limit: number, windowMs: number): Promise<{ ok: boolean; unavailable: boolean; retryAfterMs: number }> {
  const key = createHash("sha256").update(`${namespace}\0${subject}`).digest("hex");
  try {
    const res = await engine("/v0/internal/rate-limit", { method: "POST", body: JSON.stringify({ key, limit, windowMs }), signal: AbortSignal.timeout(5_000) });
    if (!res.ok) return { ok: false, unavailable: true, retryAfterMs: 1_000 };
    const data = await res.json() as { allowed?: boolean; retryAfterMs?: number };
    return { ok: data.allowed === true, unavailable: false, retryAfterMs: Math.max(1, Number(data.retryAfterMs) || windowMs) };
  } catch {
    return { ok: false, unavailable: true, retryAfterMs: 1_000 };
  }
}

export function clientIp(req: Request): string {
  const trustProxy = process.env.VERCEL === "1" || process.env.TRUST_PROXY_HEADERS === "1";
  if (!trustProxy) return "unknown";
  const forwarded = process.env.VERCEL === "1"
    ? req.headers.get("x-vercel-forwarded-for") ?? req.headers.get("x-forwarded-for")
    : req.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || req.headers.get("x-real-ip")?.trim() || "unknown";
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
