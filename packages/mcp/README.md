# @brandrail/mcp

The Brandrail MCP server. Gives compatible agents the full controlled content lifecycle through the same versioned tool registry locally and remotely:

| Tool | What it does | Comes back |
|---|---|---|
| `compile_brand(url)` | website → stored BrandSpec | ~150-token summary + low-confidence fields |
| `list_templates()` | 10 visual templates + dynamic fields + locked brand objects | readable catalog |
| `list_recipes(brand)` / `save_recipe` / `rename_recipe` / `delete_recipe` | manage reusable BrandSpec visual systems | versioned recipe state |
| `render_assets(brand, brief, formats?, recipe?, template?, templates?, modifications?, media?)` | brief + reusable or one-off visual direction → finished brand-locked PNGs | files + art direction |
| `get_brand(brand, version?)` | fetch the full spec | canonical JSON (~600–1200 tokens) |
| `diff_brand_spec(brand, from, to)` | semantic diff between versions | readable diff (~50–200 tokens) |
| `list_brands()` | inspect workspace brands | names + versions |
| `plan_campaign(objective, …)` | dry-run before mutation | blockers + execution steps |
| `start_campaign_run(…)` | create reconnect-safe campaign work | durable run ID + progress |
| `list_agent_runs()` / `get_agent_run(id)` | resume after reconnects | status + next safe step |
| `provide_agent_input` / `complete_agent_run` / `retry_agent_run` / `cancel_agent_run` | control durable work | explicit state transition |
| `list_renders()` / `get_render(id)` | retrieve render history | manifests + asset references |
| `list_channels()` | inspect connected destinations | scoped channel IDs |
| `create_review_batch(items)` | render and pause for a human | stateful review batch |
| `get_review_status(batchId)` | resume after approval | approved IDs + flagged notes |
| `add_review_comment(batchId, …)` | attach feedback without approving | comment thread |
| `list_campaigns()` | inspect campaign progress | live production metrics |
| `create_campaign()` / `update_campaign()` | manage campaign containers | linked work + performance state |
| `schedule_post(…)` | dry-run/schedule/publish safely | delivery state |
| `reschedule_post()` / `cancel_post()` | control queued delivery | updated calendar state |
| `list_calendar()` | inspect content delivery | scheduled + published posts |
| `get_analytics()` | close the feedback loop | reach + engagement insight |
| `get_usage()` | inspect plan and allowances | entitlements + remaining usage |
| `get_audit_log()` | inspect mutations | actor + route + status |

`render_assets` ranks content-compatible templates across the requested formats, composes and BrandSpec-gates the finalists, then returns semantic/visual scores, rejected alternatives, the selected intent, and rationale in `manifest.artDirection`. Pass `recipe` to reuse a visual system stored in the BrandSpec, `template` to use one design everywhere, or `templates` to direct selected formats. Pass `modifications` for named text and `media` for approved BrandSpec imagery. Arbitrary image URLs never enter the contract; all voice, media and layout gates still run.

Spec violations fail loudly with structured errors — the agent never receives a degraded render.

Publishing is also fail-closed: an agent must supply an approved batch item or `confirm=true` after explicit user confirmation. Use `dryRun=true` first.

## Hosted remote MCP

The hosted app exposes a Streamable HTTP endpoint at `https://playground.brandrail.dev/api/mcp`. Authenticate with an expiring, scoped `Authorization: Bearer brk_…` credential minted in the workspace control room. Rendered PNGs are returned as MCP resource links plus an inline preview, and durable run state survives client disconnects.

### OpenClaw

```sh
export BRANDRAIL_API_KEY='brk_…'

openclaw mcp set brandrail \
  '{"url":"https://playground.brandrail.dev/api/mcp","transport":"streamable-http","headers":{"Authorization":"Bearer ${BRANDRAIL_API_KEY}"},"connectTimeout":10,"timeout":120}'

openclaw mcp doctor brandrail --probe
```

OpenClaw uses the same hosted endpoint and scoped key as every other remote client; no adapter or gateway process is required. The environment-variable reference keeps the literal key out of the saved MCP configuration.

### Brandrail CLI diagnostics

```sh
brandrail mcp config --client openclaw
brandrail mcp doctor
```

`mcp doctor` performs an authenticated initialize handshake, verifies the core lifecycle tools, and checks inspectable resources.

## Claude Desktop / Claude Code

```json
{
  "mcpServers": {
    "brandrail": {
      "command": "npx",
      "args": ["-y", "@brandrail/mcp"],
      "env": {
        "BRANDRAIL_API_URL": "https://api.brandrail.dev",
        "BRANDRAIL_API_KEY": "brk_…",
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
