import { engine } from "@/lib/engine";
import { ensureUserId } from "@/lib/session";
import { readJsonBody } from "@/lib/request";

export async function POST(req: Request) {
  const parsed = await readJsonBody<{ brand?: string; subject?: string }>(req, 32_000);
  if (!parsed.ok) return parsed.response;
  const { brand, subject } = parsed.data;
  if (!brand || !subject?.trim()) return Response.json({ error: "brand and subject are required" }, { status: 400 });
  const uid = await ensureUserId();
  const res = await engine(`/v0/brands/${encodeURIComponent(brand)}/background`, { method: "POST", body: JSON.stringify({ subject }) }, uid);
  return Response.json(await res.json(), { status: res.status });
}
