import { engine } from "@/lib/engine";
import { ensureUserId } from "@/lib/session";

export async function GET() {
  const uid = await ensureUserId();
  const res = await engine("/v0/me/webhooks", {}, uid);
  return Response.json(await res.json(), { status: res.status });
}

export async function POST(req: Request) {
  const uid = await ensureUserId();
  const body = await req.json().catch(() => ({}));
  const res = await engine("/v0/me/webhooks", { method: "POST", body: JSON.stringify(body) }, uid);
  return Response.json(await res.json(), { status: res.status });
}
