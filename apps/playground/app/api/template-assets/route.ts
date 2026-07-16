import { engine } from "@/lib/engine";
import { ensureUserId } from "@/lib/session";

export async function POST(req: Request) {
  const length = Number(req.headers.get("content-length") ?? 0);
  if (Number.isFinite(length) && length > 13 * 1024 * 1024) return Response.json({ error: "artwork upload exceeds 12 MB" }, { status: 413 });
  const type = req.headers.get("content-type") ?? "multipart/form-data";
  const res = await engine("/v0/template-assets", { method: "POST", headers: { "content-type": type }, body: await req.arrayBuffer() }, await ensureUserId());
  return Response.json(await res.json().catch(() => ({ error: "artwork upload failed" })), { status: res.status });
}
