import { z } from "zod";
import { ALL_FORMATS, type FormatId } from "./formats.js";

export const SPEC_SCHEMA_URL = "https://brandrail.dev/spec/v0.1.json";
export const SPEC_VERSION = "0.1";

/** #RRGGBB, uppercase or lowercase accepted; canonical form is uppercase. */
export const HexColor = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, "must be a 6-digit hex color like #FF4D00");

/** kebab-case slug used for brand names. */
export const Slug = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9][a-z0-9-]*$/, "must be a kebab-case slug");

/** blob://, https://, http:// or data: reference to a stored asset. */
export const AssetRef = z
  .string()
  .regex(/^(blob:\/\/|https?:\/\/|data:)/, "must be a blob://, http(s):// or data: reference");

/** ISO date (YYYY-MM-DD). No timestamps in the body — specs must be byte-stable. */
export const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "must be YYYY-MM-DD");

export const LAYOUT_ARCHETYPES = [
  "hero-statement",
  "split-stat",
  "quote",
  "list-3",
  "cta-card",
  "promo-card",
  "feature-grid",
  "testimonial",
  "announcement",
  "before-after",
] as const;
export const LayoutArchetype = z.enum(LAYOUT_ARCHETYPES);
export type LayoutArchetype = z.infer<typeof LayoutArchetype>;
const FormatIdSchema = z.enum(ALL_FORMATS as unknown as [FormatId, ...FormatId[]]);

export const TemplateRecipeSchema = z.object({
  id: Slug,
  name: z.string().trim().min(1).max(64),
  template: LayoutArchetype.optional(),
  templates: z.record(FormatIdSchema, LayoutArchetype).optional(),
  modifications: z.array(z.object({
    format: FormatIdSchema,
    slide: z.number().int().min(0).max(20).default(0),
    name: z.enum(["kicker", "hook", "body", "cta", "badge", "rating"]),
    text: z.string().max(500),
  })).max(100).optional(),
  media: z.array(z.object({
    format: FormatIdSchema,
    name: z.enum(["primary", "secondary"]),
    photoIndex: z.number().int().min(0).max(11),
  })).max(10).optional(),
}).superRefine((value, ctx) => {
  if (value.template && value.templates) ctx.addIssue({ code: "custom", message: "recipe uses template or templates, not both" });
  const hasDecision = Boolean(
    value.template
    || Object.keys(value.templates ?? {}).length
    || value.modifications?.length
    || value.media?.length,
  );
  if (!hasDecision) ctx.addIssue({ code: "custom", message: "recipe must preserve at least one template, modification, or media decision" });
  const modificationTargets = (value.modifications ?? []).map((item) => `${item.format}:${item.slide}:${item.name}`);
  if (new Set(modificationTargets).size !== modificationTargets.length) {
    ctx.addIssue({ code: "custom", path: ["modifications"], message: "recipe modification targets must be unique" });
  }
  const mediaTargets = (value.media ?? []).map((item) => `${item.format}:${item.name}`);
  if (new Set(mediaTargets).size !== mediaTargets.length) {
    ctx.addIssue({ code: "custom", path: ["media"], message: "recipe media targets must be unique" });
  }
});

export const MetaSchema = z.object({
  name: Slug,
  /** human-facing brand name for wordmarks ("Mr. Handyman"); name stays the machine id */
  displayName: z.string().min(1).max(64).optional(),
  version: z.number().int().positive(),
  forkedFrom: z
    .object({ name: Slug, version: z.number().int().positive() })
    .nullable()
    .default(null),
  compiledFrom: z
    .object({
      type: z.enum(["url", "manual", "figma", "canva"]), // figma/canva: V1
      source: z.string(),
      at: IsoDate,
    })
    .nullable()
    .default(null),
});

export const ColorRolesSchema = z
  .object({
    ink: HexColor,
    paper: HexColor,
    signal: HexColor,
    muted: HexColor.optional(),
  })
  .catchall(HexColor);

export const ColorsSchema = z.object({
  roles: ColorRolesSchema,
  usage: z
    .object({
      signalMaxAreaPct: z.number().min(0).max(100).default(15),
      minContrast: z.number().min(1).max(21).default(4.5),
    })
    .default({}),
});

export const FontSourceSchema = z.object({
  url: AssetRef,
  weight: z.number().int().min(100).max(900),
  /** wire format; woff2 is decompressed to sfnt at render time */
  format: z.enum(["woff2", "woff", "ttf", "otf"]).default("woff2"),
});

export const FontSchema = z.object({
  family: z.string().min(1),
  weights: z.array(z.number().int().min(100).max(900)).nonempty(),
  fallback: z.enum(["sans-serif", "serif", "monospace"]).default("sans-serif"),
  case: z.enum(["none", "upper", "title"]).default("none"),
  trackingEm: z.number().min(-0.2).max(0.5).default(0),
  /** the brand's actual font files, harvested from @font-face — rendered
   * verbatim so headlines/wordmarks use the real typeface, not a fallback */
  sources: z.array(FontSourceSchema).max(8).default([]),
});

export const TypographySchema = z.object({
  display: FontSchema,
  body: FontSchema,
  scale: z
    .object({
      ratio: z.number().min(1).max(2).default(1.25),
      minBodyPx: z.number().int().min(8).default(14),
    })
    .default({}),
});

/**
 * Optional visual grammar that lets two brands with similar colors and type
 * still produce materially different compositions. Every field has a safe
 * default so existing v0.1 BrandSpecs remain valid and byte-stable.
 */
export const VisualLanguageSchema = z
  .object({
    family: z.enum(["editorial", "modular", "image-led"]).default("editorial"),
    corners: z.enum(["sharp", "soft", "pill"]).default("sharp"),
    borders: z.enum(["none", "hairline", "strong"]).default("none"),
    background: z.enum(["flat", "tinted", "split", "framed"]).default("flat"),
    imageTreatment: z.enum(["full-bleed", "contained", "masked", "monochrome"]).default("full-bleed"),
    logoTreatment: z.enum(["auto", "primary", "mark", "wordmark"]).default("auto"),
    colorBalance: z.enum(["restrained", "balanced", "bold"]).default("restrained"),
  })
  .default({});

export const LogoSchema = z.object({
  // Both assets optional: the compiler may not find a logo, and templates must
  // degrade to a wordmark rather than fail. // DECISION: missing logo is a
  // degradation case handled by templates, not a validation error.
  assets: z
    .object({
      primary: AssetRef.optional(),
      mark: AssetRef.optional(),
    })
    .default({}),
  clearspace: z.string().default("1x-mark-height"),
  minSizePx: z.number().int().min(8).default(24),
  allowedOn: z.array(z.string().min(1)).default(["ink", "paper"]),
  distort: z.literal(false).default(false),
});

export const IdentitySchema = z.object({
  colors: ColorsSchema,
  typography: TypographySchema,
  logo: LogoSchema.default({}),
  visualLanguage: VisualLanguageSchema,
  spacing: z
    .object({
      unit: z.number().int().min(2).max(32).default(8),
      grid: z.enum(["12col", "8col", "4col"]).default("12col"),
    })
    .default({}),
});

export const PhotoAssetSchema = z.union([
  AssetRef,
  z.object({
    ref: AssetRef,
    /** Human or compiler supplied meaning used for deterministic selection. */
    alt: z.string().max(240).default(""),
    context: z.string().max(500).default(""),
    tags: z.array(z.string().min(1).max(48)).max(12).default([]),
  }),
]);

export const CompositionSchema = z
  .object({
    densityMaxElementsPerZone: z.number().int().min(1).max(10).default(3),
    layoutArchetypes: z.array(LayoutArchetype).nonempty().default([...LAYOUT_ARCHETYPES]),
    whitespaceMinPct: z.number().min(0).max(80).default(30),
    alignment: z.enum(["left", "center", "mixed"]).default("left"),
    /** Reusable visual decisions; campaign copy remains separate. */
    recipes: z.array(TemplateRecipeSchema).max(24).default([]),
  })
  .superRefine((value, ctx) => {
    const ids = value.recipes.map((recipe) => recipe.id);
    if (new Set(ids).size !== ids.length) ctx.addIssue({ code: "custom", message: "recipe ids must be unique" });
  })
  .default({});

export const ImagerySchema = z
  .object({
    photography: z
      .object({
        style: z.string().default(""),
        allowed: z.boolean().default(true),
      })
      .default({}),
    illustration: z.object({ allowed: z.boolean().default(false) }).default({}),
    iconography: z
      .object({
        set: z.string().default("lucide"),
        strokePx: z.number().min(0.5).max(8).default(2),
      })
      .default({}),
    /** the brand's own photography, harvested at compile time — the only
     * imagery templates may place; text never renders over a photo */
    photos: z.array(PhotoAssetSchema).max(12).default([]),
    aiFences: z
      .object({
        backgrounds: z.boolean().default(false),
        subjects: z.literal(false).default(false), // generative subjects are never allowed in v0.1
      })
      .default({}),
  })
  .default({});

export const VoiceSchema = z
  .object({
    tone: z.array(z.string().min(1)).default([]),
    emojiMax: z.number().int().min(0).max(10).default(1),
    banned: z.array(z.string().min(1)).default([]),
    required: z.array(z.string().min(1)).default([]),
    ctaStyle: z
      .enum(["imperative-short", "imperative", "conversational", "formal"])
      .default("imperative-short"),
    hashtagMax: z.number().int().min(0).max(10).default(2),
  })
  .default({});

export const ExampleSchema = z.object({
  note: z.string().min(1),
  ref: AssetRef.nullable().default(null),
});

export const JudgmentSchema = z
  .object({
    positive: z.array(ExampleSchema).default([]),
    negative: z.array(ExampleSchema).default([]),
    promptSnippets: z.array(z.string().min(1)).default([]),
  })
  .default({});

export const BrandSpecSchema = z.object({
  $schema: z.literal(SPEC_SCHEMA_URL).default(SPEC_SCHEMA_URL),
  meta: MetaSchema,
  identity: IdentitySchema,
  composition: CompositionSchema,
  imagery: ImagerySchema,
  voice: VoiceSchema,
  judgment: JudgmentSchema,
}).superRefine((value, ctx) => {
  for (const [recipeIndex, recipe] of value.composition.recipes.entries()) {
    const selected = [recipe.template, ...Object.values(recipe.templates ?? {})].filter(Boolean) as LayoutArchetype[];
    for (const archetype of selected) {
      if (!value.composition.layoutArchetypes.includes(archetype)) {
        ctx.addIssue({ code: "custom", path: ["composition", "recipes", recipeIndex], message: `recipe template ${archetype} is not allowed by this BrandSpec` });
      }
    }
    for (const media of recipe.media ?? []) {
      if (!value.imagery.photos[media.photoIndex]) {
        ctx.addIssue({ code: "custom", path: ["composition", "recipes", recipeIndex, "media"], message: `recipe references missing brand photo ${media.photoIndex}` });
      }
    }
  }
});

export type BrandSpec = z.infer<typeof BrandSpecSchema>;
export type BrandSpecInput = z.input<typeof BrandSpecSchema>;
export type Meta = z.infer<typeof MetaSchema>;
export type Identity = z.infer<typeof IdentitySchema>;
export type VisualLanguage = z.infer<typeof VisualLanguageSchema>;
export type PhotoAsset = z.infer<typeof PhotoAssetSchema>;
export type Composition = z.infer<typeof CompositionSchema>;
export type TemplateRecipe = z.infer<typeof TemplateRecipeSchema>;
export type Imagery = z.infer<typeof ImagerySchema>;
export type Voice = z.infer<typeof VoiceSchema>;
export type Judgment = z.infer<typeof JudgmentSchema>;
