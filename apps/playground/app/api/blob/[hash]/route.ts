import { engine } from "@/lib/engine";
import { ensureUserId } from "@/lib/session";

/** Proxy pinned brand assets (blob:// photos/logos) so the browser can show
 * them — keeps the engine key server-side, like the rendered-asset proxy. */
export async function GET(_req: Request, { params }: { params: Promise<{ hash: string }> }) {
  const { hash } = await params;
  if (!/^[a-f0-9]{64}$/.test(hash)) return Response.json({ error: "bad hash" }, { status: 400 });
  const uid = await ensureUserId();
  const res = await engine(`/v0/blobs/${hash}`, {}, uid);
  if (!res.ok) return Response.json({ error: "not found" }, { status: res.status });
  return new Response(res.body, {
    headers: {
      "content-type": res.headers.get("content-type") ?? "application/octet-stream",
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}
