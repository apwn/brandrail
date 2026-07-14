# @brandrail/mcp

The Brandrail MCP server. Gives any MCP-capable agent the full controlled content lifecycle:

| Tool | What it does | Comes back |
|---|---|---|
| `compile_brand(url)` | website → stored BrandSpec | ~150-token summary + low-confidence fields |
| `list_templates()` | the 10 brand-locked templates + what each is best for | readable list (~250 tokens) |
| `render_assets(brand, brief, formats?, archetype?)` | brief → finished brand-locked PNGs on disk | file paths (~100 tokens) |
| `get_spec(brand, version?)` | fetch the full spec | canonical JSON (~600–1200 tokens) |
| `diff_spec(brand, from, to)` | semantic diff between versions | readable diff (~50–200 tokens) |
| `list_brands()` | inspect workspace brands | names + versions |
| `plan_campaign(objective, …)` | dry-run before mutation | blockers + execution steps |
| `list_channels()` | inspect connected destinations | scoped channel IDs |
| `create_review_batch(items)` | render and pause for a human | stateful review batch |
| `get_review_status(batchId)` | resume after approval | approved IDs + flagged notes |
| `list_campaigns()` | inspect campaign progress | live production metrics |
| `schedule_post(…)` | dry-run/schedule/publish safely | delivery state |
| `list_calendar()` | inspect content delivery | scheduled + published posts |
| `get_analytics()` | close the feedback loop | reach + engagement insight |
| `get_audit_log()` | inspect mutations | actor + route + status |

`render_assets` auto-picks a fitting mix of templates across the 5 formats; pass `archetype` (from `list_templates`) to force one.

Spec violations fail loudly with structured errors — the agent never receives a degraded render.

Publishing is also fail-closed: an agent must supply an approved batch item or `confirm=true` after explicit user confirmation. Use `dryRun=true` first.

## Hosted remote MCP

The hosted app exposes a stateless Streamable HTTP endpoint at `https://playground.brandrail.dev/api/mcp`. Authenticate with `Authorization: Bearer brk_…`. Mint one free connection in the workspace control room.

## Claude Desktop / Claude Code

```json
{
  "mcpServers": {
    "brandrail": {
      "command": "npx",
      "args": ["-y", "@brandrail/mcp"],
      "env": {
        "BRANDRAIL_API_URL": "https://api.brandrail.dev",
        "BRANDRAIL_API_KEY": "sk-...",
        "BRANDRAIL_OUT_DIR": "/absolute/path/for/rendered/assets"
      }
    }
  }
}
```

Claude Code: `claude mcp add brandrail -e BRANDRAIL_API_URL=https://api.brandrail.dev -- npx -y @brandrail/mcp`

## Transports

- default: stdio
- `brandrail-mcp --http [port]` — streamable HTTP (SSE) on `127.0.0.1` (default port 3845)

## Environment

| Var | Default | |
|---|---|---|
| `BRANDRAIL_API_URL` | `https://api.brandrail.dev` | the rendering API (self-hosters: your engine URL) |
| `BRANDRAIL_API_KEY` | — | not needed against a dev engine |
| `BRANDRAIL_OUT_DIR` | `./brandrail-assets` | where rendered PNGs are written |
