import type { LayoutArchetype } from "./schema.js";

export type TemplateSlotName = "kicker" | "hook" | "body" | "cta" | "badge" | "rating";
export type TemplateMediaSlotName = "primary" | "secondary";

export interface TemplateSlotInfo {
  label: string;
  maxChars: number;
  minChars?: number;
  required?: boolean;
  multiline?: boolean;
  placeholder: string;
}

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
  /** Bannerbear-style named text objects that may be changed per render. */
  slots: Partial<Record<TemplateSlotName, TemplateSlotInfo>>;
  /** Brand-library imagery users may choose; crop and treatment stay locked. */
  mediaSlots?: Partial<Record<TemplateMediaSlotName, { label: string; required?: boolean }>>;
  /** Design objects controlled by the BrandSpec rather than per-render input. */
  locked: string[];
}

const locked = (...extra: string[]) => ["colors", "type", "spacing", "logo", ...extra];
const field = (
  label: string,
  maxChars: number,
  placeholder: string,
  options: Pick<TemplateSlotInfo, "minChars" | "required" | "multiline"> = {},
): TemplateSlotInfo => ({ label, maxChars, placeholder, ...options });

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
    slots: {
      kicker: field("Eyebrow", 36, "NEW · PRODUCT UPDATE"),
      hook: field("Headline", 90, "One idea worth stopping for", { minChars: 2, required: true }),
      body: field("Supporting copy", 220, "Add one concise supporting thought.", { multiline: true }),
      cta: field("Call to action", 24, "Learn more"),
    },
    mediaSlots: { primary: { label: "Hero photo" } },
    locked: locked("photo crop", "photo treatment"),
  },
  "cta-card": {
    label: "CTA card",
    description: "Inverted (dark) card built around one call to action.",
    bestFor: "conversion posts, closing carousel slides",
    slots: {
      kicker: field("Eyebrow", 36, "READY WHEN YOU ARE"),
      hook: field("Headline", 70, "Make the next move", { minChars: 2, required: true }),
      body: field("Supporting copy", 160, "Explain the value in one short paragraph.", { multiline: true }),
      cta: field("Call to action", 24, "Get started"),
    },
    locked: locked(),
  },
  "promo-card": {
    label: "Promo card",
    description: "Product photo, an offer badge, one stated offer, a CTA chip, scan-to-shop QR.",
    bestFor: "sales, discounts, product promotions",
    needsPhotos: true,
    slots: {
      kicker: field("Eyebrow", 36, "LIMITED RELEASE"),
      hook: field("Offer", 70, "State the offer plainly", { minChars: 2, required: true }),
      body: field("Supporting copy", 140, "Add the essential condition or benefit.", { multiline: true }),
      cta: field("Call to action", 24, "Shop now"),
      badge: field("Offer badge", 10, "-30%"),
    },
    mediaSlots: { primary: { label: "Product photo", required: true } },
    locked: locked("photo crop", "photo treatment", "QR treatment"),
  },
  "feature-grid": {
    label: "Feature grid",
    description: "A title over a 2×2 grid of titled feature points.",
    bestFor: "capability rundowns, 'what's inside', spec highlights",
    slots: {
      kicker: field("Eyebrow", 36, "WHAT'S INSIDE"),
      hook: field("Section title", 56, "Everything you need", { minChars: 2, required: true }),
      body: field("Feature list", 260, "Feature — short detail\nFeature — short detail", { multiline: true }),
      cta: field("Call to action", 24, "Explore all"),
    },
    locked: locked("grid structure"),
  },
  "list-3": {
    label: "List of three",
    description: "A title over up to three square-bulleted points.",
    bestFor: "tips, steps, three-reason posts",
    slots: {
      kicker: field("Eyebrow", 36, "THREE THINGS"),
      hook: field("List title", 60, "Three reasons to care", { minChars: 2, required: true }),
      body: field("List items", 240, "First point\nSecond point\nThird point", { multiline: true }),
      cta: field("Call to action", 24, "Read more"),
    },
    locked: locked("list markers"),
  },
  "split-stat": {
    label: "Split stat",
    description: "One oversized number with a tiny caption.",
    bestFor: "metrics, milestones — supply the real number in the brief",
    optIn: true,
    slots: {
      kicker: field("Eyebrow", 36, "THE RESULT"),
      hook: field("Statistic", 12, "4×", { minChars: 1, required: true }),
      body: field("Stat context", 180, "Explain what the number means.", { multiline: true }),
      cta: field("Call to action", 24, "See how"),
    },
    locked: locked("stat composition"),
  },
  quote: {
    label: "Pull quote",
    description: "An editorial pull-quote with a hanging mark.",
    bestFor: "manifestos, taglines, editorial voice",
    slots: {
      kicker: field("Eyebrow", 36, "POINT OF VIEW"),
      hook: field("Quote", 150, "Write the quote without quotation marks.", { minChars: 2, required: true, multiline: true }),
      body: field("Attribution", 60, "Name, role"),
      cta: field("Call to action", 24, "Read more"),
    },
    locked: locked("quotation mark"),
  },
  testimonial: {
    label: "Testimonial",
    description: "A customer quote with a star rating and an avatar.",
    bestFor: "social proof, reviews — supply the real quote and rating",
    needsPhotos: true,
    optIn: true,
    slots: {
      kicker: field("Eyebrow", 36, "CUSTOMER STORY"),
      hook: field("Testimonial", 160, "Use the customer's real words.", { minChars: 2, required: true, multiline: true }),
      body: field("Attribution", 60, "Name, role"),
      rating: field("Rating", 4, "5"),
    },
    mediaSlots: { primary: { label: "Customer photo", required: true } },
    locked: locked("photo crop", "photo treatment", "rating treatment"),
  },
  announcement: {
    label: "Announcement",
    description: "A date/label tab, an event name, a details line, and a CTA.",
    bestFor: "events, launches, 'save the date' — supply the real date",
    optIn: true,
    slots: {
      kicker: field("Date or label", 32, "JUNE 14"),
      hook: field("Announcement", 64, "The event or launch name", { minChars: 2, required: true }),
      body: field("Details", 90, "Online · 6pm ET", { multiline: true }),
      cta: field("Call to action", 24, "Save your seat"),
    },
    locked: locked("announcement tab"),
  },
  "before-after": {
    label: "Before / after",
    description: "Two photo panels with labels you choose, over a title.",
    bestFor: "comparisons, transformations — needs two photos + your labels",
    needsPhotos: true,
    optIn: true,
    slots: {
      kicker: field("Hero label", 18, "AFTER"),
      hook: field("Comparison title", 56, "Show the transformation", { minChars: 2, required: true }),
      body: field("Supporting copy", 90, "Describe the meaningful change.", { multiline: true }),
      badge: field("Reference label", 18, "BEFORE"),
    },
    mediaSlots: {
      primary: { label: "After photo", required: true },
      secondary: { label: "Before photo", required: true },
    },
    locked: locked("photo crops", "photo treatment", "comparison frame"),
  },
};
