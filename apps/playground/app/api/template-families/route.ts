import { engine } from "@/lib/engine";
import { ensureUserId } from "@/lib/session";
import { readTextBody } from "@/lib/request";

async function forward(res: Response) {
  return Response.json(await res.json().catch(() => ({ error: "template family request failed" })), { status: res.status });
}

export async function GET() {
  return forward(await engine("/v0/template-families", {}, await ensureUserId()));
}

export async function POST(req: Request) {
  const body = await readTextBody(req, 1_000_000);
  if (!body.ok) return body.response;
  return forward(await engine("/v0/template-families", { method: "POST", body: body.data }, await ensureUserId()));
}
