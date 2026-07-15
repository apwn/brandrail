import { engine } from "@/lib/engine";
import { ensureUserId } from "@/lib/session";
import { readJsonBody } from "@/lib/request";

/** Ask the planner for on-brand post ideas for a compiled brand. */
export async function POST(req: Request) {
  const parsed = await readJsonBody(req);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;
  const uid = await ensureUserId();
  const res = await engine("/v0/plan", { method: "POST", body: JSON.stringify(body), signal: AbortSignal.timeout(90_000) }, uid);
  return Response.json(await res.json(), { status: res.status });
}
