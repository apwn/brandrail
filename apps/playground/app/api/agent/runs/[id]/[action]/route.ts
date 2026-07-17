import { engineJson } from "@/lib/engine";
import { ensureUserId } from "@/lib/session";
import { readJsonBody } from "@/lib/request";

const ACTIONS = new Set(["input", "retry", "cancel", "sync-review", "execute-render", "create-review", "complete"]);

export async function POST(request: Request, { params }: { params: Promise<{ id: string; action: string }> }) {
  const uid = await ensureUserId();
  const { id, action } = await params;
  if (!ACTIONS.has(action)) return Response.json({ error: "unknown run action" }, { status: 404 });
  let body: { batchId?: string; [key: string]: unknown } = {};
  if (action === "input" || action === "sync-review") {
    const parsed = await readJsonBody<typeof body>(request, 64_000);
    if (!parsed.ok) return parsed.response;
    body = parsed.data;
  }
  if (action === "sync-review") {
    if (!body.batchId) return Response.json({ error: "review batch is required" }, { status: 400 });
    const result = await engineJson(`/v0/batches/${encodeURIComponent(body.batchId)}/status?runId=${encodeURIComponent(id)}`, {}, uid);
    return Response.json(result.data, { status: result.status });
  }
  if (action === "complete") {
    const result = await engineJson(`/v0/agent/runs/${encodeURIComponent(id)}/complete`, { method: "POST", body: "{}" }, uid);
    return Response.json(result.data, { status: result.status });
  }
  if (action === "execute-render" || action === "create-review") {
    const loaded = await engineJson(`/v0/agent/runs/${encodeURIComponent(id)}`, {}, uid);
    if (loaded.status >= 400) return Response.json(loaded.data, { status: loaded.status });
    const run = (loaded.data as { run?: { objective: string; brand?: string; assetCount: number; renderIds?: string[] } }).run;
    if (!run?.brand) return Response.json({ error: "run has no active brand" }, { status: 409 });
    if (action === "execute-render") {
      const singles = ["li-image", "story", "x-graphic", "og-image"];
      const maximum = Math.max(1, Math.min(8, run.assetCount));
      const formats = maximum <= 4 ? singles.slice(0, maximum) : ["ig-carousel", ...singles.slice(0, maximum - 4)];
      const result = await engineJson("/v0/render", { method: "POST", body: JSON.stringify({ brand: run.brand, brief: run.objective, formats, runId: id }) }, uid);
      return Response.json(result.data, { status: result.status });
    }
    const renderId = run.renderIds?.at(-1);
    if (!renderId) return Response.json({ error: "produce assets before creating review" }, { status: 409 });
    const result = await engineJson("/v0/batches", { method: "POST", body: JSON.stringify({ title: run.objective.slice(0, 120), runId: id, items: [{ brand: run.brand, brief: run.objective, renderId }] }) }, uid);
    return Response.json(result.data, { status: result.status });
  }
  const result = await engineJson(`/v0/agent/runs/${encodeURIComponent(id)}/${action}`, { method: "POST", body: JSON.stringify(body) }, uid);
  return Response.json(result.data, { status: result.status });
}
