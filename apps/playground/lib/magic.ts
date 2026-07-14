import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

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
const TTL_MS = 15 * 60 * 1000; // 15 minutes

function magicSecret(): string {
  const value = process.env.SESSION_SECRET;
  if (process.env.NODE_ENV === "production" && (!value || value.length < 32)) {
    throw new Error("SESSION_SECRET must be set to at least 32 characters in production");
  }
  return value ?? "brandrail-dev-secret-change-me";
}

export interface MagicPayload {
  email: string;
  anonId: string;
  exp: number;
  jti: string;
  next?: string;
}

function safeNext(next?: string): string | undefined {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return undefined;
  try {
    const url = new URL(next, "https://brandrail.local");
    if (url.origin !== "https://brandrail.local") return undefined;
    if (url.pathname !== "/dashboard") return undefined;
    const plan = url.searchParams.get("checkout");
    if (plan && plan !== "studio" && plan !== "agency") return undefined;
    return `${url.pathname}${url.search}`;
  } catch {
    return undefined;
  }
}

export function signMagicToken(email: string, anonId: string, now = Date.now(), next?: string): string {
  const body = Buffer.from(JSON.stringify({ email: email.trim().toLowerCase(), anonId, exp: now + TTL_MS, jti: randomBytes(16).toString("hex"), ...(safeNext(next) ? { next: safeNext(next) } : {}) })).toString("base64url");
  const sig = createHmac("sha256", `magic:${magicSecret()}`).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifyMagicToken(token: string, now = Date.now()): MagicPayload | null {
  const dot = token?.lastIndexOf(".") ?? -1;
  if (dot < 0) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = createHmac("sha256", `magic:${magicSecret()}`).update(body).digest("base64url");
  try {
    if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as MagicPayload;
    if (typeof payload.exp !== "number" || payload.exp < now) return null;
    if (typeof payload.email !== "string" || !payload.email.includes("@")) return null;
    if (typeof payload.jti !== "string" || !/^[a-f0-9]{32}$/.test(payload.jti)) return null;
    if (payload.next && safeNext(payload.next) !== payload.next) return null;
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
export async function sendMagicLink(email: string, link: string, options?: { subject?: string; intro?: string; cta?: string }): Promise<SendResult> {
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
        subject: options?.subject ?? "Your Brandrail sign-in link",
        html: [
          `<p>${options?.intro ?? "Click to sign in to Brandrail — this link works once and expires in 15 minutes."}</p>`,
          `<p><a href="${link}" style="display:inline-block;padding:12px 20px;background:#FF4D00;color:#111;font-weight:bold;text-decoration:none">${options?.cta ?? "Sign in to Brandrail →"}</a></p>`,
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

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character] ?? character);
}

/** Best-effort operational email. Product actions never fail because the mail
 * provider is absent or temporarily unavailable. */
export async function sendWorkspaceNotification(input: { to: string; subject: string; headline: string; detail: string; link: string }): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log(`[brandrail] notification for ${input.to}: ${input.subject} — ${input.link}`);
    return false;
  }
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({
        from: process.env.MAIL_FROM ?? "Brandrail <notifications@brandrail.dev>",
        to: [input.to],
        subject: input.subject,
        html: `<p style="font:12px monospace;letter-spacing:.12em;color:#ff4d00">CLIENT REVIEW</p><h2>${escapeHtml(input.headline)}</h2><p>${escapeHtml(input.detail)}</p><p><a href="${escapeHtml(input.link)}" style="display:inline-block;padding:12px 20px;background:#ff4d00;color:#111;font-weight:bold;text-decoration:none">Open review →</a></p>`,
      }),
      signal: AbortSignal.timeout(15_000),
    });
    return response.ok;
  } catch {
    return false;
  }
}
