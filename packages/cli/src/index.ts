import { mkdir, open, readFile, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { Command } from "commander";
import { Brandrail, BrandrailError, type ContentProgramInput, type TemplateMediaSelection } from "@brandrail/sdk";
import { stringify, formatDiff, isFormatId, ARCHETYPE_INFO, type FormatId, type TemplateRef } from "@brandrail/spec";

/**
 * Exit codes (agents are the primary users — keep them stable):
 *   0 ok · 2 spec violation · 3 compile finished with low-confidence fields
 */
const EXIT_VIOLATION = 2;
const EXIT_LOW_CONFIDENCE = 3;
const DEFAULT_MCP_URL = "https://playground.brandrail.dev/api/mcp";
const MCP_PROTOCOL_VERSION = "2025-11-25";
const MCP_REQUIRED_TOOLS = ["list_brands", "get_brand", "start_campaign_run", "render_assets", "create_review_batch", "get_review_status", "schedule_post", "get_audit_log"];

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

const program = new Command()
  .name("brandrail")
  .description("The brand engine for AI agents. Compile a BrandSpec, render on-brand assets.")
  .version("0.1.0")
  .option("--api-url <url>", "API base URL (default: $BRANDRAIL_API_URL)")
  .option("--api-key <key>", "API key (default: $BRANDRAIL_API_KEY)")
  .option("--json", "machine-readable JSON output", false);

function client(): Brandrail {
  const opts = program.opts<{ apiUrl?: string; apiKey?: string }>();
  return new Brandrail({ apiUrl: opts.apiUrl, apiKey: opts.apiKey });
}

function isJson(): boolean {
  return Boolean(program.opts<{ json: boolean }>().json);
}

function fail(message: string, code = 1): never {
  if (isJson()) console.log(JSON.stringify({ ok: false, error: message }));
  else console.error(`error: ${message}`);
  process.exit(code);
}

function parseTemplateRef(value: string): TemplateRef {
  const match = /^(system|workspace|brand):([a-z0-9][a-z0-9-]*)(?:@(\d+))?$/.exec(value);
  if (!match) fail("template ref must be system:id, workspace:id@version, or brand:id@version");
  if (match[1] === "system") {
    if (match[3] || !(match[2]! in ARCHETYPE_INFO)) fail("system template ref must name a current built-in without a version");
    return { source: "system", id: match[2] as keyof typeof ARCHETYPE_INFO };
  }
  return { source: match[1] as "workspace" | "brand", id: match[2]!, ...(match[3] ? { version: Number(match[3]) } : {}) };
}

function handleError(e: unknown): never {
  if (e instanceof BrandrailError && e.isSpecViolation) {
    if (isJson()) {
      console.log(JSON.stringify({ ok: false, error: e.message, violations: e.violations }));
    } else {
      console.error("spec violations:");
      for (const v of e.violations) console.error(`  [${v.code}] ${v.message}`);
    }
    process.exit(EXIT_VIOLATION);
  }
  fail(e instanceof Error ? e.message : String(e));
}

type ContentOptions = {
  brand: string; name?: string; audience?: string; pillars?: string; offer?: string; dates?: string;
  perWeek: string; horizon: string; channels?: string; approval: "review" | "auto"; start?: string; end?: string;
};

function contentInput(objective: string, opts: ContentOptions): ContentProgramInput {
  const importantDates = (opts.dates ?? "").split(";").map((item) => item.trim()).filter(Boolean).map((item) => {
    const separator = item.indexOf(":");
    if (separator < 10) fail("--dates must use YYYY-MM-DD:Label;YYYY-MM-DD:Label");
    return { date: item.slice(0, separator), label: item.slice(separator + 1).trim() };
  });
  const horizon = Number(opts.horizon);
  if (horizon !== 1 && horizon !== 4) fail("--horizon must be 1 or 4");
  const perWeek = Number(opts.perWeek);
  if (!Number.isInteger(perWeek) || perWeek < 1 || perWeek > 7) fail("--per-week must be between 1 and 7");
  if (!['review', 'auto'].includes(opts.approval)) fail("--approval must be review or auto");
  return {
    brand: opts.brand,
    objective,
    perWeek,
    horizonWeeks: horizon,
    approvalMode: opts.approval,
    ...(opts.name ? { name: opts.name } : {}),
    ...(opts.audience ? { audience: opts.audience } : {}),
    ...(opts.pillars ? { pillars: opts.pillars.split(",").map((item) => item.trim()).filter(Boolean) } : {}),
    ...(opts.offer ? { offer: opts.offer } : {}),
    ...(importantDates.length ? { importantDates } : {}),
    ...(opts.channels ? { channelIds: opts.channels.split(",").map((item) => item.trim()).filter(Boolean) } : {}),
    ...(opts.start ? { startAt: opts.start } : {}),
    ...(opts.end ? { endAt: opts.end } : {}),
  } as ContentProgramInput;
}

function contentOptions(command: Command): Command {
  return command
    .requiredOption("--brand <name>", "BrandSpec name")
    .option("--name <name>", "program name")
    .option("--audience <description>", "who the content is for")
    .option("--pillars <items>", "comma-separated content pillars")
    .option("--offer <text>", "current offer or CTA")
    .option("--dates <items>", "important dates as YYYY-MM-DD:Label;YYYY-MM-DD:Label")
    .option("--per-week <count>", "posts per week", "3")
    .option("--horizon <weeks>", "preview horizon: 1 or 4 weeks", "4")
    .option("--channels <ids>", "comma-separated channel IDs; omit for all connected channels")
    .option("--approval <mode>", "review or auto", "review")
    .option("--start <date>", "start date, YYYY-MM-DD")
    .option("--end <date>", "optional end date, YYYY-MM-DD");
}

type McpRpcResponse<T> = { result?: T; error?: { code?: number; message?: string } };

function mcpCredential(): string | undefined {
  return program.opts<{ apiKey?: string }>().apiKey ?? process.env.BRANDRAIL_API_KEY;
}

function mcpSetup(clientName: string, endpoint: string): string {
  const key = mcpCredential() ?? "brk_…";
  const continuation = "\\";
  if (clientName === "openclaw") {
    const config = JSON.stringify({
      url: endpoint,
      transport: "streamable-http",
      headers: { Authorization: "Bearer ${BRANDRAIL_API_KEY}" },
      connectTimeout: 10,
      timeout: 120,
    });
    return [
      `export BRANDRAIL_API_KEY='${key}'`,
      "",
      `openclaw mcp set brandrail ${continuation}`,
      `  '${config}'`,
      "",
      "openclaw mcp doctor brandrail --probe",
    ].join("\n");
  }
  if (clientName === "claude") {
    return [
      `claude mcp add --transport http brandrail '${endpoint}' ${continuation}`,
      `  --header 'Authorization: Bearer ${key}'`,
      "",
      "claude mcp get brandrail",
    ].join("\n");
  }
  if (clientName === "http") {
    return [
      `curl -X POST '${endpoint}' ${continuation}`,
      `  -H 'Authorization: Bearer ${key}' ${continuation}`,
      `  -H 'Content-Type: application/json' ${continuation}`,
      `  -H 'Accept: application/json, text/event-stream' ${continuation}`,
      `  --data '{"jsonrpc":"2.0","id":"probe","method":"initialize","params":{"protocolVersion":"${MCP_PROTOCOL_VERSION}","capabilities":{},"clientInfo":{"name":"brandrail-probe","version":"1.0.0"}}}'`,
    ].join("\n");
  }
  fail(`unknown MCP client "${clientName}" (expected openclaw, claude, or http)`);
}

async function mcpRpc<T>(endpoint: string, key: string, id: string, method: string, params?: Record<string, unknown>, protocolVersion?: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json, text/event-stream",
        authorization: `Bearer ${key}`,
        "content-type": "application/json",
        ...(protocolVersion ? { "mcp-protocol-version": protocolVersion } : {}),
      },
      body: JSON.stringify({ jsonrpc: "2.0", id, method, ...(params ? { params } : {}) }),
      signal: AbortSignal.timeout(20_000),
    });
  } catch (cause) {
    throw new Error(`could not reach ${endpoint}: ${cause instanceof Error ? cause.message : String(cause)}`);
  }
  const body = await response.json().catch(() => ({})) as McpRpcResponse<T>;
  if (!response.ok || body.error || !body.result) {
    throw new Error(body.error?.message ?? `MCP endpoint returned HTTP ${response.status}`);
  }
  return body.result;
}

const mcp = program.command("mcp").description("configure and diagnose the hosted MCP connection");

mcp.command("config")
  .description("print setup for OpenClaw, Claude, or raw Streamable HTTP")
  .option("--client <client>", "openclaw, claude, or http", "openclaw")
  .option("--endpoint <url>", "hosted MCP endpoint", process.env.BRANDRAIL_MCP_URL ?? DEFAULT_MCP_URL)
  .action((opts: { client: string; endpoint: string }) => {
    const setup = mcpSetup(opts.client.toLowerCase(), opts.endpoint.replace(/\/$/, ""));
    if (isJson()) console.log(JSON.stringify({ ok: true, client: opts.client.toLowerCase(), endpoint: opts.endpoint, setup }));
    else console.log(setup);
  });

mcp.command("doctor")
  .description("run an authenticated MCP handshake and verify the core lifecycle tools")
  .option("--endpoint <url>", "hosted MCP endpoint", process.env.BRANDRAIL_MCP_URL ?? DEFAULT_MCP_URL)
  .action(async (opts: { endpoint: string }) => {
    const key = mcpCredential();
    if (!key) fail("BRANDRAIL_API_KEY is required. Create one in Workspace → Agent connection.");
    const endpoint = opts.endpoint.replace(/\/$/, "");
    try {
      const initialized = await mcpRpc<{ protocolVersion: string; serverInfo?: { title?: string; name?: string; version?: string } }>(endpoint, key, "cli-init", "initialize", {
        protocolVersion: MCP_PROTOCOL_VERSION,
        capabilities: {},
        clientInfo: { name: "brandrail-cli", version: "0.1.0" },
      });
      const listed = await mcpRpc<{ tools?: Array<{ name: string }> }>(endpoint, key, "cli-tools", "tools/list", undefined, initialized.protocolVersion);
      const names = new Set((listed.tools ?? []).map((tool) => tool.name));
      const missing = MCP_REQUIRED_TOOLS.filter((name) => !names.has(name));
      if (missing.length) throw new Error(`missing required tools: ${missing.join(", ")}`);
      let resourceCount: number | null = null;
      try {
        const resources = await mcpRpc<{ resources?: unknown[] }>(endpoint, key, "cli-resources", "resources/list", undefined, initialized.protocolVersion);
        resourceCount = resources.resources?.length ?? 0;
      } catch {
        // Valid least-privilege keys may intentionally omit assets:read.
      }
      const result = {
        endpoint,
        server: initialized.serverInfo?.title ?? initialized.serverInfo?.name ?? "Brandrail",
        version: initialized.serverInfo?.version,
        protocol: initialized.protocolVersion,
        tools: listed.tools?.length ?? 0,
        resources: resourceCount,
      };
      if (isJson()) console.log(JSON.stringify({ ok: true, ...result }));
      else {
        console.log("status     ready");
        console.log(`server     ${result.server}${result.version ? ` ${result.version}` : ""}`);
        console.log(`protocol   ${result.protocol}`);
        console.log(`tools      ${result.tools} · core lifecycle present`);
        console.log(`resources  ${result.resources === null ? "scoped off" : `${result.resources} inspectable assets`}`);
        console.log(`endpoint   ${result.endpoint}`);
      }
    } catch (cause) {
      handleError(cause);
    }
  });

program
  .command("compile")
  .description("compile a BrandSpec from a website URL")
  .argument("<url>", "website URL (https:// optional)")
  .option("-o, --out <file>", "where to write the spec (default: ./<brand>.brandspec.json)")
  .action(async (url: string, opts: { out?: string }) => {
    try {
      const { spec, confidence, warnings } = await client().compile(url);
      const file = opts.out ?? `./${spec.meta.name}.brandspec.json`;
      await writeFile(file, stringify(spec));
      const low = Object.entries(confidence)
        .filter(([, v]) => v < 0.5)
        .map(([k]) => k);
      if (isJson()) {
        console.log(JSON.stringify({ ok: true, spec: file, brand: spec.meta.name, version: spec.meta.version, lowConfidence: low, warnings }));
      } else {
        const r = spec.identity.colors.roles;
        console.log(`spec    ${file}`);
        console.log(`brand   ${spec.meta.name} v${spec.meta.version}`);
        console.log(`colors  ink ${r.ink} · paper ${r.paper} · signal ${r.signal}${r.muted ? ` · muted ${r.muted}` : ""}`);
        console.log(`type    ${spec.identity.typography.display.family} / ${spec.identity.typography.body.family}`);
        console.log(`logo    ${spec.identity.logo.assets.primary ? "found" : "wordmark fallback"}`);
        console.log(`photos  ${spec.imagery.photos.length > 0 ? `${spec.imagery.photos.length} harvested` : "none — layouts render typographic"}`);
        if (low.length) console.log(`review  ${low.join(", ")}`);
        for (const w of warnings) console.log(`warn    ${w}`);
      }
      process.exit(low.length > 0 ? EXIT_LOW_CONFIDENCE : 0);
    } catch (e) {
      handleError(e);
    }
  });

program
  .command("render")
  .description("render brand-locked assets from a brief")
  .argument("<brief>", 'e.g. "Summer promotion"')
  .requiredOption("--brand <name>", "brand (a compiled spec name)")
  .option("--formats <list>", "comma-separated: ig-carousel,li-image,story,x-graphic,og-image")
  .option("--recipe <id>", "saved visual recipe from the BrandSpec")
  .option("--template <id>", "template from `brandrail templates` (default: auto mix)")
  .option("--template-ref <ref>", "versioned selector: workspace:launch-card@2 or brand:campaign-frame@4")
  .option("--templates <plan>", "per-format plan: story=cta-card,og-image=announcement")
  .option("--media <slots>", "approved photos: x-graphic.primary=0,story.primary=2")
  .option("--archetype <name>", "compatibility alias for --template")
  .option("--run <runId>", "durable agent run to advance")
  .option("--out <dir>", "output directory", "./assets")
  .action(
    async (
      brief: string,
      opts: { brand: string; formats?: string; recipe?: string; template?: string; templateRef?: string; templates?: string; media?: string; archetype?: string; run?: string; out: string },
    ) => {
      try {
        let formats: FormatId[] | undefined;
        if (opts.formats) {
          const parts = opts.formats.split(",").map((f) => f.trim());
          const bad = parts.filter((f) => !isFormatId(f));
          if (bad.length) fail(`unknown formats: ${bad.join(", ")}`);
          formats = parts as FormatId[];
        }
        if (opts.template && opts.archetype && opts.template !== opts.archetype) fail("--template and --archetype must match when both are supplied");
        const selectedTemplate = opts.template ?? opts.archetype;
        if (opts.templateRef && (selectedTemplate || opts.templates)) fail("use --template-ref, --template, or --templates, not more than one");
        if (selectedTemplate && opts.templates) fail("use --template or --templates, not both");
        const templatePlan: Partial<Record<FormatId, keyof typeof ARCHETYPE_INFO>> = {};
        for (const entry of opts.templates?.split(",").filter(Boolean) ?? []) {
          const [format, template, extra] = entry.split("=");
          if (!format || !template || extra) fail(`invalid template plan entry: ${entry}`);
          if (!isFormatId(format)) fail(`unknown format in template plan: ${format}`);
          if (!(template in ARCHETYPE_INFO)) fail(`unknown template in plan: ${template}`);
          templatePlan[format as FormatId] = template as keyof typeof ARCHETYPE_INFO;
        }
        const media = (opts.media?.split(",").filter(Boolean) ?? []).map((entry): TemplateMediaSelection => {
          const [target, index, extra] = entry.split("=");
          const [format, name, targetExtra] = target?.split(".") ?? [];
          if (!format || !name || index === undefined || extra || targetExtra) fail(`invalid media selection: ${entry}`);
          if (!isFormatId(format)) fail(`unknown format in media selection: ${format}`);
          if (name !== "primary" && name !== "secondary") fail(`unknown media slot: ${name}`);
          const photoIndex = Number(index);
          if (!Number.isInteger(photoIndex) || photoIndex < 0 || photoIndex > 11) fail(`photo index must be 0–11: ${index}`);
          return { format, name, photoIndex };
        });
        const api = client();
        const res = await api.render(opts.brand, brief, {
          formats,
          ...(opts.recipe ? { recipe: opts.recipe } : {}),
          template: selectedTemplate as never,
          ...(opts.templateRef ? { templateRef: parseTemplateRef(opts.templateRef) } : {}),
          ...(Object.keys(templatePlan).length ? { templates: templatePlan as never } : {}),
          ...(media.length ? { media } : {}),
          ...(opts.run ? { runId: opts.run } : {}),
        });
        await mkdir(opts.out, { recursive: true });
        const files: string[] = [];
        for (const asset of res.assets) {
          const bytes = await api.downloadAsset(asset.url);
          const file = await writeAsset(opts.out, asset.filename, bytes);
          files.push(file);
        }
        if (isJson()) {
          console.log(JSON.stringify({ ok: true, id: res.id, specVersion: res.specVersion, files, artDirection: res.manifest.artDirection, warnings: res.manifest.warnings }));
        } else {
          console.log(`${files.length} assets · ${opts.brand} v${res.specVersion} · 0 violations`);
          for (const [format, decision] of Object.entries(res.manifest.artDirection ?? {})) {
            if (decision) console.log(`auto  ${format} → ${decision.selected} (${decision.intent})`);
          }
          for (const f of files) console.log(`  ${f}`);
          for (const w of res.manifest.warnings) console.log(`warn  ${w}`);
        }
      } catch (e) {
        handleError(e);
      }
    },
  );

program
  .command("templates")
  .description("list the brand-locked templates render can use")
  .action(() => {
    if (isJson()) {
      console.log(JSON.stringify({ ok: true, templates: ARCHETYPE_INFO }));
      return;
    }
    for (const [name, info] of Object.entries(ARCHETYPE_INFO)) {
      const tags = [info.needsPhotos ? "photo" : null, info.optIn ? "opt-in" : null]
        .filter(Boolean)
        .join(" · ");
      console.log(`${name}${tags ? `  [${tags}]` : ""}`);
      console.log(`  ${info.description}`);
      console.log(`  best for: ${info.bestFor}`);
      console.log(`  dynamic: ${Object.values(info.slots).map((slot) => `${slot.label}≤${slot.maxChars}`).join(", ")}`);
      if (info.mediaSlots) console.log(`  imagery: ${Object.values(info.mediaSlots).map((slot) => `${slot.label} (BrandSpec library)`).join(", ")}`);
      console.log(`  locked: ${info.locked.join(", ")}\n`);
    }
  });

const templateFamilies = program.command("template-families").description("manage safe versioned visual template families");

templateFamilies.command("list").action(async () => {
  try {
    const families = await client().listTemplateFamilies();
    if (isJson()) console.log(JSON.stringify({ ok: true, families }));
    else if (!families.length) console.log("No custom template families.");
    else for (const family of families) console.log(`${family.scope}:${family.id}@${family.version}  ${family.status}  ${Object.keys(family.formats).join(",")}`);
  } catch (e) { handleError(e); }
});

templateFamilies.command("versions").argument("<id>").action(async (id: string) => {
  try {
    const versions = await client().listTemplateFamilyVersions(id);
    if (isJson()) console.log(JSON.stringify({ ok: true, versions }));
    else for (const family of versions) console.log(`${family.scope}:${family.id}@${family.version}  ${family.status}  ${family.updatedAt}`);
  } catch (e) { handleError(e); }
});

templateFamilies.command("duplicate")
  .argument("<source>", "system:hero-statement or workspace:my-card@2")
  .requiredOption("--id <id>")
  .requiredOption("--name <name>")
  .option("--scope <scope>", "workspace or brand", "workspace")
  .option("--brand <name>")
  .option("--formats <list>")
  .action(async (source: string, opts: { id: string; name: string; scope: string; brand?: string; formats?: string }) => {
    try {
      if (opts.scope !== "workspace" && opts.scope !== "brand") fail("scope must be workspace or brand");
      const formats = opts.formats?.split(",").map((value) => value.trim()) as FormatId[] | undefined;
      if (formats?.some((format) => !isFormatId(format))) fail("formats contain an unknown format");
      const result = await client().duplicateTemplateFamily({ source: parseTemplateRef(source), id: opts.id, name: opts.name, scope: opts.scope, brand: opts.brand, formats });
      console.log(isJson() ? JSON.stringify({ ok: true, ...result }) : `${result.family.scope}:${result.family.id}@${result.family.version} draft created · preflight ${result.preflight.ready ? "ready" : "needs work"}`);
    } catch (e) { handleError(e); }
  });

templateFamilies.command("preflight").argument("<id>").option("--brand <name>").action(async (id: string, opts: { brand?: string }) => {
  try { const result = await client().preflightTemplateFamily(id, opts.brand); console.log(isJson() ? JSON.stringify({ ok: result.ready, ...result }) : result.ready ? "ready to publish" : result.issues.map((issue) => `${issue.severity} ${issue.path}: ${issue.message}`).join("\n")); } catch (e) { handleError(e); }
});

templateFamilies.command("publish").argument("<id>").option("--brand <name>").option("--auto-eligible").action(async (id: string, opts: { brand?: string; autoEligible?: boolean }) => {
  try { const family = await client().publishTemplateFamily(id, opts); console.log(isJson() ? JSON.stringify({ ok: true, family }) : `${family.scope}:${family.id}@${family.version} published${family.autoEligible ? " · auto-eligible" : " · manual-only"}`); } catch (e) { handleError(e); }
});

templateFamilies.command("archive").argument("<id>").action(async (id: string) => {
  try { const family = await client().archiveTemplateFamily(id); console.log(isJson() ? JSON.stringify({ ok: true, family }) : `${family.id}@${family.version} archived`); } catch (e) { handleError(e); }
});

templateFamilies.command("upload").argument("<file>").action(async (file: string) => {
  try { const bytes = await readFile(file); const result = await client().uploadTemplateArtwork(new Blob([bytes]), path.basename(file)); console.log(isJson() ? JSON.stringify({ ok: true, ...result }) : result.ref); } catch (e) { handleError(e); }
});

const recipes = program.command("recipes").description("manage reusable BrandSpec visual systems");

recipes.command("list").requiredOption("--brand <name>").action(async (opts: { brand: string }) => {
  try {
    const result = await client().listRecipes(opts.brand);
    if (isJson()) console.log(JSON.stringify({ ok: true, ...result }));
    else if (!result.recipes.length) console.log("No saved recipes.");
    else for (const recipe of result.recipes) console.log(`${recipe.id}  ${recipe.name}`);
  } catch (e) { handleError(e); }
});

recipes.command("save")
  .description("save a recipe JSON file as a new BrandSpec version")
  .argument("<file>", "JSON file containing one recipe object")
  .requiredOption("--brand <name>")
  .action(async (file: string, opts: { brand: string }) => {
    try {
      const recipe = JSON.parse(await readFile(file, "utf8"));
      const result = await client().createRecipe(opts.brand, recipe);
      if (isJson()) console.log(JSON.stringify({ ok: true, ...result }));
      else console.log(`${result.recipe.id}  saved · BrandSpec v${result.specVersion}`);
    } catch (e) { handleError(e); }
  });

recipes.command("rename")
  .argument("<id>")
  .requiredOption("--brand <name>")
  .requiredOption("--name <name>")
  .action(async (id: string, opts: { brand: string; name: string }) => {
    try {
      const result = await client().renameRecipe(opts.brand, id, opts.name);
      if (isJson()) console.log(JSON.stringify({ ok: true, ...result }));
      else console.log(`${id}  renamed · BrandSpec v${result.specVersion}`);
    } catch (e) { handleError(e); }
  });

recipes.command("delete")
  .argument("<id>")
  .requiredOption("--brand <name>")
  .option("--confirm", "confirm permanent removal", false)
  .action(async (id: string, opts: { brand: string; confirm: boolean }) => {
    try {
      if (!opts.confirm) fail("recipe deletion requires --confirm");
      const result = await client().deleteRecipe(opts.brand, id);
      if (isJson()) console.log(JSON.stringify({ ok: true, ...result }));
      else console.log(`${result.deleted}  deleted · BrandSpec v${result.specVersion}`);
    } catch (e) { handleError(e); }
  });

const spec = program.command("spec").description("inspect and manage BrandSpecs");

/** parse "acme@3" → { name, version } */
function parseRef(ref: string): { name: string; version?: number } {
  const m = /^([a-z0-9-]+)(?:@(\d+))?$/.exec(ref);
  if (!m) fail(`invalid spec ref "${ref}" (expected name or name@version)`);
  return { name: m![1]!, version: m![2] ? Number(m![2]) : undefined };
}

spec
  .command("show")
  .description("print a spec (canonical JSON)")
  .argument("<ref>", "name or name@version")
  .action(async (ref: string) => {
    try {
      const { name, version } = parseRef(ref);
      const s = await client().getSpec(name, version);
      console.log(stringify(s));
    } catch (e) {
      handleError(e);
    }
  });

spec
  .command("list")
  .description("list compiled brands")
  .action(async () => {
    try {
      const specs = await client().listSpecs();
      if (isJson()) console.log(JSON.stringify({ ok: true, specs }));
      else for (const s of specs) console.log(`${s.name}@${s.version}`);
    } catch (e) {
      handleError(e);
    }
  });

spec
  .command("diff")
  .description("human-readable semantic diff between two versions")
  .argument("<from>", "name@version, e.g. acme@2")
  .argument("<to>", "name@version, e.g. acme@3")
  .action(async (fromRef: string, toRef: string) => {
    try {
      const from = parseRef(fromRef);
      const to = parseRef(toRef);
      if (from.name !== to.name) fail("diff refs must be versions of the same brand");
      if (!from.version || !to.version) fail("both refs need explicit versions (name@N)");
      const res = await client().diffSpec(from.name, from.version, to.version);
      if (isJson()) console.log(JSON.stringify({ ok: true, entries: res.entries }));
      else console.log(res.text ?? formatDiff(res.entries));
    } catch (e) {
      handleError(e);
    }
  });

spec
  .command("fork")
  .description("fork a parent spec into a child brand (agency master → client)")
  .argument("<parent>", "parent brand name")
  .requiredOption("--name <name>", "child brand name (kebab-case)")
  .action(async (parent: string, opts: { name: string }) => {
    try {
      const child = await client().forkSpec(parseRef(parent).name, opts.name);
      if (isJson()) console.log(JSON.stringify({ ok: true, name: child.meta.name, version: child.meta.version, forkedFrom: child.meta.forkedFrom }));
      else console.log(`${child.meta.name}@${child.meta.version} forked from ${parent}`);
    } catch (e) {
      handleError(e);
    }
  });

program.command("channels").description("list connected publishing channels and their IDs").action(async () => {
  try {
    const channels = await client().listChannels();
    if (isJson()) console.log(JSON.stringify({ ok: true, channels }));
    else if (!channels.length) console.log("No channels connected. Connect one in the Brandrail workspace.");
    else for (const channel of channels) console.log(`${channel.id}  ${channel.platform} · ${channel.handle}`);
  } catch (e) { handleError(e); }
});

program.command("schedule")
  .description("publish now or add a post to the calendar")
  .argument("<text>", "post caption")
  .requiredOption("--channels <ids>", "comma-separated channel IDs (see: brandrail channels)")
  .option("--at <iso>", "ISO publish time; omit to publish now")
  .option("--render <id>", "saved render ID")
  .option("--images <files>", "comma-separated filenames from the saved render")
  .option("--idempotency-key <key>", "deduplicate retries")
  .option("--run <runId>", "durable agent run to advance")
  .option("--dry-run", "validate and print the execution without publishing")
  .option("--confirm", "confirm an agent publish without a review reference")
  .option("--approval <ref>", "approved batch:item reference")
  .action(async (text: string, opts: { channels: string; at?: string; render?: string; images?: string; idempotencyKey?: string; run?: string; dryRun?: boolean; confirm?: boolean; approval?: string }) => {
    try {
      const channelIds = opts.channels.split(",").map((value) => value.trim()).filter(Boolean);
      if (!channelIds.length) fail("at least one channel ID is required");
      if (opts.at && !Number.isFinite(Date.parse(opts.at))) fail("--at must be a valid ISO date");
      const approvalParts = opts.approval?.split(":");
      if (opts.approval && approvalParts?.length !== 2) fail("--approval must be batchId:itemId");
      const result = await client().schedule({ text, channelIds, ...(opts.at ? { scheduledAt: new Date(opts.at).toISOString() } : {}), ...(opts.render ? { renderId: opts.render } : {}), ...(opts.images ? { imageFiles: opts.images.split(",").map((value) => value.trim()).filter(Boolean) } : {}), ...(opts.idempotencyKey ? { idempotencyKey: opts.idempotencyKey } : {}), ...(opts.run ? { runId: opts.run } : {}), ...(opts.dryRun ? { dryRun: true } : {}), ...(opts.confirm ? { confirm: true } : {}), ...(approvalParts ? { approval: { batchId: approvalParts[0]!, itemId: approvalParts[1]! } } : {}) });
      if (isJson()) console.log(JSON.stringify({ ok: true, ...result }));
      else if (result.dryRun) console.log(`dry-run  ${result.ready ? "ready" : "blocked"}`);
      else console.log(`${result.post.status}  ${result.post.id}  ${result.post.scheduledAt}${result.deduplicated ? "  (deduplicated)" : ""}`);
    } catch (e) { handleError(e); }
  });

const content = program.command("content").description("plan and operate a rolling weekly or monthly content program");
content.command("list").description("list content programs and next production times").action(async () => {
  try {
    const programs = await client().listContentPrograms();
    if (isJson()) console.log(JSON.stringify({ ok: true, programs }));
    else if (!programs.length) console.log("No content programs yet. Start with: brandrail content preview <objective> --brand <name>");
    else for (const row of programs) console.log(`${row.status.padEnd(9)}  ${row.brand.padEnd(18)}  ${row.perWeek}/wk  next ${row.nextRunAt?.slice(0, 10) ?? "—"}  ${row.name}`);
  } catch (e) { handleError(e); }
});

contentOptions(content.command("preview").description("preview a coherent week or month without saving or rendering").argument("<objective>", "business outcome"))
  .option("--activate", "save this exact approved preview as the active program")
  .action(async (objective: string, opts: ContentOptions & { activate?: boolean }) => {
    try {
      const input = contentInput(objective, opts);
      const preview = await client().previewContentProgram(input);
      const saved = opts.activate ? await client().saveContentProgram({ ...input, plannedPosts: preview.posts }) : null;
      if (isJson()) console.log(JSON.stringify({ ok: true, preview, ...(saved ? { program: saved } : {}) }));
      else {
        console.log(`${preview.totalPosts} posts · ${preview.horizonWeeks} week${preview.horizonWeeks === 1 ? "" : "s"} · rolling weekly production`);
        for (const post of preview.posts) console.log(`W${post.week}  ${post.scheduledFor.slice(0, 10)}  ${post.format.padEnd(11)}  ${post.brief}`);
        console.log(saved ? `active  ${saved.name} · this exact calendar is saved` : `next  rerun with --activate to save this exact calendar`);
      }
    } catch (e) { handleError(e); }
  });

contentOptions(content.command("create").description("create or update a rolling content program").argument("<objective>", "business outcome"))
  .action(async (objective: string, opts: ContentOptions) => {
    try {
      const saved = await client().saveContentProgram(contentInput(objective, opts));
      if (isJson()) console.log(JSON.stringify({ ok: true, program: saved }));
      else {
        console.log(`${saved.status}  ${saved.name}  ${saved.perWeek}/week`);
        console.log(`next  brandrail content run ${saved.brand}`);
      }
    } catch (e) { handleError(e); }
  });

content.command("run").description("produce the next week now").argument("<brand>").action(async (brand: string) => {
  try { const result = await client().runContentProgram(brand); if (isJson()) console.log(JSON.stringify({ ok: true, ...result })); else console.log(`${result.batches} week generated · ${result.rendered} assets · ${result.queued ? `${result.queued} channel deliveries scheduled` : "waiting for review"}`); } catch (e) { handleError(e); }
});
content.command("pause").description("pause future production without deleting the program").argument("<brand>").action(async (brand: string) => {
  try { const result = await client().setContentProgramPaused(brand, true); if (isJson()) console.log(JSON.stringify({ ok: true, program: result })); else console.log(`paused  ${result.name}`); } catch (e) { handleError(e); }
});
content.command("resume").description("resume a paused content program").argument("<brand>").action(async (brand: string) => {
  try { const result = await client().setContentProgramPaused(brand, false); if (isJson()) console.log(JSON.stringify({ ok: true, program: result })); else console.log(`active  ${result.name}  next ${result.nextRunAt?.slice(0, 10) ?? "now"}`); } catch (e) { handleError(e); }
});
content.command("delete").description("delete future program execution; existing work stays intact").argument("<brand>").option("--confirm", "confirm deletion").action(async (brand: string, opts: { confirm?: boolean }) => {
  if (!opts.confirm) fail("content program deletion requires --confirm");
  try { await client().deleteContentProgram(brand); if (isJson()) console.log(JSON.stringify({ ok: true, brand })); else console.log(`deleted  ${brand} content program`); } catch (e) { handleError(e); }
});

const agent = program.command("agent").description("coordinate and inspect durable agent execution");
agent.command("plan")
  .description("dry-run a campaign before anything mutates")
  .argument("<objective>", "campaign objective")
  .option("--brand <name>", "BrandSpec name")
  .option("--channels <ids>", "comma-separated channel IDs")
  .option("--assets <count>", "estimated finished assets", "5")
  .option("--publish-at <iso>", "optional target publish time")
  .action(async (objective: string, opts: { brand?: string; channels?: string; assets: string; publishAt?: string }) => {
    try {
      const plan = await client().executionPlan({ objective, ...(opts.brand ? { brand: opts.brand } : {}), ...(opts.channels ? { channels: opts.channels.split(",").map((value) => value.trim()).filter(Boolean) } : {}), assetCount: Number(opts.assets), ...(opts.publishAt ? { publishAt: opts.publishAt } : {}) });
      if (isJson()) console.log(JSON.stringify({ ok: true, plan }));
      else {
        console.log(`${plan.ready ? "ready" : "blocked"}  ${plan.brand ?? "no brand"}  ${plan.estimate.finishedAssets} assets`);
        for (const blocker of plan.blockers) console.log(`blocker  ${blocker}`);
        for (const step of plan.steps) console.log(`${step.mutates ? "write" : "read "}  ${step.ready ? "✓" : "×"} ${step.action}`);
      }
    } catch (e) { handleError(e); }
  });

agent.command("start")
  .description("create durable state for an attached CLI, MCP, or SDK agent")
  .argument("<objective>", "campaign objective")
  .option("--brand <name>", "BrandSpec name")
  .option("--channels <ids>", "comma-separated channel IDs")
  .option("--assets <count>", "estimated finished assets", "5")
  .option("--publish-at <iso>", "optional target publish time")
  .option("--yes", "mark the run ready for execution instead of pausing for plan confirmation")
  .action(async (objective: string, opts: { brand?: string; channels?: string; assets: string; publishAt?: string; yes?: boolean }) => {
    try {
      const run = await client().startAgentRun({ objective, ...(opts.brand ? { brand: opts.brand } : {}), ...(opts.channels ? { channels: opts.channels.split(",").map((value) => value.trim()).filter(Boolean) } : {}), assetCount: Number(opts.assets), ...(opts.publishAt ? { publishAt: opts.publishAt } : {}), start: Boolean(opts.yes) });
      if (isJson()) console.log(JSON.stringify({ ok: true, run }));
      else {
        console.log(`${run.id}  ${run.status}  ${run.currentStep}  ${run.progress}%`);
        if (run.status === "input_required") console.log(`next  brandrail agent input ${run.id} --data '{"approved":true}'`);
        else if (run.currentStep === "render" && run.brand) console.log(`next  brandrail render <brief> --brand ${run.brand} --run ${run.id}`);
      }
    } catch (e) { handleError(e); }
  });

agent.command("list").description("list durable campaign runs").option("--limit <count>", "maximum runs", "25").action(async (opts: { limit: string }) => {
  try {
    const runs = await client().listAgentRuns(Number(opts.limit));
    if (isJson()) console.log(JSON.stringify({ ok: true, runs }));
    else if (!runs.length) console.log("No agent runs yet.");
    else for (const run of runs) console.log(`${run.id}  ${run.status.padEnd(14)}  ${String(run.progress).padStart(3)}%  ${run.objective}`);
  } catch (e) { handleError(e); }
});

agent.command("status").description("show one durable run").argument("<runId>").action(async (runId: string) => {
  try {
    const run = await client().getAgentRun(runId);
    if (isJson()) console.log(JSON.stringify({ ok: true, run }));
    else {
      console.log(`${run.id}  ${run.status}  ${run.currentStep}  ${run.progress}%`);
      console.log(run.objective);
      if (run.renderIds?.length) console.log(`renders  ${run.renderIds.join(", ")}`);
      if (run.batchId) console.log(`review   ${run.batchId}`);
      if (run.postIds?.length) console.log(`posts    ${run.postIds.join(", ")}`);
      if (run.error) console.log(`error    ${run.error}`);
      if (run.currentStep === "confirm_plan") console.log(`next     brandrail agent input ${run.id} --data '{"approved":true}'`);
      else if (run.currentStep === "render" && run.brand) console.log(`next     brandrail render <brief> --brand ${run.brand} --run ${run.id}`);
      else if (run.currentStep === "review_or_confirm" && run.brand && run.renderIds?.[0]) console.log(`next     brandrail review create <brief> --brand ${run.brand} --render ${run.renderIds[0]} --run ${run.id}\n         or brandrail agent complete ${run.id} for an asset-only job`);
      else if (["human_review", "resolve_review_flags"].includes(run.currentStep) && run.batchId) console.log(`next     brandrail review status ${run.batchId} --run ${run.id}`);
      else if (run.currentStep === "publish") console.log(`next     brandrail schedule <caption> --channels <ids> --run ${run.id} --confirm`);
      else if (run.currentStep === "scheduled") console.log("next     wait for delivery, then run this status command again");
    }
  } catch (e) { handleError(e); }
});

agent.command("input").description("approve a run waiting at plan confirmation").argument("<runId>").requiredOption("--data <json>", "JSON object").action(async (runId: string, opts: { data: string }) => {
  try { const value = JSON.parse(opts.data) as unknown; if (!value || Array.isArray(value) || typeof value !== "object") fail("--data must be a JSON object"); const run = await client().provideAgentInput(runId, value as Record<string, unknown>); if (isJson()) console.log(JSON.stringify({ ok: true, run })); else console.log(`${run.id}  ${run.status}  ${run.currentStep}`); } catch (e) { handleError(e); }
});

agent.command("retry").description("retry a failed or cancelled run").argument("<runId>").action(async (runId: string) => {
  try { const run = await client().retryAgentRun(runId); if (isJson()) console.log(JSON.stringify({ ok: true, run })); else console.log(`${run.id}  ${run.status}  ${run.currentStep}`); } catch (e) { handleError(e); }
});

agent.command("complete").description("finish an asset-only run without publishing").argument("<runId>").action(async (runId: string) => {
  try { const run = await client().completeAgentRun(runId); if (isJson()) console.log(JSON.stringify({ ok: true, run })); else console.log(`${run.id}  completed  100%`); } catch (e) { handleError(e); }
});

agent.command("cancel").description("cancel an active run").argument("<runId>").action(async (runId: string) => {
  try { const run = await client().cancelAgentRun(runId); if (isJson()) console.log(JSON.stringify({ ok: true, run })); else console.log(`${run.id}  cancelled`); } catch (e) { handleError(e); }
});

const review = program.command("review").description("resume human-in-the-loop work");
review.command("create")
  .argument("<brief>", "content brief to render for review")
  .description("render an item into a human review batch")
  .requiredOption("--brand <name>", "BrandSpec name")
  .option("--title <title>", "review batch title")
  .option("--template <id>", "template from `brandrail templates`")
  .option("--archetype <name>", "compatibility alias for --template")
  .option("--render <renderId>", "attach an existing render without generating it again")
  .option("--run <runId>", "durable agent run to advance")
  .action(async (brief: string, opts: { brand: string; title?: string; template?: string; archetype?: string; render?: string; run?: string }) => {
    try {
      if (opts.template && opts.archetype && opts.template !== opts.archetype) fail("--template and --archetype must match when both are supplied");
      const selectedTemplate = opts.template ?? opts.archetype;
      const batch = await client().createReviewBatch({
        ...(opts.title ? { title: opts.title } : {}),
        ...(opts.run ? { runId: opts.run } : {}),
        items: [{ brand: opts.brand, brief, ...(selectedTemplate ? { archetype: selectedTemplate as never } : {}), ...(opts.render ? { renderId: opts.render } : {}) }],
      });
      if (isJson()) console.log(JSON.stringify({ ok: true, batch }));
      else {
        console.log(`${batch.id}  ${batch.title}`);
        console.log(`next  review in the workspace, then: brandrail review status ${batch.id}${opts.run ? ` --run ${opts.run}` : ""}`);
      }
    } catch (e) { handleError(e); }
  });

review.command("status").argument("<batchId>").description("show approval state and advance a linked run").option("--run <runId>", "durable agent run to advance").action(async (batchId: string, opts: { run?: string }) => {
  try {
    const status = await client().reviewStatus(batchId, opts.run);
    if (isJson()) console.log(JSON.stringify({ ok: true, status }));
    else {
      console.log(`${status.ready ? "ready" : "waiting"}  ${status.title}  ${status.counts.approved}/${status.counts.total} approved`);
      console.log(`next  ${status.nextAction}`);
      for (const item of status.flagged) console.log(`flag  ${item.itemId}  ${item.note ?? "needs review"}`);
    }
  } catch (e) { handleError(e); }
});

review.command("comment").argument("<batchId>").description("add feedback without changing approval state").requiredOption("--author <name>").requiredOption("--text <text>").option("--item <itemId>").action(async (batchId: string, opts: { author: string; text: string; item?: string }) => {
  try { const result = await client().addReviewComment(batchId, { author: opts.author, text: opts.text, ...(opts.item ? { itemId: opts.item } : {}) }); if (isJson()) console.log(JSON.stringify({ ok: true, ...result })); else console.log("comment added"); } catch (e) { handleError(e); }
});

program.command("calendar").description("list scheduled and published posts").option("--status <status>", "filter by status").action(async (opts: { status?: string }) => {
  try {
    const posts = (await client().listScheduled()).filter((post) => !opts.status || post.status === opts.status);
    if (isJson()) console.log(JSON.stringify({ ok: true, posts }));
    else if (!posts.length) console.log("No matching calendar posts.");
    else for (const post of posts) console.log(`${post.scheduledAt}  ${post.status.padEnd(10)}  ${post.id}  ${post.text.slice(0, 72)}`);
  } catch (e) { handleError(e); }
});

program.command("reschedule").description("edit a post that is still scheduled").argument("<postId>").option("--at <iso>").option("--text <text>").action(async (postId: string, opts: { at?: string; text?: string }) => {
  try { const post = await client().reschedulePost(postId, { ...(opts.at ? { scheduledAt: new Date(opts.at).toISOString() } : {}), ...(opts.text ? { text: opts.text } : {}) }); if (isJson()) console.log(JSON.stringify({ ok: true, post })); else console.log(`${post.id}  ${post.status}  ${post.scheduledAt}`); } catch (e) { handleError(e); }
});

program.command("cancel-post").description("cancel a post that has not started publishing").argument("<postId>").action(async (postId: string) => {
  try { const result = await client().cancelPost(postId); if (isJson()) console.log(JSON.stringify(result)); else console.log(`${result.post.id}  cancelled`); } catch (e) { handleError(e); }
});

program.command("usage").description("show plan entitlements and metered usage").action(async () => {
  try { const usage = await client().usage(); if (isJson()) console.log(JSON.stringify({ ok: true, usage })); else console.log(JSON.stringify(usage, null, 2)); } catch (e) { handleError(e); }
});

const campaign = program.command("campaign").description("manage campaign workspaces");
campaign.command("list").description("list campaigns with live progress").action(async () => {
  try {
    const campaigns = await client().listCampaigns();
    if (isJson()) console.log(JSON.stringify({ ok: true, campaigns }));
    else if (!campaigns.length) console.log("No campaigns yet.");
    else for (const row of campaigns) console.log(`${row.id}  ${row.status.padEnd(8)}  ${row.name}  ${row.progress.approved}/${row.progress.assets} approved · ${row.progress.published} live`);
  } catch (e) { handleError(e); }
});
campaign.command("create")
  .description("create a campaign")
  .requiredOption("--name <name>", "campaign name")
  .requiredOption("--objective <text>", "objective and success condition")
  .option("--brands <names>", "comma-separated brand names")
  .option("--batches <ids>", "comma-separated batch IDs")
  .option("--posts <ids>", "comma-separated scheduled post IDs")
  .action(async (opts: { name: string; objective: string; brands?: string; batches?: string; posts?: string }) => {
    try {
      const list = (value?: string) => value?.split(",").map((item) => item.trim()).filter(Boolean) ?? [];
      const result = await client().createCampaign({ name: opts.name, objective: opts.objective, brandIds: list(opts.brands), batchIds: list(opts.batches), postIds: list(opts.posts) });
      if (isJson()) console.log(JSON.stringify({ ok: true, campaign: result }));
      else console.log(`${result.id}  ${result.name}  created`);
    } catch (e) { handleError(e); }
  });

program.command("analytics").description("show the performance feedback loop").option("--refresh", "pull fresh platform metrics first").action(async (opts: { refresh?: boolean }) => {
  try {
    const refreshed = opts.refresh ? await client().refreshAnalytics() : undefined;
    const data = await client().analytics();
    if (isJson()) console.log(JSON.stringify({ ok: true, refreshed, analytics: data }));
    else {
      if (refreshed) console.log(`refreshed  ${refreshed.updated}/${refreshed.published} published posts`);
      console.log(`published  ${data.totals.published}`);
      console.log(`reach      ${data.totals.impressions}`);
      console.log(`engaged    ${data.totals.engagements}`);
      console.log(`signal     ${data.insight}`);
    }
  } catch (e) { handleError(e); }
});

program.parseAsync().catch((e) => handleError(e));
