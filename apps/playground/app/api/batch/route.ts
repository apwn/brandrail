import { engine } from "@/lib/engine";
import { ensureUserId } from "@/lib/session";

/** Create a review batch (many briefs across one or more clients). */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!Array.isArray(body?.items) || body.items.length === 0) {
    return Response.json({ error: "items required" }, { status: 400 });
  }
  const uid = await ensureUserId();
  const res = await engine("/v0/batches", {
    method: "POST",
    body: JSON.stringify({ title: body.title, items: body.items, ...(body.runId ? { runId: body.runId } : {}) }),
    signal: AbortSignal.timeout(300_000), // a batch renders many items
  }, uid);
  return Response.json(await res.json(), { status: res.status });
}

/** List the user's batches (summaries with status counts). */
export async function GET() {
  const uid = await ensureUserId();
  const res = await engine("/v0/batches", {}, uid);
  return Response.json(await res.json(), { status: res.status });
}
