import { engine } from "@/lib/engine";
import { ensureUserId } from "@/lib/session";
import { readJsonBody } from "@/lib/request";

/** Run this user's autopilot now: plan → render → queue the week. Slow (it
 * renders a week of content), so give it a generous timeout. */
export async function POST(req: Request) {
  const parsed = await readJsonBody(req, 64_000);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;
  const uid = await ensureUserId();
  const res = await engine("/v0/autopilot/tick", { method: "POST", body: JSON.stringify(body), signal: AbortSignal.timeout(300_000) }, uid);
  return Response.json(await res.json(), { status: res.status });
}
