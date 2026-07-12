import { engine } from "@/lib/engine";
import { ensureUserId } from "@/lib/session";
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const uid = await ensureUserId();
  const res = await engine("/v0/publish", { method: "POST", body: JSON.stringify(body), signal: AbortSignal.timeout(60_000) }, uid);
  return Response.json(await res.json(), { status: res.status });
}
