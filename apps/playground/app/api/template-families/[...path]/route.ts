import { engine } from "@/lib/engine";
import { ensureUserId } from "@/lib/session";
import { readTextBody } from "@/lib/request";

async function proxy(req: Request, path: string[]) {
  if (!path.length || path.some((part) => !/^[a-z0-9-]+$/.test(part))) return Response.json({ error: "invalid template path" }, { status: 400 });
  const suffix = path.map(encodeURIComponent).join("/");
  const query = new URL(req.url).search;
  const body = req.method === "GET" || req.method === "HEAD" ? null : await readTextBody(req, 1_000_000, true);
  if (body && !body.ok) return body.response;
  const res = await engine(`/v0/template-families/${suffix}${query}`, {
    method: req.method,
    ...(body?.ok ? { body: body.data || "{}" } : {}),
  }, await ensureUserId());
  return Response.json(await res.json().catch(() => ({ error: "template family request failed" })), { status: res.status });
}

export async function GET(req: Request, context: { params: Promise<{ path: string[] }> }) { return proxy(req, (await context.params).path); }
export async function POST(req: Request, context: { params: Promise<{ path: string[] }> }) { return proxy(req, (await context.params).path); }
export async function DELETE(req: Request, context: { params: Promise<{ path: string[] }> }) { return proxy(req, (await context.params).path); }
