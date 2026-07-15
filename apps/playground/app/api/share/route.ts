import { engine } from "@/lib/engine";
import { getUserId } from "@/lib/session";
import { signShareToken } from "@/lib/share";
import { publicOrigin } from "@/lib/origin";
import { readJsonBody } from "@/lib/request";

export async function POST(req: Request) {
  const uid = await getUserId();
  if (!uid) return Response.json({ error: "sign in first" }, { status: 401 });
  const parsed = await readJsonBody<{ batchId?: string }>(req, 16_000);
  if (!parsed.ok) return parsed.response;
  const { batchId } = parsed.data;
  if (!batchId) return Response.json({ error: "batchId required" }, { status: 400 });
  const usageRes = await engine("/v0/me/usage", {}, uid);
  const usage = usageRes.ok ? await usageRes.json() as { role: string; workspaceId: string; entitlements: { features: string[] } } : null;
  if (!usage || usage.role !== "owner" || !usage.entitlements.features.includes("team")) return Response.json({ error: "client approval links are an Agency feature" }, { status: 403 });
  const batchRes = await engine(`/v0/batches/${encodeURIComponent(batchId)}`, {}, uid);
  if (!batchRes.ok) return Response.json({ error: "batch not found" }, { status: 404 });
  const token = signShareToken(usage.workspaceId, batchId);
  const origin = publicOrigin(req);
  return Response.json({ url: `${origin}/share/${encodeURIComponent(token)}`, expiresInDays: 30 });
}
