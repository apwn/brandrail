/** Minimal, honest developer docs — enough to go from zero to a working
 * integration on one page. The deep reference lives in the repo READMEs. */
export const metadata = { title: "Brandrail docs" };

function Code({ children }: { children: string }) {
  return <pre className="panel mt-3 p-4 font-mono text-[12.5px] text-bone overflow-x-auto whitespace-pre">{children}</pre>;
}

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="font-display font-bold text-2xl mt-14 scroll-mt-24">
      {children}
    </h2>
  );
}

export default function Docs() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <header className="flex items-center gap-3">
        <div className="rail w-10" aria-hidden />
        <a href="/" className="font-display font-bold text-lg tracking-tight">brandrail</a>
        <span className="eyebrow mt-[2px]">DOCS</span>
        <a href="/agents" className="eyebrow text-muted hover:text-bone ml-auto">FOR AGENT BUILDERS →</a>
      </header>

      <nav className="panel p-4 mt-10 flex flex-wrap gap-x-5 gap-y-1 font-mono text-xs">
        {[["#quickstart", "quickstart"], ["#auth", "auth"], ["#api", "REST API"], ["#mcp", "MCP"], ["#cli", "CLI"], ["#spec", "BrandSpec"], ["#selfhost", "self-host"]].map(([href, label]) => (
          <a key={href} href={href} className="text-muted hover:text-signal">{label}</a>
        ))}
      </nav>

      <H2 id="quickstart">Quickstart</H2>
      <p className="text-muted text-sm mt-3 leading-relaxed">
        Compile a brand from a URL, then render on-brand assets from any brief. Two calls.
      </p>
      <Code>{`# 1. compile — URL in, BrandSpec out (fonts + photos pinned)
curl -X POST https://api.brandrail.dev/v0/compile \\
  -H "x-api-key: brk_…" -H "content-type: application/json" \\
  -d '{"url": "https://acme.com"}'

# 2. render — brief in, 5 social formats out (deterministic)
curl -X POST https://api.brandrail.dev/v0/render \\
  -H "x-api-key: brk_…" -H "content-type: application/json" \\
  -d '{"brand": "acme", "brief": "Summer promotion"}'`}</Code>

      <H2 id="auth">Auth &amp; keys</H2>
      <p className="text-muted text-sm mt-3 leading-relaxed">
        Every verified workspace can mint one free key in <a href="/dashboard#agent" className="text-signal">workspace → Agent connection</a> after
        email verification. Send as <code className="text-bone">x-api-key</code> or{" "}
        <code className="text-bone">Authorization: Bearer</code>. A key scopes every call to your workspace — your
        brands, your renders, your meter.
      </p>

      <H2 id="api">REST API</H2>
      <p className="text-muted text-sm mt-3 leading-relaxed">The surface is small and boring on purpose:</p>
      <Code>{`POST /v0/compile              url → BrandSpec (versioned, pinned)
GET  /v0/specs                your brands
GET  /v0/specs/:brand         one spec (?version=N for history)
PATCH /v0/specs/:brand        edit → new version
POST /v0/render               {brand, brief, formats?, archetype?} → assets + ranked artDirection
POST /v0/agent/plan           dry-run objective → blockers + execution steps
GET  /v0/renders              saved render history
GET  /v0/renders/:id          manifest + asset URLs
POST /v0/brands/:brand/background  generate + pin brand imagery
POST /v0/batches              many briefs → review queue
GET  /v0/batches/:id/status   resumable approval state
POST /v0/plan                 AI planner: brand → proposed briefs
POST /v0/publish              text + images → connected channels
GET  /v0/scheduled            calendar posts + delivery state
GET  /v0/campaigns            campaign workspaces + live progress
POST /v0/campaigns            objective + linked brands/batches/posts
GET  /v0/analytics            channel, post and six-month performance
POST /v0/analytics/refresh    pull fresh metrics from connected networks
GET  /v0/me/audit             human + agent mutation log
GET  /v0/me/webhooks          signed event subscriptions
GET  /v0/reports/:brand       white-label HTML report`}</Code>
      <p className="text-muted text-sm mt-3 leading-relaxed">
        Renders that would violate the spec return <code className="text-bone">422</code> with structured violations —
        never a degraded image.
      </p>

      <H2 id="mcp">MCP server</H2>
      <p className="text-muted text-sm mt-3 leading-relaxed">
        The hosted Streamable HTTP MCP endpoint exposes 29 lifecycle tools plus inspectable PNG resources:
        brands, durable runs, dry-run planning, deterministic rendering, campaigns, review pauses, scoped publishing,
        calendar, analytics, usage and audit. Credentials are expiring and least-privilege; immediate publishing is opt-in.
      </p>
      <Code>{`{
  "mcpServers": {
    "brandrail": {
      "type": "http",
      "url": "https://playground.brandrail.dev/api/mcp",
      "headers": { "Authorization": "Bearer brk_…" }
    }
  }
}`}</Code>

      <H2 id="cli">CLI</H2>
      <p className="text-muted text-sm mt-3 leading-relaxed">
        Before the first npm release, clone and build the repo, then run the CLI directly:
      </p>
      <Code>{`pnpm install && pnpm build
node packages/cli/dist/index.js compile https://acme.com
node packages/cli/dist/index.js render "Summer promotion" --brand acme --json
node packages/cli/dist/index.js agent plan "Launch campaign" --brand acme --json
node packages/cli/dist/index.js agent start "Launch campaign" --brand acme --json
node packages/cli/dist/index.js agent list --json
node packages/cli/dist/index.js review status batch_123 --json
node packages/cli/dist/index.js spec diff acme@1 acme@2
node packages/cli/dist/index.js channels
node packages/cli/dist/index.js schedule "Launch day" --channels ch_123 --at 2026-08-01T15:00:00Z --dry-run
node packages/cli/dist/index.js reschedule sp_123 --at 2026-08-02T15:00:00Z
node packages/cli/dist/index.js usage --json
node packages/cli/dist/index.js campaign create --name "Q3 launch" --objective "Generate 20 demos"
node packages/cli/dist/index.js analytics --refresh
# exit codes: 0 ok · 2 spec violation · 3 low confidence`}</Code>

      <H2 id="spec">The BrandSpec</H2>
      <p className="text-muted text-sm mt-3 leading-relaxed">
        A versioned, diffable JSON document — identity (colors/type/logo), composition rules, imagery (pinned photos,
        AI fences), voice (tone, banned words), and judgment. MIT-licensed schema:{" "}
        <code className="text-bone">@brandrail/spec</code>. Your spec is yours — export it, fork it, take it elsewhere.
      </p>

      <H2 id="selfhost">Self-hosting</H2>
      <p className="text-muted text-sm mt-3 leading-relaxed">
        The rails are AGPL. Clone, <code className="text-bone">pnpm install</code>, add an OpenRouter key (and optionally
        a fal.ai key for generative backgrounds), <code className="text-bone">pnpm dev</code>. Dev mode needs no API key;
        Postgres and Stripe are optional env vars. Full guide in the repo&rsquo;s DEPLOY.md.
      </p>

      <div className="panel p-5 mt-14 border-signal/40">
        <p className="eyebrow text-bone">HONEST STATUS</p>
        <p className="text-muted text-sm mt-2 leading-relaxed">
          npm packages (<code className="text-bone">@brandrail/mcp</code>, <code className="text-bone">brandrail</code> CLI,{" "}
          <code className="text-bone">@brandrail/sdk</code>) ship with the first public release; until then run them from
          the <a href="https://github.com/apwn/brandrail" className="text-signal">repo</a>. LinkedIn/Instagram/Facebook/X/TikTok
          publishing requires per-platform app registration on your instance; Bluesky and Mastodon work out of the box.
        </p>
      </div>
    </main>
  );
}
