import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";

const DATA_DIR = process.env.PLAYGROUND_DATA_DIR ?? path.join(process.cwd(), ".data");

/** The email gate: after the wow, before the download. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return Response.json({ error: "enter a real email" }, { status: 400 });
  }
  await mkdir(DATA_DIR, { recursive: true });
  await appendFile(
    path.join(DATA_DIR, "waitlist.jsonl"),
    JSON.stringify({ email, at: new Date().toISOString(), brand: body?.brand ?? null }) + "\n",
  );
  return Response.json({ ok: true });
}
