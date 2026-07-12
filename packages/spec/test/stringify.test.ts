import { describe, expect, it } from "vitest";
import { stringify, parse, acme, acmeInput } from "../src/index.js";

describe("stringify (canonical serialization)", () => {
  it("produces identical bytes for identical content regardless of key order", () => {
    const shuffled = JSON.parse(JSON.stringify(acmeInput));
    // scramble key order at multiple depths
    const scrambled = {
      voice: shuffled.voice,
      judgment: shuffled.judgment,
      meta: shuffled.meta,
      identity: {
        spacing: shuffled.identity.spacing,
        logo: shuffled.identity.logo,
        colors: {
          usage: shuffled.identity.colors.usage,
          roles: {
            muted: shuffled.identity.colors.roles.muted,
            signal: shuffled.identity.colors.roles.signal,
            paper: shuffled.identity.colors.roles.paper,
            ink: shuffled.identity.colors.roles.ink,
          },
        },
        typography: shuffled.identity.typography,
      },
      imagery: shuffled.imagery,
      composition: shuffled.composition,
      $schema: shuffled.$schema,
    };
    expect(stringify(parse(scrambled))).toBe(stringify(acme));
  });

  it("is stable across repeated serialization", () => {
    const once = stringify(acme);
    const twice = stringify(parse(JSON.parse(once)));
    expect(twice).toBe(once);
  });

  it("orders top-level keys per schema declaration", () => {
    const keys = Object.keys(JSON.parse(stringify(acme)));
    expect(keys).toEqual([
      "$schema",
      "meta",
      "identity",
      "composition",
      "imagery",
      "voice",
      "judgment",
    ]);
  });

  it("sorts catchall color roles alphabetically after declared roles", () => {
    const withExtra = structuredClone(acmeInput);
    (withExtra.identity.colors.roles as Record<string, string>).zeta = "#123456";
    (withExtra.identity.colors.roles as Record<string, string>).alpha = "#654321";
    const roles = JSON.parse(stringify(parse(withExtra))).identity.colors.roles;
    expect(Object.keys(roles)).toEqual(["ink", "paper", "signal", "muted", "alpha", "zeta"]);
  });

  it("ends with a trailing newline and contains no timestamps", () => {
    const s = stringify(acme);
    expect(s.endsWith("\n")).toBe(true);
    expect(s).not.toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:/); // no ISO datetimes in body
  });
});
