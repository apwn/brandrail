import { engine } from "@/lib/engine";
import { ensureUserId } from "@/lib/session";

export async function GET() {
  const uid = await ensureUserId();
  const response = await engine("/v0/campaigns", {}, uid);
  return Response.json(await response.json(), { status: response.status });
}

export async function POST(request: Request) {
  const uid = await ensureUserId();
  const body = await request.json().catch(() => ({}));
  const response = await engine("/v0/campaigns", { method: "POST", body: JSON.stringify(body) }, uid);
  return Response.json(await response.json(), { status: response.status });
}
