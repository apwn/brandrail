# Brandrail operations and recovery

This is the production drill sheet for the agent, review, and publishing rail. Run it against a dedicated workspace and non-public provider accounts.

## Signals and alerts

- Probe `GET /health/ready` every minute. Alert after two consecutive failures; page immediately when storage, durable storage, production secrets, background workers, or the publishing media bridge is false.
- Probe the hosted MCP initialize + `tools/list` flow every five minutes with a minimal expiring credential. Alert after three failures.
- Read `GET /v0/me/operations` for launch-test and internal workspaces. Alert when `attentionRequired > 0`, a delivery is overdue, publishing is stuck for 15 minutes, a channel credential expires within seven days, or a webhook is exhausted.
- Alert when the scheduler reports any failed post, when webhook dead-letter count grows, or when no scheduler heartbeat is observed for five minutes.
- Send PostHog conversion events to an activation dashboard: onboarding viewed → step clicked → agent key created → probe completed → run created → plan approved → render completed. Segment failures by action, never by customer content.
- Keep `x-request-id`, workspace id, actor type, credential id, path, status, and duration in searchable logs. Never log API keys, provider tokens, review copy, or signed media URLs.

## Provider launch matrix

For Bluesky, Mastodon, LinkedIn, X, Facebook Pages, Instagram Professional, and TikTok, record the test date, app id, approved scopes, test account, operator, and result for each step:

1. Connect through the production UI and verify the resolved account/handle.
2. Let an access token enter its refresh window and confirm refresh-token rotation where supported.
3. Dry-run one reviewed item and verify exact copy, files, channel, and time.
4. Schedule to a private/test destination; confirm the calendar, audit record, provider post id, and public URL.
5. Cancel a future post and prove the scheduler never sends it. A published post is not remotely deleted by Brandrail.
6. Disconnect the channel after scheduling another test; tick the scheduler and confirm an explicit failed result plus `post.failed` webhook.
7. Revoke the provider token; confirm failure is visible, reconnect, then retry through a newly approved run.
8. For Instagram and TikTok, fetch the short-lived signed media URL from the provider path and confirm expiry and cross-workspace rejection.

Do not mark a provider live from mocked tests alone. Remove its app credentials if any production drill fails.

## Recovery drills

- **Expired agent key:** request returns `401 API key expired`; replace the credential and repeat the MCP probe.
- **Expired provider token:** delivery fails visibly; reconnect the channel. Never silently fall back to another account.
- **Disconnected channel:** due work becomes failed with `channel is missing or disconnected`; create a new reviewed delivery after reconnecting.
- **Provider outage:** preserve the failed post and exact per-channel error. Do not auto-create duplicate posts.
- **Stuck publishing:** Postgres reclaim can retry a stale claim after ten minutes. Investigate before manual replay and reuse the original idempotency key.
- **Webhook outage:** exponential retry continues to eight attempts; use the dashboard retry only after the receiver is healthy.
- **Worker outage:** stop accepting a healthy readiness state, restore the worker, then inspect overdue work before ticking.
- **Credential-key loss:** restore the previous `CREDENTIALS_KEY` from secrets management. Do not rotate it without a migration.

## Weekly review

Review activation drop-off, failed/overdue deliveries, plan conflicts, expired credentials, dead webhooks, provider error rates, render violations, allowance failures, and the ten slowest request ids. Assign every repeated failure either a product fix, clearer recovery copy, or an operational owner.
