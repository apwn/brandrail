import { engine } from "@/lib/engine";
import { ensureUserId } from "@/lib/session";

export async function GET(_req: Request, context: { params: Promise<{ hash: string }> }) {
  const { hash } = await context.params;
  if (!/^[a-f0-9]{64}$/.test(hash)) return Response.json({ error: "invalid template asset" }, { status: 400 });
  const res = await engine(`/v0/template-assets/${hash}`, {}, await ensureUserId());
  if (!res.ok) return Response.json(await res.json().catch(() => ({ error: "template asset not found" })), { status: res.status });
  return new Response(res.body, {
    status: res.status,
    headers: {
      "content-type": res.headers.get("content-type") ?? "application/octet-stream",
      "cache-control": res.headers.get("cache-control") ?? "private, max-age=31536000, immutable",
      "content-disposition": "inline",
      "x-content-type-options": "nosniff",
    },
  });
}
