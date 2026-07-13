import { engine } from "@/lib/engine";
import { ensureUserId } from "@/lib/session";

/** Run this user's autopilot now: plan → render → queue the week. Slow (it
 * renders a week of content), so give it a generous timeout. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const uid = await ensureUserId();
  const res = await engine("/v0/autopilot/tick", { method: "POST", body: JSON.stringify(body), signal: AbortSignal.timeout(300_000) }, uid);
  return Response.json(await res.json(), { status: res.status });
}
