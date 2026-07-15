import { engine, isVerifiedUser } from "@/lib/engine";
import { ensureUserId } from "@/lib/session";
import { readJsonBody } from "@/lib/request";

/** List connected channels (+ trust setting). */
export async function GET() {
  const uid = await ensureUserId();
  const res = await engine("/v0/channels", {}, uid);
  return Response.json(await res.json(), { status: res.status });
}

/** Connect a channel (verified against the platform before it's stored).
 * Storing posting credentials is a "take" action — verified accounts only,
 * so creds never hang off a loseable anonymous cookie. */
export async function POST(req: Request) {
  const parsed = await readJsonBody(req);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;
  const uid = await ensureUserId();
  if (!(await isVerifiedUser(uid))) {
    return Response.json(
      { error: "verify your email before connecting a channel (one magic link, no password)", needsAccount: true },
      { status: 401 },
    );
  }
  const res = await engine("/v0/channels", { method: "POST", body: JSON.stringify(body) }, uid);
  return Response.json(await res.json(), { status: res.status });
}
