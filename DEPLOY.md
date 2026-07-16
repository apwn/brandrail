# Deploying Brandrail

Brandrail is two deployables with one trust boundary:

1. `brandrail/apps/playground` — the public Next.js app, hosted MCP endpoint, account UI, and trusted browser-session proxy.
2. `brandrail-engine/services/api` — the private compiler, renderer, durable API, scheduler, billing webhook, and publishing workers.

Keep the repositories as siblings when building the engine because it links the public `@brandrail/spec` package.

## Production topology

Route `playground.brandrail.dev` to the Next.js app and `api.brandrail.dev` to the engine. The engine may be internet-reachable for scoped `brk_…` API keys, but browser identities are honored only when the request also carries the shared `INTERNAL_SECRET`. Never expose a deployment running with development authentication.

Use one managed Postgres database and a persistent engine process. The scheduler and content-program worker run in-process in production; Postgres leases and atomic claims prevent duplicate work across replicas. Start with one replica, then scale only after the readiness and delivery probes below pass.

## 1. Engine

Build from the directory containing both repositories:

```sh
docker build -f brandrail-engine/services/api/Dockerfile -t brandrail-engine:0.1.0 .
```

Required hosted environment:

```dotenv
NODE_ENV=production
BRANDRAIL_HOSTED=1
HOST=0.0.0.0
PORT=4747
DATABASE_URL=postgresql://…
INTERNAL_SECRET=<at-least-24-random-characters>
CREDENTIALS_KEY=<at-least-24-random-characters-and-kept-stable>
PUBLIC_ENGINE_URL=https://api.brandrail.dev

FAL_KEY=…
STRIPE_SECRET_KEY=…
STRIPE_WEBHOOK_SECRET=…
STRIPE_PRICE_STUDIO=price_…
STRIPE_PRICE_AGENCY=price_…
```

`INTERNAL_SECRET` must exactly match the public app. `CREDENTIALS_KEY` encrypts stored channel credentials and must survive every redeploy; losing or rotating it without a migration makes existing connections unreadable. Add provider credentials only for the networks you ship. Set `BRANDRAIL_CORS_ORIGINS` only for browser origins that call the engine directly.

Startup runs idempotent database migrations and fails closed when hosted storage, production secrets, fal.ai, the Stripe webhook, or either live price is unavailable. Configure the deployment probe as:

```text
GET https://api.brandrail.dev/health/ready
```

A launchable response is HTTP `200` with `ready: true`, `checks.storage: true`, `checks.durableStorage: true`, `checks.billing: true`, `checks.generativeImages: true`, and `checks.productionSecrets: true`. `GET /openapi.json` is the public OpenAPI 3.1 contract. Application requests emit an `x-request-id`; production logs are structured JSON keyed by the same ID.

Register the Stripe webhook at `https://api.brandrail.dev/webhooks/stripe`. At minimum, subscribe to checkout-session and customer-subscription lifecycle events used by the configured account.

## 2. Public app and hosted MCP

Deploy `brandrail/apps/playground` as a Next.js application. Required production environment:

```dotenv
NODE_ENV=production
ENGINE_URL=https://api.brandrail.dev
PUBLIC_URL=https://playground.brandrail.dev
SESSION_SECRET=<at-least-32-random-characters>
INTERNAL_SECRET=<same-value-as-engine>
RESEND_API_KEY=…
MAIL_FROM=Brandrail <hello@brandrail.dev>
```

`ENGINE_URL` and `PUBLIC_URL` are explicit and validated in production. `PUBLIC_URL` must be canonical HTTPS because it anchors magic links, OAuth redirects, billing redirects, and MCP metadata. Add `MCP_ALLOWED_ORIGINS` only for browser-based MCP clients you trust. `MCP_AUTHORIZATION_SERVERS` is optional for static bearer keys and should list issuer URLs if OAuth authorization is added.

The hosted MCP endpoint is `POST https://playground.brandrail.dev/api/mcp`. It is stateless Streamable HTTP, authenticates only scoped workspace keys, advertises 46 lifecycle tools, and exposes render assets as MCP resources.

## 3. Smoke test

Run these in order after every production deployment:

```sh
curl -fsS https://api.brandrail.dev/health/ready
curl -fsS https://api.brandrail.dev/openapi.json
curl -fsS https://playground.brandrail.dev/.well-known/oauth-protected-resource/api/mcp

export BRANDRAIL_API_KEY='brk_…'
node packages/cli/dist/index.js mcp doctor \
  --endpoint https://playground.brandrail.dev/api/mcp
```

Then use a dedicated launch-test workspace to complete the real story: list brands, compile a disposable public URL, start and approve a durable run, render one asset, create a review batch, approve it in the UI, dry-run publishing, schedule to a test channel, confirm the calendar and audit entries, and cancel the test post. Never run the delivery part against a production audience.

## 4. Package release

The public packages share one version. Before tagging:

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm test
pnpm typecheck
pnpm release:check
```

Set the repository `NPM_TOKEN`, update all four package versions together, and push the matching tag (for example `v0.1.0`). The release workflow builds, tests, validates package metadata and tag parity, then publishes with npm provenance.

## Rollback

Roll back the public app and engine independently to their previous immutable images. Do not roll back Postgres. Schema changes are additive and startup migrations are idempotent. If publishing is unhealthy, stop engine workers or remove platform credentials before rolling code back; queued posts remain durable. Preserve `CREDENTIALS_KEY`, `INTERNAL_SECRET`, database contents, and Stripe webhook configuration throughout the rollback.

## Launch gate

Do not announce general availability until all of these are true:

- Both production builds and full test suites pass from clean installs.
- `/health/ready`, `/openapi.json`, hosted MCP metadata, and an authenticated MCP doctor pass.
- Magic-link email, Stripe checkout/portal/webhook, one real render, one human review, and one test-channel delivery pass in production.
- DNS, HTTPS, backups, Postgres point-in-time recovery, log retention, uptime alerts, error alerts, and spend alerts are configured.
- npm ownership, 2FA, `NPM_TOKEN`, package version/tag parity, and provenance are confirmed.
- Platform app reviews and credentials match every network advertised as directly publishable.
