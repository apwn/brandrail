import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { describe, expect, it } from "vitest";
import { MCP_LIFECYCLE_TOOLS } from "@brandrail/spec";

const bin = fileURLToPath(new URL("../dist/index.js", import.meta.url));

describe("Brandrail MCP server", () => {
  it("completes the stdio handshake and advertises the full lifecycle tools", async () => {
    const transport = new StdioClientTransport({ command: process.execPath, args: [bin] });
    const client = new Client({ name: "brandrail-test", version: "1.0.0" });
    try {
      await client.connect(transport);
      const result = await client.listTools();
      expect(result.tools.map((tool) => tool.name).sort()).toEqual([...MCP_LIFECYCLE_TOOLS].sort());
      expect(result.tools.map((tool) => tool.name)).toEqual([
        "compile_brand",
        "render_assets",
        "get_brand",
        "list_recipes",
        "save_recipe",
        "rename_recipe",
        "delete_recipe",
        "list_templates",
        "list_template_families",
        "list_template_family_versions",
        "duplicate_template_family",
        "preflight_template_family",
        "publish_template_family",
        "archive_template_family",
        "diff_brand_spec",
        "list_brands",
        "plan_campaign",
        "list_content_programs",
        "preview_content_program",
        "create_content_program",
        "run_content_program",
        "pause_content_program",
        "delete_content_program",
        "list_channels",
        "create_review_batch",
        "get_review_status",
        "list_campaigns",
        "schedule_post",
        "list_calendar",
        "get_analytics",
        "get_audit_log",
        "start_campaign_run",
        "list_agent_runs",
        "get_agent_run",
        "provide_agent_input",
        "retry_agent_run",
        "complete_agent_run",
        "cancel_agent_run",
        "list_renders",
        "get_render",
        "create_campaign",
        "update_campaign",
        "add_review_comment",
        "reschedule_post",
        "cancel_post",
        "get_usage",
      ]);
      const tools = new Map(result.tools.map((tool) => [tool.name, tool.inputSchema as { properties?: Record<string, { items?: { properties?: Record<string, unknown> } }> }]));
      expect(tools.get("render_assets")?.properties).toHaveProperty("runId");
      expect(tools.get("schedule_post")?.properties).toHaveProperty("runId");
      expect(tools.get("create_review_batch")?.properties?.items?.items?.properties).toHaveProperty("renderId");
      expect(tools.get("create_review_batch")?.properties).toHaveProperty("runId");
      expect(tools.get("get_review_status")?.properties).toHaveProperty("runId");
      expect(tools.get("preview_content_program")?.properties).toHaveProperty("horizonWeeks");
      expect(tools.get("create_content_program")?.properties).toHaveProperty("plannedPosts");
      expect(tools.get("duplicate_template_family")?.properties).toHaveProperty("source");
      expect(tools.get("list_template_family_versions")?.properties).toHaveProperty("id");
    } finally {
      await client.close();
    }
  });
});
