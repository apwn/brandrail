import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Magic-link auth: the ONLY way an email gets verified. A signed, short-lived
 * token carries {email, anonId, exp}; clicking the emailed link proves the
 * user owns the address. No passwords, nothing stored server-side — the HMAC
 * signature is the state.
 *
 * Sending: Resend (fetch-based, no SDK) when RESEND_API_KEY is set. Without a
 * key (local dev / self-host), the link is printed to the server console and —
 * in non-production only — returned to the client so the flow stays testable.
 */
const SECRET = process.env.SESSION_SECRET ?? "brandrail-dev-secret-change-me";
const TTL_MS = 15 * 60 * 1000; // 15 minutes

export interface MagicPayload {
  email: string;
  anonId: string;
  exp: number;
}

export function signMagicToken(email: string, anonId: string, now = Date.now()): string {
  const body = Buffer.from(JSON.stringify({ email: email.trim().toLowerCase(), anonId, exp: now + TTL_MS })).toString("base64url");
  const sig = createHmac("sha256", `magic:${SECRET}`).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifyMagicToken(token: string, now = Date.now()): MagicPayload | null {
  const dot = token?.lastIndexOf(".") ?? -1;
  if (dot < 0) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = createHmac("sha256", `magic:${SECRET}`).update(body).digest("base64url");
  try {
    if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as MagicPayload;
    if (typeof payload.exp !== "number" || payload.exp < now) return null;
    if (typeof payload.email !== "string" || !payload.email.includes("@")) return null;
    return payload;
  } catch {
    return null;
  }
}

export interface SendResult {
  sent: boolean;
  /** dev-mode only: the link itself, so local flows work without an email provider */
  devLink?: string;
  error?: string;
}

/** Email the magic link. Configured = Resend; unconfigured = console + dev link. */
export async function sendMagicLink(email: string, link: string): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log(`[brandrail] magic link for ${email}: ${link}`);
    return { sent: false, ...(process.env.NODE_ENV !== "production" ? { devLink: link } : {}) };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({
        from: process.env.MAIL_FROM ?? "Brandrail <sign-in@brandrail.dev>",
        to: [email],
        subject: "Your Brandrail sign-in link",
        html: [
          `<p>Click to sign in to Brandrail — this link works once and expires in 15 minutes.</p>`,
          `<p><a href="${link}" style="display:inline-block;padding:12px 20px;background:#FF4D00;color:#111;font-weight:bold;text-decoration:none">Sign in to Brandrail →</a></p>`,
          `<p style="color:#888;font-size:12px">If you didn't request this, ignore it — nothing happens without the click.</p>`,
        ].join(""),
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { message?: string };
      return { sent: false, error: err.message ?? `send failed (${res.status})` };
    }
    return { sent: true };
  } catch (e) {
    return { sent: false, error: (e as Error).message };
  }
}
