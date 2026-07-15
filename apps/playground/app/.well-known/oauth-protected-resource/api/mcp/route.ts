import { MCP_PROTOCOL_VERSION } from "@/lib/mcp";

export function GET(req: Request) {
  const origin = new URL(req.url).origin;
  const authorizationServers = (process.env.MCP_AUTHORIZATION_SERVERS ?? "")
    .split(",").map((value) => value.trim()).filter(Boolean);
  return Response.json({
    resource: `${origin}/api/mcp`,
    ...(authorizationServers.length ? { authorization_servers: authorizationServers } : {}),
    bearer_methods_supported: ["header"],
    scopes_supported: ["brands:read", "brands:write", "assets:read", "assets:render", "reviews:read", "reviews:write", "campaigns:read", "campaigns:write", "calendar:read", "publish:schedule", "publish:immediate", "analytics:read", "audit:read"],
    resource_documentation: `${origin}/agents`,
    protocol_version: MCP_PROTOCOL_VERSION,
  }, { headers: { "cache-control": "public, max-age=300" } });
}
