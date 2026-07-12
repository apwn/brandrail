import { engine } from "@/lib/engine";
import { ensureUserId } from "@/lib/session";

/** Apply a review action to one item: approve / edit / regenerate / flag. */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> },
) {
  const { id, itemId } = await params;
  const body = await req.json().catch(() => ({}));
  const uid = await ensureUserId();
  const res = await engine(
    `/v0/batches/${encodeURIComponent(id)}/items/${encodeURIComponent(itemId)}`,
    { method: "PATCH", body: JSON.stringify(body), signal: AbortSignal.timeout(120_000) },
    uid,
  );
  return Response.json(await res.json(), { status: res.status });
}
