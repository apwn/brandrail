import { engine } from "@/lib/engine";
import { getUserId } from "@/lib/session";
import { signShareToken } from "@/lib/share";
import { publicOrigin } from "@/lib/origin";
import { readJsonBody } from "@/lib/request";

export async function POST(req: Request) {
  const uid = await getUserId();
  if (!uid) return Response.json({ error: "sign in first" }, { status: 401 });
  const parsed = await readJsonBody<{ batchId?: string; reviewer?: string; dueAt?: string }>(req, 16_000);
  if (!parsed.ok) return parsed.response;
  const { batchId } = parsed.data;
  if (!batchId) return Response.json({ error: "batchId required" }, { status: 400 });
  const usageRes = await engine("/v0/me/usage", {}, uid);
  const usage = usageRes.ok ? await usageRes.json() as { role: string; workspaceId: string; entitlements: { features: string[] } } : null;
  if (!usage || usage.role !== "owner" || !usage.entitlements.features.includes("team")) return Response.json({ error: "client approval links are an Agency feature" }, { status: 403 });
  const batchRes = await engine(`/v0/batches/${encodeURIComponent(batchId)}`, {}, uid);
  if (!batchRes.ok) return Response.json({ error: "batch not found" }, { status: 404 });
  const reviewer = parsed.data.reviewer?.trim();
  if (reviewer && reviewer.length > 80) return Response.json({ error: "reviewer label is too long" }, { status: 400 });
  const due = parsed.data.dueAt ? new Date(parsed.data.dueAt) : null;
  if (due && (!Number.isFinite(due.getTime()) || due.getTime() <= Date.now())) return Response.json({ error: "due date must be in the future" }, { status: 400 });
  const token = signShareToken(usage.workspaceId, batchId, { ...(reviewer ? { reviewer } : {}), ...(due ? { dueAt: due.toISOString() } : {}) });
  const origin = publicOrigin(req);
  return Response.json({ url: `${origin}/share/${encodeURIComponent(token)}`, expiresInDays: 30, reviewer, dueAt: due?.toISOString() });
}
