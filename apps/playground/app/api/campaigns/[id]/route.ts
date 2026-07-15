import { engine } from "@/lib/engine";
import { ensureUserId } from "@/lib/session";
import { readJsonBody } from "@/lib/request";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const uid = await ensureUserId();
  const { id } = await params;
  const parsed = await readJsonBody(request, 128_000);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;
  const response = await engine(`/v0/campaigns/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(body) }, uid);
  return Response.json(await response.json(), { status: response.status });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const uid = await ensureUserId();
  const { id } = await params;
  const response = await engine(`/v0/campaigns/${encodeURIComponent(id)}`, { method: "DELETE" }, uid);
  return Response.json(await response.json(), { status: response.status });
}
