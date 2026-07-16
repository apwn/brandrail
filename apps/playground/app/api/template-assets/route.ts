import { engine } from "@/lib/engine";
import { ensureUserId } from "@/lib/session";
import { readBytesBody } from "@/lib/request";

export async function POST(req: Request) {
  const body = await readBytesBody(req, 12 * 1024 * 1024);
  if (!body.ok) return body.response;
  const type = req.headers.get("content-type") ?? "multipart/form-data";
  const res = await engine("/v0/template-assets", { method: "POST", headers: { "content-type": type }, body: new Uint8Array(body.data).buffer }, await ensureUserId());
  return Response.json(await res.json().catch(() => ({ error: "artwork upload failed" })), { status: res.status });
}
