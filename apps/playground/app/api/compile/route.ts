import { engineJson, rateLimitCompile, refundCompile, clientIp, getUserAccess } from "@/lib/engine";
import { ensureUserId } from "@/lib/session";
import { readJsonBody } from "@/lib/request";

/** Compile a brand. Anonymous: 3/day per IP. Verified limits follow the plan. */
export async function POST(req: Request) {
  const parsed = await readJsonBody<{ url?: string }>(req, 16_000);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;
  if (!body?.url || typeof body.url !== "string") {
    return Response.json({ error: "A public website URL is required." }, { status: 400 });
  }
  let url: URL;
  try {
    url = new URL(body.url.trim());
  } catch {
    return Response.json({ error: "Enter a complete URL, including https://" }, { status: 400 });
  }
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) {
    return Response.json({ error: "Use a public http(s) website URL without embedded credentials." }, { status: 400 });
  }

  const uid = await ensureUserId();
  const access = await getUserAccess(uid);
  const max = access.verified ? ({ free: 10, studio: 50, agency: 250 } as const)[access.plan] : 3;
  const ip = clientIp(req);
  const limit = rateLimitCompile(ip, max);
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
  const result = await engineJson(
    "/v0/compile",
    { method: "POST", body: JSON.stringify({ url: url.toString() }) },
    uid,
  );
  if (result.status >= 400) refundCompile(ip);
  return Response.json(result.data, { status: result.status });
}
