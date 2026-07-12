import { engine } from "@/lib/engine";
import { ensureUserId } from "@/lib/session";
export async function GET() {
  const uid = await ensureUserId();
  const res = await engine("/v0/scheduled", {}, uid);
  return Response.json(await res.json(), { status: res.status });
}
