import { engine } from "@/lib/engine";
import { ensureUserId } from "@/lib/session";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body?.brand || !body?.brief) {
    return Response.json({ error: "brand and brief required" }, { status: 400 });
  }
  const uid = await ensureUserId();
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
