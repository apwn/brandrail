# brandrail

**AI can think. It still can't design.**

Every "AI social media" tool produces slop: generic captions, off-brand gradients, six-fingered stock photos. Brandrail is the other way around — your agents plan and write; a **deterministic, brand-locked template engine** renders; nothing ships off-brand, ever.

The core primitive is the **BrandSpec**: a portable, versionable, forkable, MIT-licensed definition of how a brand thinks visually — colors as roles, typography, logo rules, composition constraints, voice, and taste (positive/negative examples). Violations of the spec are **build errors, not warnings**.

```
website URL in
   → compiled BrandSpec (versioned, machine-readable)
   → "Summer promotion"
   → out: IG carousel · LinkedIn image · Story · X graphic · OG image
     — all perfectly branded, byte-for-byte reproducible
```

> AI didn't kill content. It killed *taste*. We think the fix isn't less automation — it's automation with a design system. Agents should be free to think and forbidden to freestyle your brand. Brandrail is the rail between the two. Open source, self-hostable, built in public. **Death to slop.**

## Quickstart

> **Pre-release:** the CLI, SDK, and MCP packages are built and tested in this repo but are not on npm yet. Clone the repo and run them from source until the first public release.

**Humans:**

```sh
git clone https://github.com/apwn/brandrail.git
cd brandrail
pnpm install && pnpm build
export BRANDRAIL_API_URL=https://api.brandrail.dev   # or your self-hosted engine

node packages/cli/dist/index.js compile acme.com
# spec    ./acme.brandspec.json
# colors  ink #101012 · paper #FFFFFF · signal #FF4D00
# type    Space Grotesk / Inter

node packages/cli/dist/index.js render "Summer promotion" --brand acme --out ./assets
# 8 assets · acme v1 · 0 violations
```

**Agents (MCP):**

```sh
claude mcp add brandrail -e BRANDRAIL_API_URL=https://api.brandrail.dev -- node packages/mcp/dist/index.js
```

Then ask your agent: *"compile acme.com and render a summer promotion."* The MCP server exposes the same 29-tool lifecycle locally and remotely: BrandSpecs, visible render output, durable runs, review pauses, scoped publishing, calendar, analytics and audit. See [`packages/mcp/README.md`](packages/mcp/README.md).

**Programmatic:**

```ts
import { Brandrail } from "@brandrail/sdk";

const api = new Brandrail();
const { spec } = await api.compile("acme.com");
const { assets } = await api.render(spec.meta.name, "Summer promotion");
```

**Playground:** paste your website → compile its BrandSpec, give it one brief, and render five social formats. `apps/playground`, or the hosted one at playground.brandrail.dev.

## What's in this repo

| Package | What |
|---|---|
| [`packages/spec`](packages/spec) | **BrandSpec v0.1** — schema, TS types, validators, semantic differ, forker, canonical serializer. The format is the standard; read [`SPEC.md`](packages/spec/SPEC.md). |
| [`packages/sdk`](packages/sdk) | TypeScript API client |
| [`packages/cli`](packages/cli) | `brandrail` CLI (compile · render · spec diff · spec fork), `--json` for machines |
| [`packages/mcp`](packages/mcp) | MCP server for agents (stdio + HTTP) |
| [`apps/playground`](apps/playground) | The web playground |

The rendering/compiling engine runs server-side (`RENDER_API_URL`); everything a developer embeds, vendors, or ships lives here. The four `packages/*` are **MIT** (embed them anywhere); the app/rails are **AGPL-3.0** — see [`LICENSING.md`](LICENSING.md). **Templates consume BrandSpec tokens only** — hardcoded design values are lint errors — and the same spec + copy produces byte-identical PNGs, enforced in CI.

## Templates

Ten hand-designed, rationale-documented archetypes — `hero-statement`, `cta-card`, `split-stat`, `quote`, `list-3`, `promo-card`, `feature-grid`, `testimonial`, `announcement`, `before-after` — each rendered across all five formats and each verified by a vision-model art-director gate ("would a designer sign this?"). Every one consumes BrandSpec tokens only; hardcoded design values are lint errors.

Richness that reads like a designer made it: **brand photo zones** (harvested from your site, saliency-cropped so the subject survives), **offer badges**, **CTA chips**, **star ratings**, and **scan-to-shop QR codes** — all token-locked and contrast-safe. Photos never sit under text, so the on-brand guarantee holds. The playground's **studio** lets you swap the template or edit the words on any post and re-render it live.

## Why deterministic?

Because review speed is the product. When the design layer is guaranteed, a human reviewing 100 posts across 10 clients is checking *judgment*, not *design* — which is what makes sub-second-per-post review possible at all. And because your brand is not a suggestion: contrast, density, whitespace, logo clearspace, banned words, emoji budgets — all enforced at render time with structured `SpecViolationError`s.

## Principles

1. **The spec is portable.** MIT-licensed format, git-native (a brand refresh is a PR), forkable (agency master → per-client children with lineage).
2. **Deterministic by default, generative inside fences.** Text, layout, type and color are never hallucinated.
3. **Violations are build errors.** No degraded output, ever.
4. **Agents are first-class users.** MCP + CLI from day one; token-cheap output; stable exit codes (0 ok · 2 violation · 3 low-confidence compile).

## Development

```sh
pnpm install
pnpm build     # builds spec → sdk → cli → mcp
pnpm test      # spec test suite
```

The playground and packages expect an engine at `BRANDRAIL_API_URL` (default `http://localhost:4747` in dev).

---

Open-core — MIT packages, AGPL-3.0 app ([`LICENSING.md`](LICENSING.md)) · built in public · **on-brand, on autopilot**
