# @brandrail/mcp

The Brandrail MCP server. Gives any MCP-capable agent four tools:

| Tool | What it does | Comes back |
|---|---|---|
| `compile_brand(url)` | website → stored BrandSpec | ~150-token summary + low-confidence fields |
| `list_templates()` | the 10 brand-locked templates + what each is best for | readable list (~250 tokens) |
| `render_assets(brand, brief, formats?, archetype?)` | brief → finished brand-locked PNGs on disk | file paths (~100 tokens) |
| `get_spec(brand, version?)` | fetch the full spec | canonical JSON (~600–1200 tokens) |
| `diff_spec(brand, from, to)` | semantic diff between versions | readable diff (~50–200 tokens) |

`render_assets` auto-picks a fitting mix of templates across the 5 formats; pass `archetype` (from `list_templates`) to force one.

Spec violations fail loudly with structured errors — the agent never receives a degraded render.

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
