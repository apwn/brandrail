import { engine } from "@/lib/engine";
import { verifyShareToken } from "@/lib/share";

export async function GET(_req: Request, { params }: { params: Promise<{ token: string; renderId: string; filename: string }> }) {
  const { token, renderId, filename } = await params; const share = verifyShareToken(token);
  if (!share || filename.includes("..")) return Response.json({ error: "invalid link" }, { status: 401 });
  const batchRes = await engine(`/v0/batches/${encodeURIComponent(share.batchId)}`, {}, share.workspaceId);
  if (!batchRes.ok) return Response.json({ error: "batch not found" }, { status: 404 });
  const batch = await batchRes.json() as { items: Array<{ renderId: string; assets: Array<{ filename: string }> }> };
  if (!batch.items.some((item) => item.renderId === renderId && item.assets.some((asset) => asset.filename === filename))) return Response.json({ error: "asset not in this approval" }, { status: 403 });
  const res = await engine(`/v0/renders/${encodeURIComponent(renderId)}/assets/${encodeURIComponent(filename)}`, {}, share.workspaceId);
  if (!res.ok) return Response.json({ error: "asset not found" }, { status: 404 });
  return new Response(res.body, { headers: { "content-type": "image/png", "cache-control": "private, max-age=300", "x-content-type-options": "nosniff" } });
}
