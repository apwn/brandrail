import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Brandrail, BrandrailError } from "@brandrail/sdk";
import {
  stringify,
  ALL_FORMATS,
  ARCHETYPE_INFO,
  type FormatId,
  type LayoutArchetype,
} from "@brandrail/spec";

const ARCHETYPES = Object.keys(ARCHETYPE_INFO) as LayoutArchetype[];

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
      description: `Render finished, brand-locked social assets from a one-line brief. Formats: ${ALL_FORMATS.join(", ")} (default: all five). Writes PNG files to disk and returns their paths (~100 tokens). Takes ~10-20s. By default Brandrail picks a fitting mix of templates; pass "archetype" to force one (see list_templates). Violations of the brand spec fail loudly instead of rendering degraded output.`,
      inputSchema: {
        brand: z.string().describe("a compiled brand name (from compile_brand)"),
        brief: z.string().describe('what to make, e.g. "Summer promotion"'),
        formats: z
          .array(z.enum(ALL_FORMATS as unknown as [string, ...string[]]))
          .optional()
          .describe("subset of formats; omit for all five"),
        archetype: z
          .enum(ARCHETYPES as unknown as [string, ...string[]])
          .optional()
          .describe("force one template for every format; omit for the auto mix (see list_templates)"),
      },
    },
    async ({ brand, brief, formats, archetype }) => {
      try {
        const res = await api.render(brand, brief, {
          formats: formats as FormatId[] | undefined,
          archetype: archetype as LayoutArchetype | undefined,
        });
        await mkdir(outDir, { recursive: true });
        const files: string[] = [];
        for (const asset of res.assets) {
          const bytes = await api.downloadAsset(asset.url);
          const file = path.join(outDir, asset.filename);
          await writeFile(file, bytes);
          files.push(file);
        }
        const text = [
          `${files.length} assets rendered · ${brand} v${res.specVersion} · 0 violations`,
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
    "get_spec",
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
    "list_templates",
    {
      description:
        "List the brand-locked templates (archetypes) available to render_assets, with what each is best for. Call this before forcing an archetype. Returns ~250 tokens.",
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
        return `- ${a} — ${info.description} Best for: ${info.bestFor}.${tags ? ` (${tags})` : ""}`;
      });
      return {
        content: [
          {
            type: "text" as const,
            text: `Templates (pass as render_assets archetype):\n${lines.join("\n")}\n\nOmit archetype to let Brandrail pick a fitting mix across the 5 formats.`,
          },
        ],
      };
    },
  );

  server.registerTool(
    "diff_spec",
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

  return server;
}
