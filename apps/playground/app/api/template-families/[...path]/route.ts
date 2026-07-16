import { engine } from "@/lib/engine";
import { ensureUserId } from "@/lib/session";

async function proxy(req: Request, path: string[]) {
  if (!path.length || path.some((part) => !/^[a-z0-9-]+$/.test(part))) return Response.json({ error: "invalid template path" }, { status: 400 });
  const suffix = path.map(encodeURIComponent).join("/");
  const query = new URL(req.url).search;
  const res = await engine(`/v0/template-families/${suffix}${query}`, {
    method: req.method,
    ...(req.method === "GET" || req.method === "HEAD" ? {} : { body: await req.text() || "{}" }),
  }, await ensureUserId());
  return Response.json(await res.json().catch(() => ({ error: "template family request failed" })), { status: res.status });
}

export async function GET(req: Request, context: { params: Promise<{ path: string[] }> }) { return proxy(req, (await context.params).path); }
export async function POST(req: Request, context: { params: Promise<{ path: string[] }> }) { return proxy(req, (await context.params).path); }
export async function DELETE(req: Request, context: { params: Promise<{ path: string[] }> }) { return proxy(req, (await context.params).path); }
