import { engine } from "@/lib/engine";
import { ensureUserId } from "@/lib/session";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const uid = await ensureUserId();
  const { id } = await params;
  const res = await engine(`/v0/me/webhook-deliveries/${encodeURIComponent(id)}/retry`, { method: "POST", body: "{}" }, uid);
  return Response.json(await res.json(), { status: res.status });
}
