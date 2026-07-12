import { engine } from "@/lib/engine";
import { ensureUserId } from "@/lib/session";

/** List the signed-in user's compiled brands (for the batch compose panel). */
export async function GET() {
  const uid = await ensureUserId();
  const res = await engine("/v0/specs", {}, uid);
  return Response.json(await res.json(), { status: res.status });
}
