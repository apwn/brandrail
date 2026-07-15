import { engine } from "@/lib/engine";
import { ensureUserId } from "@/lib/session";
import { readJsonBody } from "@/lib/request";

export async function GET() {
  const uid = await ensureUserId();
  const res = await engine("/v0/me/webhooks", {}, uid);
  return Response.json(await res.json(), { status: res.status });
}

export async function POST(req: Request) {
  const uid = await ensureUserId();
  const parsed = await readJsonBody(req, 64_000);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;
  const res = await engine("/v0/me/webhooks", { method: "POST", body: JSON.stringify(body) }, uid);
  return Response.json(await res.json(), { status: res.status });
}
