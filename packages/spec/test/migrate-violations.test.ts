import { describe, expect, it } from "vitest";
import {
  migrate,
  acmeInput,
  SpecViolationError,
  isSpecViolationError,
  contrastRatio,
  bestContrast,
  FORMATS,
  ALL_FORMATS,
} from "../src/index.js";

describe("migrate", () => {
  it("passes a current-schema doc through unchanged", () => {
    const r = migrate(structuredClone(acmeInput));
    expect(r.migrated).toBe(false);
    expect(r.spec.meta.name).toBe("acme");
  });

  it("rejects unknown schema URLs", () => {
    const doc = structuredClone(acmeInput) as Record<string, unknown>;
    doc.$schema = "https://brandrail.dev/spec/v9.9.json";
    expect(() => migrate(doc)).toThrow(/unknown BrandSpec schema/);
  });
});

describe("SpecViolationError", () => {
  it("carries structured violations and serializes to JSON", () => {
    const err = new SpecViolationError([
      { code: "banned-word", rule: "voice.banned", message: '"synergy" is banned', offending: "synergy" },
      { code: "contrast", rule: "identity.colors.usage.minContrast", message: "3.1:1 < 4.5:1", format: "og-image" },
    ]);
    expect(isSpecViolationError(err)).toBe(true);
    expect(err.violations).toHaveLength(2);
    expect(err.message).toContain("banned");
    expect(err.toJSON().violations[0]?.code).toBe("banned-word");
  });
});

describe("color math", () => {
  it("computes WCAG contrast (black on white = 21)", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 0);
  });

  it("bestContrast picks the more legible candidate", () => {
    expect(bestContrast("#FFFFFF", ["#101012", "#EEEEEE"])).toBe("#101012");
  });
});

describe("formats", () => {
  it("defines the five V0 formats with correct dimensions", () => {
    expect(ALL_FORMATS).toHaveLength(5);
    expect(FORMATS["ig-carousel"]).toMatchObject({ width: 1080, height: 1350, slides: 4 });
    expect(FORMATS["li-image"]).toMatchObject({ width: 1200, height: 627 });
    expect(FORMATS.story).toMatchObject({ width: 1080, height: 1920 });
    expect(FORMATS["x-graphic"]).toMatchObject({ width: 1600, height: 900 });
    expect(FORMATS["og-image"]).toMatchObject({ width: 1200, height: 630 });
  });
});
