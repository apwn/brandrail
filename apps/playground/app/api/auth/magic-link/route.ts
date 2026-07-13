import { ensureUserId } from "@/lib/session";
import { signMagicToken, sendMagicLink } from "@/lib/magic";

/** Request a sign-in link. The token carries the CURRENT anon session id so
 * the work done before signing in (compiles, renders) survives the login. */
export async function POST(req: Request) {
  const { email } = (await req.json().catch(() => ({}))) as { email?: string };
  if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return Response.json({ error: "a valid email is required" }, { status: 400 });
  }
  const anonId = await ensureUserId();
  const token = signMagicToken(email, anonId);
  const origin = process.env.PUBLIC_URL ?? new URL(req.url).origin;
  const link = `${origin}/api/auth/verify?token=${encodeURIComponent(token)}`;
  const result = await sendMagicLink(email.trim().toLowerCase(), link);
  if (result.error) return Response.json({ error: `couldn't send the link: ${result.error}` }, { status: 502 });
  // dev without a mail provider: hand the link back so the flow stays testable
  return Response.json({ ok: true, sent: result.sent, ...(result.devLink ? { devLink: result.devLink } : {}) });
}
