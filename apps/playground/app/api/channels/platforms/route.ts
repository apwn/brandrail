import { engine } from "@/lib/engine";
export async function GET() {
  const res = await engine("/v0/channels/platforms");
  return Response.json(await res.json(), { status: res.status });
}
