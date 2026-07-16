import { MCP_LIFECYCLE_TOOLS } from "@brandrail/spec";

export const MCP_PROTOCOL_VERSION = "2025-11-25";
export const MCP_SUPPORTED_VERSIONS = [MCP_PROTOCOL_VERSION, "2025-06-18", "2025-03-26"] as const;
export const MCP_SERVER_VERSION = "0.4.0";
export const MCP_TOOL_COUNT = MCP_LIFECYCLE_TOOLS.length;

export const MCP_REQUIRED_TOOLS = [
  "list_brands",
  "get_brand",
  "start_campaign_run",
  "render_assets",
  "create_review_batch",
  "get_review_status",
  "schedule_post",
  "get_audit_log",
] as const;

export const MCP_SCOPES = [
  "brands:read",
  "brands:write",
  "assets:read",
  "assets:render",
  "reviews:read",
  "reviews:write",
  "campaigns:read",
  "campaigns:write",
  "calendar:read",
  "channels:read",
  "channels:write",
  "publish:schedule",
  "publish:immediate",
  "analytics:read",
  "audit:read",
  "webhooks:read",
  "webhooks:write",
] as const;
