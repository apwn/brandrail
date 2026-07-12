import { engine } from "@/lib/engine";
import { ensureUserId } from "@/lib/session";

/** List connected channels (+ trust setting). */
export async function GET() {
  const uid = await ensureUserId();
  const res = await engine("/v0/channels", {}, uid);
  return Response.json(await res.json(), { status: res.status });
}

/** Connect a channel (verified against the platform before it's stored). */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const uid = await ensureUserId();
  const res = await engine("/v0/channels", { method: "POST", body: JSON.stringify(body) }, uid);
  return Response.json(await res.json(), { status: res.status });
}
