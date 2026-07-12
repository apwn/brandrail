import { engine } from "@/lib/engine";
import { ensureUserId } from "@/lib/session";

/** Fetch one batch with its items + asset URLs. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const uid = await ensureUserId();
  const res = await engine(`/v0/batches/${encodeURIComponent(id)}`, {}, uid);
  return Response.json(await res.json(), { status: res.status });
}
