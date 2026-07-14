import { engine } from "@/lib/engine";
import { ensureUserId } from "@/lib/session";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const uid = await ensureUserId();
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const response = await engine(`/v0/campaigns/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(body) }, uid);
  return Response.json(await response.json(), { status: response.status });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const uid = await ensureUserId();
  const { id } = await params;
  const response = await engine(`/v0/campaigns/${encodeURIComponent(id)}`, { method: "DELETE" }, uid);
  return Response.json(await response.json(), { status: response.status });
}
