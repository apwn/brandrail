import { engine } from "@/lib/engine";
import { ensureUserId } from "@/lib/session";
import { sendMagicLink, signMagicToken } from "@/lib/magic";

/** Invite a team member (Agency): their magic-link login lands in this workspace. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const uid = await ensureUserId();
  const res = await engine("/v0/me/members", { method: "POST", body: JSON.stringify(body) }, uid);
  const result = await res.json() as { members?: string[]; invitee?: { id: string; email: string }; error?: string };
  if (!res.ok || !result.invitee) return Response.json(result, { status: res.status });
  const origin = process.env.PUBLIC_URL ?? new URL(req.url).origin;
  const token = signMagicToken(result.invitee.email, result.invitee.id, Date.now(), "/dashboard");
  const link = `${origin}/api/auth/verify?token=${encodeURIComponent(token)}`;
  const sent = await sendMagicLink(result.invitee.email, link, {
    subject: "You were invited to a Brandrail workspace",
    intro: "You have been invited as a reviewer. Open the workspace to inspect BrandSpecs and approve, edit or flag queued work.",
    cta: "Open the workspace →",
  });
  return Response.json({ members: result.members, inviteSent: sent.sent, ...(sent.devLink ? { devLink: sent.devLink } : {}), ...(sent.error ? { warning: sent.error } : {}) }, { status: 201 });
}
