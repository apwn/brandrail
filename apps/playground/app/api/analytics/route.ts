import { engine } from "@/lib/engine";
import { ensureUserId } from "@/lib/session";

export async function GET() {
  const uid = await ensureUserId();
  const response = await engine("/v0/analytics", {}, uid);
  return Response.json(await response.json(), { status: response.status });
}

export async function POST() {
  const uid = await ensureUserId();
  const response = await engine("/v0/analytics/refresh", { method: "POST" }, uid);
  return Response.json(await response.json(), { status: response.status });
}
