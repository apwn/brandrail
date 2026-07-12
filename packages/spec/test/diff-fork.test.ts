import { describe, expect, it } from "vitest";
import { diff, formatDiff, fork, acme, parse } from "../src/index.js";

describe("diff", () => {
  it("returns empty for identical specs", () => {
    expect(diff(acme, acme)).toEqual([]);
    expect(formatDiff([])).toBe("No changes.");
  });

  it("reports changed scalar values with paths", () => {
    const b = parse(structuredClone(acme));
    b.identity.colors.roles.signal = "#E23E00";
    const entries = diff(acme, b);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      op: "changed",
      path: "identity.colors.roles.signal",
      from: "#FF4D00",
      to: "#E23E00",
    });
  });

  it("ignores meta.version (a bump is the consequence of a diff)", () => {
    const b = parse(structuredClone(acme));
    b.meta.version = 99;
    expect(diff(acme, b)).toEqual([]);
  });

  it("reports added and removed keys", () => {
    const b = parse(structuredClone(acme));
    (b.identity.colors.roles as Record<string, string>).accent2 = "#00FF00";
    delete (b.identity.colors.roles as Record<string, string | undefined>).muted;
    const entries = diff(acme, b);
    const ops = entries.map((e) => `${e.op}:${e.path}`).sort();
    expect(ops).toEqual([
      "added:identity.colors.roles.accent2",
      "removed:identity.colors.roles.muted",
    ]);
  });

  it("formats a human-readable grouped diff", () => {
    const b = parse(structuredClone(acme));
    b.voice.banned = [...b.voice.banned, "elevate"];
    const text = formatDiff(diff(acme, b));
    expect(text).toContain("Voice:");
    expect(text).toContain("banned");
    expect(text).toContain("elevate");
  });
});

describe("fork", () => {
  it("creates a child at version 1 with lineage", () => {
    const child = fork(acme, "client-x", {
      identity: { colors: { roles: { signal: "#0055FF" } } },
    });
    expect(child.meta.name).toBe("client-x");
    expect(child.meta.version).toBe(1);
    expect(child.meta.forkedFrom).toEqual({ name: "acme", version: 3 });
    expect(child.identity.colors.roles.signal).toBe("#0055FF");
    // untouched values inherited
    expect(child.identity.typography.display.family).toBe("Space Grotesk");
  });

  it("replaces arrays wholesale rather than merging them", () => {
    const child = fork(acme, "client-y", { voice: { banned: ["moist"] } });
    expect(child.voice.banned).toEqual(["moist"]);
  });

  it("rejects forks that produce an invalid spec", () => {
    expect(() =>
      fork(acme, "client-z", {
        identity: { colors: { roles: { ink: "#FFFFFF" } } }, // white on white
      }),
    ).toThrow(/contrast/);
  });

  it("does not mutate the parent", () => {
    const before = JSON.stringify(acme);
    fork(acme, "client-w", { voice: { emojiMax: 0 } });
    expect(JSON.stringify(acme)).toBe(before);
  });
});
