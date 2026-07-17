import { notFound } from "next/navigation";
import { engine } from "@/lib/engine";
import { verifyShareToken } from "@/lib/share";
import { ApprovalWorkspace, type SharedBatch } from "./workspace";

export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params; const share = verifyShareToken(token);
  if (!share) notFound();
  const res = await engine(`/v0/batches/${encodeURIComponent(share.batchId)}`, {}, share.workspaceId);
  if (!res.ok) notFound();
  return <ApprovalWorkspace token={token} initialBatch={await res.json() as SharedBatch} reviewer={share.reviewer} dueAt={share.dueAt} />;
}
