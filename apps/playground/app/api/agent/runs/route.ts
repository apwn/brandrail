import { engineJson } from "@/lib/engine";
import { ensureUserId } from "@/lib/session";
import { readJsonBody } from "@/lib/request";

export async function POST(request: Request) {
  const uid = await ensureUserId();
  const parsed = await readJsonBody<{ objective?: string; brand?: string }>(request, 32_000);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;
  const objective = body.objective?.trim();
  if (!objective || objective.length < 3 || objective.length > 500 || !body.brand) return Response.json({ error: "objective and brand are required" }, { status: 400 });
  const result = await engineJson("/v0/agent/runs", { method: "POST", body: JSON.stringify({ objective, brand: body.brand, assetCount: 8 }) }, uid);
  return Response.json(result.data, { status: result.status });
}
