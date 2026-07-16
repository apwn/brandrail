import { engine } from "@/lib/engine";
import { ensureUserId } from "@/lib/session";

async function forward(res: Response) {
  return Response.json(await res.json().catch(() => ({ error: "template family request failed" })), { status: res.status });
}

export async function GET() {
  return forward(await engine("/v0/template-families", {}, await ensureUserId()));
}

export async function POST(req: Request) {
  return forward(await engine("/v0/template-families", { method: "POST", body: await req.text() }, await ensureUserId()));
}
