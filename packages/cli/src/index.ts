import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { Command } from "commander";
import { Brandrail, BrandrailError } from "@brandrail/sdk";
import { stringify, formatDiff, isFormatId, ARCHETYPE_INFO, type FormatId } from "@brandrail/spec";

/**
 * Exit codes (agents are the primary users — keep them stable):
 *   0 ok · 2 spec violation · 3 compile finished with low-confidence fields
 */
const EXIT_VIOLATION = 2;
const EXIT_LOW_CONFIDENCE = 3;

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
  .option("--archetype <name>", "layout archetype (default: brand's first allowed)")
  .option("--out <dir>", "output directory", "./assets")
  .action(
    async (
      brief: string,
      opts: { brand: string; formats?: string; archetype?: string; out: string },
    ) => {
      try {
        let formats: FormatId[] | undefined;
        if (opts.formats) {
          const parts = opts.formats.split(",").map((f) => f.trim());
          const bad = parts.filter((f) => !isFormatId(f));
          if (bad.length) fail(`unknown formats: ${bad.join(", ")}`);
          formats = parts as FormatId[];
        }
        const api = client();
        const res = await api.render(opts.brand, brief, {
          formats,
          archetype: opts.archetype as never,
        });
        await mkdir(opts.out, { recursive: true });
        const files: string[] = [];
        for (const asset of res.assets) {
          const bytes = await api.downloadAsset(asset.url);
          const file = path.join(opts.out, asset.filename);
          await writeFile(file, bytes);
          files.push(file);
        }
        if (isJson()) {
          console.log(JSON.stringify({ ok: true, id: res.id, specVersion: res.specVersion, files, warnings: res.manifest.warnings }));
        } else {
          console.log(`${files.length} assets · ${opts.brand} v${res.specVersion} · 0 violations`);
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
      console.log(`  best for: ${info.bestFor}\n`);
    }
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
  .action(async (text: string, opts: { channels: string; at?: string; render?: string; images?: string; idempotencyKey?: string }) => {
    try {
      const channelIds = opts.channels.split(",").map((value) => value.trim()).filter(Boolean);
      if (!channelIds.length) fail("at least one channel ID is required");
      if (opts.at && !Number.isFinite(Date.parse(opts.at))) fail("--at must be a valid ISO date");
      const result = await client().schedule({ text, channelIds, ...(opts.at ? { scheduledAt: new Date(opts.at).toISOString() } : {}), ...(opts.render ? { renderId: opts.render } : {}), ...(opts.images ? { imageFiles: opts.images.split(",").map((value) => value.trim()).filter(Boolean) } : {}), ...(opts.idempotencyKey ? { idempotencyKey: opts.idempotencyKey } : {}) });
      if (isJson()) console.log(JSON.stringify({ ok: true, ...result }));
      else console.log(`${result.post.status}  ${result.post.id}  ${result.post.scheduledAt}${result.deduplicated ? "  (deduplicated)" : ""}`);
    } catch (e) { handleError(e); }
  });

program.command("calendar").description("list scheduled and published posts").option("--status <status>", "filter by status").action(async (opts: { status?: string }) => {
  try {
    const posts = (await client().listScheduled()).filter((post) => !opts.status || post.status === opts.status);
    if (isJson()) console.log(JSON.stringify({ ok: true, posts }));
    else if (!posts.length) console.log("No matching calendar posts.");
    else for (const post of posts) console.log(`${post.scheduledAt}  ${post.status.padEnd(10)}  ${post.id}  ${post.text.slice(0, 72)}`);
  } catch (e) { handleError(e); }
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
