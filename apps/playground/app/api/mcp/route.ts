import { handleMcp } from "@/lib/mcp";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: Request) {
  return handleMcp(req);
}

export function GET() {
  return new Response(null, { status: 405, headers: { Allow: "POST", "cache-control": "no-store" } });
}
