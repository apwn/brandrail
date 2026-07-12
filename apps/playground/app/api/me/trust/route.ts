import { engine } from "@/lib/engine";
import { ensureUserId } from "@/lib/session";
export async function PATCH(req: Request) {
  const body = await req.json().catch(() => ({}));
  const uid = await ensureUserId();
  const res = await engine("/v0/me/trust", { method: "PATCH", body: JSON.stringify(body) }, uid);
  return Response.json(await res.json(), { status: res.status });
}
