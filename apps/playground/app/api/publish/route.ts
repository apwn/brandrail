import { engine, isVerifiedUser } from "@/lib/engine";
import { ensureUserId } from "@/lib/session";
import { readJsonBody } from "@/lib/request";

/** Publishing is a "take" action — it ships content to the world as this user,
 * so it requires a verified account (the see-free / take-gated line). */
export async function POST(req: Request) {
  const parsed = await readJsonBody(req);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;
  const uid = await ensureUserId();
  if (!(await isVerifiedUser(uid))) {
    return Response.json(
      { error: "verify your email to publish — sign in from the dashboard (one magic link, no password)", needsAccount: true },
      { status: 401 },
    );
  }
  const res = await engine("/v0/publish", { method: "POST", body: JSON.stringify(body), signal: AbortSignal.timeout(60_000) }, uid);
  return Response.json(await res.json(), { status: res.status });
}
