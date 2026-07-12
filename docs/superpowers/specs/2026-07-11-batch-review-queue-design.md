# Async Batch Review Queue — design (R8)

Date: 2026-07-11 · Status: approved, implementing

## Why
The agency hero UX from the Brandrail strategy (R8). Rendering is deterministic
and brand-locked, so the reviewer checks **judgment, not design** — which is what
makes sub-5s-per-post triage of many posts across many clients possible. This is
the retention mechanism and the differentiated claim (nobody can offer fast
review of AI content unless the design layer is already guaranteed). Sits on top
of the existing engine (compile → BrandSpec → render 5 formats, deterministic).

## Review unit
One item = **one brief's full 5-format set** (the engine's natural output unit),
shown as a large hero format + 4 thumbnails. Approve/flag applies to the piece of
content. Kept together so a reviewer judges one message at a time.

## Data model (engine storage, alongside specs/renders/blobs)
```
Batch      { id, title, createdAt, itemIds[] }
BatchItem  { id, batchId, brand, brief, archetype?,
             status: "pending" | "approved" | "edited" | "flagged",
             renderId,          // -> existing stored render (5 assets)
             copy,              // the CopyDoc used (editable)
             note?, reviewMs? } // reviewMs = time-to-approve (the R8 KPI)
```
`FsStorage` gains `batches/<id>.json` + item files; renders reuse `putRender`.
New `Storage` methods: `putBatch`, `getBatch`, `listBatches`, `putBatchItem`,
`getBatchItem`.

## API (agent-native and UI-driven — same endpoints)
- `POST /v0/batches` `{title, items:[{brand,brief,archetype?}]}` → for each item:
  generate copy (unless supplied) + render via the existing pipeline, hydrate
  pinned assets, store render, create a BatchItem (status "pending"). Returns the
  batch with items. This is also how an agent enqueues work.
- `GET /v0/batches` → list (id, title, counts by status).
- `GET /v0/batches/:id` → items with asset URLs, grouped by client.
- `PATCH /v0/batches/:id/items/:itemId` `{action, copy?, note?, reviewMs?}`:
  - `approve` → status "approved" (records reviewMs).
  - `edit` → re-render with the supplied edited copy, status "edited".
  - `regenerate` → new copy from the brief, re-render, status "pending".
  - `flag` → status "flagged" (won't ship), records note.

## Review UI (`/review` in the playground)
- **Compose:** pick compiled brand(s), paste briefs (one per line), "Generate
  batch" → `POST /v0/batches`.
- **Queue:** current item center — hero format large + 4 thumbnails + the copy +
  a **"brand-locked ✓ 0 violations"** badge (from the render manifest). Left rail
  groups remaining items **by client**. Keyboard: `A` approve · `E` edit copy
  inline (reuse the studio copy editor) · `R` regenerate · `F` flag · `J/K` move ·
  `⇧A` approve-all-passing.
- **Header metric:** live **median time-to-approve** + progress (X/N) — the R8
  KPIs. `reviewMs` measured client-side (item shown → action) and sent on the
  PATCH.

## Scope (YAGNI)
In: the loop above, single local reviewer, keyboard triage, the KPI badge/metric.
Out (later, not now): auth/multi-user, real publishing of approved items (status
only), persisted reviewer identity, video, marketplace.

## Build order (each step verified before the next)
1. Engine storage: Batch/BatchItem types + `FsStorage` methods + unit tests.
2. Engine API: the four routes, reusing render/hydrate; API tests (create batch,
   review actions, regenerate re-renders).
3. Playground proxy routes + `/review` page (compose + keyboard queue).
4. Live smoke: compile 2 brands, batch several briefs, triage via keyboard.
```
