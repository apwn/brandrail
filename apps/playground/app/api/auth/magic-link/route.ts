import { ensureUserId } from "@/lib/session";
import { signMagicToken, sendMagicLink } from "@/lib/magic";
import { clientIp } from "@/lib/engine";

const attempts = new Map<string, { started: number; count: number }>();
function allowed(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const prior = attempts.get(key);
  if (!prior || now - prior.started > windowMs) {
    if (attempts.size > 5_000) attempts.clear();
    attempts.set(key, { started: now, count: 1 });
    return true;
  }
  if (prior.count >= max) return false;
  prior.count += 1;
  return true;
}

/** Request a sign-in link. The token carries the CURRENT anon session id so
 * the work done before signing in (compiles, renders) survives the login. */
export async function POST(req: Request) {
  const { email, next } = (await req.json().catch(() => ({}))) as { email?: string; next?: string };
  if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return Response.json({ error: "a valid email is required" }, { status: 400 });
  }
  const normalized = email.trim().toLowerCase();
  if (!allowed(`ip:${clientIp(req)}`, 10, 15 * 60_000) || !allowed(`email:${normalized}`, 5, 15 * 60_000)) {
    return Response.json({ error: "too many sign-in links requested — try again in 15 minutes" }, { status: 429, headers: { "retry-after": "900" } });
  }
  const anonId = await ensureUserId();
  const token = signMagicToken(normalized, anonId, Date.now(), next);
  const origin = process.env.PUBLIC_URL ?? new URL(req.url).origin;
  const link = `${origin}/api/auth/verify?token=${encodeURIComponent(token)}`;
  const result = await sendMagicLink(normalized, link);
  if (result.error) return Response.json({ error: `couldn't send the link: ${result.error}` }, { status: 502 });
  // dev without a mail provider: hand the link back so the flow stays testable
  return Response.json({ ok: true, sent: result.sent, ...(result.devLink ? { devLink: result.devLink } : {}) });
}
