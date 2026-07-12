import { engine, rateLimitCompile, clientIp } from "@/lib/engine";
import { ensureUserId } from "@/lib/session";

export async function POST(req: Request) {
  const limit = rateLimitCompile(clientIp(req));
  if (!limit.ok) {
    return Response.json(
      { error: "That's 3 compiles today — the rail reopens tomorrow. (Self-host for unlimited runs.)" },
      { status: 429 },
    );
  }
  const body = await req.json().catch(() => null);
  if (!body?.url || typeof body.url !== "string") {
    return Response.json({ error: "url required" }, { status: 400 });
  }
  const uid = await ensureUserId();
  const res = await engine("/v0/compile", { method: "POST", body: JSON.stringify({ url: body.url }) }, uid);
  return Response.json(await res.json(), { status: res.status });
}
