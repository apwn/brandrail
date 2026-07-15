import { engine } from "@/lib/engine";
import { ensureUserId } from "@/lib/session";
import { readJsonBody } from "@/lib/request";

/** List API keys (prefixes only — the full key is shown once at creation). */
export async function GET() {
  const uid = await ensureUserId();
  const res = await engine("/v0/me/keys", {}, uid);
  return Response.json(await res.json(), { status: res.status });
}

/** Mint a new API key for this user's agents (MCP / CLI / SDK). */
export async function POST(req: Request) {
  const parsed = await readJsonBody(req, 32_000);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;
  const uid = await ensureUserId();
  const res = await engine("/v0/me/keys", { method: "POST", body: JSON.stringify(body) }, uid);
  return Response.json(await res.json(), { status: res.status });
}
