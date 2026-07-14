import { engine } from "@/lib/engine";
import { ensureUserId } from "@/lib/session";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const uid = await ensureUserId();
  const res = await engine("/v0/me/workspaces/select", { method: "POST", body: JSON.stringify(body) }, uid);
  return Response.json(await res.json(), { status: res.status });
}
