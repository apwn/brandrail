import { redirect } from "next/navigation";
import { engine } from "@/lib/engine";
import { verifyMagicToken } from "@/lib/magic";
import { setSessionUid } from "@/lib/session";

/**
 * The magic-link landing. Verifies the signed token (proof the user owns the
 * email), asks the engine for the CANONICAL user — adopting/merging the anon
 * workspace if this email already has one — and rewrites the session cookie to
 * that id. This is what makes accounts recoverable on any device.
 */
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token") ?? "";
  const payload = verifyMagicToken(token);
  if (!payload) redirect("/?auth=expired");

  const res = await engine(
    "/v0/users/verify",
    { method: "POST", body: JSON.stringify({ email: payload.email, anonId: payload.anonId, jti: payload.jti, exp: payload.exp }) },
    payload.anonId,
  );
  if (!res.ok) redirect("/?auth=failed");
  const { user, adopted } = (await res.json()) as { user: { id: string }; adopted: boolean };

  await setSessionUid(user.id);
  if (payload.next) redirect(payload.next);
  redirect(adopted ? "/dashboard?welcome=back" : "/dashboard?welcome=1");
}
