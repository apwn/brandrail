import { engine } from "@/lib/engine";
import { ensureUserId } from "@/lib/session";

/** Remove a team member's access to this workspace. */
export async function DELETE(_req: Request, { params }: { params: Promise<{ email: string }> }) {
  const { email } = await params;
  const uid = await ensureUserId();
  const res = await engine(`/v0/me/members/${encodeURIComponent(email)}`, { method: "DELETE" }, uid);
  return Response.json(await res.json(), { status: res.status });
}
