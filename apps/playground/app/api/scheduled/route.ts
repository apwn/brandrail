import { engine } from "@/lib/engine";
import { ensureUserId } from "@/lib/session";
export async function GET() {
  const uid = await ensureUserId();
  const res = await engine("/v0/scheduled", {}, uid);
  return Response.json(await res.json(), { status: res.status });
}

export async function PATCH(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { id?: string; scheduledAt?: string; text?: string };
  if (!body.id) return Response.json({ error: "id required" }, { status: 400 });
  const uid = await ensureUserId();
  const res = await engine(`/v0/scheduled/${encodeURIComponent(body.id)}`, { method: "PATCH", body: JSON.stringify({ scheduledAt: body.scheduledAt, text: body.text }) }, uid);
  return Response.json(await res.json(), { status: res.status });
}

export async function DELETE(req: Request) {
  const { id } = (await req.json().catch(() => ({}))) as { id?: string };
  if (!id) return Response.json({ error: "id required" }, { status: 400 });
  const uid = await ensureUserId();
  const res = await engine(`/v0/scheduled/${encodeURIComponent(id)}`, { method: "DELETE" }, uid);
  return Response.json(await res.json(), { status: res.status });
}
