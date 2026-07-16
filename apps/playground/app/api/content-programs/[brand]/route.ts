import { engineJson } from "@/lib/engine";
import { readJsonBody } from "@/lib/request";
import { ensureUserId } from "@/lib/session";

export async function PUT(request: Request, { params }: { params: Promise<{ brand: string }> }) {
  const parsed = await readJsonBody(request, 64_000);
  if (!parsed.ok) return parsed.response;
  const uid = await ensureUserId();
  const { brand } = await params;
  const result = await engineJson(`/v0/content-programs/${encodeURIComponent(brand)}`, { method: "PUT", body: JSON.stringify(parsed.data) }, uid);
  return Response.json(result.data, { status: result.status });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ brand: string }> }) {
  const uid = await ensureUserId();
  const { brand } = await params;
  const result = await engineJson(`/v0/content-programs/${encodeURIComponent(brand)}`, { method: "DELETE" }, uid);
  return Response.json(result.data, { status: result.status });
}
