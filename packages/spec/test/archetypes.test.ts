import { describe, expect, it } from "vitest";
import { ARCHETYPE_INFO, CustomTemplateFamilySchema, LAYOUT_ARCHETYPES, acme, parse } from "../src/index.js";

describe("template catalog", () => {
  it("publishes dynamic-field contracts and locked brand objects for every template", () => {
    expect(Object.keys(ARCHETYPE_INFO).sort()).toEqual([...LAYOUT_ARCHETYPES].sort());
    for (const archetype of LAYOUT_ARCHETYPES) {
      const template = ARCHETYPE_INFO[archetype];
      expect(template.slots.hook).toMatchObject({ required: true });
      expect(template.slots.hook!.maxChars).toBeGreaterThan(0);
      expect(template.locked).toEqual(expect.arrayContaining(["colors", "type", "spacing", "logo"]));
    }
  });

  it("publishes structured numeric contracts separately from editable text", () => {
    expect(ARCHETYPE_INFO["data-trend"].dataSlots?.series).toMatchObject({
      required: true,
      minItems: 2,
      maxItems: 6,
    });
    expect(ARCHETYPE_INFO["data-trend"].slots).not.toHaveProperty("series");
  });

  it("validates safe normalized custom template families and stable refs", () => {
    const now = new Date().toISOString();
    const family = CustomTemplateFamilySchema.parse({
      id: "launch-frame",
      name: "Launch frame",
      version: 1,
      status: "draft",
      scope: "workspace",
      baseArchetype: "hero-statement",
      intents: ["announcement"],
      formats: {
        "li-image": {
          backgroundRole: "paper",
          layers: [{ id: "headline", type: "text", slot: "hook", box: { x: 0.1, y: 0.1, width: 0.8, height: 0.3 }, typography: "display", maxLines: 3, maxChars: 90, required: true, align: "left", colorRole: "ink", surfaceRole: "paper" }],
        },
      },
      createdAt: now,
      updatedAt: now,
    });
    expect(family).toMatchObject({ id: "launch-frame", version: 1, autoEligible: false });
    expect(() => CustomTemplateFamilySchema.parse({ ...family, autoEligible: true })).toThrow(/only published families/);
    expect(() => CustomTemplateFamilySchema.parse({ ...family, arbitraryCss: "position: fixed" })).toThrow(/unrecognized key/i);
    expect(() => CustomTemplateFamilySchema.parse({ ...family, formats: { "li-image": { ...family.formats["li-image"], layers: [{ ...family.formats["li-image"]!.layers[0]!, onclick: "alert(1)" }] } } })).toThrow(/unrecognized key/i);
    expect(() => CustomTemplateFamilySchema.parse({ ...family, formats: { "li-image": { backgroundRole: "paper", layers: [{ id: "bad", type: "shape", box: { x: 0.9, y: 0, width: 0.2, height: 1 }, fillRole: "paper" }] } } })).toThrow();
  });

  it("keeps reusable visual recipes portable and mutually exclusive", () => {
    const withRecipe = parse({
      ...acme,
      composition: {
        ...acme.composition,
        recipes: [{ id: "weekly-launch", name: "Weekly launch", templates: { story: "cta-card" } }],
      },
    });
    expect(withRecipe.composition.recipes[0]).toMatchObject({ id: "weekly-launch", templates: { story: "cta-card" } });
    expect(() => parse({
      ...acme,
      composition: {
        ...acme.composition,
        recipes: [{ id: "bad", name: "Bad", template: "quote", templates: { story: "cta-card" } }],
      },
    })).toThrow();
  });

  it("rejects empty and ambiguous visual recipes", () => {
    expect(() => parse({
      ...acme,
      composition: { ...acme.composition, recipes: [{ id: "empty", name: "Empty" }] },
    })).toThrow(/at least one template, modification, or media decision/);
    expect(() => parse({
      ...acme,
      imagery: { ...acme.imagery, photos: ["https://example.com/photo.jpg"] },
      composition: {
        ...acme.composition,
        recipes: [{
          id: "ambiguous",
          name: "Ambiguous",
          media: [
            { format: "story", name: "primary", photoIndex: 0 },
            { format: "story", name: "primary", photoIndex: 0 },
          ],
        }],
      },
    })).toThrow(/media targets must be unique/);
  });

  it("rejects recipe fields that the selected template cannot render", () => {
    expect(() => parse({
      ...acme,
      composition: {
        ...acme.composition,
        recipes: [{ id: "missing-product-photo", name: "Missing product photo", template: "promo-card" }],
      },
    })).toThrow(/promo-card requires 1 approved brand photo/);
    expect(() => parse({
      ...acme,
      composition: {
        ...acme.composition,
        recipes: [{
          id: "ignored-badge",
          name: "Ignored badge",
          template: "hero-statement",
          modifications: [{ format: "story", slide: 0, name: "badge", text: "NEW" }],
        }],
      },
    })).toThrow(/hero-statement does not expose the named text field "badge"/);
    expect(() => parse({
      ...acme,
      imagery: { ...acme.imagery, photos: ["https://example.com/photo.jpg"] },
      composition: {
        ...acme.composition,
        recipes: [{
          id: "ignored-photo",
          name: "Ignored photo",
          templates: { story: "cta-card" },
          media: [{ format: "story", name: "primary", photoIndex: 0 }],
        }],
      },
    })).toThrow(/cta-card does not expose the named image field "primary"/);
    expect(() => parse({
      ...acme,
      composition: {
        ...acme.composition,
        recipes: [{
          id: "overlong-cta",
          name: "Overlong CTA",
          template: "cta-card",
          modifications: [{ format: "story", slide: 0, name: "cta", text: "This call to action is far too long for the component" }],
        }],
      },
    })).toThrow(/Call to action exceeds the cta-card limit of 24 characters/);
  });
});
