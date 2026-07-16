import { z } from "zod";
import { ALL_FORMATS, type FormatId } from "./formats.js";
import { AssetRef, LayoutArchetype, Slug } from "./schema.js";

const FormatSchema = z.enum(ALL_FORMATS as unknown as [FormatId, ...FormatId[]]);
const Unit = z.number().min(0).max(1);

/** A normalized box. Coordinates are ratios of the output canvas, never pixels. */
export const TemplateBoxSchema = z.object({
  x: Unit,
  y: Unit,
  width: Unit.refine((value) => value > 0, "width must be greater than zero"),
  height: Unit.refine((value) => value > 0, "height must be greater than zero"),
}).strict().superRefine((box, ctx) => {
  if (box.x + box.width > 1.0001) ctx.addIssue({ code: "custom", path: ["width"], message: "box extends beyond the canvas" });
  if (box.y + box.height > 1.0001) ctx.addIssue({ code: "custom", path: ["height"], message: "box extends beyond the canvas" });
});

const ColorRoleSchema = z.string().min(1).max(32).regex(/^[a-z][a-z0-9-]*$/);
const TextSlotSchema = z.enum(["kicker", "hook", "body", "cta", "badge", "rating"]);

export const CustomTemplateLayerSchema = z.discriminatedUnion("type", [
  z.object({
    id: Slug,
    type: z.literal("text"),
    slot: TextSlotSchema,
    box: TemplateBoxSchema,
    typography: z.enum(["display", "body"]).default("body"),
    maxLines: z.number().int().min(1).max(12).default(3),
    maxChars: z.number().int().min(1).max(500),
    required: z.boolean().default(false),
    align: z.enum(["left", "center", "right"]).default("left"),
    colorRole: ColorRoleSchema.default("ink"),
    surfaceRole: ColorRoleSchema.default("paper"),
  }).strict(),
  z.object({
    id: Slug,
    type: z.literal("image"),
    slot: z.enum(["primary", "secondary"]),
    box: TemplateBoxSchema,
    fit: z.enum(["cover", "contain"]).default("cover"),
    required: z.boolean().default(false),
  }).strict(),
  z.object({
    id: Slug,
    type: z.literal("logo"),
    box: TemplateBoxSchema,
    treatment: z.enum(["auto", "primary", "mark", "wordmark"]).default("auto"),
  }).strict(),
  z.object({
    id: Slug,
    type: z.literal("shape"),
    box: TemplateBoxSchema,
    fillRole: ColorRoleSchema.default("paper"),
    borderRole: ColorRoleSchema.optional(),
  }).strict(),
  z.object({
    id: Slug,
    type: z.literal("data"),
    slot: z.literal("series"),
    box: TemplateBoxSchema,
    visualization: z.enum(["bars", "ranked"]).default("bars"),
    colorRole: ColorRoleSchema.default("signal"),
    surfaceRole: ColorRoleSchema.default("paper"),
  }).strict(),
]);

export const CustomTemplateCanvasSchema = z.object({
  backgroundRole: ColorRoleSchema.default("paper"),
  /** Optional locked artwork. Raster images and sanitized SVGs only; never executable markup. */
  artwork: AssetRef.optional(),
  layers: z.array(CustomTemplateLayerSchema).min(1).max(40),
}).strict().superRefine((canvas, ctx) => {
  const ids = canvas.layers.map((layer) => layer.id);
  if (new Set(ids).size !== ids.length) ctx.addIssue({ code: "custom", path: ["layers"], message: "layer ids must be unique" });
  const boundSlots = canvas.layers.flatMap((layer) => layer.type === "text" || layer.type === "image" || layer.type === "data" ? [`${layer.type}:${layer.slot}`] : []);
  if (new Set(boundSlots).size !== boundSlots.length) ctx.addIssue({ code: "custom", path: ["layers"], message: "each dynamic slot may be bound once per canvas" });
  if (!canvas.layers.some((layer) => layer.type === "text" && layer.slot === "hook")) {
    ctx.addIssue({ code: "custom", path: ["layers"], message: "each canvas needs a hook text layer" });
  }
});

export const TemplateRefSchema = z.discriminatedUnion("source", [
  z.object({ source: z.literal("system"), id: LayoutArchetype }).strict(),
  z.object({ source: z.enum(["workspace", "brand"]), id: Slug, version: z.number().int().positive().optional() }).strict(),
]);

export const CustomTemplateFamilySchema = z.object({
  id: Slug,
  name: z.string().trim().min(1).max(80),
  version: z.number().int().positive(),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  scope: z.enum(["workspace", "brand"]),
  brand: Slug.optional(),
  baseArchetype: LayoutArchetype,
  intents: z.array(z.enum(["announcement", "education", "promotion", "proof", "engagement", "product"])).min(1).max(6),
  evidence: z.array(z.enum(["none", "metric", "quote", "source", "product", "steps", "comparison", "timeline"])).max(8).default([]),
  /** Published families remain manual-only unless an operator explicitly opts them into planning. */
  autoEligible: z.boolean().default(false),
  formats: z.record(FormatSchema, CustomTemplateCanvasSchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).strict().superRefine((family, ctx) => {
  if (family.scope === "brand" && !family.brand) ctx.addIssue({ code: "custom", path: ["brand"], message: "brand-scoped families require a brand" });
  if (family.scope === "workspace" && family.brand) ctx.addIssue({ code: "custom", path: ["brand"], message: "workspace-scoped families cannot set a brand" });
  if (family.autoEligible && family.status !== "published") ctx.addIssue({ code: "custom", path: ["autoEligible"], message: "only published families can be auto-eligible" });
  if (!Object.keys(family.formats).length) ctx.addIssue({ code: "custom", path: ["formats"], message: "at least one format canvas is required" });
});

export type TemplateBox = z.infer<typeof TemplateBoxSchema>;
export type CustomTemplateLayer = z.infer<typeof CustomTemplateLayerSchema>;
export type CustomTemplateCanvas = z.infer<typeof CustomTemplateCanvasSchema>;
export type CustomTemplateFamily = z.infer<typeof CustomTemplateFamilySchema>;
export type TemplateRef = z.infer<typeof TemplateRefSchema>;
