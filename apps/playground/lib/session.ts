import { cookies } from "next/headers";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * A minimal signed-cookie session. The cookie carries the user id, HMAC-signed
 * so it can't be forged into someone else's workspace. Anonymous by default
 * (mint a fresh id on first action); becomes a "claimed" account when the user
 * attaches an email — the id is stable across the claim, so their brands and
 * renders carry over. The engine trusts this id via the `x-brandrail-user`
 * header the proxies forward.
 */
const SECRET = process.env.SESSION_SECRET ?? "brandrail-dev-secret-change-me";
const COOKIE = "brandrail_session";
const YEAR = 60 * 60 * 24 * 365;

function mac(uid: string): string {
  return createHmac("sha256", SECRET).update(uid).digest("base64url");
}
export function signSession(uid: string): string {
  return `${uid}.${mac(uid)}`;
}
function verify(value: string | undefined): string | null {
  if (!value) return null;
  const dot = value.lastIndexOf(".");
  if (dot < 0) return null;
  const uid = value.slice(0, dot);
  const sig = value.slice(dot + 1);
  const expected = mac(uid);
  try {
    if (sig.length === expected.length && timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return uid;
  } catch {
    /* length mismatch */
  }
  return null;
}
function newUid(): string {
  return `u_${randomBytes(12).toString("hex")}`;
}

/** The current session uid, or null. Read-only — safe in server components. */
export async function getUserId(): Promise<string | null> {
  return verify((await cookies()).get(COOKIE)?.value);
}

/** The session uid, minting + setting a new anonymous one if absent. Only call
 * from route handlers / server actions (they may set cookies). */
export async function ensureUserId(): Promise<string> {
  const jar = await cookies();
  const existing = verify(jar.get(COOKIE)?.value);
  if (existing) return existing;
  const uid = newUid();
  jar.set(COOKIE, signSession(uid), { httpOnly: true, sameSite: "lax", path: "/", maxAge: YEAR });
  return uid;
}

/** Drop the session (sign out). The next action mints a fresh anonymous one. */
export async function clearSession(): Promise<void> {
  (await cookies()).delete(COOKIE);
}
