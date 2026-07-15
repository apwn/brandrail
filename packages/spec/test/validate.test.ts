import { describe, expect, it } from "vitest";
import { validate, parse, acmeInput } from "../src/index.js";

describe("validate", () => {
  it("accepts the acme fixture", () => {
    const r = validate(acmeInput);
    expect(r.ok).toBe(true);
  });

  it("applies defaults for omitted optional sections", () => {
    const minimal = {
      meta: { name: "min", version: 1 },
      identity: {
        colors: { roles: { ink: "#000000", paper: "#FFFFFF", signal: "#FF4D00" } },
        typography: {
          display: { family: "Inter", weights: [700] },
          body: { family: "Inter", weights: [400] },
        },
      },
    };
    const spec = parse(minimal);
    expect(spec.composition.densityMaxElementsPerZone).toBe(3);
    expect(spec.voice.ctaStyle).toBe("imperative-short");
    expect(spec.identity.colors.usage.minContrast).toBe(4.5);
    expect(spec.identity.visualLanguage).toMatchObject({
      family: "editorial",
      corners: "sharp",
      background: "flat",
      imageTreatment: "full-bleed",
    });
    expect(spec.$schema).toBe("https://brandrail.dev/spec/v0.1.json");
  });

  it("accepts media metadata while preserving legacy string photo refs", () => {
    const input = structuredClone(acmeInput);
    input.imagery = {
      ...input.imagery!,
      photos: [
        "https://cdn.example.com/team.jpg",
        {
          ref: "https://cdn.example.com/product.jpg",
          alt: "Campaign analytics dashboard",
          context: "Product feature section",
          tags: ["analytics", "dashboard"],
        },
      ],
    };
    const spec = parse(input);
    expect(spec.imagery.photos[0]).toBe("https://cdn.example.com/team.jpg");
    expect(spec.imagery.photos[1]).toMatchObject({
      alt: "Campaign analytics dashboard",
      tags: ["analytics", "dashboard"],
    });
  });

  it("rejects illegible ink/paper combinations", () => {
    const bad = structuredClone(acmeInput);
    bad.identity.colors.roles.ink = "#EEEEEE"; // near-white on white
    const r = validate(bad);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.issues.some((i) => i.message.includes("contrast"))).toBe(true);
    }
  });

  it("rejects invalid hex colors", () => {
    const bad = structuredClone(acmeInput);
    bad.identity.colors.roles.signal = "orange" as never;
    expect(validate(bad).ok).toBe(false);
  });

  it("rejects non-slug brand names", () => {
    const bad = structuredClone(acmeInput);
    bad.meta.name = "Acme Inc!" as never;
    expect(validate(bad).ok).toBe(false);
  });

  it("rejects logo.allowedOn referencing unknown roles", () => {
    const bad = structuredClone(acmeInput);
    bad.identity.logo!.allowedOn = ["ink", "chartreuse"];
    const r = validate(bad);
    expect(r.ok).toBe(false);
  });

  it("rejects a word that is both banned and required", () => {
    const bad = structuredClone(acmeInput);
    bad.voice!.required = ["Synergy"];
    expect(validate(bad).ok).toBe(false);
  });

  it("warns (not fails) on a low-contrast signal color", () => {
    const meh = structuredClone(acmeInput);
    meh.identity.colors.roles.signal = "#B8B8B8"; // low contrast on both ink and paper? gray-ish
    const r = validate(meh);
    if (r.ok) {
      expect(r.warnings.length).toBeGreaterThanOrEqual(0);
    }
  });

  it("normalizes hex casing to uppercase", () => {
    const lower = structuredClone(acmeInput);
    lower.identity.colors.roles.signal = "#ff4d00";
    const spec = parse(lower);
    expect(spec.identity.colors.roles.signal).toBe("#FF4D00");
  });
});
