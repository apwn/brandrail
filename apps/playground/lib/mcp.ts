import { agentEngine } from "@/lib/engine";

type Tool = { name: string; description: string; inputSchema: Record<string, unknown> };

export const MCP_TOOLS: Tool[] = [
  { name: "list_brands", description: "List BrandSpecs in this workspace. Start here unless the user gave a brand name.", inputSchema: { type: "object", properties: {} } },
  { name: "compile_brand", description: "Compile a public website into an enforceable BrandSpec. This mutates the workspace and can take up to 30 seconds.", inputSchema: { type: "object", properties: { url: { type: "string", description: "Public brand website URL" } }, required: ["url"] } },
  { name: "get_brand", description: "Read a BrandSpec before making brand-sensitive decisions.", inputSchema: { type: "object", properties: { brand: { type: "string" }, version: { type: "integer", minimum: 1 } }, required: ["brand"] } },
  { name: "plan_campaign", description: "Dry-run a campaign. Returns blockers, safeguards, estimated assets, and exact mutating steps without executing them.", inputSchema: { type: "object", properties: { objective: { type: "string" }, brand: { type: "string" }, channels: { type: "array", items: { type: "string" } }, assetCount: { type: "integer", minimum: 1, maximum: 50 }, publishAt: { type: "string" } }, required: ["objective"] } },
  { name: "render_assets", description: "Render deterministic, BrandSpec-checked social assets. Nothing is published. Free usage is metered by finished file.", inputSchema: { type: "object", properties: { brand: { type: "string" }, brief: { type: "string" }, formats: { type: "array", items: { type: "string", enum: ["ig-carousel", "li-image", "story", "x-graphic", "og-image"] } }, archetype: { type: "string" } }, required: ["brand", "brief"] } },
  { name: "list_channels", description: "List connected channel IDs and platform handles. Studio required.", inputSchema: { type: "object", properties: {} } },
  { name: "list_campaigns", description: "List campaign workspaces with live production and performance progress. Studio required.", inputSchema: { type: "object", properties: {} } },
  { name: "create_campaign", description: "Create a campaign container. This does not render or publish. Studio required.", inputSchema: { type: "object", properties: { name: { type: "string" }, objective: { type: "string" }, brandIds: { type: "array", items: { type: "string" } }, batchIds: { type: "array", items: { type: "string" } }, postIds: { type: "array", items: { type: "string" } } }, required: ["name", "objective"] } },
  { name: "create_review_batch", description: "Render work into a human approval queue and pause. Studio required.", inputSchema: { type: "object", properties: { title: { type: "string" }, items: { type: "array", minItems: 1, maxItems: 50, items: { type: "object", properties: { brand: { type: "string" }, brief: { type: "string" }, archetype: { type: "string" } }, required: ["brand", "brief"] } } }, required: ["items"] } },
  { name: "get_review_status", description: "Resume safely after a human approval pause. Returns approved render IDs, flagged notes, comments, and the next action.", inputSchema: { type: "object", properties: { batchId: { type: "string" } }, required: ["batchId"] } },
  { name: "schedule_post", description: "Dry-run, schedule, or publish. Agent calls require an approved batch item, or confirm=true only after explicit user confirmation. Always use dryRun=true first.", inputSchema: { type: "object", properties: { text: { type: "string" }, channelIds: { type: "array", items: { type: "string" }, minItems: 1 }, scheduledAt: { type: "string" }, renderId: { type: "string" }, imageFiles: { type: "array", items: { type: "string" } }, idempotencyKey: { type: "string" }, dryRun: { type: "boolean" }, confirm: { type: "boolean", description: "Set true only after explicit user confirmation" }, approval: { type: "object", properties: { batchId: { type: "string" }, itemId: { type: "string" } }, required: ["batchId", "itemId"] } }, required: ["text", "channelIds"] } },
  { name: "list_calendar", description: "List scheduled, publishing, published, failed and cancelled posts. Studio required.", inputSchema: { type: "object", properties: {} } },
  { name: "get_analytics", description: "Read aggregate channel and campaign performance. Studio required.", inputSchema: { type: "object", properties: {} } },
  { name: "get_audit_log", description: "Read recent human and agent workspace mutations for oversight and debugging.", inputSchema: { type: "object", properties: { limit: { type: "integer", minimum: 1, maximum: 250 } } } },
];

function pathFor(name: string, args: Record<string, unknown>): { path: string; init?: RequestInit } | null {
  const post = (path: string, body: unknown) => ({ path, init: { method: "POST", body: JSON.stringify(body) } });
  switch (name) {
    case "list_brands": return { path: "/v0/specs" };
    case "compile_brand": return post("/v0/compile", args);
    case "get_brand": return { path: `/v0/specs/${encodeURIComponent(String(args.brand))}${args.version ? `?version=${Number(args.version)}` : ""}` };
    case "plan_campaign": return post("/v0/agent/plan", args);
    case "render_assets": return post("/v0/render", args);
    case "list_channels": return { path: "/v0/channels" };
    case "list_campaigns": return { path: "/v0/campaigns" };
    case "create_campaign": return post("/v0/campaigns", args);
    case "create_review_batch": return post("/v0/batches", args);
    case "get_review_status": return { path: `/v0/batches/${encodeURIComponent(String(args.batchId))}/status` };
    case "schedule_post": return post("/v0/publish", args);
    case "list_calendar": return { path: "/v0/scheduled" };
    case "get_analytics": return { path: "/v0/analytics" };
    case "get_audit_log": return { path: `/v0/me/audit?limit=${Math.min(250, Math.max(1, Number(args.limit ?? 50)))}` };
    default: return null;
  }
}

export async function handleMcp(req: Request): Promise<Response> {
  const apiKey = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? req.headers.get("x-api-key") ?? "";
  if (!apiKey) return Response.json({ error: "Use Authorization: Bearer <workspace key>" }, { status: 401 });
  const message = (await req.json().catch(() => null)) as { jsonrpc?: string; id?: string | number | null; method?: string; params?: { name?: string; arguments?: Record<string, unknown> } } | null;
  if (!message?.method) return Response.json({ jsonrpc: "2.0", id: message?.id ?? null, error: { code: -32600, message: "Invalid MCP request" } }, { status: 400 });
  if (message.method.startsWith("notifications/")) return new Response(null, { status: 202 });
  const result = (value: unknown) => Response.json({ jsonrpc: "2.0", id: message.id ?? null, result: value });
  if (message.method === "initialize") return result({ protocolVersion: "2025-03-26", capabilities: { tools: { listChanged: false } }, serverInfo: { name: "brandrail", version: "0.2.0" } });
  if (message.method === "ping") return result({});
  if (message.method === "tools/list") return result({ tools: MCP_TOOLS });
  if (message.method === "tools/call") {
    const name = message.params?.name ?? "";
    const target = pathFor(name, message.params?.arguments ?? {});
    if (!target) return result({ content: [{ type: "text", text: `Unknown tool: ${name}` }], isError: true });
    const upstream = await agentEngine(target.path, apiKey, target.init);
    const data = await upstream.json().catch(() => ({ error: `Engine returned ${upstream.status}` }));
    return result({ content: [{ type: "text", text: JSON.stringify(data, null, 2) }], ...(upstream.ok ? {} : { isError: true }) });
  }
  return Response.json({ jsonrpc: "2.0", id: message.id ?? null, error: { code: -32601, message: "Method not found" } }, { status: 404 });
}
