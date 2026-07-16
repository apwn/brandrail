export {
  BrandSpecSchema,
  MetaSchema,
  IdentitySchema,
  CompositionSchema,
  ImagerySchema,
  VoiceSchema,
  JudgmentSchema,
  ExampleSchema,
  ColorRolesSchema,
  FontSchema,
  VisualLanguageSchema,
  PhotoAssetSchema,
  HexColor,
  Slug,
  AssetRef,
  IsoDate,
  LayoutArchetype,
  TemplateRecipeSchema,
  LAYOUT_ARCHETYPES,
  SPEC_SCHEMA_URL,
  SPEC_VERSION,
} from "./schema.js";
export type {
  BrandSpec,
  BrandSpecInput,
  Meta,
  Identity,
  VisualLanguage,
  PhotoAsset,
  Composition,
  TemplateRecipe,
  Imagery,
  Voice,
  Judgment,
} from "./schema.js";

export { validate, parse } from "./validate.js";
export type { ValidationIssue, ValidationResult } from "./validate.js";

export { stringify, canonical } from "./stringify.js";

export { diff, formatDiff } from "./diff.js";
export type { DiffEntry, DiffOp } from "./diff.js";

export { fork } from "./fork.js";
export type { BrandSpecOverrides } from "./fork.js";

export { migrate } from "./migrate.js";
export type { MigrationResult } from "./migrate.js";

export { SpecViolationError, isSpecViolationError } from "./violations.js";
export type { Violation, ViolationCode } from "./violations.js";

export { FORMATS, ALL_FORMATS, isFormatId } from "./formats.js";
export type { FormatId, FormatDef } from "./formats.js";

export {
  contrastRatio,
  relativeLuminance,
  bestContrast,
  hexToRgb,
  rgbToHex,
  normalizeHex,
} from "./color.js";

export { acme, acmeInput } from "./fixtures/acme.js";

export { ARCHETYPE_INFO } from "./archetypes.js";
export type { ArchetypeInfo, TemplateDataSlotName, TemplateMediaSlotName, TemplateSlotInfo, TemplateSlotName } from "./archetypes.js";

export {
  TemplateBoxSchema,
  CustomTemplateLayerSchema,
  CustomTemplateCanvasSchema,
  CustomTemplateFamilySchema,
  TemplateRefSchema,
} from "./custom-templates.js";
export type {
  TemplateBox,
  CustomTemplateLayer,
  CustomTemplateCanvas,
  CustomTemplateFamily,
  TemplateRef,
} from "./custom-templates.js";

export { MCP_LIFECYCLE_TOOLS } from "./agent.js";
export type { McpLifecycleTool } from "./agent.js";
