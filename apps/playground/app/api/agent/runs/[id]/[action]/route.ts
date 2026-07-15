import { engineJson } from "@/lib/engine";
import { ensureUserId } from "@/lib/session";

const ACTIONS = new Set(["input", "retry", "cancel", "sync-review"]);

export async function POST(request: Request, { params }: { params: Promise<{ id: string; action: string }> }) {
  const uid = await ensureUserId();
  const { id, action } = await params;
  if (!ACTIONS.has(action)) return Response.json({ error: "unknown run action" }, { status: 404 });
  const body = action === "input" || action === "sync-review" ? await request.json().catch(() => ({})) as { batchId?: string } : {};
  if (action === "sync-review") {
    if (!body.batchId) return Response.json({ error: "review batch is required" }, { status: 400 });
    const result = await engineJson(`/v0/batches/${encodeURIComponent(body.batchId)}/status?runId=${encodeURIComponent(id)}`, {}, uid);
    return Response.json(result.data, { status: result.status });
  }
  const result = await engineJson(`/v0/agent/runs/${encodeURIComponent(id)}/${action}`, { method: "POST", body: JSON.stringify(body) }, uid);
  return Response.json(result.data, { status: result.status });
}
