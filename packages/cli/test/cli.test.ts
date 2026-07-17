import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const bin = fileURLToPath(new URL("../dist/index.js", import.meta.url));

describe("brandrail CLI", () => {
  it("boots as an executable and reports its version", () => {
    const result = spawnSync(process.execPath, [bin, "--version"], { encoding: "utf8" });
    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe("0.1.0");
  });

  it("returns machine-readable template metadata", () => {
    const result = spawnSync(process.execPath, [bin, "templates", "--json"], { encoding: "utf8" });
    expect(result.status).toBe(0);
    const body = JSON.parse(result.stdout) as { ok: boolean; templates: Record<string, unknown> };
    expect(body.ok).toBe(true);
    expect(Object.keys(body.templates)).toContain("hero-statement");
    expect(body.templates["hero-statement"]).toMatchObject({ slots: { hook: { maxChars: 90 } }, locked: expect.arrayContaining(["colors", "type"]) });
  });

  it("offers the template-first render flag while keeping the compatibility alias", () => {
    const result = spawnSync(process.execPath, [bin, "render", "--help"], { encoding: "utf8" });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("--template <id>");
    expect(result.stdout).toContain("--recipe <id>");
    expect(result.stdout).toContain("--templates <plan>");
    expect(result.stdout).toContain("--media <slots>");
    expect(result.stdout).toContain("--archetype <name>");
  });

  it("exposes the reusable recipe lifecycle with explicit delete confirmation", () => {
    const root = spawnSync(process.execPath, [bin, "recipes", "--help"], { encoding: "utf8" });
    const remove = spawnSync(process.execPath, [bin, "recipes", "delete", "--help"], { encoding: "utf8" });
    expect(root.stdout).toContain("list");
    expect(root.stdout).toContain("save");
    expect(root.stdout).toContain("rename");
    expect(root.stdout).toContain("delete");
    expect(remove.stdout).toContain("--confirm");
  });

  it("exposes run lineage across render, review, and delivery commands", () => {
    for (const args of [["render", "--help"], ["schedule", "--help"], ["review", "create", "--help"], ["review", "status", "--help"]]) {
      const result = spawnSync(process.execPath, [bin, ...args], { encoding: "utf8" });
      expect(result.status).toBe(0);
      expect(result.stdout).toContain("--run <runId>");
    }
  });

  it("supports explicitly completing an asset-only run", () => {
    const result = spawnSync(process.execPath, [bin, "agent", "complete", "--help"], { encoding: "utf8" });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("finish an asset-only run without publishing");
  });

  it("prints a safe OpenClaw MCP configuration with a live probe command", () => {
    const testKey = "brk_1234567890123456789012345678901234567890";
    const result = spawnSync(process.execPath, [bin, "mcp", "config", "--client", "openclaw"], { encoding: "utf8", env: { ...process.env, BRANDRAIL_API_KEY: testKey } });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("read -rsp 'Brandrail API key: '");
    expect(result.stdout).not.toContain(testKey);
    expect(result.stdout).toContain("openclaw mcp set brandrail");
    expect(result.stdout).toContain("Bearer ${BRANDRAIL_API_KEY}");
    expect(result.stdout).toContain("openclaw mcp doctor brandrail --probe");
  });

  it("prints a native Claude Code remote MCP command", () => {
    const result = spawnSync(process.execPath, [bin, "mcp", "config", "--client", "claude"], { encoding: "utf8" });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("claude mcp add --transport http brandrail");
    expect(result.stdout).toContain("--header 'Authorization: Bearer ${BRANDRAIL_API_KEY}'");
    expect(result.stdout).toContain("claude mcp get brandrail");
  });

  it("exposes an authenticated MCP doctor command", () => {
    const result = spawnSync(process.execPath, [bin, "mcp", "doctor", "--help"], { encoding: "utf8" });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("authenticated MCP handshake");
    expect(result.stdout).toContain("--endpoint <url>");
  });

  it("exposes the full content-program lifecycle with a safe review default", () => {
    const root = spawnSync(process.execPath, [bin, "content", "--help"], { encoding: "utf8" });
    const preview = spawnSync(process.execPath, [bin, "content", "preview", "--help"], { encoding: "utf8" });
    const remove = spawnSync(process.execPath, [bin, "content", "delete", "--help"], { encoding: "utf8" });
    expect(root.status).toBe(0);
    for (const command of ["list", "preview", "create", "run", "pause", "resume", "delete"]) expect(root.stdout).toContain(command);
    expect(preview.stdout).toContain("--horizon <weeks>");
    expect(preview.stdout).toContain("--approval <mode>");
    expect(preview.stdout).toContain("--activate");
    expect(preview.stdout).toContain("review");
    expect(remove.stdout).toContain("--confirm");
  });
});
