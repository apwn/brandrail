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
  });

  it("exposes run lineage across render, review, and delivery commands", () => {
    for (const args of [["render", "--help"], ["schedule", "--help"], ["review", "create", "--help"], ["review", "status", "--help"]]) {
      const result = spawnSync(process.execPath, [bin, ...args], { encoding: "utf8" });
      expect(result.status).toBe(0);
      expect(result.stdout).toContain("--run <runId>");
    }
  });
});
