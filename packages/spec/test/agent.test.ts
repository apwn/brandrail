import { describe, expect, it } from "vitest";
import { MCP_LIFECYCLE_TOOLS } from "../src/index.js";

describe("canonical agent contract", () => {
  it("keeps one unique 44-tool lifecycle registry", () => {
    expect(MCP_LIFECYCLE_TOOLS).toHaveLength(44);
    expect(new Set(MCP_LIFECYCLE_TOOLS).size).toBe(MCP_LIFECYCLE_TOOLS.length);
    expect(MCP_LIFECYCLE_TOOLS).toEqual(expect.arrayContaining([
      "list_brands",
      "start_campaign_run",
      "render_assets",
      "create_review_batch",
      "schedule_post",
      "get_audit_log",
    ]));
  });
});
