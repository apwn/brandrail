import { engine } from "@/lib/engine";
import { ensureUserId } from "@/lib/session";
import { readJsonBody } from "@/lib/request";

/** Autopilot cadences: which brands post how often. */
export async function GET() {
  const uid = await ensureUserId();
  const res = await engine("/v0/me/cadences", {}, uid);
  return Response.json(await res.json(), { status: res.status });
}

export async function PUT(req: Request) {
  const parsed = await readJsonBody(req, 64_000);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;
  const uid = await ensureUserId();
  const res = await engine("/v0/me/cadences", { method: "PUT", body: JSON.stringify(body) }, uid);
  return Response.json(await res.json(), { status: res.status });
}
