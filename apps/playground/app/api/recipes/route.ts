import { engine } from "@/lib/engine";
import { readJsonBody } from "@/lib/request";
import { ensureUserId } from "@/lib/session";

async function forward(res: Response): Promise<Response> {
  return Response.json(await res.json().catch(() => ({ error: "recipe request failed" })), { status: res.status });
}

export async function GET(req: Request) {
  const brand = new URL(req.url).searchParams.get("brand")?.trim();
  if (!brand) return Response.json({ error: "brand required" }, { status: 400 });
  return forward(await engine(`/v0/specs/${encodeURIComponent(brand)}/recipes`, {}, await ensureUserId()));
}

export async function POST(req: Request) {
  const parsed = await readJsonBody<{ brand?: string; recipe?: unknown }>(req);
  if (!parsed.ok) return parsed.response;
  if (!parsed.data.brand || !parsed.data.recipe) return Response.json({ error: "brand and recipe required" }, { status: 400 });
  return forward(await engine(`/v0/specs/${encodeURIComponent(parsed.data.brand)}/recipes`, {
    method: "POST",
    body: JSON.stringify({ recipe: parsed.data.recipe }),
  }, await ensureUserId()));
}

export async function PATCH(req: Request) {
  const parsed = await readJsonBody<{ brand?: string; id?: string; name?: string }>(req);
  if (!parsed.ok) return parsed.response;
  const { brand, id, name } = parsed.data;
  if (!brand || !id || !name) return Response.json({ error: "brand, id and name required" }, { status: 400 });
  return forward(await engine(`/v0/specs/${encodeURIComponent(brand)}/recipes/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ name }),
  }, await ensureUserId()));
}

export async function DELETE(req: Request) {
  const parsed = await readJsonBody<{ brand?: string; id?: string }>(req, 16_000);
  if (!parsed.ok) return parsed.response;
  const { brand, id } = parsed.data;
  if (!brand || !id) return Response.json({ error: "brand and id required" }, { status: 400 });
  return forward(await engine(`/v0/specs/${encodeURIComponent(brand)}/recipes/${encodeURIComponent(id)}`, {
    method: "DELETE",
  }, await ensureUserId()));
}
