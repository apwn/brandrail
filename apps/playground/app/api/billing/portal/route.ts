import { engine } from "@/lib/engine";
import { ensureUserId } from "@/lib/session";

/** Open the Stripe billing portal (manage / cancel a subscription). */
export async function POST(req: Request) {
  const origin = new URL(req.url).origin;
  const uid = await ensureUserId();
  const res = await engine(
    "/v0/billing/portal",
    { method: "POST", body: JSON.stringify({ returnUrl: `${origin}/dashboard` }) },
    uid,
  );
  return Response.json(await res.json(), { status: res.status });
}
