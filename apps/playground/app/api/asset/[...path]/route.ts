import { engine } from "@/lib/engine";
import { ensureUserId } from "@/lib/session";

/** Proxy rendered PNGs (keeps the engine key server-side; scoped to the user). */
export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const [renderId, filename] = path;
  if (!renderId || !filename || filename.includes("..")) {
    return Response.json({ error: "bad path" }, { status: 400 });
  }
  const uid = await ensureUserId();
  const res = await engine(`/v0/renders/${encodeURIComponent(renderId)}/assets/${encodeURIComponent(filename)}`, {}, uid);
  if (!res.ok) return Response.json({ error: "not found" }, { status: res.status });
  return new Response(res.body, {
    headers: {
      "content-type": "image/png",
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
    },
  });
}
