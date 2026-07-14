import { engine } from "@/lib/engine";
import { ensureUserId } from "@/lib/session";

/** Start a Stripe Checkout for a paid plan; returns the redirect URL. */
export async function POST(req: Request) {
  const { plan } = (await req.json().catch(() => ({}))) as { plan?: string };
  if (plan !== "studio" && plan !== "agency") {
    return Response.json({ error: "plan must be studio or agency" }, { status: 400 });
  }
  const origin = new URL(req.url).origin;
  const uid = await ensureUserId();
  const res = await engine(
    "/v0/billing/checkout",
    {
      method: "POST",
      body: JSON.stringify({ plan, successUrl: `${origin}/dashboard?upgraded=${plan}`, cancelUrl: `${origin}/dashboard?checkout=cancelled` }),
    },
    uid,
  );
  return Response.json(await res.json(), { status: res.status });
}
