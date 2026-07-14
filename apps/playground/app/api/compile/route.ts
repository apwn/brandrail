import { engine, rateLimitCompile, clientIp, getUserAccess } from "@/lib/engine";
import { ensureUserId } from "@/lib/session";

/** Compile a brand. Anonymous: 3/day per IP. Verified limits follow the plan. */
export async function POST(req: Request) {
  const uid = await ensureUserId();
  const access = await getUserAccess(uid);
  const max = access.verified ? ({ free: 10, studio: 50, agency: 250 } as const)[access.plan] : 3;
  const limit = rateLimitCompile(clientIp(req), max);
  if (!limit.ok) {
    return Response.json(
      {
        error: access.verified
          ? `That's ${max} compiles today on ${access.plan} — the rail reopens tomorrow. (Self-host for unlimited runs.)`
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
