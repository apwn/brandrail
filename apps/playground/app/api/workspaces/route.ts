import { engine } from "@/lib/engine";
import { ensureUserId } from "@/lib/session";
import { readJsonBody } from "@/lib/request";

export async function POST(req: Request) {
  const parsed = await readJsonBody(req, 16_000);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;
  const uid = await ensureUserId();
  const res = await engine("/v0/me/workspaces/select", { method: "POST", body: JSON.stringify(body) }, uid);
  return Response.json(await res.json(), { status: res.status });
}
