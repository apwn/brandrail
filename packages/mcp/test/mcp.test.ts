import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { describe, expect, it } from "vitest";

const bin = fileURLToPath(new URL("../dist/index.js", import.meta.url));

describe("Brandrail MCP server", () => {
  it("completes the stdio handshake and advertises the five public tools", async () => {
    const transport = new StdioClientTransport({ command: process.execPath, args: [bin] });
    const client = new Client({ name: "brandrail-test", version: "1.0.0" });
    try {
      await client.connect(transport);
      const result = await client.listTools();
      expect(result.tools.map((tool) => tool.name)).toEqual([
        "compile_brand",
        "render_assets",
        "get_spec",
        "list_templates",
        "diff_spec",
      ]);
    } finally {
      await client.close();
    }
  });
});
