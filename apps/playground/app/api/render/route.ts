import { engine, isVerifiedUser } from "@/lib/engine";
import { ensureUserId } from "@/lib/session";

const anonymousRestyles = new Map<string, number>();

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body?.brand || !body?.brief) {
    return Response.json({ error: "brand and brief required" }, { status: 400 });
  }
  const uid = await ensureUserId();
  const isRestyle = Array.isArray(body.formats) && body.formats.length === 1 && Boolean(body.archetype);
  if (isRestyle && !(await isVerifiedUser(uid))) {
    const used = anonymousRestyles.get(uid) ?? 0;
    if (used >= 2) return Response.json({ error: "Sign in free to keep restyling and save this workspace." }, { status: 403 });
    anonymousRestyles.set(uid, used + 1);
  }
  const res = await engine("/v0/render", {
    method: "POST",
    body: JSON.stringify({
      brand: body.brand,
      brief: body.brief,
      ...(body.formats ? { formats: body.formats } : {}),
      ...(body.archetype ? { archetype: body.archetype } : {}),
      ...(body.copy ? { copy: body.copy } : {}),
    }),
  }, uid);
  return Response.json(await res.json(), { status: res.status });
}
