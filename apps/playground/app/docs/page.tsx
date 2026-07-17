import type { Metadata } from "next";
import { CopyCode } from "../components/copy-code";
import { HashScroll } from "../components/hash-scroll";
import { McpSetupGuide } from "../components/mcp-setup-guide";
import { PublicFooter } from "../components/public-footer";
import { PublicNav } from "../components/public-nav";
import { MCP_TOOL_COUNT } from "@/lib/mcp-meta";

const DOCS_NAV_LINKS = [
  { href: "/agents", label: "Agent platform" },
  { href: "https://github.com/apwn/brandrail", label: "GitHub" },
] as const;

const DOCS_MOBILE_LINK = { href: "/agents", label: "Agents" } as const;

export const metadata: Metadata = {
  title: "Developer documentation · Brandrail",
  description: "Connect an AI agent with hosted MCP or build brand-safe content workflows with the Brandrail REST API, SDK, and CLI.",
  alternates: { canonical: "/docs" },
  openGraph: {
    title: "Build on Brandrail",
    description: "Hosted MCP, REST API, SDK, CLI, portable BrandSpecs, and human-controlled publishing.",
    url: "/docs",
  },
};

const SECTIONS = [
  ["#quickstart", "Quickstart"],
  ["#auth", "Auth & keys"],
  ["#templates", "Templates"],
  ["#programs", "Content programs"],
  ["#mcp", "MCP"],
  ["#api", "REST API"],
  ["#sdk", "SDK"],
  ["#cli", "CLI"],
  ["#publishing", "Publishing"],
  ["#spec", "BrandSpec"],
  ["#errors", "Errors & safety"],
  ["#selfhost", "Self-host"],
] as const;

const REST_QUICKSTART = `# 1. compile — URL in, versioned BrandSpec out
curl -X POST https://api.brandrail.dev/v0/compile \\
  -H "Authorization: Bearer brk_…" \\
  -H "content-type: application/json" \\
  -d '{"url":"https://acme.com"}'

# 2. render — brief in, finished assets out
curl -X POST https://api.brandrail.dev/v0/render \\
  -H "Authorization: Bearer brk_…" \\
  -H "content-type: application/json" \\
  -d '{"brand":"acme","brief":"Summer promotion"}'`;

const API_SURFACE = `POST   /v0/compile                 website → versioned BrandSpec
GET    /v0/specs                   list active brands
GET    /v0/specs/:name             fetch one spec or version
PATCH  /v0/specs/:name             edit → new version
GET    /v0/specs/:name/recipes     list reusable visual systems
POST   /v0/specs/:name/recipes     save recipe → new spec version
PATCH  /v0/specs/:name/recipes/:id rename recipe → new spec version
DELETE /v0/specs/:name/recipes/:id remove recipe → new spec version
GET    /v0/templates               visual library + dynamic field contracts
GET    /v0/template-families       list workspace + brand visual families
GET    /v0/template-families/:id/versions immutable family history
POST   /v0/template-families/duplicate create editable declarative draft
POST   /v0/template-families/:id/preflight verify slots, roles, formats, contrast
POST   /v0/template-families/:id/publish immutable published version
POST   /v0/template-families/:id/archive retire without breaking old renders
DELETE /v0/template-families/:id  delete draft-only history
POST   /v0/template-assets         freeze PNG/JPEG/WebP/sanitized SVG artwork
POST   /v0/render                  brief → gated assets + art direction
GET    /v0/renders/:id             manifest + asset URLs
GET    /v0/content-programs        rolling program strategy + state
POST   /v0/content-programs/preview plan one or four weeks without rendering
PUT    /v0/content-programs/:brand create or update a Studio program
POST   /v0/content-programs/:brand/run produce the next week now
POST   /v0/content-programs/:brand/pause pause or resume future production
DELETE /v0/content-programs/:brand stop future production
POST   /v0/agent/plan              dry-run objective → blockers + steps
POST   /v0/agent/runs              start reconnect-safe work
GET    /v0/agent/runs/:id          resume from durable state
POST   /v0/batches                 create a human review queue
GET    /v0/batches/:id/status      approval state + exact item IDs
POST   /v0/publish                 dry-run or schedule approved work
GET    /v0/scheduled               calendar + delivery state
GET    /v0/analytics               performance feedback
GET    /v0/me/usage                limits and remaining allowance
GET    /v0/me/audit                agent + human mutation log
GET    /v0/me/operations           delivery + recovery attention signals`;

const SDK_EXAMPLE = `import { Brandrail } from "@brandrail/sdk";

const brandrail = new Brandrail({
  apiKey: process.env.BRANDRAIL_API_KEY,
});

const { spec } = await brandrail.compile("https://acme.com");
const render = await brandrail.render(
  spec.meta.name,
  "Summer promotion",
  {
    formats: ["li-image"],
    template: "hero-statement",
    modifications: [
      { format: "li-image", name: "hook", text: "The exact headline" },
    ],
    media: [
      { format: "li-image", name: "primary", photoIndex: 0 },
    ],
  },
);

console.log(render.assets);`;

const CLI_EXAMPLE = `pnpm install && pnpm build

node packages/cli/dist/index.js compile https://acme.com
node packages/cli/dist/index.js templates
node packages/cli/dist/index.js recipes list --brand acme
node packages/cli/dist/index.js recipes save ./weekly-launch.json --brand acme
node packages/cli/dist/index.js recipes rename weekly-launch --brand acme --name "Weekly launch"
node packages/cli/dist/index.js recipes delete weekly-launch --brand acme --confirm
node packages/cli/dist/index.js render "Summer promotion" --brand acme --recipe weekly-launch --json
node packages/cli/dist/index.js render "Launch" --brand acme --template promo-card --media x-graphic.primary=0
node packages/cli/dist/index.js content preview "Own the category" --brand acme --audience "Operations leaders" --pillars "Proof,Education,Product" --per-week 3 --horizon 4
# Approve the ideas, then save that exact calendar:
node packages/cli/dist/index.js content preview "Own the category" --brand acme --audience "Operations leaders" --pillars "Proof,Education,Product" --per-week 3 --horizon 4 --activate
node packages/cli/dist/index.js content run acme
node packages/cli/dist/index.js content pause acme
node packages/cli/dist/index.js mcp config --client openclaw
node packages/cli/dist/index.js mcp doctor
node packages/cli/dist/index.js agent start "Launch campaign" --brand acme --json
node packages/cli/dist/index.js agent status run_123
node packages/cli/dist/index.js review status batch_123 --run run_123
node packages/cli/dist/index.js schedule "Launch day" --channels ch_123 \\
  --at 2026-08-01T15:00:00Z --dry-run

# stable exit codes: 0 ok · 2 spec violation · 3 low confidence`;

export default function DocsPage() {
  return (
    <main className="min-h-screen">
      <HashScroll />
      <DocsHeader />
      <DocsHero />
      <div className="mx-auto grid max-w-[1180px] gap-10 px-5 pb-20 sm:px-6 lg:grid-cols-[210px_minmax(0,1fr)] lg:gap-14 lg:pt-14">
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <p className="eyebrow text-bone">ON THIS PAGE</p>
            <DocsNav />
            <div className="mt-8 border-l-2 border-green pl-3 font-mono text-[9px] leading-relaxed text-muted"><span className="text-green">● HOSTED MCP</span><br />{MCP_TOOL_COUNT} tools · remote HTTP</div>
          </div>
        </aside>
        <article className="min-w-0 max-w-[820px]">
          <div className="mb-8 overflow-x-auto border-y border-hairline py-3 lg:hidden"><DocsNav horizontal /></div>
          <QuickstartSection />
          <AuthSection />
          <TemplatesSection />
          <ContentProgramsSection />
          <McpSection />
          <ApiSection />
          <SdkSection />
          <CliSection />
          <PublishingSection />
          <BrandSpecSection />
          <ErrorsSection />
          <SelfHostSection />
          <ReleaseStatus />
        </article>
      </div>
      <DocsFooter />
    </main>
  );
}

function DocsHeader() {
  return (
    <PublicNav
      context="Docs · V0"
      links={DOCS_NAV_LINKS}
      ctaLabel="Create a free key"
      mobileLink={DOCS_MOBILE_LINK}
    />
  );
}

function DocsHero() {
  return (
    <section className="relative overflow-hidden border-b border-hairline-soft pb-10 pt-12 md:pb-12 md:pt-14">
      <div className="surface-grid absolute inset-0 opacity-35" aria-hidden />
      <div className="relative mx-auto max-w-[1180px] px-5 sm:px-6">
        <p className="eyebrow text-signal">DEVELOPER DOCUMENTATION · V0</p>
        <h1 className="mt-4 max-w-[790px] font-display text-[clamp(40px,6vw,66px)] font-bold leading-[.98] tracking-[-.045em]">Build brand-safe content operations.</h1>
        <p className="mt-5 max-w-[720px] text-[17px] leading-relaxed text-muted">Connect an agent with one hosted MCP endpoint, or use the REST API, TypeScript SDK and CLI directly. Every surface shares the same BrandSpec, permissions and fail-closed render gate.</p>
        <div className="mt-7 flex flex-wrap gap-3"><a href="#quickstart" className="btn">Start in two minutes ↓</a><a href="/login?agent=1" className="btn-ghost">Create a free key →</a></div>
        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 font-mono text-[10px] text-muted"><span className="text-green">● HOSTED MCP</span><span>REST API · V0</span><span>SDK + CLI · PRE-RELEASE</span><span>{MCP_TOOL_COUNT} LIFECYCLE TOOLS</span></div>
      </div>
    </section>
  );
}

function DocsNav({ horizontal = false }: { horizontal?: boolean }) {
  return (
    <nav className={horizontal ? "flex min-w-max gap-5 font-mono text-[10px]" : "mt-4 space-y-2 border-l border-hairline pl-4 font-mono text-[10px]"} aria-label="Documentation sections">
      {SECTIONS.map(([href, label]) => <a key={href} href={href} className={`${horizontal ? "" : "block"} text-muted hover:text-signal`}>{label}</a>)}
    </nav>
  );
}

function DocHeading({ id, eyebrow, children }: { id: string; eyebrow?: string; children: React.ReactNode }) {
  return (
    <div className="scroll-mt-24 pt-14 first:pt-0" id={id}>
      {eyebrow && <p className="eyebrow text-signal">{eyebrow}</p>}
      <h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">{children}</h2>
    </div>
  );
}

function QuickstartSection() {
  return (
    <section>
      <DocHeading id="quickstart" eyebrow="START HERE">Quickstart</DocHeading>
      <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted">The fastest path for an agent is hosted MCP. If you are calling Brandrail from an application, the REST quickstart compiles a live website and renders the first asset set in two requests.</p>
      <div className="mt-7 grid gap-px border border-hairline bg-hairline sm:grid-cols-4">
        {[
          ["01", "Create a key", "Verify your email and mint one scoped connection."],
          ["02", "Verify the client", "Run the live probe, then read usage and brands."],
          ["03", "Ask for a plan", "“Compile https://acme.com and plan our launch.”"],
          ["04", "Approve visibly", "Inspect the exact run plan in Brandrail before rendering."],
        ].map(([number, title, body]) => <div key={number} className="bg-ink p-4"><span className="font-mono text-[9px] text-signal">{number}</span><h3 className="mt-3 font-display text-sm font-bold">{title}</h3><p className="mt-1 text-xs leading-relaxed text-muted">{body}</p></div>)}
      </div>
      <McpSetupGuide endpoint="https://playground.brandrail.dev/api/mcp" />
      <p className="mt-6 font-mono text-[10px] uppercase tracking-[.12em] text-muted">REST IN TWO REQUESTS</p>
      <CopyCode label="cURL quickstart">{REST_QUICKSTART}</CopyCode>
    </section>
  );
}

function AuthSection() {
  return (
    <section>
      <DocHeading id="auth" eyebrow="IDENTITY + SCOPE">Auth &amp; keys</DocHeading>
      <p className="mt-4 text-[15px] leading-relaxed text-muted">Every verified workspace can mint one free, revocable key in <a href="/dashboard#agent" className="text-signal hover:text-bone">Workspace → Agent connection</a>. Send it as <code className="text-bone">Authorization: Bearer</code> or <code className="text-bone">x-api-key</code>. Each key is bound to one workspace, an expiry and explicit scopes.</p>
      <div className="mt-5 grid gap-px border border-hairline bg-hairline sm:grid-cols-4">
        {[['brands:read', 'Inspect BrandSpecs'], ['plans:write', 'Create dry plans'], ['assets:render', 'Create gated assets'], ['brands:write', 'Change BrandSpecs and template families'], ['publish:schedule', 'Schedule approved work'], ['publish:immediate', 'Publish approved work now; requires schedule scope too']].map(([scope, meaning]) => <div key={scope} className="bg-panel p-4"><code className="font-mono text-[10px] text-green">{scope}</code><p className="mt-2 text-xs text-muted">{meaning}</p></div>)}
      </div>
      <p className="mt-4 border-l-2 border-signal pl-4 text-sm leading-relaxed text-muted">Account, billing, credential and channel-connection controls always require a browser session. An agent key cannot take over the workspace owner’s identity.</p>
    </section>
  );
}

function TemplatesSection() {
  return (
    <section>
      <DocHeading id="templates" eyebrow="AUTO + CONTROL">Hybrid templates</DocHeading>
      <p className="mt-4 text-[15px] leading-relaxed text-muted">Use <strong className="text-bone">auto</strong> to let Brandrail art-direct a varied campaign, pass one stable <code className="text-bone">template</code> ID everywhere, or provide a <code className="text-bone">templates</code> plan for selected formats. Designs publish named text and image fields. Image choices are indexes from the approved BrandSpec library—arbitrary URLs are rejected—while colors, type, spacing, logo, crops and treatments remain locked. Photo-led templates stay unavailable until the BrandSpec contains enough approved imagery, so an empty image zone can never reach a render.</p>
      <div className="mt-6 grid gap-px border border-hairline bg-hairline sm:grid-cols-5">
        {[['AUTO MIX', 'Best-fit template per format and carousel slide.'], ['ONE TEMPLATE', 'One explicit composition across requested formats.'], ['CHANNEL PLAN', 'Direct selected formats; omitted formats stay automatic.'], ['SAVED LOOK', 'Reuse approved visual decisions with fresh campaign copy.'], ['CUSTOM FAMILY', 'Select an immutable workspace or brand template version.']].map(([title, body]) => <div key={title} className="bg-panel p-4"><span className="font-mono text-[9px] text-signal">{title}</span><p className="mt-2 text-xs leading-relaxed text-muted">{body}</p></div>)}
      </div>
      <CopyCode label="Template + named fields">{`curl -X POST https://api.brandrail.dev/v0/render \\
  -H "Authorization: Bearer brk_…" \\
  -H "content-type: application/json" \\
  -d '{
    "brand":"acme",
    "brief":"Summer promotion",
    "formats":["li-image"],
    "template":"promo-card",
    "modifications":[
      {"format":"li-image","name":"badge","text":"-20%"},
      {"format":"li-image","name":"hook","text":"Summer starts here"}
    ]
  }'`}</CopyCode>
      <CopyCode label="Per-format template plan">{`{
  "brand": "acme",
  "brief": "Launch the summer collection",
  "templates": {
    "story": "cta-card",
    "og-image": "announcement"
  }
}`}</CopyCode>
      <CopyCode label="Approved image field">{`{
  "brand": "acme",
  "brief": "Summer product offer",
  "formats": ["x-graphic"],
  "template": "promo-card",
  "media": [
    {"format":"x-graphic","name":"primary","photoIndex":0}
  ]
}`}</CopyCode>
      <CopyCode label="Reusable saved-look file">{`{
  "id": "weekly-launch",
  "name": "Weekly launch",
  "templates": {
    "ig-carousel": "hero-statement",
    "story": "cta-card",
    "li-image": "split-stat"
  },
  "media": [
    {"format":"story","name":"primary","photoIndex":0}
  ]
}`}</CopyCode>
      <p className="mt-4 text-sm leading-relaxed text-muted">Save a finished visual plan as a <strong className="text-bone">saved look</strong> from Studio. The API field remains <code className="text-bone">recipe</code> for compatibility. Saved looks live in <code className="text-bone">composition.recipes</code> and preserve template and approved-image decisions—not old campaign copy.</p>
      <div className="mt-8 border border-hairline bg-panel p-5"><p className="eyebrow text-green">USER-OWNED VISUALS</p><h3 className="mt-2 font-display text-xl font-bold">Template families are safe data, not executable pages</h3><p className="mt-3 text-sm leading-relaxed text-muted">Open <a href="/templates" className="text-signal">Visual templates</a> to duplicate any system template, drag and size normalized text/image/logo/shape/data zones, edit layer properties, attach locked artwork per format, inspect immutable history, restore an older layout as a new draft, preflight, publish, and render a production proof. Families are scoped to the workspace or one brand. Drafts and published families are manual-only by default; automatic planning requires a separate explicit <code className="text-bone">autoEligible</code> publication with all five canvases.</p><p className="mt-3 text-sm leading-relaxed text-muted">Uploads accept PNG, JPEG, and WebP up to 12 MB or sanitized static SVG up to 2 MB. Raster dimensions are capped at 8192 px and 40 megapixels, and ownership is recorded per workspace. Scripts, animations, HTML/CSS/JS, event handlers, foreign objects, external references, cross-workspace blob reuse, and caller-supplied compliance reports are rejected. Published and archived history cannot be hard-deleted. A future Figma exporter should emit this same strict JSON plus frozen assets; generic Figma or arbitrary web-page import would weaken determinism and safety.</p></div>
      <CopyCode label="Render a published family">{`{
  "brand": "acme",
  "brief": "Launch the approved workflow",
  "templateRef": {"source":"brand","id":"launch-frame","version":3},
  "formats": ["li-image"]
}`}</CopyCode>
    </section>
  );
}

function ContentProgramsSection() {
  return (
    <section>
      <DocHeading id="programs" eyebrow="ONGOING OUTCOME">Content programs</DocHeading>
      <p className="mt-4 text-[15px] leading-relaxed text-muted">A Content Program stores the strategy behind ongoing production: objective, audience, product facts, pillars, offer, important dates, cadence, timezone, posting time, channels and approval mode. Brandrail plans the full one- or four-week horizon for coherence, but renders only the next week so later unlocked work can adapt to approvals and performance. The free workspace can edit, lock, replace and export the full calendar without spending an asset.</p>
      <div className="mt-6 grid gap-px border border-hairline bg-hairline sm:grid-cols-3">
        {[
          ["PREVIEW", "Plans dated ideas for the full horizon. Saves nothing and renders nothing."],
          ["RUN", "Produces the next week, creates the review batch and prepares native copy and matching visuals for each selected channel—or every connected channel when none are specified."],
          ["REPEAT", "Keeps the strategy stable while refreshing angles with recent performance."],
        ].map(([title, body]) => <div key={title} className="bg-panel p-4"><span className="font-mono text-[9px] text-signal">{title}</span><p className="mt-2 text-xs leading-relaxed text-muted">{body}</p></div>)}
      </div>
      <CopyCode label="Preview, then activate with the SDK">{`const input = {
  brand: "acme",
  objective: "Own the category before our September launch",
  audience: "Operations leaders at growing teams",
  pillars: ["Proof", "Education", "Product"],
  offer: "Start a 14-day trial",
  perWeek: 3,
  horizonWeeks: 4 as const,
  approvalMode: "review" as const,
};

const preview = await brandrail.previewContentProgram(input);
// inspect preview.posts — no assets have been rendered

const program = await brandrail.saveContentProgram({
  ...input,
  plannedPosts: preview.posts,
});
await brandrail.runContentProgram(program.brand);`}</CopyCode>
      <p className="mt-4 border-l-2 border-signal pl-4 text-sm leading-relaxed text-muted"><strong className="text-bone">Review is the safe default.</strong> Auto mode is accepted only when selected explicitly and at least one chosen publishing channel is connected. Pausing or deleting a program never removes existing assets, reviews or scheduled work.</p>
    </section>
  );
}

function McpSection() {
  return (
    <section>
      <DocHeading id="mcp" eyebrow="AGENT-NATIVE">MCP server</DocHeading>
      <p className="mt-4 text-[15px] leading-relaxed text-muted">The hosted Streamable HTTP endpoint exposes {MCP_TOOL_COUNT} lifecycle tools and inspectable PNG resources: brands, content programs, durable runs, planning, rendering, campaigns, review pauses, scoped publishing, calendar, analytics, usage and audit.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <article className="border border-hairline bg-panel p-5"><p className="eyebrow text-green">REMOTE</p><h3 className="mt-2 font-display text-lg font-bold">Hosted Streamable HTTP</h3><p className="mt-2 text-sm leading-relaxed text-muted">No local process. Best for clients that support remote MCP and persistent credentials.</p></article>
        <article className="border border-hairline bg-panel p-5"><p className="eyebrow text-signal">LOCAL</p><h3 className="mt-2 font-display text-lg font-bold">Local stdio server</h3><p className="mt-2 text-sm leading-relaxed text-muted">Claude Desktop and Claude Code can run the source-built MCP package against cloud or self-hosted APIs.</p></article>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-muted">Rendered PNGs return as MCP resource links with inline previews. Default credentials can list and preflight template families, apply a saved look, choose system templates, and change named render fields. Duplicating, publishing, or archiving a durable template family requires the separate <code className="text-bone">brands:write</code> permission. Durable run IDs survive disconnects. Exact plans are approved only in the workspace, and agent delivery requires the approved review item, render, channel-specific copy and files.</p>
      <div className="mt-6 overflow-hidden border border-hairline">
        {[
          ["DEFAULT KEY", "Observe · dry-plan · render", "No BrandSpec changes, review mutations, channel access, or delivery"],
          ["WORKFLOW OPT-IN", "Campaign and review scopes", "Create batches and advance durable work; humans still own decisions"],
          ["DELIVERY OPT-IN", "Channel, calendar, and schedule scopes", "Only approved review items can be delivered"],
          ["IMMEDIATE OPT-IN", "publish:immediate + delivery scopes", "Allows an approved item to publish now instead of entering the future calendar"],
        ].map(([level, ability, boundary]) => <div key={level} className="grid gap-2 border-b border-hairline-soft bg-panel p-4 last:border-b-0 sm:grid-cols-[135px_1fr_1.35fr]"><span className="font-mono text-[9px] text-signal">{level}</span><strong className="text-sm text-bone">{ability}</strong><span className="text-xs leading-relaxed text-muted">{boundary}</span></div>)}
      </div>
      <div className="mt-6 border-l-2 border-green pl-4 text-sm leading-relaxed text-muted"><strong className="text-bone">First successful run:</strong> create a default key → complete the live probe → call <code className="text-bone">get_usage</code> and <code className="text-bone">list_brands</code> → start a durable run → approve its exact plan in the workspace → poll the run → render one reversible asset.</div>
      <p className="mt-4 text-xs leading-relaxed text-muted">Approval stays bound to the run&apos;s brand, objective, maximum asset count, channels, delivery time, review batch, render lineage, reviewed copy and files. If one changes, Brandrail returns a precise mismatch error instead of weakening the gate. Approved agent deliveries cannot be edited after scheduling; cancel them and create a newly approved run.</p>
      <div className="mt-5 border-l-2 border-green pl-4 text-sm leading-relaxed text-muted"><span className="font-mono text-[10px] text-green">OPENCLAW READY</span><br />Save the remote server with <code className="text-bone">openclaw mcp set</code>, keep the key in <code className="text-bone">BRANDRAIL_API_KEY</code>, then run <code className="text-bone">openclaw mcp doctor brandrail --probe</code>. No Brandrail-specific adapter is required.</div>
    </section>
  );
}

function ApiSection() {
  return (
    <section>
      <DocHeading id="api" eyebrow="HTTP + JSON">REST API</DocHeading>
      <p className="mt-4 text-[15px] leading-relaxed text-muted">Versioned under <code className="text-bone">/v0</code>. The core surface below covers the normal lifecycle; the SDK exposes the same operations with typed inputs and errors.</p>
      <CopyCode label="Core REST routes">{API_SURFACE}</CopyCode>
      <p className="mt-4 text-sm leading-relaxed text-muted">Render requests that violate the active BrandSpec return <code className="text-bone">422</code> with structured violations. They never return a silently degraded image.</p>
      <div className="mt-5 flex flex-wrap gap-3"><a href="https://api.brandrail.dev/openapi.json" className="btn-ghost">OpenAPI 3.1 contract →</a><a href="https://api.brandrail.dev/health/ready" className="btn-ghost">API readiness →</a></div>
    </section>
  );
}

function SdkSection() {
  return (
    <section>
      <DocHeading id="sdk" eyebrow="TYPESCRIPT">SDK</DocHeading>
      <p className="mt-4 text-[15px] leading-relaxed text-muted"><code className="text-bone">@brandrail/sdk</code> provides typed methods for specs, renders, content programs, agent runs, review, scheduling, campaigns, usage and analytics. Until the first npm release, import it from a source checkout.</p>
      <CopyCode label="TypeScript SDK">{SDK_EXAMPLE}</CopyCode>
    </section>
  );
}

function CliSection() {
  return (
    <section>
      <DocHeading id="cli" eyebrow="HUMANS + AUTOMATION">CLI</DocHeading>
      <p className="mt-4 text-[15px] leading-relaxed text-muted">The CLI is designed for both operators and agents: machine-readable JSON, stable exit codes and explicit dry-runs. Build it from the repository until the public package ships.</p>
      <CopyCode label="CLI from source">{CLI_EXAMPLE}</CopyCode>
    </section>
  );
}

function PublishingSection() {
  return (
    <section>
      <DocHeading id="publishing" eyebrow="CHANNEL READINESS">Publishing</DocHeading>
      <p className="mt-4 text-[15px] leading-relaxed text-muted">Brandrail renders for every supported format. Direct delivery depends on the channel credentials available to your workspace, and the agent publish gate stays closed until the exact item is approved.</p>
      <div className="mt-6 grid gap-px border border-hairline bg-hairline sm:grid-cols-2">
        <div className="bg-panel p-5"><p className="eyebrow text-green">READY WITHOUT APP REVIEW</p><h3 className="mt-2 font-display text-lg font-bold">Bluesky + Mastodon</h3><p className="mt-2 text-sm leading-relaxed text-muted">Connect account credentials, dry-run the delivery and schedule approved items from the same run.</p></div>
        <div className="bg-panel p-5"><p className="eyebrow text-signal">PLATFORM CREDENTIALS REQUIRED</p><h3 className="mt-2 font-display text-lg font-bold">LinkedIn, Meta, X + TikTok</h3><p className="mt-2 text-sm leading-relaxed text-muted">Use your registered platform app and scopes. Until connected, Brandrail still renders the correct export package for manual publishing.</p></div>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-muted">Agents can inspect connected channels, dry-run <code className="text-bone">/v0/publish</code>, schedule the exact reviewed copy and files, and read delivery state without bypassing the human review boundary. Channels with different approved copy use separate calls. Once scheduled, agent delivery is immutable; cancel and approve a new run to change its copy or time.</p>
    </section>
  );
}

function BrandSpecSection() {
  return (
    <section>
      <DocHeading id="spec" eyebrow="THE PORTABLE PRIMITIVE">The BrandSpec</DocHeading>
      <p className="mt-4 text-[15px] leading-relaxed text-muted">A versioned, diffable JSON document describing identity, composition, imagery, voice and judgment. The MIT-licensed <code className="text-bone">@brandrail/spec</code> schema is portable: export it, fork it, review changes in git and use it outside Brandrail.</p>
      <div className="mt-6 grid gap-px border border-hairline bg-hairline sm:grid-cols-2">
        {[
          ["Identity", "Color roles, typography, logo assets and clearspace"],
          ["Composition", "Grid, hierarchy, density and whitespace"],
          ["Imagery", "Pinned photos, crop rules and generative fences"],
          ["Voice", "Tone, banned phrases, emoji and CTA budgets"],
        ].map(([title, body]) => <div key={title} className="bg-panel p-4"><h3 className="font-display text-sm font-bold">{title}</h3><p className="mt-1 text-xs text-muted">{body}</p></div>)}
      </div>
    </section>
  );
}

function ErrorsSection() {
  const errors = [
    ["401", "Missing, invalid or expired credential"],
    ["403", "Plan, workspace, scope or human-session gate"],
    ["409", "Run or approval state conflicts with the action"],
    ["422", "Structured BrandSpec or render violation"],
    ["429", "Workspace allowance or rate limit reached"],
  ];
  return (
    <section>
      <DocHeading id="errors" eyebrow="FAIL CLOSED">Errors &amp; safety</DocHeading>
      <p className="mt-4 text-[15px] leading-relaxed text-muted">Errors are explicit and machine-readable. Tool failures include a stable code where recovery depends on it, plus fields such as <code className="text-bone">requiredScope</code>, <code className="text-bone">requiredPlan</code>, <code className="text-bone">nextAction</code>, and the request ID when available. Agents should dry-run first, preserve returned IDs, and resume durable state instead of repeating mutations. Operators can poll <code className="text-bone">/v0/me/operations</code> for failed, overdue, stuck, disconnected, expired, or exhausted workflow signals.</p>
      <div className="mt-5 overflow-hidden border border-hairline">
        {errors.map(([code, meaning]) => <div key={code} className="grid grid-cols-[58px_1fr] border-b border-hairline-soft last:border-b-0"><code className="border-r border-hairline bg-panel p-3 text-center font-mono text-xs text-signal">{code}</code><span className="p-3 text-sm text-muted">{meaning}</span></div>)}
      </div>
      <ul className="mt-5 space-y-2 text-sm leading-relaxed text-muted">
        <li><span className="mr-2 text-green">✓</span>Use dry-runs before publishing or scheduling.</li>
        <li><span className="mr-2 text-green">✓</span>Reuse idempotency keys when retrying a delivery request.</li>
        <li><span className="mr-2 text-green">✓</span>Store run, render, batch and approval IDs as durable references.</li>
        <li><span className="mr-2 text-green">✓</span>Deliver the exact reviewed copy and files; use separate calls for channel-specific variants.</li>
        <li><span className="mr-2 text-green">✓</span>Cancel and re-approve instead of editing an approved agent delivery.</li>
      </ul>
    </section>
  );
}

function SelfHostSection() {
  return (
    <section>
      <DocHeading id="selfhost" eyebrow="OPEN RAILS">Self-hosting</DocHeading>
      <p className="mt-4 text-[15px] leading-relaxed text-muted">The app and operating rails are AGPL. Clone the public and engine repositories as siblings, install each workspace, and point the app at the local engine. Development can run without API auth; Postgres, Stripe, email and publishing providers remain optional. Hosted production fails closed unless its durable storage, secrets, image generation and billing configuration are ready.</p>
      <div className="mt-5 flex flex-wrap gap-3"><a href="https://github.com/apwn/brandrail/blob/main/DEPLOY.md" className="btn-ghost">Open deployment guide →</a><a href="https://github.com/apwn/brandrail" className="btn-ghost">View the repository</a></div>
    </section>
  );
}

function ReleaseStatus() {
  return (
    <aside className="mt-14 border border-signal/50 bg-panel p-5 sm:p-6" aria-label="Release status">
      <p className="eyebrow text-bone">HONEST STATUS</p>
      <p className="mt-2 text-sm leading-relaxed text-muted">The hosted MCP and REST surfaces are the primary connection paths. The <code className="text-bone">@brandrail/mcp</code>, <code className="text-bone">brandrail</code> CLI and <code className="text-bone">@brandrail/sdk</code> npm packages ship with the first public release; until then, run them from the repository. Bluesky and Mastodon work without platform app review. LinkedIn, Instagram, Facebook, X and TikTok require app registration on your instance.</p>
    </aside>
  );
}

function DocsFooter() {
  return <PublicFooter note="Hosted MCP and REST are available now · SDK and CLI packages are pre-release" />;
}
