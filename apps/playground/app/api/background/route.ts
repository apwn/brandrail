import { engine } from "@/lib/engine";
import { ensureUserId } from "@/lib/session";

export async function POST(req: Request) {
  const { brand, subject } = (await req.json().catch(() => ({}))) as { brand?: string; subject?: string };
  if (!brand || !subject?.trim()) return Response.json({ error: "brand and subject are required" }, { status: 400 });
  const uid = await ensureUserId();
  const res = await engine(`/v0/brands/${encodeURIComponent(brand)}/background`, { method: "POST", body: JSON.stringify({ subject }) }, uid);
  return Response.json(await res.json(), { status: res.status });
}
