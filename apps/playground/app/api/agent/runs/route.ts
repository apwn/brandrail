import { engineJson } from "@/lib/engine";
import { ensureUserId } from "@/lib/session";

export async function POST(request: Request) {
  const uid = await ensureUserId();
  const body = await request.json().catch(() => ({})) as { objective?: string; brand?: string };
  const objective = body.objective?.trim();
  if (!objective || objective.length < 3 || objective.length > 500 || !body.brand) return Response.json({ error: "objective and brand are required" }, { status: 400 });
  const result = await engineJson("/v0/agent/runs", { method: "POST", body: JSON.stringify({ objective, brand: body.brand, assetCount: 5, start: false }) }, uid);
  return Response.json(result.data, { status: result.status });
}
