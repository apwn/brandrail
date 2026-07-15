import { engine } from "@/lib/engine";
import { ensureUserId } from "@/lib/session";
import { readJsonBody } from "@/lib/request";
export async function GET() {
  const uid = await ensureUserId();
  const res = await engine("/v0/scheduled", {}, uid);
  return Response.json(await res.json(), { status: res.status });
}

export async function PATCH(req: Request) {
  const parsed = await readJsonBody<{ id?: string; scheduledAt?: string; text?: string }>(req, 32_000);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;
  if (!body.id) return Response.json({ error: "id required" }, { status: 400 });
  const uid = await ensureUserId();
  const res = await engine(`/v0/scheduled/${encodeURIComponent(body.id)}`, { method: "PATCH", body: JSON.stringify({ scheduledAt: body.scheduledAt, text: body.text }) }, uid);
  return Response.json(await res.json(), { status: res.status });
}

export async function DELETE(req: Request) {
  const parsed = await readJsonBody<{ id?: string }>(req, 16_000);
  if (!parsed.ok) return parsed.response;
  const { id } = parsed.data;
  if (!id) return Response.json({ error: "id required" }, { status: 400 });
  const uid = await ensureUserId();
  const res = await engine(`/v0/scheduled/${encodeURIComponent(id)}`, { method: "DELETE" }, uid);
  return Response.json(await res.json(), { status: res.status });
}
