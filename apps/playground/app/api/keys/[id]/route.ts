import { engine } from "@/lib/engine";
import { ensureUserId } from "@/lib/session";

/** Revoke an API key. */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const uid = await ensureUserId();
  const res = await engine(`/v0/me/keys/${encodeURIComponent(id)}`, { method: "DELETE" }, uid);
  return Response.json(await res.json(), { status: res.status });
}
