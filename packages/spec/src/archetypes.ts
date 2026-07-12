import type { LayoutArchetype } from "./schema.js";

export interface ArchetypeInfo {
  label: string;
  /** one line, written for a human or an agent choosing a template */
  description: string;
  /** best-fit briefs — helps an agent (or the planner) pick */
  bestFor: string;
  /** needs a real brand photo (2 for before-after) to shine */
  needsPhotos?: boolean;
  /** not auto-planned; request explicitly (avoids fabricating stats/quotes/pairs) */
  optIn?: boolean;
}

/**
 * The template catalog — shared by the CLI, MCP server, playground studio, and
 * docs so "what templates exist" has one source of truth. Ordered by how
 * broadly useful each is.
 */
export const ARCHETYPE_INFO: Record<LayoutArchetype, ArchetypeInfo> = {
  "hero-statement": {
    label: "Hero statement",
    description: "One oversized statement carries the canvas; optional photo band.",
    bestFor: "launches, announcements, bold single-idea posts",
  },
  "cta-card": {
    label: "CTA card",
    description: "Inverted (dark) card built around one call to action.",
    bestFor: "conversion posts, closing carousel slides",
  },
  "promo-card": {
    label: "Promo card",
    description: "Product photo, an offer badge, one stated offer, a CTA chip, scan-to-shop QR.",
    bestFor: "sales, discounts, product promotions",
    needsPhotos: true,
  },
  "feature-grid": {
    label: "Feature grid",
    description: "A title over a 2×2 grid of titled feature points.",
    bestFor: "capability rundowns, 'what's inside', spec highlights",
  },
  "list-3": {
    label: "List of three",
    description: "A title over up to three square-bulleted points.",
    bestFor: "tips, steps, three-reason posts",
  },
  "split-stat": {
    label: "Split stat",
    description: "One oversized number with a tiny caption.",
    bestFor: "metrics, milestones — supply the real number in the brief",
    optIn: true,
  },
  quote: {
    label: "Pull quote",
    description: "An editorial pull-quote with a hanging mark.",
    bestFor: "manifestos, taglines, editorial voice",
  },
  testimonial: {
    label: "Testimonial",
    description: "A customer quote with a star rating and an avatar.",
    bestFor: "social proof, reviews — supply the real quote and rating",
    needsPhotos: true,
    optIn: true,
  },
  announcement: {
    label: "Announcement",
    description: "A date/label tab, an event name, a details line, and a CTA.",
    bestFor: "events, launches, 'save the date' — supply the real date",
    optIn: true,
  },
  "before-after": {
    label: "Before / after",
    description: "Two photo panels with labels you choose, over a title.",
    bestFor: "comparisons, transformations — needs two photos + your labels",
    needsPhotos: true,
    optIn: true,
  },
};
