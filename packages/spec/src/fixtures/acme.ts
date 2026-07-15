import type { BrandSpecInput, BrandSpec } from "../schema.js";
import { parse } from "../validate.js";

/**
 * The canonical fixture brand used across the monorepo and the engine:
 * renderer snapshots, determinism gates, CLI examples and docs all use acme.
 */
export const acmeInput: BrandSpecInput = {
  $schema: "https://brandrail.dev/spec/v0.1.json",
  meta: {
    name: "acme",
    version: 3,
    forkedFrom: null,
    compiledFrom: { type: "url", source: "https://acme.com", at: "2026-07-07" },
  },
  identity: {
    colors: {
      roles: { ink: "#101012", paper: "#FFFFFF", signal: "#FF4D00", muted: "#9B978F" },
      usage: { signalMaxAreaPct: 15, minContrast: 4.5 },
    },
    typography: {
      display: {
        family: "Space Grotesk",
        weights: [700],
        fallback: "sans-serif",
        case: "none",
        trackingEm: -0.02,
      },
      body: { family: "Inter", weights: [400, 600], fallback: "sans-serif" },
      scale: { ratio: 1.25, minBodyPx: 14 },
    },
    logo: {
      assets: {},
      clearspace: "1x-mark-height",
      minSizePx: 24,
      allowedOn: ["ink", "paper"],
      distort: false,
    },
    visualLanguage: {
      family: "modular",
      corners: "sharp",
      borders: "none",
      background: "split",
      imageTreatment: "full-bleed",
      logoTreatment: "auto",
      colorBalance: "balanced",
    },
    spacing: { unit: 8, grid: "12col" },
  },
  composition: {
    densityMaxElementsPerZone: 3,
    layoutArchetypes: ["hero-statement", "split-stat", "quote", "list-3", "cta-card", "promo-card", "feature-grid", "testimonial", "announcement", "before-after"],
    whitespaceMinPct: 30,
    alignment: "left",
  },
  imagery: {
    photography: { style: "natural light, real people, no stock poses", allowed: true },
    illustration: { allowed: false },
    iconography: { set: "lucide", strokePx: 2 },
    aiFences: { backgrounds: true, subjects: false },
  },
  voice: {
    tone: ["direct", "confident", "dry"],
    emojiMax: 1,
    banned: ["synergy", "game-changing", "unleash", "revolutionize"],
    required: [],
    ctaStyle: "imperative-short",
    hashtagMax: 2,
  },
  judgment: {
    positive: [{ note: "big stat, tiny caption", ref: null }],
    negative: [{ note: "never gradient backgrounds", ref: null }],
    promptSnippets: ["Write like a senior engineer with taste."],
  },
};

export const acme: BrandSpec = parse(acmeInput);
