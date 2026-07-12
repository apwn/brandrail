import { engine } from "@/lib/engine";

/** Whether Stripe billing is configured on the engine (gates the upgrade UI). */
export async function GET() {
  try {
    const res = await engine("/v0/billing/config");
    return Response.json(await res.json(), { status: res.status });
  } catch {
    return Response.json({ configured: false });
  }
}
