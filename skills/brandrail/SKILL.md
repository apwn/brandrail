---
name: brandrail
description: Operate Brandrail as a safe agent-native content system: compile brands, plan campaigns, render deterministic assets, pause for approval, schedule, and inspect performance.
---

# Brandrail agent workflow

Use Brandrail when the user asks for branded social content, a repeatable content campaign, approval-aware publishing, or content performance analysis.

## Safety contract

1. Start with `list_brands`. Compile only when the requested brand does not exist or the user asks to refresh it.
2. Read the BrandSpec before making brand-sensitive claims or choosing a visual direction.
3. Call `plan_campaign` before a multi-step campaign, or `start_campaign_run` when the work must survive reconnects. A durable run always pauses at `confirm_plan`; direct the user to the Brandrail run page and poll `get_agent_run` after they approve the exact visible plan.
4. Rendering is safe and reversible, but a linked run is still bound to its approved brand, objective, and maximum asset count. Use those exact values; create a new run when they change. Render first, then use `create_review_batch` and pause for human review whenever Studio review is available.
5. Resume with `get_review_status`. Never treat pending or flagged work as approved.
6. Call `schedule_post` with `dryRun=true` before scheduling or publishing.
7. Agent delivery always requires an approved `batchId` + `itemId`, its approved `renderId`, and the exact reviewed copy and files for that channel. When linked to a run, keep the approved channels and delivery time exact. Send separate calls when channels have different approved copy. A user who wants to bypass review must publish manually in the Brandrail workspace; never translate chat consent into an agent-side confirmation flag.
8. Always include an idempotency key for publish retries.
9. Use `get_agent_run` after reconnecting. Never create a duplicate run just because a client timed out.
10. Approved agent deliveries are immutable. To change copy or time, cancel the post and create a newly approved run. Only the credential that created a scheduled delivery may cancel it.
11. Use `get_audit_log` when an action's origin or state is unclear.

## Default sequence

`get_usage` → `list_brands` → `get_brand` → `start_campaign_run` → human approves the visible dry plan → `get_agent_run` → `render_assets` → `create_review_batch` → human review → `get_review_status` → `schedule_post(dryRun=true)` → `schedule_post(approval)` → `get_analytics`

When `render_assets` is left on auto, inspect `manifest.artDirection`: it reports the inferred content intent, selected layout, semantic and composed-canvas scores, rejected alternatives, and rationale. Prefer a user-selected BrandSpec `recipe` when one matches the job; it reuses visual decisions while copy stays fresh. Only force a `template` when the user asks for a specific treatment or the supplied content makes the automatic interpretation wrong. Use `list_templates` first for named text/image fields, required photo counts, and locked objects. Use `modifications` for text and `media` for a BrandSpec photo index. Never choose a photo-required template without enough approved BrandSpec imagery, pass arbitrary image URLs, or override locked colors, type, spacing, logos, crops, or treatments.

## CLI fallback

Set `BRANDRAIL_API_URL` and `BRANDRAIL_API_KEY`, then use machine-readable output:

```sh
brandrail --json spec list
brandrail --json agent plan "Launch the new product" --brand acme
brandrail --json agent start "Launch the new product" --brand acme
brandrail --json agent list
brandrail --json render "Launch the new product" --brand acme
brandrail --json review status batch_123
brandrail --json schedule "New product is live" --channels ch_123 --dry-run
```

Do not print, log, or commit the workspace API key.
