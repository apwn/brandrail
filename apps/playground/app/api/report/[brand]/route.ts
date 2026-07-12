import { engine } from "@/lib/engine";
import { ensureUserId } from "@/lib/session";

/** Proxy the brand-styled white-label report HTML. */
export async function GET(_req: Request, { params }: { params: Promise<{ brand: string }> }) {
  const { brand } = await params;
  const uid = await ensureUserId();
  const res = await engine(`/v0/reports/${encodeURIComponent(brand)}`, {}, uid);
  if (!res.ok) return Response.json(await res.json().catch(() => ({ error: "report failed" })), { status: res.status });
  return new Response(res.body, { headers: { "content-type": "text/html; charset=utf-8" } });
}
