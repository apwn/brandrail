import { engine } from "@/lib/engine";
import { ensureUserId } from "@/lib/session";

/** Claim the current (anonymous) workspace with an email. The session id is
 * kept, so the brands and renders compiled while anonymous carry over. */
export async function POST(req: Request) {
  const { email } = (await req.json().catch(() => ({}))) as { email?: string };
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return Response.json({ error: "a valid email is required" }, { status: 400 });
  }
  const uid = await ensureUserId();
  const res = await engine("/v0/users", { method: "POST", body: JSON.stringify({ id: uid, email }) }, uid);
  const data = await res.json();
  return Response.json(data, { status: res.status });
}
