import { engine } from "@/lib/engine";
import { ensureUserId, clearSession } from "@/lib/session";

/** Delete the account: purge the engine-side user + workspace, drop the session. */
export async function DELETE() {
  const uid = await ensureUserId();
  const res = await engine("/v0/me", { method: "DELETE" }, uid);
  if (!res.ok) return Response.json(await res.json(), { status: res.status });
  await clearSession();
  return Response.json({ ok: true });
}
