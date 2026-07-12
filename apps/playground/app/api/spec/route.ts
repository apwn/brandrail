import { engine } from "@/lib/engine";
import { ensureUserId } from "@/lib/session";

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
