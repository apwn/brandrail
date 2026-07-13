import { engine, rateLimitCompile, clientIp, isVerifiedUser } from "@/lib/engine";
import { ensureUserId } from "@/lib/session";

/** Compile a brand. Anonymous: 3/day per IP. Verified account: 10/day — the
 * account always GIVES something the anonymous session doesn't have. */
export async function POST(req: Request) {
  const uid = await ensureUserId();
  const verified = await isVerifiedUser(uid);
  const max = verified ? 10 : 3;
  const limit = rateLimitCompile(clientIp(req), max);
  if (!limit.ok) {
    return Response.json(
      {
        error: verified
          ? "That's 10 compiles today — the rail reopens tomorrow. (Self-host for unlimited runs.)"
          : "That's 3 compiles today. Sign in (free) for 10/day — or self-host for unlimited runs.",
      },
      { status: 429 },
    );
  }
  const body = await req.json().catch(() => null);
  if (!body?.url || typeof body.url !== "string") {
    return Response.json({ error: "url required" }, { status: 400 });
  }
  const res = await engine("/v0/compile", { method: "POST", body: JSON.stringify({ url: body.url }) }, uid);
  return Response.json(await res.json(), { status: res.status });
}
