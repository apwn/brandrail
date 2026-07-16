import { MCP_PROTOCOL_VERSION, MCP_SCOPES } from "@/lib/mcp-meta";

export function GET(req: Request) {
  const origin = new URL(req.url).origin;
  const authorizationServers = (process.env.MCP_AUTHORIZATION_SERVERS ?? "")
    .split(",").map((value) => value.trim()).filter(Boolean);
  return Response.json({
    resource: `${origin}/api/mcp`,
    resource_name: "Brandrail Agent Runtime",
    ...(authorizationServers.length ? { authorization_servers: authorizationServers } : {}),
    bearer_methods_supported: ["header"],
    scopes_supported: MCP_SCOPES,
    resource_documentation: `${origin}/docs#mcp`,
    protocol_version: MCP_PROTOCOL_VERSION,
  }, { headers: { "cache-control": "public, max-age=300" } });
}
