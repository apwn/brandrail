import { engine } from "@/lib/engine";
import { ensureUserId } from "@/lib/session";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { brand?: string; kind?: string; filename?: string; data?: string; weight?: number; notes?: string };
  if (!body.brand) return Response.json({ error: "brand required" }, { status: 400 });
  const uid = await ensureUserId();
  const res = await engine(`/v0/brands/${encodeURIComponent(body.brand)}/assets`, { method: "POST", body: JSON.stringify(body) }, uid);
  return Response.json(await res.json(), { status: res.status });
}
