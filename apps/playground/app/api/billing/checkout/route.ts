import { engine } from "@/lib/engine";
import { ensureUserId } from "@/lib/session";
import { publicOrigin } from "@/lib/origin";
import { readJsonBody } from "@/lib/request";

/** Start a Stripe Checkout for a paid plan; returns the redirect URL. */
export async function POST(req: Request) {
  const parsed = await readJsonBody<{ plan?: string; returnTo?: string }>(req, 16_000);
  if (!parsed.ok) return parsed.response;
  const { plan } = parsed.data;
  if (plan !== "studio" && plan !== "agency") {
    return Response.json({ error: "plan must be studio or agency" }, { status: 400 });
  }
  const returnTo = parsed.data.returnTo?.startsWith("/") && !parsed.data.returnTo.startsWith("//") ? parsed.data.returnTo : undefined;
  const origin = publicOrigin(req);
  const uid = await ensureUserId();
  const res = await engine(
    "/v0/billing/checkout",
    {
      method: "POST",
      body: JSON.stringify({
        plan,
        successUrl: `${origin}/dashboard?upgraded=${plan}${returnTo ? `&return=${encodeURIComponent(returnTo)}` : ""}`,
        cancelUrl: `${origin}/dashboard?checkout=cancelled${returnTo ? `&return=${encodeURIComponent(returnTo)}` : ""}`,
      }),
    },
    uid,
  );
  return Response.json(await res.json(), { status: res.status });
}
