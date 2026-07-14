import { handleMcp } from "@/lib/mcp";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: Request) {
  return handleMcp(req);
}

export function GET() {
  return Response.json({ service: "brandrail-mcp", transport: "streamable-http", auth: "Authorization: Bearer <workspace key>" });
}
