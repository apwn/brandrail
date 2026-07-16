import { engineJson } from "@/lib/engine";
import { readJsonBody } from "@/lib/request";
import { ensureUserId } from "@/lib/session";

export async function POST(request: Request) {
  const parsed = await readJsonBody(request, 64_000);
  if (!parsed.ok) return parsed.response;
  const uid = await ensureUserId();
  const result = await engineJson("/v0/content-programs/preview-item", { method: "POST", body: JSON.stringify(parsed.data) }, uid);
  return Response.json(result.data, { status: result.status });
}
