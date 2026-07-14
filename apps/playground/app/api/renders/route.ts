import { engine } from "@/lib/engine";
import { ensureUserId } from "@/lib/session";

export async function GET(req: Request) {
  const limit = new URL(req.url).searchParams.get("limit") ?? "24";
  const uid = await ensureUserId();
  const res = await engine(`/v0/renders?limit=${encodeURIComponent(limit)}`, {}, uid);
  return Response.json(await res.json(), { status: res.status });
}
