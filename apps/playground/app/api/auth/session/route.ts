import { engine } from "@/lib/engine";
import { getUserId } from "@/lib/session";

/** The current user + usage, or null. Read-only (no session is minted here). */
export async function GET() {
  const uid = await getUserId();
  if (!uid) return Response.json({ user: null });
  const res = await engine("/v0/me/usage", {}, uid);
  if (!res.ok) return Response.json({ user: null });
  const data = (await res.json()) as { user: unknown; role: string; workspaceId: string; entitlements: unknown; limit: number; counts: unknown };
  return Response.json({ user: data.user, role: data.role, workspaceId: data.workspaceId, entitlements: data.entitlements, limit: data.limit, counts: data.counts });
}
