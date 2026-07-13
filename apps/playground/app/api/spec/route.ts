import { engine } from "@/lib/engine";
import { ensureUserId } from "@/lib/session";

/** Download a portable BrandSpec JSON file. */
export async function GET(req: Request) {
  const brand = new URL(req.url).searchParams.get("brand")?.trim();
  if (!brand) return Response.json({ error: "brand required" }, { status: 400 });
  const uid = await ensureUserId();
  const res = await engine(`/v0/specs/${encodeURIComponent(brand)}`, {}, uid);
  if (!res.ok) return Response.json(await res.json().catch(() => ({ error: "spec not found" })), { status: res.status });
  const { spec } = (await res.json()) as { spec: unknown };
  return new Response(JSON.stringify(spec, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="${brand.replace(/[^a-z0-9_-]/gi, "-")}.brandspec.json"`,
      "cache-control": "private, no-store",
    },
  });
}

/** Inline brand-sheet edits: PATCH the spec (bumps version server-side). */
export async function PATCH(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body?.brand || !body?.patch) {
    return Response.json({ error: "brand and patch required" }, { status: 400 });
  }
  const uid = await ensureUserId();
  const res = await engine(`/v0/specs/${encodeURIComponent(body.brand)}`, {
    method: "PATCH",
    body: JSON.stringify(body.patch),
  }, uid);
  return Response.json(await res.json(), { status: res.status });
}

export async function DELETE(req: Request) {
  const { brand } = (await req.json().catch(() => ({}))) as { brand?: string };
  if (!brand) return Response.json({ error: "brand required" }, { status: 400 });
  const uid = await ensureUserId();
  const res = await engine(`/v0/specs/${encodeURIComponent(brand)}`, { method: "DELETE" }, uid);
  return Response.json(await res.json().catch(() => ({ error: "delete failed" })), { status: res.status });
}
