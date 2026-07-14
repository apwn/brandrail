import { engine, isVerifiedUser } from "@/lib/engine";
import { ensureUserId } from "@/lib/session";

export async function GET(req: Request, { params }: { params: Promise<{ platform: string }> }) {
  const uid = await ensureUserId();
  if (!(await isVerifiedUser(uid))) return Response.redirect(new URL("/login", req.url));
  const { platform } = await params;
  const origin = process.env.PUBLIC_URL ?? new URL(req.url).origin;
  const redirectUri = `${origin}/api/channels/oauth/${encodeURIComponent(platform)}/callback`;
  const res = await engine(`/v0/channels/oauth/${encodeURIComponent(platform)}/start?redirectUri=${encodeURIComponent(redirectUri)}`, {}, uid);
  const body = (await res.json()) as { url?: string; error?: string };
  if (!res.ok || !body.url) return Response.redirect(new URL(`/dashboard?channelError=${encodeURIComponent(body.error ?? "connection unavailable")}`, origin));
  return Response.redirect(body.url);
}
