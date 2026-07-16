import { ensureUserId } from "@/lib/session";
import { signMagicToken, sendMagicLink } from "@/lib/magic";
import { clientIp, reserveAbuseLimit } from "@/lib/engine";
import { publicOrigin } from "@/lib/origin";
import { readJsonBody } from "@/lib/request";

/** Request a sign-in link. The token carries the CURRENT anon session id so
 * the work done before signing in (compiles, renders) survives the login. */
export async function POST(req: Request) {
  const parsed = await readJsonBody<{ email?: string; next?: string }>(req, 16_000);
  if (!parsed.ok) return parsed.response;
  const { email, next } = parsed.data;
  if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return Response.json({ error: "a valid email is required" }, { status: 400 });
  }
  const normalized = email.trim().toLowerCase();
  const [ipLimit, emailLimit] = await Promise.all([
    reserveAbuseLimit("magic-ip", clientIp(req), 10, 15 * 60_000),
    reserveAbuseLimit("magic-email", normalized, 5, 15 * 60_000),
  ]);
  if (ipLimit.unavailable || emailLimit.unavailable) return Response.json({ error: "Sign-in protection is temporarily unavailable. Please retry shortly." }, { status: 503 });
  if (!ipLimit.ok || !emailLimit.ok) {
    const retryAfter = Math.max(ipLimit.retryAfterMs, emailLimit.retryAfterMs);
    return Response.json({ error: "too many sign-in links requested — try again in 15 minutes" }, { status: 429, headers: { "retry-after": String(Math.max(1, Math.ceil(retryAfter / 1000))) } });
  }
  const anonId = await ensureUserId();
  const token = signMagicToken(normalized, anonId, Date.now(), next);
  const origin = publicOrigin(req);
  const link = `${origin}/api/auth/verify?token=${encodeURIComponent(token)}`;
  const result = await sendMagicLink(normalized, link);
  if (result.error) return Response.json({ error: `couldn't send the link: ${result.error}` }, { status: 502 });
  // dev without a mail provider: hand the link back so the flow stays testable
  return Response.json({ ok: true, sent: result.sent, ...(result.devLink ? { devLink: result.devLink } : {}) });
}
