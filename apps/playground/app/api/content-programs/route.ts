import { engineJson } from "@/lib/engine";
import { ensureUserId } from "@/lib/session";

export async function GET() {
  const uid = await ensureUserId();
  const result = await engineJson("/v0/content-programs", {}, uid);
  return Response.json(result.data, { status: result.status });
}
