import { engine } from "@/lib/engine";
import { verifyShareToken } from "@/lib/share";
import { sendWorkspaceNotification } from "@/lib/magic";
import { publicOrigin } from "@/lib/origin";
import { readJsonBody } from "@/lib/request";

async function notifyOwner(workspaceId: string, token: string, req: Request, headline: string, detail: string) {
  const usage = await engine("/v0/me/usage", {}, workspaceId).then((response) => response.ok ? response.json() as Promise<{ user?: { email?: string | null } }> : null).catch(() => null);
  if (!usage?.user?.email) return;
  const origin = publicOrigin(req);
  await sendWorkspaceNotification({ to: usage.user.email, subject: `Brandrail: ${headline}`, headline, detail, link: `${origin}/share/${encodeURIComponent(token)}` });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params; const share = verifyShareToken(token);
  if (!share) return Response.json({ error: "approval link is invalid or expired" }, { status: 401 });
  const parsed = await readJsonBody<{ itemId?: string; action?: string; note?: string }>(req, 64_000);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;
  if (!body.itemId || (body.action !== "approve" && body.action !== "flag")) return Response.json({ error: "itemId and approve/flag action required" }, { status: 400 });
  const res = await engine(`/v0/batches/${encodeURIComponent(share.batchId)}/items/${encodeURIComponent(body.itemId)}`, { method: "PATCH", body: JSON.stringify({ action: body.action, note: body.note, externalApproval: true }) }, share.workspaceId);
  const data = await res.json();
  if (res.ok) await notifyOwner(share.workspaceId, token, req, body.action === "approve" ? "A client approved an asset" : "A client requested changes", body.note?.trim() || `Review item ${body.itemId} was ${body.action === "approve" ? "approved" : "flagged"}.`);
  return Response.json(data, { status: res.status });
}

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params; const share = verifyShareToken(token);
  if (!share) return Response.json({ error: "approval link is invalid or expired" }, { status: 401 });
  const parsed = await readJsonBody<{ author?: string; text?: string; itemId?: string }>(req, 64_000);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;
  const res = await engine(`/v0/batches/${encodeURIComponent(share.batchId)}/comments`, { method: "POST", body: JSON.stringify(body) }, share.workspaceId);
  const data = await res.json();
  if (res.ok) await notifyOwner(share.workspaceId, token, req, `${body.author?.trim() || "A client"} left a comment`, body.text?.trim() || "New feedback is waiting in the approval room.");
  return Response.json(data, { status: res.status });
}
