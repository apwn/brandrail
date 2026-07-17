import { mkdir, open } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Brandrail, BrandrailError, type ContentProgramInput, type TemplateMediaSelection, type TemplateModification } from "@brandrail/sdk";
import {
  stringify,
  ALL_FORMATS,
  ARCHETYPE_INFO,
  TemplateRefSchema,
  type FormatId,
  type LayoutArchetype,
  type TemplateRecipe,
} from "@brandrail/spec";

const ARCHETYPES = Object.keys(ARCHETYPE_INFO) as LayoutArchetype[];

function safeAssetPath(directory: string, filename: string): string {
  if (path.basename(filename) !== filename || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,255}$/.test(filename)) throw new Error("server returned an unsafe asset filename");
  const root = path.resolve(directory);
  const target = path.resolve(root, filename);
  if (!target.startsWith(`${root}${path.sep}`)) throw new Error("server returned an unsafe asset filename");
  return target;
}

async function writeAsset(directory: string, filename: string, bytes: Uint8Array): Promise<string> {
  const target = safeAssetPath(directory, filename);
  const handle = await open(target, constants.O_WRONLY | constants.O_CREAT | constants.O_TRUNC | constants.O_NOFOLLOW, 0o600);
  try { await handle.writeFile(bytes); } finally { await handle.close(); }
  return target;
}
const slideCopyInput = z.object({
  kicker: z.string().max(500).optional(),
  hook: z.string().min(1).max(500),
  body: z.string().max(2_000).optional(),
  cta: z.string().max(500).optional(),
  badge: z.string().max(500).optional(),
  rating: z.string().max(20).optional(),
  series: z.array(z.object({
    label: z.string().min(1).max(24),
    value: z.number().finite(),
  })).min(2).max(6).optional(),
});
const contentProgramInput = {
  brand: z.string().min(1).describe("compiled brand name"),
  name: z.string().min(2).max(120).optional(),
  objective: z.string().min(3).max(500).describe("business outcome the content should advance"),
  audience: z.string().max(240).optional(),
  pillars: z.array(z.string().min(1).max(80)).max(6).optional(),
  offer: z.string().max(240).optional(),
  contentContext: z.string().max(2_000).optional().describe("product facts, differentiators, proof points and current topics; do not include unverified claims"),
  importantDates: z.array(z.object({ date: z.string().describe("YYYY-MM-DD"), label: z.string().min(1).max(120) })).max(12).optional(),
  perWeek: z.number().int().min(1).max(7),
  horizonWeeks: z.union([z.literal(1), z.literal(4)]).optional(),
  channelIds: z.array(z.string()).max(20).optional(),
  approvalMode: z.enum(["review", "auto"]).optional().describe("review is the safe default; auto requires connected channels"),
  timeZone: z.string().max(100).optional().describe("IANA timezone, e.g. America/Costa_Rica"),
  postingTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional().describe("preferred local posting time, HH:mm"),
  startAt: z.string().optional().describe("YYYY-MM-DD"),
  endAt: z.string().optional().describe("YYYY-MM-DD"),
  paused: z.boolean().optional(),
  plannedPosts: z.array(z.object({
    week: z.number().int().min(1).max(4),
    scheduledFor: z.string().datetime(),
    brief: z.string().min(2).max(120),
    rationale: z.string().max(200),
    archetype: z.enum(ARCHETYPES as unknown as [string, ...string[]]),
    format: z.enum(ALL_FORMATS as unknown as [string, ...string[]]),
    locked: z.boolean().optional(),
  })).max(28).optional().describe("approved posts returned by preview_content_program; pass them to preserve that exact preview"),
};

/**
 * Tool descriptions are written for agent consumption: they state what comes
 * back and roughly what it costs in tokens, so a planner can budget.
 */
export function buildServer(): McpServer {
  const api = new Brandrail();
  const outDir = process.env.BRANDRAIL_OUT_DIR ?? path.join(process.cwd(), "brandrail-assets");

  const server = new McpServer({ name: "brandrail", version: "0.1.0" });

  const err = (e: unknown) => ({
    content: [
      {
        type: "text" as const,
        text:
          e instanceof BrandrailError && e.isSpecViolation
            ? `SPEC VIOLATIONS (nothing was rendered):\n${e.violations.map((v) => `- [${v.code}] ${v.message}`).join("\n")}`
            : `error: ${e instanceof Error ? e.message : String(e)}`,
      },
    ],
    isError: true,
  });

  server.registerTool(
    "compile_brand",
    {
      description:
        "Compile a machine-readable BrandSpec (colors, typography, logo, voice, composition rules) from a website URL. Takes ~10-30s. Returns a compact summary (~150 tokens) plus low-confidence fields to review; the full spec is stored server-side under the returned brand name for use with render_assets.",
      inputSchema: {
        url: z.string().describe("website URL, e.g. acme.com"),
      },
    },
    async ({ url }) => {
      try {
        const { spec, confidence, warnings } = await api.compile(url);
        const r = spec.identity.colors.roles;
        const low = Object.entries(confidence)
          .filter(([, v]) => v < 0.5)
          .map(([k]) => k);
        const lines = [
          `brand: ${spec.meta.name} v${spec.meta.version}`,
          `colors: ink ${r.ink} · paper ${r.paper} · signal ${r.signal}`,
          `type: ${spec.identity.typography.display.family} / ${spec.identity.typography.body.family}`,
          `logo: ${spec.identity.logo.assets.primary ? "found" : "wordmark fallback"}`,
          `photos: ${spec.imagery.photos.length} harvested`,
          `voice: ${spec.voice.tone.join(", ")} · cta ${spec.voice.ctaStyle}`,
          low.length ? `review (low confidence): ${low.join(", ")}` : "all fields high confidence",
          ...warnings.map((w) => `warning: ${w}`),
          `next: render_assets with brand="${spec.meta.name}"`,
        ];
        return { content: [{ type: "text" as const, text: lines.join("\n") }] };
      } catch (e) {
        return err(e);
      }
    },
  );

  server.registerTool(
    "render_assets",
    {
      description: `Render finished, brand-locked social assets from a one-line brief. Formats: ${ALL_FORMATS.join(", ")} (default: all five). Writes PNG files to disk and returns their paths plus inspectable content intent and art-direction choices (~150 tokens). Takes ~10-20s. By default Brandrail ranks content-compatible templates while preserving campaign variety; pass "template" to force one and "modifications" to set named dynamic fields (see list_templates). Violations of the brand spec fail loudly instead of rendering degraded output.`,
      inputSchema: {
        brand: z.string().describe("a compiled brand name (from compile_brand)"),
        brief: z.string().describe('what to make, e.g. "Summer promotion"'),
        recipe: z.string().regex(/^[a-z0-9][a-z0-9-]*$/).max(64).optional().describe("reusable visual recipe stored in the BrandSpec"),
        formats: z
          .array(z.enum(ALL_FORMATS as unknown as [string, ...string[]]))
          .optional()
          .describe("subset of formats; omit for all five"),
        template: z
          .enum(ARCHETYPES as unknown as [string, ...string[]])
          .optional()
          .describe("force one template for every format; omit for the auto mix (see list_templates)"),
        templates: z.record(
          z.enum(ALL_FORMATS as unknown as [string, ...string[]]),
          z.enum(ARCHETYPES as unknown as [string, ...string[]]),
        ).optional().describe("per-format template plan; omitted formats stay automatic and this cannot be combined with template"),
        templateRef: TemplateRefSchema.optional().describe("versioned system, workspace, or brand template family selector"),
        archetype: z.enum(ARCHETYPES as unknown as [string, ...string[]]).optional().describe("compatibility alias for template"),
        copy: z.record(
          z.enum(ALL_FORMATS as unknown as [string, ...string[]]),
          z.array(slideCopyInput).min(1).max(4),
        ).optional().describe("exact per-format copy; use series here for data-trend so chart values are supplied rather than inferred"),
        modifications: z.array(z.object({
          format: z.enum(ALL_FORMATS as unknown as [string, ...string[]]),
          slide: z.number().int().min(0).optional(),
          name: z.enum(["kicker", "hook", "body", "cta", "badge", "rating"]),
          text: z.string().max(500),
        })).max(100).optional().describe("named text-field changes applied after copy generation; slide is zero-based"),
        media: z.array(z.object({
          format: z.enum(ALL_FORMATS as unknown as [string, ...string[]]),
          name: z.enum(["primary", "secondary"]),
          photoIndex: z.number().int().min(0).max(11),
        })).max(10).optional().describe("named image-slot selections using zero-based indexes from the active BrandSpec photo library"),
        runId: z.string().optional().describe("durable run to advance after rendering"),
      },
    },
    async ({ brand, brief, recipe, formats, template, templates, templateRef, archetype, copy, modifications, media, runId }) => {
      try {
        if (template && archetype && template !== archetype) throw new Error("template and archetype must match when both are supplied");
        if ((template || archetype) && templates) throw new Error("use template or templates, not both");
        const res = await api.render(brand, brief, {
          recipe,
          formats: formats as FormatId[] | undefined,
          template: (template ?? archetype) as LayoutArchetype | undefined,
          templates: templates as Partial<Record<FormatId, LayoutArchetype>> | undefined,
          templateRef,
          copy,
          modifications: modifications as TemplateModification[] | undefined,
          media: media as TemplateMediaSelection[] | undefined,
          runId,
        });
        await mkdir(outDir, { recursive: true });
        const files: string[] = [];
        for (const asset of res.assets) {
          const bytes = await api.downloadAsset(asset.url);
          const file = await writeAsset(outDir, asset.filename, bytes);
          files.push(file);
        }
        const text = [
          `${files.length} assets rendered · ${brand} v${res.specVersion} · 0 violations`,
          ...Object.entries(res.manifest.artDirection ?? {}).map(
            ([format, decision]) =>
              `auto: ${format} → ${decision?.selected ?? "unknown"} (${decision?.intent ?? "unknown"})`,
          ),
          ...files,
          ...res.manifest.warnings.map((w) => `warning: ${w}`),
        ].join("\n");
        return { content: [{ type: "text" as const, text }] };
      } catch (e) {
        return err(e);
      }
    },
  );

  server.registerTool(
    "get_brand",
    {
      description:
        "Fetch a stored BrandSpec as canonical JSON (~600-1200 tokens). Use only when you need field values; compile_brand already returns the summary.",
      inputSchema: {
        brand: z.string(),
        version: z.number().int().positive().optional().describe("omit for latest"),
      },
    },
    async ({ brand, version }) => {
      try {
        const spec = await api.getSpec(brand, version);
        return { content: [{ type: "text" as const, text: stringify(spec) }] };
      } catch (e) {
        return err(e);
      }
    },
  );

  server.registerTool(
    "list_recipes",
    {
      description: "List reusable visual recipes stored in a BrandSpec. Use a matching recipe before inventing a new template plan.",
      inputSchema: { brand: z.string() },
    },
    async ({ brand }) => {
      try {
        const result = await api.listRecipes(brand);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (e) { return err(e); }
    },
  );

  server.registerTool(
    "save_recipe",
    {
      description: "Save a reusable visual system as a new BrandSpec version. Preserve template and approved-image decisions; keep campaign copy out of the recipe unless explicitly requested.",
      inputSchema: {
        brand: z.string(),
        id: z.string().regex(/^[a-z0-9][a-z0-9-]*$/).max(64),
        name: z.string().min(1).max(64),
        template: z.enum(ARCHETYPES as unknown as [string, ...string[]]).optional(),
        templates: z.record(z.enum(ALL_FORMATS as unknown as [string, ...string[]]), z.enum(ARCHETYPES as unknown as [string, ...string[]])).optional(),
        media: z.array(z.object({ format: z.enum(ALL_FORMATS as unknown as [string, ...string[]]), name: z.enum(["primary", "secondary"]), photoIndex: z.number().int().min(0).max(11) })).max(10).optional(),
      },
    },
    async ({ brand, id, name, template, templates, media }) => {
      try {
        const recipe = { id, name, template, templates, media } as TemplateRecipe;
        const result = await api.createRecipe(brand, recipe);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (e) { return err(e); }
    },
  );

  server.registerTool(
    "rename_recipe",
    {
      description: "Rename a saved visual recipe and create a new BrandSpec version without changing its visual decisions.",
      inputSchema: {
        brand: z.string(),
        recipeId: z.string().regex(/^[a-z0-9][a-z0-9-]*$/).max(64),
        name: z.string().min(1).max(64),
      },
    },
    async ({ brand, recipeId, name }) => {
      try {
        const result = await api.renameRecipe(brand, recipeId, name);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (e) { return err(e); }
    },
  );

  server.registerTool(
    "delete_recipe",
    {
      description: "Delete a saved recipe and create a new BrandSpec version. Use only after explicit user confirmation.",
      inputSchema: { brand: z.string(), recipeId: z.string().regex(/^[a-z0-9][a-z0-9-]*$/).max(64) },
    },
    async ({ brand, recipeId }) => {
      try {
        const result = await api.deleteRecipe(brand, recipeId);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (e) { return err(e); }
    },
  );

  server.registerTool(
    "list_templates",
    {
      description:
        "List the brand-locked visual templates available to render_assets, including named dynamic fields and locked design objects. Call this before selecting a template. Returns ~250 tokens.",
      inputSchema: {},
    },
    async () => {
      const lines = ARCHETYPES.map((a) => {
        const info = ARCHETYPE_INFO[a];
        const tags = [
          info.needsPhotos ? "needs a brand photo" : null,
          info.optIn ? "opt-in (supply real content)" : null,
        ]
          .filter(Boolean)
          .join(", ");
        const dynamic = Object.entries(info.slots).map(([name, slot]) => `${name}≤${slot.maxChars}`).join(", ");
        const imagery = info.mediaSlots ? ` Imagery: ${Object.entries(info.mediaSlots).map(([name, slot]) => `${name} (${slot.label})`).join(", ")}.` : "";
        return `- ${a} — ${info.description} Best for: ${info.bestFor}. Dynamic: ${dynamic}.${imagery} Locked: ${info.locked.join(", ")}.${tags ? ` (${tags})` : ""}`;
      });
      return {
        content: [
          {
            type: "text" as const,
            text: `Templates (pass as render_assets template):\n${lines.join("\n")}\n\nOmit template to let Brandrail pick a fitting mix across formats and carousel slides.`,
          },
        ],
      };
    },
  );

  server.registerTool(
    "list_template_families",
    { description: "List versioned workspace and brand visual template families, including draft/published status and supported formats.", inputSchema: {} },
    async () => {
      try { return { content: [{ type: "text" as const, text: JSON.stringify({ families: await api.listTemplateFamilies() }, null, 2) }] }; }
      catch (e) { return err(e); }
    },
  );

  server.registerTool(
    "list_template_family_versions",
    { description: "List immutable version history for one workspace or brand template family.", inputSchema: { id: z.string().regex(/^[a-z0-9][a-z0-9-]*$/).max(64) } },
    async ({ id }) => {
      try { return { content: [{ type: "text" as const, text: JSON.stringify({ versions: await api.listTemplateFamilyVersions(id) }, null, 2) }] }; }
      catch (e) { return err(e); }
    },
  );

  server.registerTool(
    "duplicate_template_family",
    {
      description: "Create an editable declarative template family from a system or user-owned template contract. The result is a draft and cannot enter automatic planning until preflighted and published.",
      inputSchema: {
        source: TemplateRefSchema,
        id: z.string().regex(/^[a-z0-9][a-z0-9-]*$/).max(64),
        name: z.string().min(1).max(80),
        scope: z.enum(["workspace", "brand"]),
        brand: z.string().optional(),
        formats: z.array(z.enum(ALL_FORMATS as unknown as [string, ...string[]])).optional(),
      },
    },
    async (input) => {
      try { return { content: [{ type: "text" as const, text: JSON.stringify(await api.duplicateTemplateFamily({ ...input, formats: input.formats as FormatId[] | undefined }), null, 2) }] }; }
      catch (e) { return err(e); }
    },
  );

  server.registerTool(
    "preflight_template_family",
    { description: "Run structural, slot, format, color-role, and contrast checks before a custom template is published.", inputSchema: { id: z.string(), brand: z.string().optional() } },
    async ({ id, brand }) => {
      try { return { content: [{ type: "text" as const, text: JSON.stringify(await api.preflightTemplateFamily(id, brand), null, 2) }] }; }
      catch (e) { return err(e); }
    },
  );

  server.registerTool(
    "publish_template_family",
    { description: "Publish a custom family only after preflight passes. autoEligible remains false unless explicitly requested.", inputSchema: { id: z.string(), brand: z.string().optional(), autoEligible: z.boolean().optional() } },
    async ({ id, brand, autoEligible }) => {
      try { return { content: [{ type: "text" as const, text: JSON.stringify(await api.publishTemplateFamily(id, { brand, autoEligible }), null, 2) }] }; }
      catch (e) { return err(e); }
    },
  );

  server.registerTool(
    "archive_template_family",
    { description: "Archive a custom template family so new renders cannot select it. Existing render manifests remain reproducible.", inputSchema: { id: z.string() } },
    async ({ id }) => {
      try { return { content: [{ type: "text" as const, text: JSON.stringify(await api.archiveTemplateFamily(id), null, 2) }] }; }
      catch (e) { return err(e); }
    },
  );

  server.registerTool(
    "diff_brand_spec",
    {
      description:
        "Human-readable semantic diff between two versions of a BrandSpec (~50-200 tokens). A brand refresh is a diff you can review.",
      inputSchema: {
        brand: z.string(),
        from: z.number().int().positive(),
        to: z.number().int().positive(),
      },
    },
    async ({ brand, from, to }) => {
      try {
        const res = await api.diffSpec(brand, from, to);
        return { content: [{ type: "text" as const, text: res.text }] };
      } catch (e) {
        return err(e);
      }
    },
  );

  server.registerTool(
    "list_brands",
    { description: "List the BrandSpecs available in this workspace. Start here when no brand was specified.", inputSchema: {} },
    async () => {
      try {
        const specs = await api.listSpecs();
        return { content: [{ type: "text" as const, text: specs.length ? specs.map((spec) => `${spec.name}@${spec.version}`).join("\n") : "No brands yet. Use compile_brand first." }] };
      } catch (e) { return err(e); }
    },
  );

  server.registerTool(
    "plan_campaign",
    {
      description: "Dry-run a campaign before mutating anything. Returns blockers, safeguards, asset estimate and exact execution steps. Always call this before a multi-step campaign.",
      inputSchema: {
        objective: z.string().min(3), brand: z.string().optional(), channels: z.array(z.string()).optional(),
        assetCount: z.number().int().min(1).max(50).default(8).describe("Maximum finished assets this approved run may create"), publishAt: z.string().optional(),
      },
    },
    async (input) => {
      try { return { content: [{ type: "text" as const, text: JSON.stringify(await api.executionPlan(input), null, 2) }] }; }
      catch (e) { return err(e); }
    },
  );

  server.registerTool(
    "list_content_programs",
    { description: "List rolling one- or four-week content programs in this workspace, including cadence, strategy, status and next run.", inputSchema: {} },
    async () => { try { const data = { programs: await api.listContentPrograms() }; return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }], structuredContent: data }; } catch (e) { return err(e); } },
  );

  server.registerTool(
    "preview_content_program",
    { description: "Plan one coherent week or four weeks without saving or rendering. Returns exact dated post ideas across the full horizon. Use this before create_content_program.", inputSchema: contentProgramInput },
    async (input) => { try { const data = await api.previewContentProgram(input as ContentProgramInput); return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }], structuredContent: data as unknown as Record<string, unknown> }; } catch (e) { return err(e); } },
  );

  server.registerTool(
    "create_content_program",
    { description: "Create or update a rolling content program. Pass plannedPosts from preview_content_program to preserve the approved calendar exactly. If omitted, Brandrail plans a fresh horizon. Only the next week renders so later work can learn from performance. Studio required.", inputSchema: contentProgramInput },
    async (input) => { try { const data = await api.saveContentProgram(input as ContentProgramInput); return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }], structuredContent: data as unknown as Record<string, unknown> }; } catch (e) { return err(e); } },
  );

  server.registerTool(
    "run_content_program",
    { description: "Produce the next week with channel-native copy and matching visual formats. Review-mode programs pause in the human queue; auto-mode programs schedule only to their selected connected channels. Producing twice inside one week requires confirmForce=true.", inputSchema: { brand: z.string().min(1), confirmForce: z.boolean().optional() } },
    async ({ brand, confirmForce }) => { try { const data = await api.runContentProgram(brand, confirmForce); return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }], structuredContent: data as unknown as Record<string, unknown> }; } catch (e) { return err(e); } },
  );

  server.registerTool(
    "pause_content_program",
    { description: "Pause or resume a content program without deleting its strategy or prior work.", inputSchema: { brand: z.string().min(1), paused: z.boolean().default(true) } },
    async ({ brand, paused }) => { try { const data = await api.setContentProgramPaused(brand, paused); return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }], structuredContent: data as unknown as Record<string, unknown> }; } catch (e) { return err(e); } },
  );

  server.registerTool(
    "delete_content_program",
    { description: "Delete a content program. Existing renders, review decisions and scheduled posts remain intact.", inputSchema: { brand: z.string().min(1), confirm: z.literal(true) } },
    async ({ brand }) => { try { const data = await api.deleteContentProgram(brand); return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }], structuredContent: data }; } catch (e) { return err(e); } },
  );

  server.registerTool(
    "list_channels",
    { description: "List connected social channels and IDs. Studio required.", inputSchema: {} },
    async () => {
      try { return { content: [{ type: "text" as const, text: JSON.stringify(await api.listChannels(), null, 2) }] }; }
      catch (e) { return err(e); }
    },
  );

  server.registerTool(
    "create_review_batch",
    {
      description: "Create a human approval queue, then pause. For a durable run, every item must use the run's exact brand and objective plus a renderId produced by that run; linked batches never regenerate assets. Never self-approve. Studio required.",
      inputSchema: {
        title: z.string().optional(),
        runId: z.string().optional(),
        items: z.array(z.object({ brand: z.string(), version: z.number().int().positive().optional(), brief: z.string(), archetype: z.enum(ARCHETYPES as unknown as [string, ...string[]]).optional(), renderId: z.string().optional() })).min(1).max(50),
      },
    },
    async ({ title, runId, items }) => {
      try { return { content: [{ type: "text" as const, text: JSON.stringify(await api.createReviewBatch({ title, runId, items: items as Array<{ brand: string; version?: number; brief: string; archetype?: LayoutArchetype; renderId?: string }> }), null, 2) }] }; }
      catch (e) { return err(e); }
    },
  );

  server.registerTool(
    "get_review_status",
    { description: "Resume after a human approval pause. Pass runId to advance the durable run when review is ready.", inputSchema: { batchId: z.string(), runId: z.string().optional() } },
    async ({ batchId, runId }) => {
      try { return { content: [{ type: "text" as const, text: JSON.stringify(await api.reviewStatus(batchId, runId), null, 2) }] }; }
      catch (e) { return err(e); }
    },
  );

  server.registerTool(
    "list_campaigns",
    { description: "List campaigns with live approval, publishing and performance progress. Studio required.", inputSchema: {} },
    async () => {
      try { return { content: [{ type: "text" as const, text: JSON.stringify(await api.listCampaigns(), null, 2) }] }; }
      catch (e) { return err(e); }
    },
  );

  server.registerTool(
    "schedule_post",
    {
      description: "Dry-run, schedule, or publish human-approved work. Use dryRun=true first. Real agent calls require the approved batch/item, render, exact channel copy, exact channel files, run time, and credential scope. Schedule channels with different approved copy in separate calls.",
      inputSchema: {
        text: z.string(), channelIds: z.array(z.string()).min(1), scheduledAt: z.string().optional(), renderId: z.string().optional(),
        imageFiles: z.array(z.string()).optional(), idempotencyKey: z.string().optional(), runId: z.string().optional(), dryRun: z.boolean().optional(),
        approval: z.object({ batchId: z.string(), itemId: z.string() }).optional(),
      },
    },
    async (input) => {
      try { return { content: [{ type: "text" as const, text: JSON.stringify(await api.schedule(input), null, 2) }] }; }
      catch (e) { return err(e); }
    },
  );

  server.registerTool(
    "list_calendar",
    { description: "List scheduled, publishing, published, failed and cancelled posts. Studio required.", inputSchema: {} },
    async () => {
      try { return { content: [{ type: "text" as const, text: JSON.stringify(await api.listScheduled(), null, 2) }] }; }
      catch (e) { return err(e); }
    },
  );

  server.registerTool(
    "get_analytics",
    { description: "Read aggregate content performance and the current feedback-loop insight. Studio required.", inputSchema: {} },
    async () => {
      try { return { content: [{ type: "text" as const, text: JSON.stringify(await api.analytics(), null, 2) }] }; }
      catch (e) { return err(e); }
    },
  );

  server.registerTool(
    "get_audit_log",
    { description: "Read recent human and agent workspace mutations for oversight and debugging.", inputSchema: { limit: z.number().int().min(1).max(250).optional() } },
    async ({ limit }) => {
      try { return { content: [{ type: "text" as const, text: JSON.stringify(await api.audit(limit), null, 2) }] }; }
      catch (e) { return err(e); }
    },
  );

  server.registerTool(
    "start_campaign_run",
    {
      description: "Create a durable campaign run that survives reconnects. It always pauses until a human approves the exact plan in the Brandrail workspace.",
      inputSchema: { objective: z.string().min(3), brand: z.string().optional(), channels: z.array(z.string()).optional(), assetCount: z.number().int().min(1).max(50).default(8).describe("Maximum finished assets this approved run may create"), publishAt: z.string().optional() },
    },
    async (input) => { try { const data = await api.startAgentRun(input); return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }], structuredContent: data as unknown as Record<string, unknown> }; } catch (e) { return err(e); } },
  );

  server.registerTool(
    "list_agent_runs",
    { description: "List durable campaign runs with progress and the current safe next step.", inputSchema: { limit: z.number().int().min(1).max(100).optional() } },
    async ({ limit }) => { try { const data = { runs: await api.listAgentRuns(limit) }; return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }], structuredContent: data }; } catch (e) { return err(e); } },
  );

  server.registerTool(
    "get_agent_run",
    { description: "Retrieve one durable run after reconnecting or waiting for human input.", inputSchema: { runId: z.string() } },
    async ({ runId }) => { try { const data = await api.getAgentRun(runId); return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }], structuredContent: data as unknown as Record<string, unknown> }; } catch (e) { return err(e); } },
  );

  server.registerTool(
    "retry_agent_run",
    { description: "Retry a failed or cancelled run without creating duplicate campaign state.", inputSchema: { runId: z.string() } },
    async ({ runId }) => { try { const data = await api.retryAgentRun(runId); return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }], structuredContent: data as unknown as Record<string, unknown> }; } catch (e) { return err(e); } },
  );

  server.registerTool(
    "complete_agent_run",
    { description: "Finish an asset-only run after the user accepts its output. This never publishes anything.", inputSchema: { runId: z.string() } },
    async ({ runId }) => { try { const data = await api.completeAgentRun(runId); return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }], structuredContent: data as unknown as Record<string, unknown> }; } catch (e) { return err(e); } },
  );

  server.registerTool(
    "cancel_agent_run",
    { description: "Cancel an active durable run.", inputSchema: { runId: z.string() } },
    async ({ runId }) => { try { const data = await api.cancelAgentRun(runId); return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }], structuredContent: data as unknown as Record<string, unknown> }; } catch (e) { return err(e); } },
  );

  server.registerTool(
    "list_renders",
    { description: "List recent render IDs and manifests.", inputSchema: { limit: z.number().int().min(1).max(100).optional() } },
    async ({ limit }) => { try { const data = { renders: await api.listRenders(limit) }; return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }], structuredContent: data }; } catch (e) { return err(e); } },
  );

  server.registerTool(
    "get_render",
    { description: "Get a stored render manifest by ID.", inputSchema: { renderId: z.string() } },
    async ({ renderId }) => { try { const data = await api.getRender(renderId); return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }], structuredContent: data as unknown as Record<string, unknown> }; } catch (e) { return err(e); } },
  );

  server.registerTool(
    "create_campaign",
    { description: "Create a measurable campaign container without rendering or publishing.", inputSchema: { name: z.string().min(2), objective: z.string().min(2), status: z.enum(["draft", "active", "complete"]).optional(), startAt: z.string().optional(), endAt: z.string().optional(), brandIds: z.array(z.string()).optional(), batchIds: z.array(z.string()).optional(), postIds: z.array(z.string()).optional() } },
    async (input) => { try { const data = await api.createCampaign(input); return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }], structuredContent: data as unknown as Record<string, unknown> }; } catch (e) { return err(e); } },
  );

  server.registerTool(
    "update_campaign",
    { description: "Update a campaign and its linked brands, review batches, or scheduled posts.", inputSchema: { campaignId: z.string(), name: z.string().optional(), objective: z.string().optional(), status: z.enum(["draft", "active", "complete"]).optional(), startAt: z.string().optional(), endAt: z.string().optional(), brandIds: z.array(z.string()).optional(), batchIds: z.array(z.string()).optional(), postIds: z.array(z.string()).optional() } },
    async ({ campaignId, ...input }) => { try { const data = await api.updateCampaign(campaignId, input); return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }], structuredContent: data as unknown as Record<string, unknown> }; } catch (e) { return err(e); } },
  );

  server.registerTool(
    "add_review_comment",
    { description: "Add feedback to a review batch or one item without altering approval state.", inputSchema: { batchId: z.string(), itemId: z.string().optional(), author: z.string().min(1).max(80), text: z.string().min(1).max(1000) } },
    async ({ batchId, ...input }) => { try { const data = await api.addReviewComment(batchId, input); return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }], structuredContent: data as Record<string, unknown> }; } catch (e) { return err(e); } },
  );

  server.registerTool(
    "cancel_post",
    { description: "Cancel a post that has not started publishing.", inputSchema: { postId: z.string() } },
    async ({ postId }) => { try { const data = await api.cancelPost(postId); return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }], structuredContent: data as unknown as Record<string, unknown> }; } catch (e) { return err(e); } },
  );

  server.registerTool(
    "get_usage",
    { description: "Read current plan entitlements and remaining usage before expensive work.", inputSchema: {} },
    async () => { try { const data = await api.usage(); return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }], structuredContent: data as unknown as Record<string, unknown> }; } catch (e) { return err(e); } },
  );

  return server;
}
