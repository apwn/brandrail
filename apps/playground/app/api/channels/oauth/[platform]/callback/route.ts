import { engine } from "@/lib/engine";
import { ensureUserId } from "@/lib/session";
import { publicOrigin } from "@/lib/origin";

export async function GET(req: Request, { params }: { params: Promise<{ platform: string }> }) {
  const uid = await ensureUserId();
  const { platform } = await params;
  const url = new URL(req.url);
  const origin = publicOrigin(req);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const platformError = url.searchParams.get("error_description") ?? url.searchParams.get("error");
  if (platformError || !code || !state) return Response.redirect(new URL(`/dashboard?channelError=${encodeURIComponent(platformError ?? "OAuth was cancelled")}`, origin));
  const redirectUri = `${origin}/api/channels/oauth/${encodeURIComponent(platform)}/callback`;
  const res = await engine(`/v0/channels/oauth/${encodeURIComponent(platform)}/callback`, { method: "POST", body: JSON.stringify({ code, state, redirectUri }) }, uid);
  const body = (await res.json()) as { error?: string };
  return Response.redirect(new URL(res.ok ? `/dashboard?connected=${encodeURIComponent(platform)}` : `/dashboard?channelError=${encodeURIComponent(body.error ?? "connection failed")}`, origin));
}
