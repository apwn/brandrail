import type { LayoutArchetype } from "./schema.js";

export type TemplateSlotName = "kicker" | "hook" | "body" | "cta" | "badge" | "rating";
export type TemplateMediaSlotName = "primary" | "secondary";
export type TemplateDataSlotName = "series";

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
  /** Structured numeric inputs. Kept separate from text so charts never infer values from prose. */
  dataSlots?: Partial<Record<TemplateDataSlotName, {
    label: string;
    minItems: number;
    maxItems: number;
    placeholder: Array<{ label: string; value: number }>;
    required?: boolean;
  }>>;
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
      body: field("Feature list", 260, "Feature — short detail\nFeature — short detail", { minChars: 2, required: true, multiline: true }),
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
      body: field("List items", 240, "First point\nSecond point\nThird point", { minChars: 2, required: true, multiline: true }),
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
      body: field("Attribution", 60, "Name, role", { minChars: 2, required: true }),
      rating: field("Rating", 4, "5", { minChars: 1, required: true }),
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
      kicker: field("Date or label", 32, "JUNE 14", { minChars: 2, required: true }),
      hook: field("Announcement", 64, "The event or launch name", { minChars: 2, required: true }),
      body: field("Details", 90, "Online · 6pm ET", { multiline: true }),
      cta: field("Call to action", 24, "Save your seat"),
    },
    mediaSlots: { primary: { label: "Event or launch photo" } },
    locked: locked("announcement tab", "photo crop", "photo treatment"),
  },
  "before-after": {
    label: "Before / after",
    description: "Two photo panels with labels you choose, over a title.",
    bestFor: "comparisons, transformations — needs two photos + your labels",
    needsPhotos: true,
    optIn: true,
    slots: {
      kicker: field("Hero label", 18, "AFTER", { minChars: 1, required: true }),
      hook: field("Comparison title", 56, "Show the transformation", { minChars: 2, required: true }),
      body: field("Supporting copy", 90, "Describe the meaningful change.", { multiline: true }),
      badge: field("Reference label", 18, "BEFORE", { minChars: 1, required: true }),
    },
    mediaSlots: {
      primary: { label: "After photo", required: true },
      secondary: { label: "Before photo", required: true },
    },
    locked: locked("photo crops", "photo treatment", "comparison frame"),
  },
  "product-showcase": {
    label: "Product showcase",
    description: "A contained product or UI image with one feature claim and CTA.",
    bestFor: "product demos, app screens, feature releases, interface callouts",
    needsPhotos: true,
    slots: {
      kicker: field("Eyebrow", 36, "PRODUCT UPDATE"),
      hook: field("Feature headline", 70, "The workspace, made visible", { minChars: 2, required: true }),
      body: field("Supporting copy", 140, "Explain the useful change in one sentence.", { multiline: true }),
      cta: field("Call to action", 24, "See the update"),
      badge: field("Status badge", 16, "NOW LIVE"),
    },
    mediaSlots: { primary: { label: "Product or UI image", required: true } },
    locked: locked("product frame", "photo crop", "photo treatment"),
  },
  "process-3": {
    label: "Three-step process",
    description: "Three connected stages communicate sequence rather than a loose list.",
    bestFor: "workflows, onboarding, methods, how-it-works posts",
    slots: {
      kicker: field("Eyebrow", 36, "HOW IT WORKS"),
      hook: field("Process title", 60, "From brief to approved", { minChars: 2, required: true }),
      body: field("Three stages", 240, "Compile — capture the system\nRender — create every format\nReview — approve with context", { minChars: 2, required: true, multiline: true }),
      cta: field("Call to action", 24, "See the workflow"),
    },
    locked: locked("stage markers", "connectors"),
  },
  "data-trend": {
    label: "Data trend",
    description: "A sourced numeric series rendered as a compact deterministic chart.",
    bestFor: "time series, campaign performance, benchmark movement — supply real data",
    optIn: true,
    slots: {
      kicker: field("Eyebrow", 36, "QUARTERLY TREND"),
      hook: field("Chart headline", 64, "Review time keeps falling", { minChars: 2, required: true }),
      body: field("Source or takeaway", 120, "Source: approved campaign analytics", { minChars: 2, required: true, multiline: true }),
      cta: field("Call to action", 24, "View the report"),
    },
    dataSlots: {
      series: {
        label: "Numeric series",
        minItems: 2,
        maxItems: 6,
        required: true,
        placeholder: [
          { label: "Q1", value: 42 },
          { label: "Q2", value: 58 },
          { label: "Q3", value: 71 },
          { label: "Q4", value: 84 },
        ],
      },
    },
    locked: locked("chart scale", "chart marks", "source treatment"),
  },
  "case-study-proof": {
    label: "Case study proof",
    description: "A verified result, customer attribution, and compact supporting narrative.",
    bestFor: "case studies, customer outcomes, proof posts — supply a real result and attribution",
    optIn: true,
    slots: {
      kicker: field("Eyebrow", 36, "CUSTOMER RESULT"),
      hook: field("Result", 14, "42%", { minChars: 1, required: true }),
      body: field("Proof story", 220, "What changed, for whom, and why it matters.", { minChars: 2, required: true, multiline: true }),
      badge: field("Customer", 40, "Acme · Operations", { minChars: 2, required: true }),
      cta: field("Call to action", 24, "Read the story"),
    },
    locked: locked("proof hierarchy", "attribution treatment"),
  },
  "screenshot-callout": {
    label: "Screenshot callout",
    description: "A framed product screen with one focused annotation and supporting copy.",
    bestFor: "UI walkthroughs, feature reveals, release notes, product education",
    needsPhotos: true,
    slots: {
      kicker: field("Eyebrow", 36, "IN THE PRODUCT"),
      hook: field("Callout", 64, "Find the signal in seconds", { minChars: 2, required: true }),
      body: field("Explanation", 180, "Explain what the highlighted area lets someone do.", { minChars: 2, required: true, multiline: true }),
      badge: field("Status", 18, "NEW"),
      cta: field("Call to action", 24, "See it in action"),
    },
    mediaSlots: { primary: { label: "Product screenshot", required: true } },
    locked: locked("screen frame", "annotation marker", "image fit"),
  },
  "compare-2": {
    label: "Two-way comparison",
    description: "Two labeled text columns compare approaches without requiring photos.",
    bestFor: "plans, approaches, old-versus-new, option comparisons",
    optIn: true,
    slots: {
      kicker: field("Left label", 18, "BEFORE", { minChars: 1, required: true }),
      badge: field("Right label", 18, "AFTER", { minChars: 1, required: true }),
      hook: field("Comparison title", 64, "A clearer way to work", { minChars: 2, required: true }),
      body: field("Paired points", 260, "Manual handoffs → Shared context\nOne-off files → Reusable systems", { minChars: 2, required: true, multiline: true }),
      cta: field("Call to action", 24, "Compare the workflow"),
    },
    locked: locked("comparison columns", "pair markers"),
  },
  timeline: {
    label: "Timeline",
    description: "A chronological sequence of up to five dated milestones.",
    bestFor: "roadmaps, launch sequences, histories, event schedules",
    optIn: true,
    slots: {
      kicker: field("Eyebrow", 36, "THE ROADMAP"),
      hook: field("Timeline title", 64, "From pilot to rollout", { minChars: 2, required: true }),
      body: field("Milestones", 300, "MAY — Pilot\nJUNE — Learn\nJULY — Roll out", { minChars: 2, required: true, multiline: true }),
      cta: field("Call to action", 24, "Follow the rollout"),
    },
    locked: locked("timeline rail", "milestone markers"),
  },
  "ranked-bars": {
    label: "Ranked bars",
    description: "A sourced numeric ranking with horizontal bars and direct labels.",
    bestFor: "rankings, category comparisons, survey results — supply real values",
    optIn: true,
    slots: {
      kicker: field("Eyebrow", 36, "TOP DRIVERS"),
      hook: field("Ranking headline", 64, "What teams value most", { minChars: 2, required: true }),
      body: field("Source", 120, "Source: approved customer survey", { minChars: 2, required: true, multiline: true }),
      cta: field("Call to action", 24, "View the findings"),
    },
    dataSlots: {
      series: {
        label: "Ranked numeric series",
        minItems: 2,
        maxItems: 6,
        required: true,
        placeholder: [
          { label: "Clarity", value: 84 },
          { label: "Speed", value: 71 },
          { label: "Control", value: 63 },
        ],
      },
    },
    locked: locked("rank order", "bar scale", "source treatment"),
  },
};
