import { engineJson } from "@/lib/engine";
import { ensureUserId } from "@/lib/session";

export async function POST(request: Request, { params }: { params: Promise<{ brand: string; action: string }> }) {
  const uid = await ensureUserId();
  const { brand, action } = await params;
  if (!["run", "pause", "resume"].includes(action)) return Response.json({ error: "unknown content program action" }, { status: 404 });
  const path = action === "run" ? `/v0/content-programs/${encodeURIComponent(brand)}/run` : `/v0/content-programs/${encodeURIComponent(brand)}/pause`;
  const body = action === "run" ? "{}" : JSON.stringify({ paused: action === "pause" });
  const result = await engineJson(path, { method: "POST", body }, uid);
  return Response.json(result.data, { status: result.status });
}
